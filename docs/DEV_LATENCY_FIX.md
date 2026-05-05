# Dev Environment Latency Fix — Neon / pg-pool

## Vấn đề

Dev environment (localhost) bị latency **20s–60s+** trên mọi thao tác: chuyển trang, mutation dữ liệu, v.v. Sentry ghi nhận nhiều crash với stack trace trỏ đến `pg-pool/index.js` và `PrismaPgAdapter.performIO`. Production hoàn toàn không bị ảnh hưởng.

Stack trace điển hình:

```
Crashed in non-app: D:\vocabulary-web\wyn\node_modules\pg-pool\index.js:45:11
  in PrismaPgAdapter.performIO
  in PrismaPgAdapter.queryRaw
  in SrsHubPage (app\(app)\review\srs\page.tsx:62)
```

---

## Root Cause — 4 nguyên nhân cộng hưởng

### 1. Dùng sai URL trong dev (nguyên nhân chính)

`DATABASE_URL` là URL của **Neon PgBouncer pooler** — được thiết kế cho serverless (kết nối ngắn hạn, ephemeral). Trong một persistent dev server:

- Neon tự suspend compute sau **5 phút không hoạt động**
- PgBouncer luôn chạy và chấp nhận kết nối dù compute đang lạnh
- Khi compute lạnh, query bị giữ nguyên trong PgBouncer queue cho đến khi compute warm up (5–15s)
- Nhưng với `idleTimeoutMillis: 10_000` (xem bên dưới), kết nối bị evict trước khi có cơ hội reuse → cycle reconnect → cold start lặp đi lặp lại **mỗi lần** chuyển trang

### 2. `connectionTimeoutMillis: 60_000` che giấu sự cố

Đây là timeout để chờ lấy một slot connection từ pool. Khi pool bị exhausted hoặc connection đang bị giữ, request kế tiếp chờ tối đa **60 giây** — giải thích cho các trường hợp latency "vượt quá 1 phút".

### 3. `idleTimeoutMillis: 10_000` gây reconnect liên tục

10 giây quá ngắn cho dev server với các request thưa thớt. Kết nối bị evict sau 10s idle → request tiếp theo phải tạo kết nối mới → gặp Neon cold start → 5–15s → vòng lặp không kết thúc.

### 4. Crash `PrismaPgAdapter.performIO` (phantom-alive connection)

Khi PgBouncer drop một backend connection trong khi pg-pool vẫn nghĩ connection đó còn sống, bất kỳ query nào đang in-flight sẽ crash tại `performIO`. Handler `pool.on('error', () => {})` chỉ bắt được lỗi async từ idle client, **không bắt được crash trong khi query đang thực thi** — đây là failure mode đặc thù của PgBouncer.

---

## Giải pháp

Dùng `DIRECT_URL` trong dev thay vì `DATABASE_URL`:

- Kết nối thẳng tới Neon compute, bypass PgBouncer hoàn toàn
- **Direct TCP connection giữ Neon compute không bị auto-suspend** miễn là connection còn mở
- Không có phantom-alive connection (failure mode của PgBouncer)
- Khi compute warm, latency giảm xuống thời gian query thuần (~50–200ms)

### Lưu ý quan trọng về `DIRECT_URL` và cold start

Khi Neon compute đang lạnh:

- `DATABASE_URL` (pooler): TCP đến PgBouncer luôn thành công ngay → query chờ trong PgBouncer queue
- `DIRECT_URL`: TCP đến Neon direct → Neon bắt đầu wake up → cần **30s timeout** để chờ đủ

Vì vậy cần `connect_timeout=30` và `connectionTimeoutMillis: 30_000` cho dev.

### `max: 3` bắt buộc — không được dùng `max: 1`

Nhiều page dùng `Promise.all` để chạy nhiều query song song:

```typescript
// Ví dụ: SRS page
const [dueCount, nextDue, totalEnrolled] = await Promise.all([
  db.word.count(...),
  db.word.findFirst(...),
  db.word.count(...),
]);
```

Với `max: 1`, chỉ 1 query chạy được, 2 query còn lại queue lại → nếu query đầu bị stuck (cold start), 2 cái kia timeout ngay sau `connectionTimeoutMillis`. Cần `max: 3` để xử lý concurrency.

---

## File thay đổi

**Chỉ 1 file:** `lib/db.ts`

---

