# Plan: Admin Web cho Wyn (Beta Management)

## Context

Ứng dụng đã hoàn thành 12 phase phát triển feature + Phase A/B của [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md). Sau khi đã có domain `wynvocab.site` và Sentry/Analytics, mục tiêu tiếp theo là **mở beta cho 1 vài người bạn test**. Để quản lý beta hiệu quả, cần xây admin section trong cùng codebase.

Plan này KHÔNG đề cập Phase C của PRODUCTION_PLAN (PWA, i18n, caching, backup) — sẽ làm sau khi admin web hoàn thành.

---

## Quyết định kiến trúc

| Câu hỏi                          | Lựa chọn                                             | Lý do                                                                     |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Cùng codebase hay project mới?   | **Cùng codebase**                                    | Shared Prisma/Auth.js, deploy chung Vercel, scale beta nhỏ không cần tách |
| Cách lưu admin role              | **Biến env `ADMIN_EMAIL`**                           | Không cần migration, đổi admin qua env                                    |
| Quyền admin với user             | **View + Delete (cascade)**                          | Đủ cho beta, dùng được khi cần xóa account spam                           |
| Quyền admin với words/categories | **View + Delete**                                    | Dùng khi phát hiện spam content                                           |
| Hiển thị announcements           | **Banner trong app** (dismissible, lưu localStorage) | Khó miss hơn toast, user vẫn dismiss được                                 |
| Audit logs                       | **Chỉ admin actions**                                | Đủ cho accountability, không tốn DB                                       |

---

## Tiến độ thực thi

| Phase                           | Trạng thái | Ngày hoàn thành | Ghi chú                                                                                       |
| ------------------------------- | ---------- | --------------- | --------------------------------------------------------------------------------------------- |
| **1** Prisma schema + migration | ✅ Done    | 2026-04-30      | 3 model mới: Feedback, Announcement, AuditLog                                                 |
| **2** Auth & TypeScript         | ✅ Done    | 2026-04-30      | `isAdmin` trong JWT/Session từ `ADMIN_EMAIL` env                                              |
| **3** Middleware (`proxy.ts`)   | ✅ Done    | 2026-04-30      | Guard `/admin` + thêm `/feedback` vào PROTECTED_PATHS                                         |
| **4** Library mới               | ✅ Done    | 2026-04-30      | `lib/admin/queries.ts`, `lib/admin/audit.ts`, `lib/schemas/admin.ts`                          |
| **5** Server Actions            | ✅ Done    | 2026-04-30      | `app/actions/admin.ts` với `requireAdmin()` guard                                             |
| **6** Admin UI                  | ✅ Done    | 2026-04-30      | 6 trang admin + admin sidebar                                                                 |
| **7** Announcement Banner       | ✅ Done    | 2026-04-30      | Client component dismissible vào `(app)/layout.tsx`                                           |
| **8** Trang Feedback cho user   | ✅ Done    | 2026-04-30      | `/feedback` với form                                                                          |
| **9** Sidebar & TopBar updates  | ✅ Done    | 2026-04-30      | Thêm Feedback nav item + Admin Panel dropdown link                                            |
| **Verify & deploy**             | ✅ Done    | 2026-05-01      | Test 9 scenarios + `npm run build`                                                            |
| **10** UI Polish & Bug Fixes    | ✅ Done    | 2026-05-01      | 5 fix: timeout, banner, table style, words cols, overview charts                              |
| **11** UX & Code Quality Fixes  | ✅ Done    | 2026-05-01      | Admin settings page, table header bg, sidebar refactor, React Compiler warnings, CSS lint fix |
| **12** Shared DataTable         | ✅ Done    | 2026-05-02      | `DataTable<T>` + migrate 6 tables (users/words/feedback/announcements/audit/overview)         |
| **13** ApiUsage Tracking        | ✅ Done    | 2026-05-05      | `ApiUsageDaily` model + migration + `recordApiUsage` helper + wrap 3 lib calls                |
| **14** API Usage Page           | ✅ Done    | 2026-05-05      | `/admin/api-usage` + `ApiSparkline` + `TopConsumersTabs` + critical banner                    |
| **15** Reviews Mgmt Page        | ✅ Done    | 2026-05-05      | `/admin/reviews` overview + per-user drill-down (vocab + grammar + idiom)                     |
| **16** Polish                   | ✅ Done    | 2026-05-05      | `updateAnnouncement` + 2 category stat cards trên Overview                                    |

Update với `[x]` hoặc ✅ khi hoàn thành.

---

## Phase 1 — Prisma Schema & Migration

- [x] Thêm vào model `User`: `feedbacks Feedback[]`
- [x] Thêm enum `FeedbackType { GENERAL BUG FEATURE_REQUEST }`
- [x] Thêm enum `FeedbackStatus { OPEN RESOLVED DISMISSED }`
- [x] Thêm model `Feedback` (id, userId nullable, type, content, status, createdAt) + index `[status, createdAt]`
- [x] Thêm model `Announcement` (id, title, content, isActive, expiresAt nullable, createdAt) + index `[isActive, expiresAt]`
- [x] Thêm model `AuditLog` (id, adminEmail, action, entityType, entityId nullable, metadata Json nullable, createdAt) + index `[adminEmail, createdAt]`
- [x] Chạy: `npx prisma migrate dev --name add_admin_models`
- [x] Verify: kiểm tra Prisma client regenerate ở `app/generated/prisma/`

**File chạm:** [prisma/schema.prisma](prisma/schema.prisma)

---

## Phase 2 — Auth & TypeScript Augmentation

