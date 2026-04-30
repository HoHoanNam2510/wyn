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

## Phase 8 — Text Scanner

**Status:** `[x]` Complete
**Prerequisite:** Phase 7 complete

**Goal:** User pastes any English text → each word is color-coded by vocabulary status → click an unknown word to add it to the collection. Bridges real-world reading with the word learning system.

### Word Status (3 levels)

- **Mastered** (green) — in user's vocabulary + ≥5 reviews + ≥80% accuracy
- **Learning** (amber) — in user's vocabulary, not yet mastered
- **Unknown** (plain/muted) — not in user's vocabulary → click to add

### Architecture

- No new DB table — client-side matching against word map fetched server-side once
- Server RSC pre-fetches all user words + mastery stats (raw SQL, same pattern as `lib/stats/queries.ts`)
- Tokenizer in-browser: strips punctuation from token edges for lookup, preserves original for display
- Clicking unknown word → Dialog with "Add to vocabulary" link to `/words/new?term={word}`
- Clicking known/learning word → Popover showing first context meaning + partOfSpeech

### Key files

```
app/(app)/text-scanner/page.tsx           ← RSC: fetch words + mastery stats, pass word map to client
app/(app)/text-scanner/scanner-client.tsx ← Client: textarea → tokenize → highlight spans + click handlers
app/(app)/text-scanner/loading.tsx        ← Skeleton
lib/text-scanner.ts                       ← tokenize(text) utility
components/layout/sidebar.tsx             ← Add Text Scanner nav item (ScanText icon)
```

---

## Phase 9 — Idioms & Phrases

**Status:** `[x]` Complete
**Prerequisite:** Phase 8 complete

**Goal:** Third content section (alongside Words and Grammar) for multi-word expressions. Seeded content organized by category, user-added examples per idiom, and a quiz mode mirroring the Grammar Quiz.

### Key differences from Grammar

