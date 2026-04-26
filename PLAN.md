# PLAN.md — Vocabulary Learning App Roadmap

> Keep this file up-to-date. Update phase checkboxes as work progresses.

---

## Goal

A personal English vocabulary learning web app that replicates a paper-based learning style (word + phonetics + meaning + examples), extended with structured multi-context support, categorization, review modes, and progress tracking.

**Non-goals (current scope):** SRS algorithm, CSV import, multiple public users, example translation.

---

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Framework     | Next.js 15 (App Router, RSC + Server Actions)               |
| Language      | TypeScript (strict)                                         |
| Database      | PostgreSQL — Neon free tier                                 |
| ORM           | Prisma                                                      |
| Auth          | Auth.js v5 (Google OAuth)                                   |
| UI            | Tailwind CSS + shadcn/ui                                    |
| Forms         | react-hook-form + zod                                       |
| Charts        | Recharts                                                    |
| External APIs | dictionaryapi.dev (phonetics/audio) · Unsplash API (images) |
| Hosting       | Vercel (free tier)                                          |

---

## Phase 1 — Foundation: Auth + CRUD + Categories

**Status:** `[x]` Complete

**Goal:** Fully working word management before any review features. This is the core of the app.

### Tasks

- [x] Next.js 16 project setup (TypeScript, Tailwind v4, ESLint, App Router)
- [x] Tailwind color palette (13 shades, primary #DC143C) in globals.css via `@theme`
- [x] Prisma 7 schema + first migration (all models) — uses `@prisma/adapter-pg`
- [x] Auth.js v5 Google OAuth (sign in → `/dashboard`, sign out)
- [x] Layout: sidebar nav (Words, Categories, Review, Stats) + top bar
- [x] Word list page (`/words`): search, filter by category, pagination, card/list toggle
- [x] Add word page (`/words/new`): auto-fetch from dictionaryapi.dev, multi-context, examples, Unsplash picker, category multi-select
- [x] Edit word page (`/words/[id]/edit`) — same form, pre-filled
- [x] Delete word (with confirmation dialog)
- [x] Categories page (`/categories`): CRUD inline, name + color picker, word count
- [x] Assign/remove categories from word (from word edit page)

### Key files

```
prisma/schema.prisma
app/(auth)/sign-in/
app/(app)/words/
app/(app)/words/new/
app/(app)/words/[id]/edit/
app/(app)/categories/
lib/dictionary.ts          ← dictionaryapi.dev fetch + parse
lib/unsplash.ts            ← Unsplash image search
lib/schemas/               ← Zod schemas (shared client/server)
app/actions/words.ts       ← Server Actions: createWord, updateWord, deleteWord
app/actions/categories.ts  ← Server Actions: createCategory, updateCategory, deleteCategory
```

---

## Phase 2 — Review Modes

**Status:** `[x]` Complete  
**Prerequisite:** Phase 1 complete (need real word data to review)

**Goal:** Two review modes that use the examples created in Phase 1.

### Flashcard MC

- Show: word image (if exists) + context meaning
- 4 answer choices: correct term + 3 random distractors from same category (or ALL)
- Click → reveal correct/wrong → next card
- Keyboard: `1`–`4` to select, `Enter` / `Space` to advance

### Fill-in-Blank

- Take a random example from word pool
- Replace the word with `_______` (blank)
- User types answer → submit → check (case-insensitive, trim whitespace)
- Show correct answer if wrong → next

### Session flow

1. Setup page: choose category + mode + number of questions (10/20/50/all)
2. Review screen: progress bar (X/N) + question + input/choices
3. Summary screen: score, time, list of wrong answers with correct answers

### ReviewEvent logging

Every answer logged: `{ userId, wordId, mode, correct, reviewedAt, durationMs }`

### Key files

```
app/(app)/review/
app/(app)/review/[mode]/
lib/review/pickQuestions.ts    ← select words + generate distractors
app/actions/reviews.ts         ← logReviewEvent Server Action
```

---

## Phase 3 — Statistics Dashboard

**Status:** `[x]` Complete  
**Prerequisite:** Phase 2 (needs ReviewEvent data)

### Metrics & Visualizations

| Metric                                       | Visualization  |
| -------------------------------------------- | -------------- |
| Words added / day (last 30d)                 | Line chart     |
| Reviews / day (last 30d)                     | Bar chart      |
| Accuracy / day (last 30d)                    | Line chart (%) |
| Current streak (consecutive active days)     | Hero number    |
| Total words                                  | Hero number    |
| Words mastered (accuracy ≥ 80%, ≥ 5 reviews) | Hero number    |
| Top 10 struggling words (accuracy < 50%)     | Table          |
| Words per category                           | Donut chart    |

### Key files

```
app/(app)/stats/
lib/stats/queries.ts    ← Prisma aggregation queries (group by day, etc.)
```

---

## Phase 4 — Polish

**Status:** `[x]` Complete  
**Prerequisite:** Phase 3 complete

### Dark mode
- [x] Install `next-themes`, wrap root layout with `ThemeProvider`
- [x] `@custom-variant dark` in globals.css — class-based dark mode (not media query)
- [x] `.dark {}` token block replacing `@media (prefers-color-scheme: dark)` — near-black `#0d0d0d` background
- [x] `ThemeToggle` component (Sun/Moon icon, mounted guard for hydration safety)

### Audio playback
- [x] `AudioButton` component — native Web Audio API, play/stop, loading state
- [x] Audio button on word cards (card + list view) with `stopPropagation` fix
- [x] Audio button on review session flashcard
- [x] `phonetic` + `audioUrl` surfaced in `FlashcardQuestion` type

### Loading skeletons
- [x] `loading.tsx` for `/words`, `/categories`, `/stats`, `/review`, `/dashboard`
- [x] All skeletons match `max-w-*` + `mx-auto` of their page content

### Mobile responsive
- [x] `SidebarContext` — shared open/close state between Sidebar and TopBar
- [x] Sidebar slide-in with backdrop on mobile (`sm:hidden` hamburger, `sm:static` on desktop)
- [x] `HamburgerButton` — mobile-only, calls `useSidebar().toggle`
- [x] `TopBar` — `ml-auto` on right group so toggle+avatar stays right-aligned when hamburger hidden

### UX improvements (beyond original scope)
- [x] Word detail page (`/words/[id]`) — dedicated read view: all contexts, examples numbered, audio, categories, Edit/Delete buttons
- [x] Word cards and list rows are clickable → navigate to detail page (via `router.push`, not Link, to avoid audio click conflicts)
- [x] Sort dropdown on words page: Newest / Oldest / A→Z / Z→A (URL param `?sort=`, no DB migration needed)
- [x] Main content `mx-auto` centering on dashboard, categories, review, stats pages
- [x] Separator `border-t` between image area and content on word cards
- [x] LCP `priority` prop: sidebar logo, word detail image, first 2 word cards
- [x] Unsplash image grid: `grid-cols-2 sm:grid-cols-4` (was broken on mobile)

### Key files (new)
```
components/layout/theme-toggle.tsx       ← dark/light toggle button
components/layout/hamburger-button.tsx   ← mobile sidebar trigger
components/layout/sidebar-context.tsx    ← shared sidebar open/close state
components/ui/audio-button.tsx           ← audio playback component
app/(app)/words/[id]/page.tsx            ← word detail page (RSC)
app/(app)/words/[id]/word-delete-button.tsx  ← delete confirm dialog (client)
app/(app)/*/loading.tsx                  ← skeleton loading for all main pages
```

---

## Future Backlog (not in current scope)

- SRS algorithm (SM-2 like Anki) — only if review without scheduling feels insufficient
- Multi-user / public access
- CSV/JSON import
- Example translation (Vietnamese)
- Offline mode / PWA

---

## Architecture Notes

- **Server Actions for all mutations** — no REST API routes for CRUD operations
- **RSC for data fetching** — query DB directly in page components, no `useEffect` data fetching
- **Single Zod schema per entity** — defined in `lib/schemas/`, used by both Server Action and client-side form validation
- **External APIs fail gracefully** — dictionary/Unsplash fetch errors should never block word creation; show empty state, user fills manually