- [x] Sửa [types/next-auth.d.ts](types/next-auth.d.ts) — thêm `isAdmin: boolean` vào `Session.user`
- [x] Bổ sung augmentation `next-auth/jwt` cho `JWT.isAdmin: boolean`
- [x] Sửa [lib/auth.ts](lib/auth.ts):
  - Trong `jwt` callback: `token.isAdmin = token.email === process.env.ADMIN_EMAIL`
  - Trong `session` callback: `session.user.isAdmin = token.isAdmin ?? false`
- [x] Thêm vào `.env`: `ADMIN_EMAIL=m8mi0909@gmail.com`
- [x] Thêm vào `.env.example`: `ADMIN_EMAIL=` với comment giải thích
- [x] Verify: `npx tsc --noEmit` không lỗi

---

## Phase 3 — Middleware

- [x] Sửa [proxy.ts](proxy.ts):
  - Thêm `/feedback` vào `PROTECTED_PATHS`
  - Thêm guard cho admin path sau block `isProtected`:
    ```ts
    const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
    if (isAdminPath) {
      if (!isLoggedIn)
        return NextResponse.redirect(new URL('/sign-in', request.url));
      if (!token?.isAdmin)
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    ```
- [x] Verify: User thường vào `/admin` redirect về `/dashboard`; chưa login redirect về `/sign-in`

---

## Phase 4 — Library mới

### 4.1. `lib/admin/audit.ts`

- [x] Helper `writeAuditLog({ adminEmail, action, entityType, entityId?, metadata? })` — `db.auditLog.create`

### 4.2. `lib/admin/queries.ts`

- [x] `fetchAdminDashboardStats()` — totalUsers, totalWords, totalReviews, openFeedback, activeUsers7d, recentAuditLogs (10)
- [x] `fetchAdminUsers(page, pageSize=20)` — kèm `_count: { words, reviewEvents }`
- [x] `fetchAdminWords(page, q, pageSize=30)` — search by term, kèm `user.email`, context đầu tiên
- [x] `fetchAdminFeedback(page, status, pageSize=25)` — status filter, kèm user info
- [x] `fetchAdminAnnouncements()` — toàn bộ
- [x] `fetchActiveAnnouncements()` — `isActive=true AND (expiresAt IS NULL OR expiresAt > now)`
- [x] `fetchAuditLogs(page, pageSize=30)` — phân trang

### 4.3. `lib/schemas/admin.ts`

- [x] `feedbackSubmitSchema` — type enum + content(10-2000)
- [x] `announcementSchema` — title(1-100) + content(1-500) + expiresAt optional

---

## Phase 5 — Server Actions (`app/actions/admin.ts`)

- [x] Helper `requireAdmin()` — gọi `auth()`, throw nếu không phải admin, return `adminEmail`
- [x] `adminDeleteUser(userId)` — cascade + audit `DELETE_USER`
- [x] `adminDeleteWord(wordId)` — audit `DELETE_WORD` (kèm metadata: term, ownerId)
- [x] `updateFeedbackStatus(feedbackId, status)` — audit `UPDATE_FEEDBACK_STATUS`
- [x] `submitFeedback({ type, content })` — KHÔNG cần admin guard, chỉ check session
- [x] `createAnnouncement({ title, content, expiresAt? })` — audit `CREATE_ANNOUNCEMENT`
- [x] `toggleAnnouncement(id, isActive)` — audit `ACTIVATE_/DEACTIVATE_ANNOUNCEMENT`
- [x] `deleteAnnouncement(id)` — audit `DELETE_ANNOUNCEMENT`
- [x] Mỗi action có `revalidatePath('/admin/...')` ở cuối

---

## Phase 6 — Admin UI

### 6.1. Layout & Sidebar

- [x] Tạo `app/(admin)/layout.tsx` — guard `if (!session.user.isAdmin) redirect('/dashboard')`, dùng `SidebarProvider` + `TopBar` + `AdminSidebar`
- [x] Tạo `components/admin/admin-sidebar.tsx` — clone từ user sidebar, nav items: Overview, Users, Words, Feedback, Announcements, Audit Log, ← Back to App

### 6.2. Trang Overview Dashboard

- [x] `app/(admin)/admin/page.tsx` — server component, gọi `fetchAdminDashboardStats()`, render stat cards + bảng audit log gần nhất
- [x] `app/(admin)/admin/loading.tsx`

### 6.3. Trang Users Management

- [x] `app/(admin)/admin/users/page.tsx` — server, accept `searchParams.page`
- [x] `app/(admin)/admin/users/users-client.tsx` — bảng + Dialog confirm + `adminDeleteUser` qua `useTransition` + toast + `router.refresh()`
- [x] `app/(admin)/admin/users/loading.tsx`

### 6.4. Trang Words Management

- [x] `app/(admin)/admin/words/page.tsx` — server, accept `searchParams.{page, q}`, render search form GET
- [x] `app/(admin)/admin/words/words-client.tsx` — bảng (term, owner email, ngày tạo, meaning đầu tiên) + Delete
- [x] `app/(admin)/admin/words/loading.tsx`

### 6.5. Trang Feedback Management

- [x] `app/(admin)/admin/feedback/page.tsx` — server, accept `searchParams.{page, status}`, render filter tabs (All/Open/Resolved/Dismissed)
- [x] `app/(admin)/admin/feedback/feedback-client.tsx` — bảng + dropdown đổi status (gọi `updateFeedbackStatus`)
- [x] `app/(admin)/admin/feedback/loading.tsx`

### 6.6. Trang Announcements Management

- [x] `app/(admin)/admin/announcements/page.tsx` — server, gọi `fetchAdminAnnouncements()`
- [x] `app/(admin)/admin/announcements/announcements-client.tsx` — form tạo (title, content, expiresAt) + danh sách với toggle active + delete
- [x] `app/(admin)/admin/announcements/loading.tsx`

### 6.7. Trang Audit Log