- `explanation: String` instead of `formula: Json` (no chip display needed)
- `register: String?` field (formal / informal / neutral) — not present in Grammar
- 10 categories, ~53 idioms (vs Grammar's 12 sections, ~51 patterns)

### Data Model (4 new models)

```prisma
IdiomCategory   → id, title, order
Idiom           → id, categoryId (FK), phrase, explanation, register?, notes?, order
IdiomExample    → id, idiomId (FK), userId (FK, nullable — null = seeded), sentence, createdAt
IdiomReviewEvent → id, userId (FK), idiomId (FK), correct, reviewedAt, durationMs
```

### Seed Content (10 categories, ~53 idioms)

1. Social Interaction (8) — break the ice, read the room, hit it off, clear the air, go out of your way…
2. Time & Deadlines (5) — in the nick of time, once in a blue moon, around the clock…
3. Success & Achievement (6) — hit the nail on the head, go the extra mile, raise the bar…
4. Difficulty & Challenges (5) — bite off more than you can chew, face the music, uphill battle…
5. Communication (5) — get to the point, beat around the bush, on the same page…
6. Emotions & Feelings (5) — under the weather, over the moon, on cloud nine…
7. Work & Career (6) — burn the midnight oil, ahead of the curve, back to square one…
8. Money & Business (4) — cost an arm and a leg, break even, make ends meet…
9. Relationships (4) — tie the knot, on thin ice, bury the hatchet…
10. Learning & Knowledge (5) — learn the ropes, pick someone's brain, connect the dots…

### Routes

```
/idioms                      → List page (accordion by category)
/idioms/[idiomId]            → Detail (phrase, explanation, register, examples, add form)
/idioms/quiz                 → Quiz setup (category + count)
/idioms/quiz/session         → Quiz session (MC: identify idiom from example sentence)
```

### Key files

```
prisma/schema.prisma                                   ← Add 4 Idiom* models + User relations
prisma/seed.ts                                         ← Extend with idiom seed data
lib/schemas/idioms.ts                                  ← Zod schema for user example input
lib/idiomQuiz/pickQuestions.ts                         ← Pick questions + distractors (cross-category preferred)
app/actions/idioms.ts                                  ← addIdiomExample, deleteIdiomExample
app/actions/idiomQuiz.ts                               ← logIdiomReviewEvent
app/(app)/idioms/page.tsx                              ← RSC list page (accordion)
app/(app)/idioms/[idiomId]/page.tsx                    ← RSC detail page
app/(app)/idioms/[idiomId]/examples-client.tsx         ← Add/delete user examples (client)
app/(app)/idioms/quiz/page.tsx                         ← RSC setup page
app/(app)/idioms/quiz/setup-client.tsx                 ← Category + count selectors
app/(app)/idioms/quiz/session/page.tsx                 ← RSC: pick questions
app/(app)/idioms/quiz/session/session-client.tsx       ← Quiz UI (MC, no FormulaDisplay)
components/layout/sidebar.tsx                          ← Add Idioms nav item (Lightbulb icon)
```

---

## Phase 10 — Writing Practice Mode

**Status:** `[x]` Complete
**Prerequisite:** Phase 9 complete

**Goal:** Fourth review mode in the existing `/review` flow. Given a word (term + meaning + phonetic), user writes 1–2 sentences using it. Optional AI evaluation via Groq. User sees reference example sentences from DB, then self-grades. No countdown timer.

### How it works

1. Setup page: select "Writing Practice" mode (4th button) alongside existing 3 modes
2. Session: show word card (term, phonetic, meaning, image) → textarea → "Submit Writing" → reveal reference examples + opt-in "Check with AI" → self-grade (Correct ✓ / Needs Practice)
3. Summary: same AnswerRecord[] summary as other modes

### Data Model

No new DB table. Added `writing_practice` to the `ReviewMode` enum. Log to existing `ReviewEvent`.

```prisma
enum ReviewMode {
  flashcard
  fill_blank
  sentence_build
  writing_practice
}
```

### Question Type

```typescript
type WritingPracticeQuestion = {
  type: 'writing_practice';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  exampleSentences: string[]; // reference sentences, up to 3, shown after writing
};
```

### Session flow

**Phase 'answering':** word card + `<Textarea>` + "Submit Writing" button (no countdown)
**Phase 'reviewing':** user's text (read-only) + opt-in AI check button → AI feedback box → Reference Examples → grade buttons (no auto-advance)

### AI Sentence Checking (addition beyond original scope)

Free-tier Groq API (`llama-3.1-8b-instant`, 14,400 req/day). Opt-in — button only appears after "Submit Writing". Returns `{ correct: boolean, feedback: string }`.

- `lib/groq.ts` — Groq client singleton (`GROQ_API_KEY` env var)
- `app/actions/writing.ts` — `checkWritingSentence({ term, partOfSpeech, meaning, sentence })` Server Action
- AI feedback is informational only; user still self-grades manually

**`HighlightedFeedback` component** (in `session-client.tsx`): renders AI feedback with quoted phrases (`'...'` / `"..."`) highlighted. Uses lookbehind regex `(?<![a-zA-Z])` to avoid false positives on `one's`, `don't`, etc. Highlight color matches feedback box: green for correct, amber for incorrect.

### Files Created / Modified

| File                                          | Change                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                        | Added `writing_practice` to ReviewMode enum                                     |
| `lib/schemas/review.ts`                       | Added `'writing_practice'` to `reviewModeValues`                                |
| `lib/review/pickQuestions.ts`                 | Added `WritingPracticeQuestion` type + branch; recency weighting (see below)    |
| `lib/groq.ts`                                 | New — Groq client singleton                                                     |
| `app/actions/writing.ts`                      | New — `checkWritingSentence` Server Action (Groq AI eval)                       |
| `app/actions/reviews.ts`                      | Expanded mode union type                                                        |
| `app/(app)/review/session/page.tsx`           | Added to validation guard + empty-state message                                 |
| `app/(app)/review/session/session-client.tsx` | Added `WritingPracticeView` + `HighlightedFeedback`; timer bypass for this mode |
| `app/(app)/review/setup-client.tsx`           | Added 4th mode button (PenLine icon); grid → `grid-cols-2 sm:grid-cols-4`       |

### Review Recency Weighting (addition beyond original scope, applies to all 4 modes)

**Problem:** Pure random sampling caused the same word to appear in nearly every session (words with more examples had higher effective probability; no memory of recent reviews).

**Solution** (in `lib/review/pickQuestions.ts`):

- After building the eligible-word list for any mode, query `ReviewEvent` to get each word's most-recent review timestamp (across all modes).
- Apply weighted sampling without replacement: words reviewed more recently get lower weight; never-reviewed words get highest weight.

```
Weight table:
  Never reviewed    → 10  (highest)
  Reviewed < 1h ago →  1  (lowest)
  Reviewed today    →  3
  Reviewed 1–3d ago →  6
  Reviewed 3d+ ago  → 10  (same as never)
```

- `recencyWeight(lastReviewedAt)` — pure function, no I/O
- `weightedSample(items, getWeight, n)` — weighted random sampling without replacement (Fisher-Yates variant)
- `sampleWithRecency(eligible, userId, count)` — async helper; fetches last-reviewed map, delegates to `weightedSample`; if `count === 'all'`, falls back to plain shuffle (no repetition concern)

---

## Phase 11 — SRS Algorithm (SM-2)

**Status:** `[x]` Complete
**Prerequisite:** Phase 10 complete

**Goal:** Spaced repetition scheduling using SM-2 algorithm. Adds `nextReviewAt` and related fields to `Word`. New `/review/srs` route shows a queue of words due today. Session uses reveal + 4-button Anki grading (Again / Hard / Good / Easy → SM-2 quality 0/3/4/5). Updates word SRS state after each answer and logs to `ReviewEvent`.

### Nghiệp vụ — Recency Weighting và SRS không xung đột

Hai hệ thống hoạt động trên state khác nhau và route khác nhau:

|                           | Ôn tập thường (`/review`)                 | Ôn tập SRS (`/review/srs`)                      |
| ------------------------- | ----------------------------------------- | ----------------------------------------------- |
| Chọn từ dựa trên          | `ReviewEvent.reviewedAt` (Recency Weight) | `Word.nextReviewAt` (lịch SM-2)                 |
| Cập nhật                  | `ReviewEvent` only                        | `Word` SRS fields + `ReviewEvent` (mode=`srs`)  |
| Bị ảnh hưởng bởi bên kia? | SRS events làm giảm recency weight (đúng) | Regular events **không bao giờ** chạm SRS state |

**Quy tắc then chốt:** Trả lời trong session thường (`flashcard`, `fill_blank`, v.v.) **KHÔNG** cập nhật `Word.nextReviewAt`. Chỉ SRS grading mới làm điều này.

### Data Model

Add 4 fields to `Word` and `srs` to `ReviewMode` enum:

```prisma
model Word {
  // ...existing fields...
  nextReviewAt    DateTime?                    // null = never SRS-reviewed → immediately due
  srsInterval     Int       @default(1)        // days until next review
  srsEaseFactor   Float     @default(2.5)      // SM-2 E-Factor
  srsRepetitions  Int       @default(0)        // consecutive correct answers

  @@index([userId, nextReviewAt])              // required for queue performance
}

enum ReviewMode {
  flashcard
  fill_blank
  sentence_build
  writing_practice
  srs                                          // new
}
```

Migration: `npx prisma migrate dev --name add_srs_fields`

### SRS Grading (4-button Anki style)

| Button | SM-2 Quality | EF effect | Next interval         |
| ------ | ------------ | --------- | --------------------- |
| Again  | 0            | EF − 0.80 | Reset to 1 day        |
| Hard   | 3            | EF − 0.14 | Modest increase       |
| Good   | 4            | EF ± 0    | Normal increase (×EF) |
| Easy   | 5            | EF + 0.10 | Large increase        |

`correct` in ReviewEvent: `again → false`, `hard/good/easy → true`

### SM-2 algorithm (`lib/srs.ts`)

Pure function, no DB access. Export type `SrsGrade = 'again' | 'hard' | 'good' | 'easy'`.

```typescript
// quality < 3: reset repetitions=0, interval=1
// quality >= 3:
//   rep 0 → interval=1, rep 1 → interval=6, rep 2+ → interval=round(interval×EF)
//   repetitions += 1
// EF = max(1.3, EF + 0.1 − (5−q) × (0.08 + (5−q) × 0.02))
// nextReviewAt = midnight(today + interval days)
```

### SrsQuestion type (`lib/review/pickQuestions.ts`)

```typescript
type SrsQuestion = {
  type: 'srs';
  wordId: string;
  term: string;
  imageUrl: string | null;
  meaning: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  exampleSentences: string[]; // up to 3, shown after reveal
  srsState: { repetitions: number; interval: number; easeFactor: number };
};
```

SRS questions fetched directly in the RSC session page, not through `pickQuestions()`.

### `updateWordSRS` server action (`app/actions/srs.ts`)

1. `auth()` — verify session
2. Fetch Word SRS state + verify `word.userId === userId`
3. Call `computeNextSrs(state, grade)`
4. `db.word.update(...)` — write new SRS fields
5. `db.reviewEvent.create(...)` — log with `mode: 'srs'`, `correct: grade !== 'again'`

### Routes

```
/review/srs              → Hub: số từ đến hạn + nút bắt đầu
/review/srs/session      → Session: reveal → 4-button grade → update Word SRS state
```

**Hub page** (`app/(app)/review/srs/page.tsx`):

- Nếu có từ đến hạn: thẻ số lượng + "Bắt đầu ôn tập" → `/review/srs/session`
- Nếu không có: "Đã ôn xong!" + thời điểm đến hạn tiếp theo (`min(nextReviewAt)`)
- Hiển thị tổng số từ đã đăng ký SRS (có `nextReviewAt != null`)

**Session RSC** (`app/(app)/review/srs/session/page.tsx`):

- Fetch TẤT CẢ từ đến hạn (không giới hạn — SRS xử lý hết hàng đợi ngày)
- Mỗi từ: join Context đầu tiên + tối đa 3 Example
- Nếu không có từ: redirect về `/review/srs`

**Session Client** (`app/(app)/review/srs/session/session-client.tsx`) — không timer, không tự động chuyển:

- Phase `revealing`: thẻ từ (term, phonetic, AudioButton, hình, meaning) + nút "Xem đáp án"
- Phase `grading`: câu ví dụ tham khảo + 4 nút chấm điểm (Again/Hard/Good/Easy)
- Summary: tổng số ôn, phân bổ điểm (Again/Hard/Good/Easy), thời gian phiên — không có "Thử lại"

### Sidebar badge

`app/(app)/layout.tsx` becomes async → fetches `srsDue` count → passes as `srsCount` prop to `Sidebar`. Badge renders next to "SRS Review" nav item (BrainCircuit icon) when count > 0.

### Files to Create / Modify

| File                                              | Change                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `prisma/schema.prisma`                            | Add `srs` to ReviewMode enum; add 4 SRS fields + `@@index` to Word  |
| `lib/srs.ts`                                      | New — pure SM-2 `computeNextSrs(state, grade)` + `SrsGrade` type    |
| `lib/review/pickQuestions.ts`                     | Add `SrsQuestion` type export                                       |
| `app/actions/srs.ts`                              | New — `updateWordSRS(wordId, grade)` server action                  |
| `app/actions/reviews.ts`                          | Expand mode union to include `'srs'`                                |
| `app/(app)/review/srs/page.tsx`                   | New — RSC hub (due count + next due time + start button)            |
| `app/(app)/review/srs/session/page.tsx`           | New — RSC: fetch all due words as `SrsQuestion[]`                   |
| `app/(app)/review/srs/session/session-client.tsx` | New — reveal + 4-button grade UI, no timer, summary with grade dist |
| `app/(app)/layout.tsx`                            | Convert to async; fetch + pass srsDue count to Sidebar              |
| `components/layout/sidebar.tsx`                   | Add `srsCount` prop + badge + SRS nav item (BrainCircuit icon)      |
| `lib/stats/queries.ts`                            | Add `srsDueToday` query to `fetchStats`                             |
| `app/(app)/stats/page.tsx`                        | Add "Due for SRS" HeroCard                                          |
| `CLAUDE.md`                                       | Mark Phase 11 complete; update Word + ReviewMode in data model      |
| `PLAN.md`                                         | Mark Phase 11 complete                                              |

---

## Phase 12 — JSON Import

**Status:** `[x]` Complete
**Prerequisite:** Phase 11 complete

**Goal:** Bulk import words from a JSON file. User uploads a file → client-side parse + validate → preview table → confirm → server-side batch insert. No DB migration needed (no new models). CSV remains future backlog.

### JSON Format

```json
[
  {
    "term": "eloquent",
    "imageUrl": "https://...",
    "categories": ["Academic", "Writing"],
    "contexts": [
      {
        "partOfSpeech": "adjective",
        "phonetic": "/ˈel.ə.kwənt/",
        "audioUrl": "https://...",
        "meaning": "Expressing ideas clearly and effectively",
        "examples": ["She gave an eloquent speech.", "His writing is eloquent."]
      }
    ]
  }
]
```

- `imageUrl`, `phonetic`, `audioUrl`, `categories` are optional
- `contexts` required (min 1); each context: `partOfSpeech` must match enum, `meaning` required, `examples` min 1
- Max 500 words per import

### Business Rules

- **Duplicates**: skip words whose `term` already exists (case-insensitive) — same as `createWord`
- **Unknown categories**: auto-create with default color `#6b7280` rather than failing the import
- **Error handling**: skip-and-continue per word (one bad word doesn't abort entire import)
- **Phonetic + audioUrl auto-fetch**: if a context is missing either `phonetic` or `audioUrl` (or both), system fetches from `dictionaryapi.dev` in parallel and applies both fields together (consistency rule). If user provides both → kept as-is. If dict finds nothing → user's partial data preserved. Only override happens when dict returns a valid `audioUrl`.

### UI Flow (4 states)

```
idle → previewing → importing → done
```

- **idle**: drop zone (drag-and-drop + click to browse) + divider + paste JSON textarea with clear button (X) + info note about phonetic/audio auto-fill + collapsible JSON format hint
- **previewing**: table (Term | Part of Speech | Meaning | Categories) + invalid rows error banner + "Import N words" button
- **importing**: spinner (button disabled)
- **done**: result card — X created / Y skipped (duplicates) / Z errors

### Files to Create / Modify

| File                                       | Change                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/schemas/import.ts`                    | New — Zod schema (`importWordSchema`, `importFileSchema`)                                                                                  |
| `app/actions/import.ts`                    | New — `importWords(data)` server action → `ImportResult`; parallel `fetchDictionary` for phonetic+audioUrl                                 |
| `app/(app)/words/import/page.tsx`          | New — RSC wrapper (auth + layout)                                                                                                          |
| `app/(app)/words/import/import-client.tsx` | New — full client UI (FileReader + paste textarea → parse → preview → action → results)                                                    |
| `app/(app)/words/page.tsx`                 | Modify — add "Import JSON" button (Upload icon, outline) next to "Add Word"                                                                |
| `app/actions/words.ts`                     | Add `deleteWords(ids)` server action for bulk delete                                                                                       |
| `app/(app)/words/word-list-client.tsx`     | Add selection mode (CheckSquare2 toggle), bulk delete action bar + confirmation dialog; fix phonetic display to be independent of audioUrl |

---

## Future Backlog (not in current scope)

- Multi-user / public access
- CSV import (JSON import done in Phase 12)
- Example translation (Vietnamese)
- Offline mode / PWA

---

## Architecture Notes

- **Server Actions for all mutations** — no REST API routes for CRUD operations
- **RSC for data fetching** — query DB directly in page components, no `useEffect` data fetching
- **Single Zod schema per entity** — defined in `lib/schemas/`, used by both Server Action and client-side form validation
- **External APIs fail gracefully** — dictionary/Unsplash fetch errors should never block word creation; show empty state, user fills manually
