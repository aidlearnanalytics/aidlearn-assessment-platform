# Handover — AidLearn Analytics Assessment Platform

Built incrementally with Claude, stage by stage, testing each before moving on. This
doc is the fastest way for a new developer to get oriented.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma ORM → Postgres (Supabase)
- NextAuth (credentials provider) for admin login
- Zod for input validation on API routes

## Where things stand

**Done and tested by the client (Stage 1–3):**
- Stage 1 — App shell, full DB schema (`prisma/schema.prisma`), admin auth, branded UI
  (AidLearn Analytics, Signal Blue `#1d4ed8`).
- Stage 2 — Question Bank: create/edit/delete a question, submit for approval,
  approve/reject, filter by status/skill/difficulty. AI generation is deliberately
  **not built** — `/admin/question-bank/generate` is a placeholder. Build it after
  confirming the human flow, so the question bank still works if the AI provider
  changes.
- Stage 3 — Companies (`/admin/companies/new`) and Assessment Builder
  (`/admin/assessments/new`, `/admin/assessments/[id]`): create an assessment,
  attach/detach approved questions, publish once the attached count matches
  `numQuestions`.

**Known open issue (unresolved at handover):** clicking "New assessment" on
`/admin/assessments` sometimes does not navigate at all — no URL change, no console
error confirmed yet. Client was mid-troubleshooting (checked file paths, restarted
dev server, hard-refreshed) when this was handed over. Worth checking:
- Whether `app/admin/assessments/new/page.tsx` and `components/admin/AssessmentForm.tsx`
  are both present and export correctly.
- Browser console for a hydration error breaking event handlers site-wide.
- Whether the anchor tag actually renders with the right `href` (inspect element).

**Not built yet — Stages 4–10, in this order (from the original brief):**
4. Candidate assessment flow: landing → registration → instructions → screen-share
   permission → fullscreen → assessment → submit → result.
5. Monitoring: screen-share/fullscreen/tab-switch/visibility detection feeding the
   existing `ViolationLog` model, configurable per assessment via the toggles already
   on the `Assessment` model.
6. Scoring engine: populate `AssessmentAttempt.overallScore/overallPct/categoryScores`.
7. Admin intelligence: rankings, average/category/department performance.
8. Reports: individual + corporate, printable/PDF. `/admin/reports` is currently a
   placeholder.
9. Analytics: GA4/GTM/UTM tracking, funnel/conversion events.
10. First real tenant assessment: "Indie Finance Excel & Financial Data Skills
    Assessment" — question bank population once the platform works end to end.

## Local setup

See `README.md` in the project root — env vars, `npm install`, `npm run db:push`,
`npm run db:seed`, `npm run dev`.

## Data model

`prisma/schema.prisma` is the source of truth — comments inline explain each model.
Nothing in it has changed since Stage 1; every stage since has been additive
(new routes/pages, no migrations).