- [x] `app/(admin)/admin/audit/page.tsx` — server, bảng read-only (admin email, action, entity type/id, metadata JSON, timestamp)
- [x] `app/(admin)/admin/audit/loading.tsx`

---

## Phase 7 — Announcement Banner

- [x] Tạo `components/admin/announcement-banner.tsx`:
  - Client component, nhận `announcements: { id, title, content }[]`
  - SSR: render rỗng (an toàn hydration)
  - `useEffect`: đọc localStorage key `wyn_dismissed_announcements`, filter ra các ID chưa dismiss
  - Hiển thị: chỉ `visible[0]` (mới nhất chưa dismiss)
  - Nút X: thêm ID vào localStorage + xóa khỏi state
  - Style: `bg-primary text-primary-foreground` full-width
- [x] Sửa `app/(app)/layout.tsx`:
  - Thêm `fetchActiveAnnouncements()` vào `Promise.all` cùng `srsDue` query
  - Render `<AnnouncementBanner announcements={announcements} />` ngay phía trên `<TopBar />` trong cột phải

---

## Phase 8 — Trang Feedback cho User

- [x] `app/(app)/feedback/page.tsx` — server component, metadata title "Feedback", render `<FeedbackForm />`
- [x] `app/(app)/feedback/feedback-form.tsx` — client component:
  - 3 nút type (General/Bug/Feature Request)
  - Textarea (10-2000 chars) với character counter
  - Submit qua `useTransition` → `submitFeedback(data)`
  - Khi success: `toast("Cảm ơn bạn đã góp ý!")` + reset form (không redirect)
  - Dùng react-hook-form + zod resolver

---

## Phase 9 — Updates Sidebar & TopBar

- [x] Sửa `components/layout/sidebar.tsx` — thêm `{ href: '/feedback', label: 'Feedback', icon: MessageSquare }` vào `navItems` (giữa Stats và Settings); import `MessageSquare` từ `lucide-react`
- [x] Sửa `components/layout/top-bar.tsx` — thêm conditional `DropdownMenuItem` cho `user.isAdmin`:
  ```tsx
  {
    user.isAdmin && (
      <>
        <DropdownMenuItem asChild>
          <Link
            href="/admin"
            className="cursor-pointer text-sm font-semibold text-primary"
          >
            Admin Panel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    );
  }
  ```
  Đặt trước Settings item.

---

## Verification — Test trước khi merge

- [x] Đăng nhập bằng `m8mi0909@gmail.com` → dropdown TopBar có "Admin Panel" (đây là ADMIN_EMAIL chính thức)
- [x] Đăng nhập bằng email khác → vào `/admin` redirect về `/dashboard`
- [x] Logout → vào `/admin` redirect về `/sign-in`
- [x] `/admin` hiển thị đúng tổng users/words/reviews/feedback OPEN
- [x] Tạo user test, thêm 5 words, sau đó admin xóa user → DB cascade xóa hết, có row AuditLog `DELETE_USER`
- [x] Tạo announcement → user thường login thấy banner → bấm X → mất → reload → vẫn không hiện
- [x] User thường submit feedback → xuất hiện trong `/admin/feedback` với status OPEN
- [x] Admin đổi status feedback → có row AuditLog `UPDATE_FEEDBACK_STATUS`
- [x] `npm run build` pass, không lỗi TypeScript
- [x] `npx tsc --noEmit` pass

---

## Critical Files

```
prisma/schema.prisma                                 ← thêm 3 model + enum + relation User
types/next-auth.d.ts                                 ← thêm isAdmin vào Session + JWT
lib/auth.ts                                          ← stamp isAdmin trong callbacks
proxy.ts                                             ← admin guard + /feedback protected
.env, .env.example                                   ← ADMIN_EMAIL

lib/admin/queries.ts                                 ← MỚI — admin DB queries
lib/admin/audit.ts                                   ← MỚI — writeAuditLog
lib/schemas/admin.ts                                 ← MỚI — feedback + announcement zod
app/actions/admin.ts                                 ← MỚI — tất cả admin server actions

app/(admin)/layout.tsx                               ← MỚI — admin layout + guard
app/(admin)/admin/page.tsx                           ← MỚI — overview dashboard
app/(admin)/admin/users/page.tsx + users-client.tsx  ← MỚI — user mgmt
app/(admin)/admin/words/page.tsx + words-client.tsx  ← MỚI — words mgmt
app/(admin)/admin/feedback/{page, feedback-client}.tsx ← MỚI
app/(admin)/admin/announcements/{page, announcements-client}.tsx ← MỚI
app/(admin)/admin/audit/page.tsx                     ← MỚI — audit log

components/admin/admin-sidebar.tsx                   ← MỚI — admin nav
components/admin/announcement-banner.tsx             ← MỚI — dismissible banner

app/(app)/feedback/{page, feedback-form}.tsx         ← MỚI — user feedback form
app/(app)/layout.tsx                                 ← thêm announcement banner
components/layout/sidebar.tsx                        ← thêm Feedback nav item
components/layout/top-bar.tsx                        ← thêm Admin Panel dropdown link
```

---

## Phân chia thời gian gợi ý (1 tuần)

| Ngày   | Focus                  | Output                                              |
| ------ | ---------------------- | --------------------------------------------------- |
| Ngày 1 | Phase 1 + 2 + 3        | Schema migrated, auth có isAdmin, middleware bảo vệ |
| Ngày 2 | Phase 4 + 5            | Library + server actions xong, test bằng cURL       |
| Ngày 3 | Phase 6.1-6.3          | Layout + sidebar + Overview + Users page            |
| Ngày 4 | Phase 6.4-6.7          | Words + Feedback + Announcements + Audit pages      |
| Ngày 5 | Phase 7 + 8            | Banner + user feedback form                         |
| Ngày 6 | Phase 9 + Verification | Sidebar/TopBar updates + test 10 scenarios          |
| Ngày 7 | Deploy & invite beta   | Push lên production, gửi link cho 3-5 bạn test      |

