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
