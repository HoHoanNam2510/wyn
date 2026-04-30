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

| Phase                           | Trạng thái | Ngày hoàn thành | Ghi chú                                                              |
| ------------------------------- | ---------- | --------------- | -------------------------------------------------------------------- |
| **1** Prisma schema + migration | ⏳ Pending | —               | 3 model mới: Feedback, Announcement, AuditLog                        |
| **2** Auth & TypeScript         | ⏳ Pending | —               | `isAdmin` trong JWT/Session từ `ADMIN_EMAIL` env                     |
| **3** Middleware (`proxy.ts`)   | ⏳ Pending | —               | Guard `/admin` + thêm `/feedback` vào PROTECTED_PATHS                |
| **4** Library mới               | ⏳ Pending | —               | `lib/admin/queries.ts`, `lib/admin/audit.ts`, `lib/schemas/admin.ts` |
| **5** Server Actions            | ⏳ Pending | —               | `app/actions/admin.ts` với `requireAdmin()` guard                    |
| **6** Admin UI                  | ⏳ Pending | —               | 6 trang admin + admin sidebar                                        |
| **7** Announcement Banner       | ⏳ Pending | —               | Client component dismissible vào `(app)/layout.tsx`                  |
| **8** Trang Feedback cho user   | ⏳ Pending | —               | `/feedback` với form                                                 |
| **9** Sidebar & TopBar updates  | ⏳ Pending | —               | Thêm Feedback nav item + Admin Panel dropdown link                   |
| **Verify & deploy**             | ⏳ Pending | —               | Test 9 scenarios + `npm run build`                                   |

Update với `[x]` hoặc ✅ khi hoàn thành.

---

## Phase 1 — Prisma Schema & Migration

- [ ] Thêm vào model `User`: `feedbacks Feedback[]`
- [ ] Thêm enum `FeedbackType { GENERAL BUG FEATURE_REQUEST }`
- [ ] Thêm enum `FeedbackStatus { OPEN RESOLVED DISMISSED }`
- [ ] Thêm model `Feedback` (id, userId nullable, type, content, status, createdAt) + index `[status, createdAt]`
- [ ] Thêm model `Announcement` (id, title, content, isActive, expiresAt nullable, createdAt) + index `[isActive, expiresAt]`
- [ ] Thêm model `AuditLog` (id, adminEmail, action, entityType, entityId nullable, metadata Json nullable, createdAt) + index `[adminEmail, createdAt]`
- [ ] Chạy: `npx prisma migrate dev --name add_admin_models`
- [ ] Verify: kiểm tra Prisma client regenerate ở `app/generated/prisma/`

**File chạm:** [prisma/schema.prisma](prisma/schema.prisma)

---

## Phase 2 — Auth & TypeScript Augmentation

- [ ] Sửa [types/next-auth.d.ts](types/next-auth.d.ts) — thêm `isAdmin: boolean` vào `Session.user`
- [ ] Bổ sung augmentation `next-auth/jwt` cho `JWT.isAdmin: boolean`
- [ ] Sửa [lib/auth.ts](lib/auth.ts):
  - Trong `jwt` callback: `token.isAdmin = token.email === process.env.ADMIN_EMAIL`
  - Trong `session` callback: `session.user.isAdmin = token.isAdmin ?? false`
- [ ] Thêm vào `.env`: `ADMIN_EMAIL=m8mi0909@gmail.com`
- [ ] Thêm vào `.env.example`: `ADMIN_EMAIL=` với comment giải thích
- [ ] Verify: `npx tsc --noEmit` không lỗi

---

## Phase 3 — Middleware

- [ ] Sửa [proxy.ts](proxy.ts):
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
- [ ] Verify: User thường vào `/admin` redirect về `/dashboard`; chưa login redirect về `/sign-in`

---

## Phase 4 — Library mới

### 4.1. `lib/admin/audit.ts`

- [ ] Helper `writeAuditLog({ adminEmail, action, entityType, entityId?, metadata? })` — `db.auditLog.create`

### 4.2. `lib/admin/queries.ts`

- [ ] `fetchAdminDashboardStats()` — totalUsers, totalWords, totalReviews, openFeedback, activeUsers7d, recentAuditLogs (10)
- [ ] `fetchAdminUsers(page, pageSize=20)` — kèm `_count: { words, reviewEvents }`
- [ ] `fetchAdminWords(page, q, pageSize=30)` — search by term, kèm `user.email`, context đầu tiên
- [ ] `fetchAdminFeedback(page, status, pageSize=25)` — status filter, kèm user info
- [ ] `fetchAdminAnnouncements()` — toàn bộ
- [ ] `fetchActiveAnnouncements()` — `isActive=true AND (expiresAt IS NULL OR expiresAt > now)`
- [ ] `fetchAuditLogs(page, pageSize=30)` — phân trang

### 4.3. `lib/schemas/admin.ts`

- [ ] `feedbackSubmitSchema` — type enum + content(10-2000)
- [ ] `announcementSchema` — title(1-100) + content(1-500) + expiresAt optional

---

## Phase 5 — Server Actions (`app/actions/admin.ts`)

- [ ] Helper `requireAdmin()` — gọi `auth()`, throw nếu không phải admin, return `adminEmail`
- [ ] `adminDeleteUser(userId)` — cascade + audit `DELETE_USER`
- [ ] `adminDeleteWord(wordId)` — audit `DELETE_WORD` (kèm metadata: term, ownerId)
- [ ] `updateFeedbackStatus(feedbackId, status)` — audit `UPDATE_FEEDBACK_STATUS`
- [ ] `submitFeedback({ type, content })` — KHÔNG cần admin guard, chỉ check session
- [ ] `createAnnouncement({ title, content, expiresAt? })` — audit `CREATE_ANNOUNCEMENT`
- [ ] `toggleAnnouncement(id, isActive)` — audit `ACTIVATE_/DEACTIVATE_ANNOUNCEMENT`
- [ ] `deleteAnnouncement(id)` — audit `DELETE_ANNOUNCEMENT`
- [ ] Mỗi action có `revalidatePath('/admin/...')` ở cuối