---

## Sau khi launch beta

Theo dõi 1-2 tuần đầu:

- Audit log có ghi đúng không
- Feedback có vào không
- Banner có dismiss đúng không
- Có user nào thoát được admin guard không (security)

Sau đó chuyển sang Phase C của [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md):

- C3 Caching/optimization (giảm tải Unsplash khi traffic tăng)
- C4 Backup script (yên tâm hơn với dữ liệu beta)
- C1 PWA (nếu mobile traffic > 50%)
- C2 i18n (nếu cần mở rộng cộng đồng VN)

---

## Phase 10 — UI Polish & Bug Fixes

> Phát hiện sau khi test dev environment. Thực hiện sau khi Verification pass.

### Fix 1 — Lỗi DB Connection Timeout (Bug nghiêm trọng)

**Files:** [app/(app)/layout.tsx](<app/(app)/layout.tsx>), [lib/db.ts](lib/db.ts)

**Nguyên nhân (2 lớp):**

1. `app/(app)/layout.tsx`: Không có `.catch()` → crash toàn layout khi DB cold-start
2. `lib/db.ts`: `idleTimeoutMillis: 30_000` giữ connection đủ lâu để Neon kill server-side; thiếu `pool.on('error')` handler → unhandled Node.js error crash mọi request sau idle

**Sửa:**

```tsx
// app/(app)/layout.tsx
const [srsDue, announcements] = await Promise.all([
  session?.user?.id
    ? db.word.count({ where: { ... } }).catch(() => 0)
    : Promise.resolve(0),
  fetchActiveAnnouncements().catch(() => []),
]);
```

```ts
// lib/db.ts — Pool config
const pool = new Pool({
  connectionTimeoutMillis: 60_000, // 60s — đủ cho Neon cold start
  idleTimeoutMillis: 10_000, // 10s — evict trước khi Neon proxy kill
});
pool.on('error', () => {}); // ngăn unhandled error crash
```

> Ghi chú: Độ chậm 10–30s do Neon free tier cold-start là không tránh khỏi ở dev. Fix này ngăn lỗi 500 — tốc độ bình thường sau khi DB đã warm.

- [x] Thêm `.catch(() => 0)` vào srsDue count query
- [x] Thêm `.catch(() => [])` vào `fetchActiveAnnouncements()`
- [x] `lib/db.ts`: giảm `idleTimeoutMillis` 30s → 10s, tăng `connectionTimeoutMillis` → 60s, thêm `pool.on('error')`

---

### Fix 2 — Announcement Banner: Title và Content tách 2 dòng

**File:** [components/admin/announcement-banner.tsx](components/admin/announcement-banner.tsx)

**Hiện tại:** Title và content nằm chung 1 thẻ `<p>`, chỉ khác `font-bold`.

**Sửa:** Tách ra 2 dòng riêng, tăng font size title:

```tsx
<div className="flex items-start gap-3 bg-primary text-primary-foreground px-6 py-3">
  <div className="flex-1">
    <p className="text-base font-bold leading-tight">{current.title}</p>
    <p className="text-sm mt-0.5 opacity-90">{current.content}</p>
  </div>
  {/* Nút X giữ nguyên */}
</div>
```

- [x] Đổi `items-center` → `items-start` trên container
- [x] Tách title/content thành 2 thẻ `<p>` riêng biệt
- [x] Title: `text-base font-bold`, Content: `text-sm opacity-90`

---

### Fix 3 — Table Styling: Viền đậm, separator nhạt, header tinted

**Nguyên nhân:** `--border: #e6e0e2` quá nhạt → dù `border-2` thì outer border vẫn không đậm hơn row separator.

**Sửa (final implementation):** Dùng `foreground` token với opacity để tạo hierarchy rõ ràng, tự adapt dark mode:

```tsx
<div className="overflow-hidden rounded-xl border border-foreground/20
  [&_thead_tr]:bg-primary/10
  [&_thead_tr]:border-foreground/20
  [&_tbody_tr]:border-foreground/8">
```

- `border-foreground/20` (outer + header divider) → darkest, rõ ràng trong cả light/dark
- `[&_thead_tr]:bg-primary/10` → header row tint nhẹ crimson
- `[&_tbody_tr]:border-foreground/8` → separator nhạt nhất

**Áp dụng cho 6 vị trí:**

- [x] [app/(admin)/admin/words/words-client.tsx](<app/(admin)/admin/words/words-client.tsx>)
- [x] [app/(admin)/admin/users/users-client.tsx](<app/(admin)/admin/users/users-client.tsx>)
- [x] [app/(admin)/admin/feedback/feedback-client.tsx](<app/(admin)/admin/feedback/feedback-client.tsx>)
- [x] [app/(admin)/admin/announcements/announcements-client.tsx](<app/(admin)/admin/announcements/announcements-client.tsx>)
- [x] [app/(admin)/admin/audit/page.tsx](<app/(admin)/admin/audit/page.tsx>)
- [x] [app/(admin)/admin/page.tsx](<app/(admin)/admin/page.tsx>) (bảng Recent Actions)

---

### Fix 4 — Trang Words: Thêm cột Context và Phonetic

**Thứ tự cột mới:** `Term | Context | Phonetic | Meaning | Owner | Created | Actions`

> Về nhiều context: Chỉ show context đầu tiên (theo `order`). Cả 3 cột Context/Phonetic/Meaning đều lấy từ cùng 1 context đó → không có xung đột.

#### 4a. Cập nhật query + type — [lib/admin/queries.ts](lib/admin/queries.ts)

