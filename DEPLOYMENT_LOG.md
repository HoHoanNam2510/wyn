# Deployment Log — Wyn App (Vercel + Sentry)

> Ghi lại toàn bộ quá trình setup production deployment cho Wyn app.
> Mục đích: dùng để tra cứu nhanh khi gặp lỗi hoặc cần làm lại từ đầu.

---

## Tổng quan

| Thành phần | Chi tiết |
|---|---|
| Hosting | Vercel (free tier) |
| Domain hiện tại | `https://wyn-nine.vercel.app` |
| Git repo | GitHub → `HoHoanNam2510/wyn` |
| Error tracking | Sentry (`wyn-1q` org, project `javascript-nextjs`) |
| Database | Neon Postgres (giữ nguyên từ trước) |
| Auth | Auth.js v5 + Google OAuth |

---

## Phase B — Những gì đã được triển khai

Tất cả code dưới đây đã được commit vào branch `main` và deploy lên Vercel.

### B1 — Error tracking (Sentry) + Analytics

**Packages đã thêm:**
```
@sentry/nextjs
@vercel/analytics
@vercel/speed-insights
```

**Files được tạo/sửa:**
- `sentry.client.config.ts` — Sentry khởi tạo phía trình duyệt
- `sentry.server.config.ts` — Sentry khởi tạo phía server
- `sentry.edge.config.ts` — Sentry khởi tạo phía edge runtime
- `instrumentation.ts` — Hook để Next.js load Sentry đúng thời điểm
- `next.config.ts` — Bọc bằng `withSentryConfig(...)` để upload source maps
- `app/layout.tsx` — Thêm `<Analytics />` và `<SpeedInsights />` từ Vercel

### B2 — Onboarding dashboard (empty state)

**File sửa:** `app/(app)/dashboard/page.tsx`

Khi user chưa có từ nào (`wordCount === 0`), hiển thị component `OnboardingView` gồm:
- 3 bước hướng dẫn (Add word → Create category → Start reviewing)
- Mỗi bước có icon trạng thái, mô tả, và nút CTA
- Card "Prefer to import?" dẫn đến `/words/import`

Khi đã có từ: hiển thị dashboard bình thường với stats + quick actions.

### B3 — Profile edit + Theme picker (Settings)

**Files sửa:**
- `app/(app)/settings/settings-client.tsx` — Thêm inline name edit + theme picker
- `app/(app)/settings/page.tsx` — Đọc user từ DB thay vì session (để `router.refresh()` hoạt động)
- `app/actions/account.ts` — Thêm server action `updateDisplayName()`

**Cách hoạt động:**
- Bấm icon bút chì cạnh tên → input xuất hiện
- Enter hoặc click ✓ → gọi server action → `revalidatePath('/settings')` + `router.refresh()`
- Theme picker: Light / Dark / System bằng `useTheme()` từ `next-themes`

### B4 — SEO (sitemap + robots)

- `app/sitemap.ts` — Liệt kê 3 URL public: `/`, `/privacy`, `/terms`
- `app/robots.ts` — Chặn crawler vào tất cả route cần đăng nhập

Cả hai dùng `NEXT_PUBLIC_APP_URL` từ env vars. **Cần cập nhật biến này khi đổi domain.**

### B5 — CI/CD pipeline

**File tạo:** `.github/workflows/ci.yml`

Tự động chạy khi push hoặc PR vào `main`:
1. Lint (`npm run lint`)
2. Type check (`npx tsc --noEmit`)
3. Validate Prisma schema (`npx prisma validate`)
4. Check formatting (`npm run format:check`)

Build thật sự do Vercel đảm nhiệm (không cần chạy trong CI).

---

## Env Variables — Danh sách đầy đủ

### Trên Vercel (Settings → Environment Variables)

