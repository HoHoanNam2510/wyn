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

## Phase 5 — Sentence Builder Mode

**Status:** `[x]` Complete  
**Prerequisite:** Phase 4 complete

**Goal:** Add a third review mode focused on grammar and sentence structure, not just vocabulary recall. Words from an example sentence are shuffled into chips; the user clicks them back into the correct order (Duolingo-style).

### How it works

1. Pick an `Example.text` that contains the target word
2. Split the sentence into word chips (split by space; punctuation stays attached to its word)
3. Shuffle chips using Fisher-Yates
4. User clicks a chip from the pool → appended to the sentence area (left-to-right)
5. User clicks a chip in the sentence area → returned to the pool
6. Submit → compare joined chips to original sentence (case-insensitive, trimmed)
7. The target word chip is highlighted in primary color

### Filter rules

- Skip sentences with fewer than 5 tokens (too trivial)
- Skip sentences with more than 15 tokens (too tedious)
- Requires ≥ 1 word with a matching example (same eligibility as fill_blank)

### Question type

```typescript
type SentenceBuildQuestion = {
  type: 'sentence_build';
  wordId: string;
  term: string;
  tokens: string[]; // shuffled chips
  answer: string; // original sentence (for checking)
  meaning: string;
  partOfSpeech: string;
};
```

### Files to change

| File                                          | Change                                                     |
| --------------------------------------------- | ---------------------------------------------------------- |
| `prisma/schema.prisma`                        | Add `sentence_build` to `ReviewMode` enum                  |
| `prisma/migrations/`                          | Run `npx prisma migrate dev`                               |
| `lib/review/pickQuestions.ts`                 | Add `SentenceBuildQuestion` type + `sentence_build` branch |
| `lib/schemas/review.ts`                       | Add `'sentence_build'` to `reviewModeValues` array         |
| `app/actions/reviews.ts`                      | Add `'sentence_build'` to `mode` union type                |
| `app/(app)/review/session/page.tsx`           | Accept and validate `sentence_build` mode param            |
| `app/(app)/review/setup-client.tsx`           | Add third mode button                                      |
| `app/(app)/review/session/session-client.tsx` | Add `SentenceBuildView` component + chip state             |

---

## Phase 6 — Grammar Reference Page

**Status:** `[x]` Complete  
**Prerequisite:** Phase 5 complete

**Goal:** Add a dedicated Grammar section with seeded reference patterns organized by section. Users can read formulas with color-coded chip display and add their own example sentences to any pattern.

### Design Decisions

- Grammar patterns are **globally seeded** (not per-user) — content is stable reference material
- Users can **add/delete their own examples** for any pattern; cannot modify patterns themselves
- Formulas stored as `Json` (`FormulaChunk[]`) — each chunk has `text` and `type` for color rendering
- Formula types and badge colors:
  - `subject` → teal (tertiary)
  - `auxiliary` → crimson (primary)
  - `verb` → amber (secondary)
  - `object` → neutral
  - `connector` → plain text (no badge)
  - `note` → italic muted text (no badge)

### Content Scope (~51 patterns across 12 sections)

1. Present Tenses (4) — Simple, Continuous, Perfect, Perfect Continuous
2. Past Tenses (4)
3. Future Forms (5) — will, be going to, Present Continuous, Future Continuous, Future Perfect
4. Conditional Sentences (5) — Type 0, 1, 2, 3, Mixed
5. Passive Voice (5) — across tenses + modal
6. Modal Verbs (8) — can/could, may/might, must/have to, should, will/would, shall, need to, used to
7. Reported Speech (4) — statements, yes/no questions, wh- questions, commands
8. Comparatives & Superlatives (3)
9. Questions (4) — Yes/No, Wh-, Tag, Indirect
10. Gerunds & Infinitives (3)
11. Relative Clauses (3) — defining, non-defining, reduced
12. Articles (3) — a/an, the, zero article

### Data Model

```prisma
model GrammarSection {
  id       String           @id @default(cuid())
  title    String
  order    Int
  patterns GrammarPattern[]
}

model GrammarPattern {
  id        String           @id @default(cuid())
  sectionId String
  section   GrammarSection   @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  title     String
  formula   Json             // FormulaChunk[]
  notes     String?
  order     Int
  examples  GrammarExample[]
}

model GrammarExample {
  id        String         @id @default(cuid())
  patternId String
  pattern   GrammarPattern @relation(fields: [patternId], references: [id], onDelete: Cascade)
  userId    String?        // null = system-seeded
  user      User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sentence  String
  createdAt DateTime       @default(now())
}
```