- [x] Thêm `partOfSpeech` và `phonetic` vào `contexts` select trong `fetchAdminWords`
- [x] Cập nhật type `AdminWord`: `contexts: { partOfSpeech: string; phonetic: string | null; meaning: string }[]`

#### 4b. Cập nhật table — [app/(admin)/admin/words/words-client.tsx](<app/(admin)/admin/words/words-client.tsx>)

- [x] Thêm 2 `<TableHead>`: Context, Phonetic (sau Term, trước Meaning)
- [x] Thêm 2 `<TableCell>` tương ứng: `partOfSpeech` (capitalize), `phonetic` (font-mono)

---

### Fix 5 — Trang Overview: Stat Cards + Biểu đồ tăng trưởng 30 ngày

#### 5a. Shared HeroCard — file mới [components/shared/hero-card.tsx](components/shared/hero-card.tsx)

- [x] Tách `HeroCard` từ `app/(app)/stats/page.tsx` ra component riêng (giữ nguyên style)
- [x] Cập nhật `app/(app)/stats/page.tsx` import từ `@/components/shared/hero-card`

Style giữ nguyên: `bg-card border border-border rounded-xl px-5 py-4`, icon `h-10 w-10 rounded-lg`, value `text-2xl font-bold`, label `text-xs text-muted-foreground`.

#### 5b. Time-series queries — [lib/admin/queries.ts](lib/admin/queries.ts)

- [x] Thêm helper `fillDays(raw, days=30)` — fill 0 cho ngày không có data
- [x] Thêm 3 raw SQL vào `fetchAdminDashboardStats` (users/words/reviews per day, 30 ngày gần nhất)
- [x] Mở rộng type `AdminDashboardStats`: `usersPerDay`, `wordsPerDay`, `reviewsPerDay`

```sql
SELECT DATE("createdAt")::text AS day, COUNT(*)::int AS count
FROM "User" / "Word" / "ReviewEvent"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt") ORDER BY day
```

#### 5c. Admin charts — file mới [components/admin/overview-charts.tsx](components/admin/overview-charts.tsx)

- [x] Client component với 3 Recharts chart (cùng màu + tooltip style với `stats-charts.tsx`):
  - `UserGrowthChart` — AreaChart, crimson `#dc143c`, 200px
  - `WordGrowthChart` — BarChart, crimson, 180px
  - `ReviewGrowthChart` — BarChart, tertiary `#2481a8`, 180px

#### 5d. Viết lại Overview page — [app/(admin)/admin/page.tsx](<app/(admin)/admin/page.tsx>)

- [x] 5 HeroCard trong grid (Total Users / Words / Reviews / Open Feedback / Active 7d)
- [x] 3 chart trong grid 3 cột (User Growth / Word Growth / Review Activity)
- [x] Giữ bảng Recent Actions bên dưới (với fix styling từ Fix 3)

---

### Kiểm tra Phase 10

- [x] Trang load bình thường dù DB cold-start (không có 500 error)
- [x] Banner hiển thị title to + content nhỏ ở 2 dòng riêng
- [x] Tất cả 6 trang admin: viền ngoài table đậm hơn row separator
- [x] Trang Words: có cột Context và Phonetic, từ không có context hiện `—`
- [x] Trang Overview: 5 HeroCard + 3 biểu đồ hiển thị đúng
- [x] Stats page của user web vẫn hoạt động bình thường (shared HeroCard)
- [x] `npx tsc --noEmit` pass, không lỗi TypeScript
- [x] `npm run build` pass (chưa chạy build production)

---

## Phase 11 — UX & Code Quality Fixes

> Phát hiện và sửa sau Phase 10 khi tiếp tục test UI.

### 11.1 — Admin Settings Page (UX fix)

**Vấn đề:** Click tab Settings trong admin sidebar redirect sang user web (`/settings`) → mất context admin.

**Sửa:**

- [x] Tạo `app/(admin)/admin/settings/page.tsx` — reuse `SettingsClient` từ `@/app/(app)/settings/settings-client`, same data fetching
- [x] Đổi href trong AdminSidebar: `/settings` → `/admin/settings`

### 11.2 — Admin Sidebar Refactor

- [x] Di chuyển tab Settings vào `navItems[]` ngay sau Audit Log (active highlight như các tab khác)
- [x] Xóa Sign out khỏi sidebar (đã có trong TopBar dropdown, không cần duplicate)
- [x] Sign out button trong TopBar: fix `DropdownMenuItem asChild` + `<div>` wrapper sai → `<DropdownMenuItem><SignOutButton /></DropdownMenuItem>`

### 11.3 — React Compiler Warnings

| File                                                                                 | Warning                                    | Fix                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/(app)/feedback/feedback-form.tsx](<app/(app)/feedback/feedback-form.tsx>)       | `form.watch()` không memoizable            | Thay bằng `useWatch({ control, name, defaultValue })`                                                                                               |
| [components/admin/announcement-banner.tsx](components/admin/announcement-banner.tsx) | `setState` synchronously trong `useEffect` | Xóa useState/useEffect, dùng `useSyncExternalStore` — `getServerSnapshot` trả `[]` (hydration-safe), `readFromStorage` đọc localStorage phía client |

- [x] `feedback-form.tsx`: `form.watch('content')` → `useWatch({ control: form.control, name: 'content', defaultValue: '' })`
- [x] `announcement-banner.tsx`: `useSyncExternalStore(subscribe, readFromStorage, getServerSnapshot)` — module-level cache (`cachedRaw`/`cachedIds`) + listeners Set; loại bỏ cả useEffect lẫn hydration mismatch cùng lúc

### 11.4 — TypeScript & CSS Lint

- [x] `types/next-auth.d.ts`: Xóa `import type { JWT }` không dùng (type được dùng trong `declare module` không cần import ngoài)
- [x] `.vscode/settings.json`: Thêm `"css.lint.unknownAtRules": "ignore"` — suppress false positive cho Tailwind v4 `@theme` và `@custom-variant`

