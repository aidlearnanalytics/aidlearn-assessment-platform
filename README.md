# AidLearn Analytics — Assessment Platform, Stage 1 (Foundation)

Application shell + database architecture + auth. No question bank UI, assessment
builder logic, candidate flow, monitoring, scoring, or AI generation yet — those are
Stages 2–10.

## What's here

```
app/
  (auth)/login          admin login (credentials)
  admin/dashboard        live counts pulled from the DB
  admin/companies        list companies (multi-tenant root)
  admin/assessments      list assessments
  admin/question-bank    list + filter questions by status
  admin/participants     list participants + best score
  admin/reports          placeholder — built in Stage 8
  api/auth/[...nextauth] NextAuth route
prisma/schema.prisma      full Stage 1 data model (see below)
lib/db.ts                 Prisma client singleton
lib/auth.ts                NextAuth config + requireRole() guard
```

## Data model (prisma/schema.prisma)

- `Company` — tenant. Everything else hangs off `companyId`.
- `AdminUser` — SUPER_ADMIN (AidLearn staff, sees everything), COMPANY_ADMIN
  (scoped to one company), REVIEWER (approves/rejects questions only).
- `Skill`, `Category`, `Question` — question bank. `Question.source` is HUMAN or
  AI_GENERATED; `Question.status` walks DRAFT → PENDING_APPROVAL → APPROVED/REJECTED.
  Nothing reaches an assessment until APPROVED.
- `Assessment` + `AssessmentQuestion` — builder config (duration, randomization,
  monitoring toggles, branding) and the join table that lets a question's order/points
  be overridden per assessment.
- `Participant`, `AssessmentAttempt`, `Answer` — candidate side: one attempt per
  participant per assessment, with per-question answers and rolled-up category/
  difficulty scores as JSON.
- `ViolationLog` — one row per monitoring event (tab switch, fullscreen exit, etc.),
  feeds Stage 5/7.

## Local setup

1. Create a Supabase project (or any Postgres instance).
2. `cp .env.example .env` and fill in `DATABASE_URL` + `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`).
3. `npm install`
4. `npm run db:push` — creates the tables from schema.prisma.
5. `npm run db:seed` — creates `admin@aidlearn.com` / `changeme123`.
6. `npm run dev` — visit `/login`, sign in, land on `/admin/dashboard`.

## Stage 1 acceptance check

- [ ] Can log in as the seeded admin and reach `/admin/dashboard`.
- [ ] Dashboard counts read 0/0/0/0 against an empty DB without erroring.
- [ ] Creating a row directly in Prisma Studio (`npm run db:studio`) for `Company`,
      `Assessment`, `Question`, or `Participant` shows up in the matching list page.
- [ ] `requireRole()` throws for a signed-out request (wire it into API routes as they're
      added in Stage 2+).

Once that's confirmed, move to Stage 2 (Question Bank: create/edit/approve, then AI
generation on top of a working human-only flow).