---

## Phase 6 — Admin UI

### 6.1. Layout & Sidebar

- [ ] Tạo `app/(admin)/layout.tsx` — guard `if (!session.user.isAdmin) redirect('/dashboard')`, dùng `SidebarProvider` + `TopBar` + `AdminSidebar`
- [ ] Tạo `components/admin/admin-sidebar.tsx` — clone từ user sidebar, nav items: Overview, Users, Words, Feedback, Announcements, Audit Log, ← Back to App

### 6.2. Trang Overview Dashboard

- [ ] `app/(admin)/admin/page.tsx` — server component, gọi `fetchAdminDashboardStats()`, render stat cards + bảng audit log gần nhất
- [ ] `app/(admin)/admin/loading.tsx`

### 6.3. Trang Users Management

- [ ] `app/(admin)/admin/users/page.tsx` — server, accept `searchParams.page`
- [ ] `app/(admin)/admin/users/users-client.tsx` — bảng + Dialog confirm + `adminDeleteUser` qua `useTransition` + toast + `router.refresh()`
- [ ] `app/(admin)/admin/users/loading.tsx`

### 6.4. Trang Words Management

- [ ] `app/(admin)/admin/words/page.tsx` — server, accept `searchParams.{page, q}`, render search form GET
- [ ] `app/(admin)/admin/words/words-client.tsx` — bảng (term, owner email, ngày tạo, meaning đầu tiên) + Delete
- [ ] `app/(admin)/admin/words/loading.tsx`

### 6.5. Trang Feedback Management

- [ ] `app/(admin)/admin/feedback/page.tsx` — server, accept `searchParams.{page, status}`, render filter tabs (All/Open/Resolved/Dismissed)
- [ ] `app/(admin)/admin/feedback/feedback-client.tsx` — bảng + dropdown đổi status (gọi `updateFeedbackStatus`)
- [ ] `app/(admin)/admin/feedback/loading.tsx`

### 6.6. Trang Announcements Management

- [ ] `app/(admin)/admin/announcements/page.tsx` — server, gọi `fetchAdminAnnouncements()`
- [ ] `app/(admin)/admin/announcements/announcements-client.tsx` — form tạo (title, content, expiresAt) + danh sách với toggle active + delete
- [ ] `app/(admin)/admin/announcements/loading.tsx`

### 6.7. Trang Audit Log

- [ ] `app/(admin)/admin/audit/page.tsx` — server, bảng read-only (admin email, action, entity type/id, metadata JSON, timestamp)
- [ ] `app/(admin)/admin/audit/loading.tsx`

---

## Phase 7 — Announcement Banner

- [ ] Tạo `components/admin/announcement-banner.tsx`:
  - Client component, nhận `announcements: { id, title, content }[]`
  - SSR: render rỗng (an toàn hydration)
  - `useEffect`: đọc localStorage key `wyn_dismissed_announcements`, filter ra các ID chưa dismiss
  - Hiển thị: chỉ `visible[0]` (mới nhất chưa dismiss)
  - Nút X: thêm ID vào localStorage + xóa khỏi state
  - Style: `bg-primary text-primary-foreground` full-width
- [ ] Sửa `app/(app)/layout.tsx`:
  - Thêm `fetchActiveAnnouncements()` vào `Promise.all` cùng `srsDue` query
  - Render `<AnnouncementBanner announcements={announcements} />` ngay phía trên `<TopBar />` trong cột phải

---

## Phase 8 — Trang Feedback cho User

- [ ] `app/(app)/feedback/page.tsx` — server component, metadata title "Feedback", render `<FeedbackForm />`
- [ ] `app/(app)/feedback/feedback-form.tsx` — client component:
  - 3 nút type (General/Bug/Feature Request)
  - Textarea (10-2000 chars) với character counter
  - Submit qua `useTransition` → `submitFeedback(data)`
  - Khi success: `toast("Cảm ơn bạn đã góp ý!")` + reset form (không redirect)
  - Dùng react-hook-form + zod resolver

---

## Phase 9 — Updates Sidebar & TopBar

- [ ] Sửa `components/layout/sidebar.tsx` — thêm `{ href: '/feedback', label: 'Feedback', icon: MessageSquare }` vào `navItems` (giữa Stats và Settings); import `MessageSquare` từ `lucide-react`
- [ ] Sửa `components/layout/top-bar.tsx` — thêm conditional `DropdownMenuItem` cho `user.isAdmin`:
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

- [ ] Đăng nhập bằng `m8mi0909@gmail.com` → dropdown TopBar có "Admin Panel"
- [ ] Đăng nhập bằng email khác → vào `/admin` redirect về `/dashboard`
- [ ] Logout → vào `/admin` redirect về `/sign-in`
- [ ] `/admin` hiển thị đúng tổng users/words/reviews/feedback OPEN
- [ ] Tạo user test, thêm 5 words, sau đó admin xóa user → DB cascade xóa hết, có row AuditLog `DELETE_USER`
- [ ] Tạo announcement → user thường login thấy banner → bấm X → mất → reload → vẫn không hiện
- [ ] User thường submit feedback → xuất hiện trong `/admin/feedback` với status OPEN
- [ ] Admin đổi status feedback → có row AuditLog `UPDATE_FEEDBACK_STATUS`
- [ ] `npm run build` pass, không lỗi TypeScript
- [ ] `npx tsc --noEmit` pass

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