### Kiểm tra Phase 11

- [x] Admin → Settings: không redirect sang user web, render đúng trong admin layout
- [x] Admin sidebar: Settings tab active highlight khi đang ở `/admin/settings`
- [x] Sign out button hoạt động qua TopBar dropdown ở cả user web và admin web
- [x] `npx tsc --noEmit` pass
- [x] Không còn React Compiler warning cho 2 file trên
- [x] Không còn CSS lint warning cho `@theme`, `@custom-variant` trong globals.css

---

# Round 2 — Phase 12-16 (New Updates)

## Context Round 2

Sau Phase 11, beta sẵn sàng cho 3-5 user thử. User đề xuất 5 ideas mới cho admin web. Round này phản hồi từng idea với pushback rõ ràng + đề xuất implementation.

**Mục tiêu**: thêm khả năng giám sát Reviews + External API quota (chống burn quota trong beta) + cải thiện code quality.

---

## Tổng kết phản hồi 5 ideas

| Idea                              | Recommendation                | Lý do                                                                                            |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| **1. Reviews mgmt page**          | ✅ BUILD                      | Critical visibility cho beta. Bao gồm Grammar/Idiom quiz (đã log)                                |
| **2. External services page**     | ✅ BUILD + new DB model       | Critical chống quota burn. Cần `ApiUsageDaily` table, không thể chỉ in-memory                    |
| **3. Categories admin page**      | ❌ **SKIP** (chỉ 2 stat card) | Categories per-user, không phải shared content → admin CRUD vô nghĩa                             |
| **4. Users/Words CRUD đầy đủ**    | ⚠️ **MOSTLY SKIP**            | Users dùng Google OAuth, không Create được. Word phức tạp (contexts/examples). View+Delete đã đủ |
| **5. Shared DataTable component** | ✅ BUILD đầu tiên             | Refactor foundation — 4 table hiện đã copy-paste 80% code                                        |

**Bổ sung tui phát hiện**: Announcements hiện chỉ có Toggle + Delete, **thiếu Update**. Đây là Update DUY NHẤT đáng làm vì typo trong announcement hiển thị cho mọi user.

---

## Pushback chi tiết — 3 ideas tui không khuyến nghị

### Idea 3 — Categories admin page → SKIP

**Lý do**: Category là per-user taxonomy ("Business", "Travel" của riêng từng người). Admin không có lý do để rename/delete categories của user khác — đó là quyền user.

**Thay vào đó**: thêm 2 stat card vào trang Overview (`/admin`):

- `Avg Categories/User` — tổng categories / tổng users
- `% Words With Category` — % word đã được tag

→ Đủ visibility xem feature có được dùng không, KHÔNG cần page riêng.

### Idea 4 — Full CRUD Users/Words → MOSTLY SKIP

**Users**:

- ❌ **Create**: Không thể. Account tạo qua Google OAuth tự động khi user lần đầu sign-in.
- ❌ **Update**: Email/avatar bind từ Google. Field `name` có thể edit nhưng admin không bao giờ thấy name của user khác trong flow bình thường → low value.
- ✅ Giữ nguyên View + Delete.

**Words**:

- ❌ **Create**: Word là user-owned (`userId` FK). Admin tạo word cho user nào? Không có use case.
- ❌ **Update**: Edit term + nhiều contexts + examples = UI phức tạp. User tự edit ở `/words/[id]/edit` được rồi. Admin chỉ cần delete khi spam.
- ✅ Giữ nguyên View + Delete.

**Bổ sung mới**: thêm `updateAnnouncement(id, {title, content, expiresAt})` — sửa typo announcement (~30 LoC).

**Các page nào CẦN thêm CRUD?**

- Feedback: đã có status update ✅
- Audit Log: read-only by design ✅
- Reviews (Phase 15 mới): chỉ view + drill-down, không CRUD (review event là hard fact, không sửa)
- API Usage (Phase 14 mới): read-only

→ **Kết luận**: chỉ 1 thứ duy nhất cần thêm là `updateAnnouncement`.

---

## Phase 12 — Shared DataTable Component (Refactor)

> **Build đầu tiên**: tất cả phase sau dùng component này.

### 12.1. Tạo `components/admin/data-table.tsx`

```ts
type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string; // td className
  headerClassName?: string; // th className
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    basePath: string;
    searchParams?: Record<string, string>; // preserve filter/q
  };
};
```

- Client component (cell callbacks closure server actions qua `useTransition` ở caller)
- Outer styling cố định: `border border-foreground/20 [&_thead_tr]:bg-primary/10 [&_thead_tr]:border-foreground/20 [&_tbody_tr]:border-foreground/8 overflow-hidden rounded-xl`
- Pagination component nội bộ (Prev/Next link với `?page=N` + preserve other params)
- Empty state mặc định: "No data" — overridable

### 12.2. Migrate 6 tables hiện có

- [x] `users-client.tsx` — column array thay TableHeader/Body
- [x] `words-client.tsx`
- [x] `feedback-client.tsx` — extract `<StatusSelect>` per-row component
- [x] `announcements-client.tsx` — extract `<AnnouncementActions>` per-row component
- [x] `audit/page.tsx` (table inline trong page)
- [x] `admin/page.tsx` (Recent Actions table)

### 12.3. Bug fix

- [x] `announcement-banner.tsx`: `getServerSnapshot` trả `[]` literal → new reference mỗi call → vòng lặp vô hạn. Fix: dùng `const EMPTY: string[] = []` module-level.

**Net LoC**: -70 (component +80, xóa duplication -150).

---

## Phase 13 — ApiUsage Tracking (Foundation cho Phase 14)