| Biến | Lấy ở đâu | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Neon → Connection Details → Pooled connection | Dùng cho runtime |
| `DIRECT_URL` | Neon → Connection Details → Direct connection | Chỉ dùng cho `prisma migrate dev` |
| `AUTH_SECRET` | `openssl rand -base64 32` | Tạo 1 lần, giữ cố định |
| `AUTH_URL` | `https://wyn-nine.vercel.app` | URL production của app |
| `AUTH_GOOGLE_ID` | Google Cloud Console → OAuth 2.0 Clients | |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → OAuth 2.0 Clients | |
| `UNSPLASH_ACCESS_KEY` | Unsplash Developers → Your apps | |
| `GROQ_API_KEY` | console.groq.com | Cho AI writing check |
| `NEXT_PUBLIC_APP_URL` | `https://wyn-nine.vercel.app` | **Cập nhật khi đổi domain** |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Settings → Projects → javascript-nextjs → Client Keys (DSN) | |
| `SENTRY_ORG` | `wyn-1q` | Slug của Sentry org |
| `SENTRY_PROJECT` | `javascript-nextjs` | Tên project trong Sentry |
| `SENTRY_AUTH_TOKEN` | Sentry → User Settings → Auth Tokens → Create | Scope: `project:releases`, `org:read`, `project:read` |

**Environment nên chọn:** Production + Preview + Development cho tất cả (trừ `DIRECT_URL` chỉ cần Development).

### Trên máy local (.env)

Tương tự nhưng:
- `AUTH_URL=http://localhost:3108`
- `NEXT_PUBLIC_APP_URL=http://localhost:3108`
- `DATABASE_URL` dùng pooler URL của Neon
- `DIRECT_URL` dùng direct URL của Neon

---

## Các Bug đã gặp và cách fix

### Bug 1 — Vercel build fail: "Cannot find module" (Prisma)

**Lỗi:**
```
Error: Cannot find module '@/app/generated/prisma/client'
```

**Nguyên nhân:**
Prisma client được generate ra folder `app/generated/prisma/` và folder này nằm trong `.gitignore`. Vercel clone repo về không có folder này → build crash.

**Fix:**
Thêm vào `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```
`postinstall` chạy tự động sau `npm install` → Vercel sẽ generate Prisma client trước khi build.

**Commit:** `237dead`

---

### Bug 2 — SSL deprecation warning từ `pg`

**Lỗi (xuất hiện mỗi khi cold start):**
```
(node:4) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require',
and 'verify-ca' are treated as aliases for 'verify-full' in pg >= 9
```

**Nguyên nhân:**
URL kết nối Neon có tham số `?sslmode=require`. Trong `pg` phiên bản 9+, tham số này bị deprecated.

**Fix:** Sửa `lib/db.ts` — xóa `sslmode` khỏi URL và truyền SSL option trực tiếp vào Pool:
```ts
function buildConnectionString(url: string | undefined) {
  const u = new URL(url);
  u.searchParams.delete('sslmode'); // xóa sslmode khỏi URL
  return u.toString();
}

const pool = new Pool({
  connectionString: buildConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: true }, // truyền SSL riêng, không qua URL
});
```

---

### Bug 3 — Đăng nhập Google xong bị redirect về /sign-in (không vào được dashboard)

**Triệu chứng:**
Click "Continue with Google" → Google OAuth → thành công → nhưng bị đá ngược về `/sign-in` thay vì vào `/dashboard`.

**Lỗi trong Vercel logs:**
```
[auth][error] CallbackRouteError: response parameter "iss" (issuer) missing
```

**Nguyên nhân:**
Auth.js v5 chạy sau reverse proxy của Vercel. Nó cần biết rằng các header `x-forwarded-host`, `x-forwarded-proto` từ Vercel là đáng tin cậy. Mặc định nó không tin và bỏ qua → không xác định được issuer đúng → lỗi.

**Fix:** Thêm `trustHost: true` vào `lib/auth.ts`:
```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  trustHost: true, // ← thêm dòng này
  // ...
});
```

Ngoài ra cũng cần đảm bảo biến `AUTH_URL=https://wyn-nine.vercel.app` đã được set trên Vercel.

---

### Bug 4 — Sau khi fix Bug 3, vẫn bị đá về /sign-in

**Triệu chứng (từ Vercel logs):**
```
GET /api/auth/callback/google  302  (OK — callback thành công)
GET /dashboard                 307  (bị redirect!)
GET /sign-in                   200  (về trang login)
```

