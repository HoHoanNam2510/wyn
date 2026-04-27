# CLAUDE.md — Vocabulary Learning App

> **MANDATORY**: Read this file completely at the start of EVERY new conversation before doing anything else.

---

## Project Overview

Personal web app for learning English vocabulary. Full-stack Next.js 16, TypeScript, Prisma ORM, PostgreSQL (Neon), Auth.js v5, Tailwind CSS v4, shadcn/ui. Deployed on Vercel.

- **Working directory:** `d:\vocabulary-web\wyn`
- **Stack:** Next.js 16.2.4 (App Router) · Prisma · Neon Postgres · Auth.js v5 (Google OAuth) · **Tailwind CSS v4** · shadcn/ui · Recharts · react-hook-form + zod · Unsplash API · dictionaryapi.dev
- **IMPORTANT — Tailwind v4:** No `tailwind.config.js`. Colors and theme tokens live in [app/globals.css](app/globals.css) under `@theme { }`. Use classes like `bg-primary`, `text-primary-t30`, `border-secondary-t60` directly.
- **IMPORTANT — Next.js 16:** APIs may differ from training data. Read `node_modules/next/dist/docs/` for updated conventions before writing routing, middleware, or data fetching code.

---

## Role & Collaboration Rules (NON-NEGOTIABLE)

Claude is a **co-developer**, NOT an assistant that blindly follows orders. The following rules are binding:

1. **Challenge bad decisions immediately and forcefully.** If the user proposes something vague, over-engineered, under-engineered, or architecturally wrong — stop and say so before writing a single line of code.
2. **No bias toward the user's ideas.** If there's a better approach, advocate for it aggressively. The user explicitly asked for this.
3. **Interrogate every new significant decision.** Ask WHY before implementing anything non-trivial.
4. **Prevent over-engineering.** Build exactly what's needed. Not what's "cool" or "might be useful later."
5. **Prevent under-engineering.** Never cut corners that cause pain later (missing userId FK, no validation at system boundaries, no error handling for external APIs).
6. **Track current phase.** Before starting new feature work, confirm which phase we're in and that the previous phase is complete.
7. **Call out stale decisions.** If the user references a decision that conflicts with current implementation, flag the contradiction immediately.

---

## Data Model (Prisma schema summary)

```
User                → id, email, name, image, createdAt
Word                → id, userId (FK), term, imageUrl (Unsplash, optional), createdAt, updatedAt
Context             → id, wordId (FK), partOfSpeech (enum), phonetic, audioUrl, meaning (text), order (int)
Example             → id, contextId (FK), text
Category            → id, userId (FK), name, color
WordCategory        → wordId + categoryId (composite PK — join table for M:N)
ReviewEvent         → id, userId, wordId, mode (flashcard | fill_blank | sentence_build), correct (bool), reviewedAt, durationMs
GrammarSection      → id, title, order
GrammarPattern      → id, sectionId (FK), title, formula (Json = FormulaChunk[]), notes, order
GrammarExample      → id, patternId (FK), userId (FK, nullable — null = seeded), sentence, createdAt
GrammarReviewEvent  → id, userId (FK), patternId (FK), correct (bool), reviewedAt, durationMs  [Phase 7 — not yet added]
```

**"ALL" category**: Virtual — no DB row. Means "no category filter applied." Do NOT create a real ALL category in the DB.

---

## Current Phase Status

- [x] **Phase 1** — Setup + Auth + CRUD words/contexts/examples + Categories + auto-fetch (dictionary + Unsplash)
- [x] **Phase 2** — Review modes (Flashcard MC + Fill-in-blank) + ReviewEvent logging
- [x] **Phase 3** — Statistics dashboard
- [x] **Phase 4** — Polish (dark mode, audio playback, loading skeletons, mobile sidebar, word detail page, sort dropdown, LCP fixes)
- [x] **Phase 5** — Sentence Builder review mode (word-order grammar practice, Duolingo-style chip UI, DB migration for new ReviewMode enum value)
- [x] **Phase 6** — Grammar reference page (seeded patterns per section, chip/badge formula display, user-added examples per pattern)
- [ ] **Phase 7** — Grammar Pattern Quiz (`/grammar/quiz`): identify-the-pattern MC mode, separate `GrammarReviewEvent` table, section filter + count setup, summary screen