### 13.1. Prisma schema

```prisma
model ApiUsageDaily {
  id      String   @id @default(cuid())
  date    DateTime @db.Date
  service String   // "dictionary" | "unsplash" | "groq"
  userId  String?  // nullable cho global/anonymous
  count   Int      @default(0)
  @@unique([date, service, userId])
  @@index([date, service])
}
```

- [x] Migrate: `npx prisma migrate dev --name add_api_usage_daily`

### 13.2. Helper `lib/admin/apiUsage.ts`

```ts
export async function recordApiUsage(service: string, userId: string | null) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  await db.apiUsageDaily
    .upsert({
      where: { date_service_userId: { date, service, userId } },
      create: { date, service, userId, count: 1 },
      update: { count: { increment: 1 } },
    })
    .catch(() => {}); // fire-and-forget — never break user request
}
```

### 13.3. Wrap 3 lib calls

- [x] [lib/dictionary.ts](lib/dictionary.ts) — gọi `recordApiUsage('dictionary', userId)` SAU rate-limit check, TRƯỚC `fetch()`. Dùng `void` (không await blocking).
- [x] [lib/unsplash.ts](lib/unsplash.ts) — `recordApiUsage('unsplash', userId)`
- [x] [app/actions/writing.ts](app/actions/writing.ts) — `recordApiUsage('groq', userId)` (dynamic import, sau auth check)

**Tradeoff**: 1 DB upsert/API call. Cho beta scale 3-5 user × 100-200 calls/ngày = 300-1000 upserts/ngày → không đáng kể.

**Tại sao không in-memory only?** Vercel serverless cold-start reset memory. Phải có persistence để xem historical.

---

## Phase 14 — `/admin/api-usage` Page

### 14.1. Queries trong `lib/admin/queries.ts`

- [x] `fetchApiUsageToday()` → từng service: `{ count, capDaily, percentOfCap, status: 'green'|'yellow'|'red'|'critical' }`
- [x] `fetchApiUsage30Days()` → time-series per service (dùng `fillDays`)
- [x] `fetchTopApiConsumers(limit=10)` → top consumers hôm nay (fetch all services, client-side filter per tab)

### 14.2. Free-tier caps & threshold logic

| Service       | Daily Cap (free)            | Per-user gợi ý |
| ------------- | --------------------------- | -------------- |
| dictionaryapi | unlimited (track only)      | 60/min (đã có) |
| unsplash      | ~1200 (50/hr × 24)          | 20/min (đã có) |
| groq          | 14400/day                   | 50/day (đã có) |
| neon          | N/A — track total row count | —              |

Threshold:

- `consumed/cap < 0.6` → green
- `0.6-0.8` → yellow
- `0.8-0.95` → red
- `>= 0.95` → critical (banner đỏ trên Overview)

### 14.3. UI

- [x] `app/(admin)/admin/api-usage/page.tsx` — server component
- [x] 3 service cards (dictionary, unsplash, groq): today usage % + progress bar + 30-day `ApiSparkline`
- [x] `TopConsumersTabs`: tabbed per-service, top 30 global consumers filter client-side
- [x] Banner đỏ trên `/admin` nếu bất kỳ service ở trạng thái critical
- [x] Loading state (`loading.tsx`)

### 14.4. Sidebar

- [x] Thêm `{ href: '/admin/api-usage', label: 'API Usage', icon: Activity }` vào `admin-sidebar.tsx`

---

## Phase 15 — `/admin/reviews` Page

### 15.1. Queries trong `lib/admin/queries.ts`

- [x] `fetchReviewsOverview()` — 3 datasets:
  - `reviewsPerDay30d` — UNION từ 3 bảng (vocab + grammar + idiom), stacked
  - `reviewsByMode` — counts cho 7 mode: 5 vocab + grammar + idiom
  - `accuracyByMode` — % correct cho từng mode
- [x] `fetchAdminUserReviews(page, pageSize=20)` — per-user summary: `{ userId, email, totalReviews, last7d, accuracy%, favMode, lastActiveAt }`
- [x] `fetchUserReviewDetail(userId)` — same 3 charts scope user
- [x] `fetchReviewEventsForUser(userId, mode?, page)` — raw events table cho drill-down

> **Note**: `GrammarReviewEvent` và `IdiomReviewEvent` không có cột `mode`. Inject synthetic label `'grammar_quiz'`, `'idiom_quiz'` trong UNION query.

### 15.2. UI

- [x] `app/(admin)/admin/reviews/page.tsx` — server, 3 charts top + DataTable per-user
- [x] `components/admin/reviews-charts.tsx` — client, 3 Recharts:
  - Stacked AreaChart 30 ngày (vocab/grammar/idiom) — vocab on top (đảo thứ tự để màu đỏ nổi bật)
  - PieChart 7 slices (per-mode distribution)
  - BarChart accuracy% per mode (color-coded: red < 50%, yellow < 70%, green ≥ 70%)
- [x] `app/(admin)/admin/reviews/[userId]/page.tsx` — drill-down, same charts user-scoped + bảng raw events (filter mode dropdown, paginated 50/page)
- [x] Loading states

### 15.3. Cập nhật `activeUsers7d` query

- [x] UNION cả 3 bảng `ReviewEvent` + `GrammarReviewEvent` + `IdiomReviewEvent` để đếm chính xác.

### 15.4. Sidebar

- [x] Thêm `{ href: '/admin/reviews', label: 'Reviews', icon: BarChart3 }` (giữa Words và Feedback)

---

## Phase 16 — Polish

### 16.1. Update Announcement (1 thứ CRUD duy nhất đáng thêm)