**Nguyên nhân:**
Auth.js v5 đặt tên cookie session là `__Secure-authjs.session-token` trên HTTPS (production). Nhưng trong `proxy.ts`, hàm `getToken` từ `next-auth/jwt` không biết tên cookie này — nó mặc định tìm `authjs.session-token` (không có prefix `__Secure-`) → tìm không thấy → trả về `null` → middleware nghĩ user chưa đăng nhập → redirect về `/sign-in`.

**Fix:** Thêm `secureCookie` vào `getToken` trong `proxy.ts`:
```ts
const token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET,
  secureCookie: request.nextUrl.protocol === 'https:', // ← thêm dòng này
});
```

Khi HTTP (local): tìm `authjs.session-token`
Khi HTTPS (Vercel): tìm `__Secure-authjs.session-token`

**Commit:** `2a85f16`

---

### Bug 5 — TypeScript error trong instrumentation.ts

**Lỗi:**
```
Argument of type '{ path: string; method: string; }' is not assignable
to parameter of type 'RequestInfo'. Property 'headers' is missing.
```

**Nguyên nhân:**
Dùng `captureRequestError` với sai kiểu tham số.

**Fix:** Đơn giản hóa — chỉ dùng `captureException`:
```ts
export const onRequestError = async (err: unknown) => {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(err);
};
```

---

### Bug 6 — Sentry build warnings (deprecated options)

**Warning:**
```
Option "disableLogger" is deprecated
Option "automaticVercelMonitors" is deprecated at top level
```

**Fix:** Chuyển sang cấu trúc mới trong `next.config.ts`:
```ts
withSentryConfig(nextConfig, {
  webpack: {
    treeshake: { removeDebugLogging: true }, // thay disableLogger
    automaticVercelMonitors: true,           // đưa vào trong webpack.{}
  },
});
```

---

## Cấu hình Google OAuth (quan trọng khi đổi domain)

**Đường đi:** console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs → chọn client của Wyn

Hai mục cần cập nhật mỗi khi domain thay đổi:

**Authorized JavaScript origins:**
```
https://wyn-nine.vercel.app
```

**Authorized redirect URIs:**
```
https://wyn-nine.vercel.app/api/auth/callback/google
```

Nếu thêm domain mới → thêm 2 dòng mới, không xóa dòng cũ (để cả Vercel URL và custom domain đều hoạt động).

---

## Checklist khi đổi sang Custom Domain

Khi mua domain mới và gắn vào Vercel, cần làm đủ 4 bước này:

- [ ] **Vercel** → Settings → Domains → thêm domain → cấu hình DNS theo hướng dẫn của Vercel
- [ ] **Vercel env vars** → cập nhật `NEXT_PUBLIC_APP_URL` và `AUTH_URL` thành domain mới
- [ ] **Google Cloud Console** → thêm domain mới vào Authorized origins + Authorized redirect URIs
- [ ] **Redeploy** Vercel sau khi đổi env vars

---

## Kiến trúc Middleware (proxy.ts)

Next.js 16 dùng file `proxy.ts` (thay cho `middleware.ts`) với named export `proxy`.

File `proxy.ts` chạy trước mọi request, làm nhiệm vụ:
1. Đọc JWT token từ cookie (`getToken`)
2. Nếu truy cập route cần đăng nhập mà chưa login → redirect về `/sign-in`
3. Nếu đã login mà vào `/sign-in` → redirect về `/dashboard`

Route cần đăng nhập: `/dashboard`, `/words`, `/categories`, `/review`, `/stats`, `/settings`, `/grammar`, `/idioms`, `/text-scanner`

---

## Sentry — Cách verify hoạt động

Sau khi deploy, vào app trên production, mở DevTools (F12) → tab Console → chạy:
```js
throw new Error("sentry test wyn")
```
Sau ~30 giây vào `https://wyn-1q.sentry.io/issues/` → nếu thấy error xuất hiện = Sentry đang hoạt động.

---

## Thứ tự deploy khi có thay đổi code

1. `npm run format` — format code
2. `git add <files> && git commit -m "..."` — commit
3. `git push origin main` — push
4. Vercel tự động detect push → build → deploy (mất ~2-3 phút)
5. Kiểm tra Vercel dashboard → Deployments → xem trạng thái

Nếu build fail → xem logs tại: Vercel → Deployments → click vào deployment fail → tab "Build Logs"

---

*Cập nhật lần cuối: 30/04/2026*
