# PLAN.md — Vocabulary Learning App Roadmap

> Keep this file up-to-date. Update phase checkboxes as work progresses.

---

## Goal

A personal English vocabulary learning web app that replicates a paper-based learning style (word + phonetics + meaning + examples), extended with structured multi-context support, categorization, review modes, and progress tracking.

**Non-goals (current scope):** SRS algorithm, CSV import, multiple public users, example translation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC + Server Actions) |
| Language | TypeScript (strict) |
| Database | PostgreSQL — Neon free tier |
| ORM | Prisma |
| Auth | Auth.js v5 (Google OAuth) |
| UI | Tailwind CSS + shadcn/ui |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| External APIs | dictionaryapi.dev (phonetics/audio) · Unsplash API (images) |
| Hosting | Vercel (free tier) |

---

## Phase 1 — Foundation: Auth + CRUD + Categories

**Status:** `[ ]` Not started

**Goal:** Fully working word management before any review features. This is the core of the app.

### Tasks
- [ ] Next.js 15 project setup (TypeScript, Tailwind, ESLint, App Router)
- [ ] Tailwind color palette (13 shades, primary #DC143C)
- [ ] Prisma schema + first migration (all models)
- [ ] Auth.js v5 Google OAuth (sign in → `/dashboard`, sign out)
- [ ] Layout: sidebar nav (Words, Categories, Review, Stats) + top bar
- [ ] Word list page (`/words`):
  - Search by term
  - Filter by category
  - Pagination (50 words/page)
  - Card/list toggle
- [ ] Add word page (`/words/new`):
  - Term input → auto-fetch from dictionaryapi.dev → pre-fills contexts
  - Multiple contexts: POS dropdown + phonetic + audioUrl + meaning (textarea)
  - Multiple examples per context (add/remove inline)
  - Image picker: fetch 8 Unsplash suggestions → grid → pick 1 (optional)
  - Category multi-select
- [ ] Edit word page (`/words/[id]/edit`) — same form, pre-filled
- [ ] Delete word (with confirmation dialog)
- [ ] Categories page (`/categories`):
  - CRUD: name + color picker
  - Show word count per category
- [ ] Assign/remove categories from word (from word edit page)

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

**Status:** `[ ]` Not started  
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

**Status:** `[ ]` Not started  
**Prerequisite:** Phase 2 (needs ReviewEvent data)

### Metrics & Visualizations

| Metric | Visualization |
|---|---|
| Words added / day (last 30d) | Line chart |
| Reviews / day (last 30d) | Bar chart |
| Accuracy / day (last 30d) | Line chart (%) |
| Current streak (consecutive active days) | Hero number |
| Total words | Hero number |
| Words mastered (accuracy ≥ 80%, ≥ 5 reviews) | Hero number |
| Top 10 struggling words (accuracy < 50%) | Table |
| Words per category | Donut chart |

### Key files
```
app/(app)/stats/
lib/stats/queries.ts    ← Prisma aggregation queries (group by day, etc.)
```

---

## Phase 4 — Polish

**Status:** `[ ]` Not started  
**Prerequisite:** Phase 3 complete

- [ ] Dark mode (next-themes)
- [ ] Audio playback button on word/context (using `audioUrl` field)
- [ ] Keyboard shortcuts in review (already in Phase 2 spec)
- [ ] Mobile responsive audit and fixes
- [ ] Empty states (no words, no categories, no review data)
- [ ] Loading skeletons for async data

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