- [x] `app/actions/admin.ts` — thêm `updateAnnouncement(id, raw)` với `announcementSchema` + audit `UPDATE_ANNOUNCEMENT`
- [x] `announcements-client.tsx` — thêm `EditDialog` component (tái dụng form từ Create, pre-fill dữ liệu hiện tại) + nút ✏️ trong `AnnouncementActions`

### 16.2. Category stats trên Overview

- [x] `lib/admin/queries.ts` — thêm vào `fetchAdminDashboardStats`: `avgCategoriesPerUser`, `wordsWithCategoryPct`
- [x] `app/(admin)/admin/page.tsx` — thêm 2 HeroCard (grid mở rộng lên 7 card)

---

## Critical Files (Round 2)

```
prisma/schema.prisma                                 ← thêm ApiUsageDaily
lib/admin/queries.ts                                 ← +5 queries (api usage + reviews)
lib/admin/apiUsage.ts                                ← MỚI — recordApiUsage helper
lib/dictionary.ts, lib/unsplash.ts, lib/groq.ts     ← thêm tracking call
app/actions/admin.ts                                 ← + updateAnnouncement

components/admin/data-table.tsx                      ← MỚI — Phase 12 foundation
components/admin/reviews-charts.tsx                  ← MỚI — Phase 15
components/admin/admin-sidebar.tsx                   ← +2 nav items

app/(admin)/admin/api-usage/page.tsx                 ← MỚI — Phase 14
app/(admin)/admin/reviews/page.tsx                   ← MỚI — Phase 15
app/(admin)/admin/reviews/[userId]/page.tsx          ← MỚI — drill-down

app/(admin)/admin/{users,words,feedback,announcements,audit}/*.tsx ← migrate to DataTable
app/(admin)/admin/page.tsx                           ← + 2 category stat cards + critical banner
```

---

## Phasing & Estimates

| Phase  | Scope                                     | Net LoC | Days  |
| ------ | ----------------------------------------- | ------- | ----- |
| **12** | DataTable + migrate 4 tables              | -70     | 0.5   |
| **13** | ApiUsage schema + tracking helper         | +180    | 0.5   |
| **14** | `/admin/api-usage` page + critical banner | +250    | 1.0   |
| **15** | `/admin/reviews` overview + drill-down    | +400    | 1.5   |
| **16** | updateAnnouncement + category stats       | +60     | 0.25  |
| Total  |                                           | +820    | ~3.75 |

**Order rationale**: 12 first (foundation cho mọi page sau) → 13 trước 14 (cần data trước UI) → 14 trước 15 (quota burn risk > review visibility risk) → 16 cuối (polish).

---

## Risks & Edge Cases

1. **Chicken-and-egg Neon tracking**: `.catch(() => {})` trong `recordApiUsage` — Neon fail thì silent miss 1-2 counts, không break user request.
2. **UTC date boundary**: dùng `setUTCHours(0,0,0,0)` để tránh duplicate row cùng ngày khác timezone.
3. **In-memory rate limiter (`lib/rateLimit.ts`)**: KHÔNG được fix bởi `ApiUsageDaily` (đó là historical, không phải current-window). Cold start vẫn reset rate limit. → Defer thành Phase 17 nếu cần persisted rate limit.
4. **Word delete cascade**: trước khi merge Phase 15, verify `ReviewEvent.wordId` cascade hoặc set null khi delete word — nếu không sẽ FK violation.
5. **React Compiler**: column `cell()` callbacks tự được memoize, không cần `useMemo` thủ công.
6. **GrammarReviewEvent/IdiomReviewEvent không có `mode`**: inject synthetic label trong raw SQL UNION.

---

## Verification — Test trước khi merge từng phase

### Phase 12

- [x] 4 trang admin render giống y trước refactor (visual diff)
- [x] Pagination giữ filter (q ở Words, status ở Feedback) khi click Next
- [x] Delete dialog vẫn hoạt động trên Users/Words

### Phase 13-14

- [x] Login thường, gọi auto-fetch dictionary 1 word → DB có row mới trong `ApiUsageDaily`
- [x] Gọi 2 lần liên tiếp → `count=2` (không tạo 2 row)
- [x] Force unsplash error → user request KHÔNG fail (fire-and-forget verified)
- [x] `/admin/api-usage` hiển thị đúng 3 service card (Dictionary, Unsplash, Groq) + sparkline
  > Note: Plan gốc ghi "4 service card" là sai — Neon có trong bảng cap nhưng không có daily cap nên không implement thành card.
- [x] Set `consumed/cap > 0.95` (manual SQL) → banner đỏ hiện trên `/admin`

### Phase 15

- [x] Tạo review events đủ 7 mode (flashcard, fill_blank, sentence_build, writing_practice, srs, grammar_quiz, idiom_quiz) cho 1 user
  > Note: Không phải "5 vocab + 3 grammar + 2 idiom" — đây là 7 mode riêng biệt (5 vocab mode + grammar quiz + idiom quiz).
- [x] `/admin/reviews` Pie chart hiển thị đúng tối đa 7 slice (1 per mode có data) — không phải 3 slice
  > Note: Stacked AreaChart mới gộp theo nhóm vocab/grammar/idiom (3 area); Pie chart distribution là per-mode (7 slice).
- [x] Click row user → drill-down show đúng events theo trang
- [x] `activeUsers7d` count đúng sau khi UNION 3 bảng
- [x] Mode filter trong drill-down hoạt động

### Phase 16

- [x] Edit announcement → audit log có row `UPDATE_ANNOUNCEMENT`
- [x] Overview hiển thị `Avg Categories/User` + `% Words With Category` chính xác
- [x] Overview page layout: 4 hero card/row (7 card chia 2 hàng: 4 + 3)

### Final

- [x] `npx tsc --noEmit` pass
- [x] `npm run build` pass
- [x] Login non-admin email → tất cả `/admin/*` redirect `/dashboard`