## Code cuối cùng — `lib/db.ts`

```typescript
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const isDev = process.env.NODE_ENV === 'development';

function buildConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Remove sslmode from URL — ssl is handled via the Pool ssl option below
    // to avoid pg deprecation warning about sslmode=require semantics
    u.searchParams.delete('sslmode');
    if (!u.searchParams.has('connect_timeout')) {
      u.searchParams.set('connect_timeout', '30');
    }
    return u.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const pool = new Pool(
    isDev
      ? {
          connectionString: buildConnectionString(process.env.DIRECT_URL),
          ssl: { rejectUnauthorized: true },
          max: 3,
          connectionTimeoutMillis: 30_000,
          idleTimeoutMillis: 60_000,
        }
      : {
          connectionString: buildConnectionString(process.env.DATABASE_URL),
          ssl: { rejectUnauthorized: true },
          max: 3,
          connectionTimeoutMillis: 60_000, // 60s — enough for Neon cold start
          idleTimeoutMillis: 10_000, // 10s — evict before Neon's proxy kills them
        }
  );

  // When Neon terminates an idle connection, pg-pool emits 'error'.
  // Without this handler Node.js throws an unhandled error and crashes the request.
  // pg-pool automatically removes the dead client from the pool after this fires.
  pool.on('error', () => {});

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

---

## So sánh cấu hình dev trước vs sau

| Tham số                   | Trước (sai)             | Sau (đúng)            | Lý do                                |
| ------------------------- | ----------------------- | --------------------- | ------------------------------------ |
| `connectionString`        | `DATABASE_URL` (pooler) | `DIRECT_URL` (direct) | Bypass PgBouncer, giữ compute warm   |
| `max`                     | `3`                     | `3`                   | Giữ nguyên — cần cho `Promise.all`   |
| `connectionTimeoutMillis` | `60_000`                | `30_000`              | Đủ cho cold start, fail nhanh hơn    |
| `idleTimeoutMillis`       | `10_000`                | `60_000`              | Giữ connection sống giữa các request |
| `connect_timeout` (URL)   | `30`                    | `30`                  | Giữ nguyên                           |

Production **không thay đổi gì**.

---

## Lỗi phát sinh trong quá trình fix

### Attempt đầu tiên sai: `max: 1` + `connectionTimeoutMillis: 15_000`

```
⨯ Error: timeout exceeded when trying to connect
  at DashboardPage (app\(app)\dashboard\page.tsx:18)
  GET /dashboard 200 in 16.9s
```

**Nguyên nhân:** `max: 1` không đủ cho `Promise.all` — query thứ 2 queue sau query thứ 1, nếu query 1 bị stuck (cold start), query 2 timeout ở 15s. `connect_timeout=15` cũng quá ngắn cho Neon cold start qua direct URL.

**Fix:** Tăng `max: 3`, `connectionTimeoutMillis: 30_000`, `connect_timeout=30`.

---

## Hành vi sau khi fix

- **Request đầu tiên sau khi Neon suspend** (~5 phút idle hoặc server vừa start): mất 5–20s (cold start không tránh khỏi ở free tier)
- **Mọi request sau đó**: ~50–500ms (direct connection giữ compute warm)
- **Sau 60s idle** (idleTimeoutMillis): connection bị evict, request kế cần reconnect → có thể gặp cold start nếu Neon cũng suspend. Tuy nhiên hiếm xảy ra vì Neon chỉ suspend sau 5 phút.

---

## Kiểm tra

1. `npm run dev` — restart dev server (bắt buộc để pool mới được khởi tạo)
2. Navigate qua nhiều trang — latency phải giảm xuống ~100–500ms sau request đầu tiên
3. Để dev server idle 6+ phút, navigate — cold start một lần, sau đó nhanh
4. Kiểm tra Sentry — không còn `pg-pool` / `PrismaPgAdapter.performIO` crash mới
5. `npm run build` — production build phải pass (production code path không thay đổi)

---

## Tại sao lỗi này cứ tái phát

Các lần fix trước chỉ vá triệu chứng (timeout, error handler) mà không xử lý root cause: **dùng pooler URL trong persistent dev server**. PgBouncer được thiết kế cho serverless — kết nối ngắn hạn, nhiều client cùng lúc. Trong dev server chạy liên tục, pooler gây ra vòng lặp cold start không thể tránh khỏi dù có tune timeout thế nào.