### Routes

```
/grammar                  → All sections + pattern cards (accordion UI)
/grammar/[patternId]      → Pattern detail: formula chips, notes, examples, add form
```

### Files to Create / Modify

| File                                                | Change                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `prisma/schema.prisma`                              | Add 3 grammar models + `grammarExamples` relation to User        |
| `prisma/seed.ts`                                    | New — seed all 12 sections + ~51 patterns + system examples      |
| `lib/schemas/grammar.ts`                            | New — Zod schema for user example input                          |
| `app/actions/grammar.ts`                            | New — `addGrammarExample`, `deleteGrammarExample` server actions |
| `components/grammar/formula-display.tsx`            | New — render formula as colored chip badges                      |
| `app/(app)/grammar/page.tsx`                        | New — RSC list page with shadcn Accordion per section            |
| `app/(app)/grammar/[patternId]/page.tsx`            | New — RSC detail page                                            |
| `app/(app)/grammar/[patternId]/examples-client.tsx` | New — client add/delete form                                     |
| `components/layout/sidebar.tsx`                     | Add Grammar nav item (BookMarked icon)                           |
| `CLAUDE.md`                                         | Mark Phase 6 complete when done                                  |

---

## Phase 7 — Grammar Pattern Quiz

**Status:** `[x]` Complete
**Prerequisite:** Phase 6 complete (needs seeded GrammarPattern + GrammarExample data)

**Goal:** A dedicated grammar quiz mode — separate from the vocabulary review flow. Show a sentence from `GrammarExample`, ask the user to identify which grammar pattern it demonstrates (MC format, 4 choices). Logs results to a separate `GrammarReviewEvent` table to keep the word-based `ReviewEvent` schema clean.

### How it works

1. Setup page (`/grammar/quiz`): choose section (or All) + number of questions (10 / 20 / all)
2. Quiz screen: show a `GrammarExample.sentence` → 4 pattern title choices → click → reveal correct/wrong → next
3. Summary screen: score, time, list of wrong answers with the correct pattern name + formula

### Distractor selection

- 3 distractors drawn randomly from patterns **outside the correct pattern's section** (if possible), to avoid same-section ambiguity
- Fall back to any other pattern if not enough cross-section candidates

### Data Model

```prisma
model GrammarReviewEvent {
  id         String         @id @default(cuid())
  userId     String
  patternId  String
  correct    Boolean
  reviewedAt DateTime       @default(now())
  durationMs Int
  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  pattern    GrammarPattern @relation(fields: [patternId], references: [id], onDelete: Cascade)
}
```

`User` model gains: `grammarReviews GrammarReviewEvent[]`
`GrammarPattern` model gains: `reviews GrammarReviewEvent[]`

### Routes

```
/grammar/quiz              → Setup: choose section + count
/grammar/quiz/session      → Quiz session (client component, same shell as vocabulary review)
```

### Files to Create / Modify

| File                                                | Change                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `prisma/schema.prisma`                              | Add `GrammarReviewEvent` model + relations to User and GrammarPattern |
| `prisma/migrations/`                                | Run `npx prisma migrate dev --name add_grammar_review_event`          |
| `lib/schemas/grammarQuiz.ts`                        | New — Zod schema for setup params (sectionId, count)                  |
| `lib/grammarQuiz/pickQuestions.ts`                  | New — pick N examples + generate 3 distractors per question           |
| `app/actions/grammarQuiz.ts`                        | New — `logGrammarReviewEvent` server action                           |
| `app/(app)/grammar/quiz/page.tsx`                   | New — RSC setup page (fetch sections for dropdown)                    |
| `app/(app)/grammar/quiz/setup-client.tsx`           | New — client: section select + count select + Start button            |
| `app/(app)/grammar/quiz/session/page.tsx`           | New — RSC: pick questions + pass to session client                    |
| `app/(app)/grammar/quiz/session/session-client.tsx` | New — client: quiz UI (MC cards, progress bar, summary)               |

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