Update with `[x]` when a phase is complete.

---

## Finalized Tech Decisions

| Decision            | Choice                                  | Reason                                                                                |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| Database            | PostgreSQL via Neon (free tier)         | Relational data — MongoDB was rejected                                                |
| ORM                 | Prisma **7** + `@prisma/adapter-pg`     | Prisma 7 requires driver adapter; `DIRECT_URL` for migrations, pooler URL for runtime |
| Auth                | Auth.js v5 with Google OAuth            | No password management, single-click login                                            |
| UI Components       | shadcn/ui + Tailwind CSS                | No external component maintenance, copyable                                           |
| Forms               | react-hook-form + zod                   | Shared client/server validation, fully type-safe                                      |
| Charts              | Recharts                                | Sufficient for stats needs, no D3 overhead                                            |
| Phonetics           | dictionaryapi.dev (free, no key needed) | Auto-fetch on word add, user can edit                                                 |
| Audio               | `audioUrl` from dictionaryapi.dev       | Native `<audio>` element, zero cost                                                   |
| Images              | Unsplash API (free, 50 req/hr)          | Auto-suggest 8 images on word add, user picks 1                                       |
| SRS                 | **Not in scope** (Phase 1–4)            | Add after Phase 4 if needed; schema is ready for it                                   |
| CSV import          | **Not in scope**                        | User has no existing data                                                             |
| Example translation | **Not in scope**                        | English-only examples                                                                 |

---

## Coding Conventions

- **Server Actions** (`app/actions/*.ts`) for all mutations — no REST API routes for CRUD
- **RSC (React Server Components)** for data fetching — minimize client-side `useEffect`
- **Zod schemas** for all validation, defined once in `lib/schemas/` and shared between client and server
- **Prisma** for all DB access — raw SQL only for complex stats aggregations that Prisma can't express cleanly
- **No `any` types** in TypeScript, ever
- shadcn/ui components live in `components/ui/` — **do NOT modify them** — compose on top of them
- Business logic in `lib/` — keep Server Actions and components thin
- External API calls wrapped in `lib/` (`lib/dictionary.ts`, `lib/unsplash.ts`) — never inline fetch in components

---

## Env Variables

```env
DATABASE_URL=                # Neon pooler connection string (for runtime queries via @prisma/adapter-pg)
DIRECT_URL=                  # Neon direct connection string (for prisma migrate dev — remove -pooler from hostname)
AUTH_GOOGLE_ID=              # Google OAuth client ID
AUTH_GOOGLE_SECRET=          # Google OAuth client secret
AUTH_SECRET=                 # openssl rand -base64 32
UNSPLASH_ACCESS_KEY=         # Unsplash API (free, 50 req/hr on demo, 5000/hr on production)
NEXT_PUBLIC_APP_URL=         # http://localhost:3000 or https://your-app.vercel.app
```

**IMPORTANT — Next.js 16 changes:**

- `middleware.ts` is deprecated → use `proxy.ts` with named export `proxy` (not default)
- Prisma client is generated to `app/generated/prisma/client.ts` — import from `@/app/generated/prisma/client`
- `prisma.config.ts` controls CLI datasource URL (uses `DIRECT_URL`); runtime client uses `DATABASE_URL` via `Pool` + `PrismaPg` adapter

---

## Key Commands

```bash
npm run dev              # Start dev server at localhost:3000
npx prisma migrate dev   # Create and run a new migration
npx prisma generate      # Regenerate Prisma Client after schema change
npx prisma studio        # Open DB browser at localhost:5555
npm run build            # Production build (run before deploy)
npm run lint             # ESLint check
```

---

## UI Design System

- **Primary color:** `#DC143C` (Crimson) — 13 tonal shades T0–T100 in Tailwind config
- **Secondary:** Warm amber `#DD8C12` — 13 tonal shades
- **Tertiary:** Cool teal-blue `#2481A8` — 13 tonal shades
- **Neutral:** Warm gray `#F4F1F2` — 13 tonal shades
- **Error:** `#B3261E`
- Design principle: Clean, uncluttered. Primary color highlights CTAs and key vocabulary terms. Neutral surfaces for content areas. High contrast for readability.
