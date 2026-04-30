# Plan tổng hợp: Production Readiness cho Wyn (Vocabulary Web App)

## Context

Web học từ vựng cá nhân (Next.js 16 + Prisma 7 + Neon Postgres + Auth.js v5) đã hoàn thành 12 phase phát triển feature (xem [PLAN.md](PLAN.md)). Mục tiêu của user: **deploy lên production vào đầu tháng 6/2026**, mở cho người dùng thực sử dụng.

Plan này KHÔNG đề cập admin web (đã được loại trừ). Tập trung vào 6 nhóm vấn đề cần xử lý trước/sau khi launch:

1. **UX cho newbie** — gaps khi user lần đầu vào web
2. **Security** — lỗ hổng phải fix trước deploy
3. **Performance** — DB indexes, caching, bundle
4. **External services** — risk khi free tier hết quota
5. **Observability** — error tracking, analytics, logging
6. **Maintenance / Legal** — CI/CD, tests, GDPR, privacy policy

Plan được sắp xếp theo **mức độ ưu tiên triển khai**, không theo nhóm vấn đề.

---

## Đánh giá tổng quan từ góc nhìn newbie

**Điểm mạnh hiện tại:**

- Feature core hoàn chỉnh: 4 review modes + SRS + Grammar + Idioms + Text Scanner + JSON import
- Auth Google OAuth gọn (1-click)
- Mobile responsive (sidebar slide-in, hamburger)
- Dark mode, audio playback, loading skeletons
- Recency-weighted question sampling — chống lặp từ
- Toast feedback (sonner) cho các action

**Điểm yếu khi newbie lần đầu vào:**

- Dashboard trống trơn, không có onboarding tour, không có demo data → user không biết bắt đầu từ đâu
- Branding lệch: sidebar ghi "Wyn", trang sign-in ghi "VocabApp"
- Không có Profile / Settings page — chỉ có nút Sign Out
- Không có cách export data (data hostage)
- Không có /help, /privacy, /terms — bắt buộc khi launch public với Google OAuth
- Không có error.tsx, not-found.tsx → 404/500 hiện trang Next.js mặc định xấu
- Không có metadata OG → share link lên Facebook/Zalo hiện preview rỗng
- Không có manifest.json / PWA → không "Add to Home Screen" được trên mobile

---

## Tiến độ thực thi

| Phase                                     | Trạng thái | Ngày hoàn thành | Ghi chú                                                                                           |
| ----------------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------- |
| **A1** Security                           | ✅ Done    | 2026-04-29      | auth() trên 2 API routes, categoryIds ownership check, in-memory rate limiter, safeUrl validation |
| **A2** DB indexes                         | ✅ Done    | 2026-04-29      | Migration `20260429103358_add_event_indexes` đã apply lên Neon                                    |
| **A3** Branding + OG + error pages        | ✅ Done    | 2026-04-29      | sign-in "Wyn", opengraph-image.tsx, error.tsx, not-found.tsx, metadata đầy đủ                     |
| **A4** Privacy + Terms                    | ✅ Done    | 2026-04-29      | `/privacy`, `/terms` với public layout; sidebar footer links                                      |
| **A5** Account deletion + export          | ✅ Done    | 2026-04-29      | `/settings` page, deleteAccount(), exportData(), Settings link trong sidebar + topbar             |
| **A6** `.env.example`                     | ✅ Done    | 2026-04-29      | Tất cả env vars với placeholder và comment                                                        |
| **B1** Observability (Sentry + Analytics) | ✅ Done    | 2026-04-30      | Sentry + Vercel Analytics + Speed Insights                                                        |
| **B2** Onboarding newbie                  | ✅ Done    | 2026-04-30      | Empty state 3-step checklist khi wordCount === 0                                                  |
| **B3** Profile & Settings mở rộng         | ✅ Done    | 2026-04-30      | Inline name edit + theme picker (light/dark/system)                                               |
| **B4** SEO (sitemap + robots)             | ✅ Done    | 2026-04-30      | app/sitemap.ts + app/robots.ts                                                                    |
| **B5** CI/CD pipeline                     | ✅ Done    | 2026-04-30      | .github/workflows/ci.yml — lint + tsc + prisma validate + format check                            |
| **B6** Unit tests                         | ⏳ Pending | —               | Post-launch                                                                                       |
| **Custom Domain**                         | ✅ Done    | 2026-04-30      | wynvocab.site mua tại Namecheap, DNS Namecheap → Vercel, Google OAuth updated                     |
| **C1** PWA                                | ⏳ Pending | —               | Post-launch                                                                                       |
| **C2** i18n                               | ⏳ Pending | —               | Post-launch                                                                                       |
| **C3** Caching / bundle optimization      | ⏳ Pending | —               | Post-launch                                                                                       |
| **C4** Backup script                      | ⏳ Pending | —               | Post-launch                                                                                       |

**Bonus (ngoài plan gốc):**

- `proxy.ts`: bổ sung `/grammar`, `/idioms`, `/text-scanner` vào `PROTECTED_PATHS` (các route này cần auth nhưng bị thiếu)
- `app/(public)/layout.tsx`: nút **← Back to app** trên header của privacy/terms pages

---

## Phase A — MUST-FIX trước khi deploy (≈ 1 tuần)

### A1. Security critical (BLOCKING) ✅

**Vấn đề:**

- [app/actions/words.ts:36,84](app/actions/words.ts#L36) — `createWord` / `updateWord` nhận `categoryIds` từ user input nhưng không verify category có thuộc user hiện tại. Attacker (user khác đang đăng nhập) có thể inject categoryId của user khác → cross-user data linkage.
- [app/api/dictionary/route.ts](app/api/dictionary/route.ts) + [app/api/unsplash/route.ts](app/api/unsplash/route.ts) — không có `auth()` check. Bất kỳ ai (không cần login) gọi được, sẽ ăn quota Unsplash 50 req/hr.
- Không có rate limiting per-user cho Groq (14400/day shared) — 1 user spam có thể làm hết quota cả ngày của mọi người.
- [lib/schemas/word.ts](lib/schemas/word.ts) — `imageUrl`/`audioUrl` chỉ check `.url()`, không refine để chặn `javascript:` protocol hay domain không whitelist.

**Action:**

1. Thêm verify `categoryIds` thuộc user trong `createWord`, `updateWord`, `importWords`:
   ```ts
   const owned = await db.category.count({
     where: { id: { in: data.categoryIds }, userId },
   });
   if (owned !== data.categoryIds.length) throw new Error('Invalid category');
   ```
2. Wrap 2 API routes (`/api/dictionary`, `/api/unsplash`) bằng `await auth()` → return 401 nếu chưa login.
3. Thêm rate limiting đơn giản (in-memory hoặc Upstash Redis free tier):
   - `lib/rateLimit.ts`: per-userId + per-action (e.g., `groqWriting`: 50/day/user, `unsplashSearch`: 20/min/user, `dictionaryFetch`: 60/min/user).
4. Refine `urlSchema = z.string().url().refine(u => /^https?:/.test(u))` — chặn `javascript:`, `data:`.

### A2. DB indexes (performance critical khi user vượt 1000+ reviews) ✅

**Vấn đề:** [prisma/schema.prisma](prisma/schema.prisma) — `ReviewEvent`, `GrammarReviewEvent`, `IdiomReviewEvent` không có index trên `(userId, reviewedAt)` nhưng [lib/stats/queries.ts](lib/stats/queries.ts) chạy 14 raw SQL group by ngày/user. Khi 1 user có 10k+ events → full table scan.

**Action:** Thêm vào schema rồi `npx prisma migrate dev --name add_event_indexes`:

```prisma
model ReviewEvent { ... @@index([userId, reviewedAt]) }
model GrammarReviewEvent { ... @@index([userId, reviewedAt]) }
model IdiomReviewEvent { ... @@index([userId, reviewedAt]) }
```

### A3. UX — branding + error pages + OG metadata ✅

**Vấn đề:**

- [app/(auth)/sign-in/](<app/(auth)/sign-in/>) hiển thị "VocabApp", sidebar hiển thị "Wyn" — chọn 1 tên duy nhất.
- [app/layout.tsx:18](app/layout.tsx#L18) — metadata chỉ có `title`, `description`. Thiếu OpenGraph image, twitter card, canonical, metadataBase.
- Không có `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`.

**Action:**

1. Quyết định branding (đề xuất: giữ "Wyn" — ngắn, dễ nhớ). Sửa sign-in page.
2. Bổ sung metadata trong layout:
   ```ts
   export const metadata: Metadata = {
     metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
     title: { default: 'Wyn — Học từ vựng tiếng Anh', template: '%s · Wyn' },
     description: 'App học từ vựng cá nhân với SRS, ngữ pháp và idiom.',
     openGraph: {
       title: 'Wyn',
       description: '...',
       images: ['/og.png'],
       type: 'website',
     },
     twitter: { card: 'summary_large_image' },
     icons: { icon: '/icon.png' },
   };
   ```
3. Tạo `og.png` (1200×630) — có thể dùng `next/og` ImageResponse generate dynamic.
4. Tạo `app/error.tsx` + `app/not-found.tsx` với UI thân thiện (CTA về `/dashboard`).

### A4. Legal — privacy + terms (BẮT BUỘC nếu dùng Google OAuth public) ✅

**Vấn đề:** Google OAuth Verification Process yêu cầu privacy policy URL công khai. Nếu chưa có → app sẽ hiện "unverified" cảnh báo cho user.

**Action:**

1. Tạo `app/(public)/privacy/page.tsx` + `app/(public)/terms/page.tsx`.
2. Nội dung tối thiểu: thu thập gì (email, name, image từ Google), dùng để làm gì, không bán data, cách user xóa account, contact email.
3. Verify domain trong Google Cloud Console + submit OAuth consent screen review.

### A5. Account deletion (GDPR) ✅

**Vấn đề:** User không có cách tự xóa tài khoản. Nếu launch ở EU/VN có user yêu cầu xóa data → phải làm thủ công.

**Action:** Thêm trang `/settings/account` với nút "Delete Account" + confirm dialog. Server action `deleteAccount()` xóa User → cascade xóa Word/Category/ReviewEvent/etc.

### A6. Secrets check + .env.example ✅

**Vấn đề:** Không có `.env.example` → dev mới không biết env nào cần. (Đã verify: `.env` KHÔNG bị commit, không cần rotate.)

**Action:** Tạo `.env.example` liệt kê tất cả keys (DATABASE*URL, DIRECT_URL, AUTH*\*, UNSPLASH_ACCESS_KEY, GROQ_API_KEY, NEXT_PUBLIC_APP_URL) với placeholder.

---

## Phase B — SHOULD-HAVE trong tháng đầu launch (≈ 2 tuần)

### B1. Observability

**Lý do:** Hiện tại không có cách biết khi production có lỗi — `console.error` chỉ vào log Vercel.

**Đề xuất stack (free tier đủ cho < 1k user):**

- **Sentry** ([sentry.io](https://sentry.io)) — error tracking, free 5k events/tháng. Cài qua `@sentry/nextjs`.
- **Vercel Analytics + Speed Insights** — tích hợp 1 dòng, free tier 25k events. Đo Web Vitals real user.
- **PostHog** (self-hosted hoặc cloud free 1M events/tháng) — product analytics: feature usage, funnel, retention. Hữu ích để biết user dùng review mode nào nhiều.

**Action:**

1. `npm i @sentry/nextjs` → chạy wizard.
2. Thêm `@vercel/analytics` + `@vercel/speed-insights` vào `app/layout.tsx`.
3. (Optional) PostHog cho tracking custom event: `word_added`, `review_completed`, `srs_session_started`.

### B2. Onboarding cho newbie

**Vấn đề:** Dashboard mới đăng nhập trống trơn, user không biết phải làm gì.

**Đề xuất:**

- **Empty state có hướng dẫn**: thay vì "0 words" → hiện 3-step checklist: "1. Thêm từ đầu tiên, 2. Tạo category, 3. Bắt đầu review". Mỗi step là CTA có link.
- **Demo word optional**: nút "Load 20 từ vựng mẫu" trên dashboard — gọi server action seed 20 từ phổ biến vào account user. Có thể xoá sau.
- **Tooltip / coach marks**: giới thiệu sidebar lần đầu (dùng `localStorage` flag để chỉ hiện 1 lần).

### B3. Profile & Settings page

**Action:** Tạo `/settings` với:

- Edit profile (name, image — đồng bộ với Google nhưng cho phép override)
- Theme preference (light/dark/system)
- Export data (JSON download — reuse format từ Phase 12 import schema → roundtrip)
- Delete account (đã làm ở A5)

### B4. SEO infrastructure

**Action:**

1. `app/sitemap.ts` — generate sitemap (chỉ public pages: `/`, `/privacy`, `/terms`).
2. `app/robots.ts` — disallow `/dashboard`, `/words`, etc. (vì cần auth).
3. Verify Google Search Console.

### B5. CI/CD pipeline

**Action:** Tạo `.github/workflows/ci.yml`:

- On PR/push: `npm ci`, `npm run lint`, `tsc --noEmit`, `npm run build`, `prisma validate`.
- Block merge nếu fail.
- (Optional) Preview deploy via Vercel — đã có sẵn nếu connect Vercel-GitHub.

### B6. Tests cho logic critical

**Vấn đề:** Không có test nào. Refactor → dễ regression. Đặc biệt SRS algorithm + recency weighting nếu sai sẽ ảnh hưởng cả app.

**Action:** Cài `vitest` + viết unit tests cho:

- `lib/srs.ts` → `computeNextSrs(state, grade)` — test 4 grade × edge case (rep=0, rep=1, EF floor 1.3).
- `lib/review/pickQuestions.ts` → `recencyWeight`, `weightedSample`.
- `lib/text-scanner.ts` → `tokenize`.
- `lib/dictionary.ts` parse → mock fetch.

Skip E2E (Playwright) cho MVP — chỉ thêm sau nếu thấy regression nhiều.

---

## Phase C — NICE-TO-HAVE post-launch (sau 1 tháng)

### C1. PWA / installable

- `app/manifest.ts` (Next.js 16 native) → name, icons, theme_color, display: standalone.
- Service worker với `next-pwa` hoặc Workbox cho offline read mode (cache static + word list).
- Lý do post-launch: chỉ làm khi có >50% mobile traffic.

### C2. i18n (Vietnamese ↔ English)

Hiện tại UI label hardcode mix Việt-Anh không nhất quán. Nếu muốn launch cho cộng đồng VN → cài `next-intl`.

### C3. Caching / cost optimization

- Wrap `fetchDictionary` + `searchUnsplash` bằng `unstable_cache(..., { revalidate: 86400 })` — giảm req tới external API.
- Lazy-load Recharts (`dynamic(import, { ssr: false })`) chỉ trên `/stats` — giảm bundle ~250KB.
- Server-side `Suspense` boundary trên dashboard cho `fetchStats()` (14 queries) — streaming UI.

### C4. Backup script

Neon free tier auto-backup 7 ngày. Để an tâm hơn:

- GitHub Actions cron tuần 1 lần: `pg_dump` → upload S3/R2.
- Hoặc Vercel Cron (free tier có) gọi API export → email/upload.

---

## External services — chi phí dự kiến và alternatives

| Service           | Free tier                           | Khi nào cần upgrade                 | Cost upgrade                  | Alternative VN-friendly                |
| ----------------- | ----------------------------------- | ----------------------------------- | ----------------------------- | -------------------------------------- |
| **Vercel Hobby**  | 100GB bw, 12s function              | >500 active user/ngày               | Pro $20/mo/member             | Self-host VPS Vietnix ~120k/tháng      |
| **Neon Postgres** | 512MB, 0.5 compute hr/day           | DB > 250MB hoặc cold start khó chịu | Launch $19/mo (10GB, no idle) | Supabase free 500MB (gần tương đương)  |
| **Unsplash**      | 50/hr (demo) → 5000/hr (production) | NGAY — apply production tier (free) | Free                          | —                                      |
| **Groq**          | 14400 req/day                       | >300 active user dùng AI check      | Pay-as-go ~$0.05/M tokens     | OpenAI gpt-4o-mini cheap, ~tương đương |
| **Sentry**        | 5k events/mo                        | >1k active user                     | $26/mo Team                   | GlitchTip self-host (free)             |
| **Google OAuth**  | Unlimited                           | —                                   | —                             | —                                      |
| **PostHog Cloud** | 1M events/mo                        | — (rất rộng)                        | $0.000248/event sau           | Self-host nếu muốn                     |

**Khuyến nghị giai đoạn launch:**

- Tổng chi phí 0 đồng nếu < 100 active user/ngày — tất cả free tier đều đủ.
- Action duy nhất phải làm NGAY: **apply Unsplash production tier** (50→5000 req/hr, vẫn miễn phí).
- Nếu dự kiến bùng nổ user → budget ~$40/mo (Neon Launch + Vercel Pro) là an toàn cho 1k-5k active user.

---

## Critical files sẽ chạm

```
prisma/schema.prisma                        ← thêm @@index trên 3 review event tables
app/actions/words.ts                        ← verify categoryIds ownership
app/actions/import.ts                       ← cùng verify
app/api/dictionary/route.ts                 ← thêm auth()
app/api/unsplash/route.ts                   ← thêm auth()
app/actions/writing.ts                      ← rate limit per-user cho Groq
lib/rateLimit.ts                            ← MỚI — utility rate limiter
lib/schemas/word.ts                         ← refine URL validation
app/layout.tsx                              ← OG metadata, metadataBase
app/error.tsx, app/not-found.tsx            ← MỚI
app/(auth)/sign-in/page.tsx                 ← đổi "VocabApp" → "Wyn"
app/(public)/privacy/page.tsx               ← MỚI — privacy policy
app/(public)/terms/page.tsx                 ← MỚI — terms
app/(app)/settings/page.tsx                 ← MỚI — profile + delete account + export
app/actions/account.ts                      ← MỚI — deleteAccount, exportData
app/sitemap.ts, app/robots.ts               ← MỚI
.env.example                                ← MỚI
.github/workflows/ci.yml                    ← MỚI
vitest.config.ts + lib/__tests__/*          ← MỚI (Phase B6)
```

---

## Verification — cách test trước khi deploy

**A1 (Security):**

- Tạo 2 user A, B. User B tạo category. Login A → mở DevTools → submit POST với `categoryIds: [B's category id]` → phải bị reject.
- Logout → curl `/api/dictionary?term=hello` → phải nhận 401.
- Spam Groq writing check 60 lần/phút → phải bị rate limit từ lần thứ N.

**A2 (Indexes):**

- `npx prisma migrate dev --name add_event_indexes` → check migration SQL có CREATE INDEX.
- (Optional) Seed 10k ReviewEvent → so sánh `EXPLAIN ANALYZE` trước/sau.

**A3 (Branding/OG):**

- Mở `/sign-in` thấy "Wyn" thay vì "VocabApp".
- Paste URL production vào [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → preview hiện đúng OG image + title.
- Truy cập `/foo-bar` không tồn tại → hiện not-found page custom.

**A4 (Legal):**

- Verify privacy policy URL trong Google Cloud Console → trạng thái OAuth chuyển từ "Testing" sang "In production".

**A5 (Account deletion):**

- Tạo user test, thêm 5 words. Delete account → check DB `User` + tất cả `Word`, `Category`, `ReviewEvent` cascade-deleted. Login lại Google → tạo user mới (clean).

**B1 (Sentry):**

- Throw test error trong 1 server action → vào Sentry dashboard thấy event.
- Vercel Speed Insights tab hiện LCP/FID/CLS sau khi có 100+ visit.

**Production smoke test (post-deploy):**

1. Login lần đầu → dashboard load < 3s (cold start Neon < 30s acceptable).
2. Add 1 word → auto-fetch dict + Unsplash work.
3. Run review session 10 câu → log vào ReviewEvent.
4. Check Sentry không có error mới.
5. Mobile (Chrome iOS/Android) — sidebar mở/đóng, audio play.

---

## Phân chia thời gian gợi ý (4 tuần trước launch 1/6)

| Tuần                | Focus                                                  | Output                                    | Trạng thái           |
| ------------------- | ------------------------------------------------------ | ----------------------------------------- | -------------------- |
| Tuần 1 (đầu 5/2026) | Phase A1 + A2 (security + indexes)                     | Migration + security fixes                | ✅ Done (2026-04-29) |
| Tuần 2              | Phase A3 + A4 + A5 + A6 (UX + legal)                   | Privacy/terms công bố, settings page live | ✅ Done (2026-04-29) |
| Tuần 3              | Phase B1 + B5 (Sentry + CI) + Unsplash production tier | Sentry receiving events, CI green         | ✅ Done (2026-04-30) |
| Tuần 4              | Phase B2 + B3 + B4 (onboarding + SEO) + custom domain  | wynvocab.site live, smoke test done       | ✅ Done (2026-04-30) |
| 1/6/2026            | **Public launch**                                      | Verify uptime 7 ngày                      | ⏳ Target            |

Phase B6 (tests) + Phase C có thể làm sau launch khi đã thấy pattern lỗi thực tế.
