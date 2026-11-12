# AI START HERE — Bangladesh AI Observatory

## Read this first
This is the source snapshot for a Bangladesh-focused AI governance web application. The product contains a readiness assessment and a public-interest AI Observatory. The assessment is the pre-existing core product and must remain functional; Observatory and AI-system registry features are additive. The archive is a source handoff, not a deployed production release.

## Snapshot identity
- Manus project: Bangladesh AI Observatory (a separate Manus-hosted copy)
- Canonical Manus repository branch: `main`
- Snapshot commit: `3553ded`
- Language: TypeScript; frontend text is English/Bengali where implemented
- Current backend: Express + tRPC + Drizzle ORM + MySQL, with Manus OAuth/runtime integrations
- Supabase migration: **not started**
- Publishing/deployment: **not authorized**
- The ZIP excludes `.git` history, `node_modules`, build output, runtime logs, and secret values. Install dependencies from the lockfile before running commands.

## Product capabilities in the source
### Readiness Assessment
- Assessment setup by entity/scope and questionnaire flow
- Maturity scoring and control responses
- Evidence metadata/upload handling and coverage
- Workspace, findings/review, report/export and organization/reviewer workflows
- Role- and assignment-aware server-side authorization, including reviewer scope limits

### Bangladesh AI Observatory
- Public page for published, attributed observations, indicators and methodology/caveats
- Empty-state behavior is intentional when no source-linked observations are published
- Admin-only curation/mutation paths
- Public output is filtered to published/source-linked records

### Private AI-system register
- Tenant/organization-scoped records, not a public list
- Server-side parent/organization authorization is required for access and mutations

## Architecture and where to look
- `client/src/App.tsx` — client routes and protected route boundaries
- `client/src/pages/Assessment.tsx` — assessment setup
- `client/src/pages/Questionnaire.tsx` — assessment answers, evidence, save and submit flow
- `client/src/pages/Workspace.tsx` — assessment workspace and exports
- `client/src/pages/ReviewManager.tsx`, `ReviewQueue.tsx`, `ReviewAssessment.tsx`, `ReviewInvite.tsx` — reviewer and organization workflows
- `client/src/pages/Observatory.tsx` — public Observatory
- `client/src/pages/AISystemRegistry.tsx`, `AISystemDetail.tsx` — private AI-system register
- `server/routers.ts` — tRPC API surface and input validation
- `server/agarasDb.ts` — assessment data access, authorization and business rules
- `server/observatoryDb.ts` — Observatory query/mutation paths
- `server/db.ts`, `drizzle/schema.ts`, `drizzle/` — MySQL connection, schema and migrations
- `server/authorization.regression.test.ts` — pure/database-free authorization regressions
- `client/public/manus-routes.json` — route manifest served at `/manus-routes.json`
- `TODO.md` — original implementation history and project tracking
- `NEXT_STEPS_TODO.md` — concise remaining-work list included for the next agent

## Main routes
`/` home; `/assessment` and `/readiness` setup; `/assessment/:id` questionnaire; `/workspace`; `/review`; `/review/manage`; `/review/:id`; `/review/invite/:token`; `/observatory`; `/observatory/systems`; `/observatory/systems/:id`; `/admin`; `/incidents` (future/placeholder capability).

## Development and validation
Requirements from `package.json`: Node `>=22 <23`, pnpm `10.18.0`.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm exec drizzle-kit check
```

The app's local `pnpm dev` needs runtime integrations/database configuration. Never point it at the shared managed or production database for mutating tests. A configured staging connection must be isolated and supplied through a secure secret mechanism, never committed or printed. The project's current Drizzle config expects `DATABASE_URL`; do not overwrite the existing managed database configuration.

## Verification facts and limits
Verified in the source snapshot's sandbox before packaging: `pnpm check` passed; `pnpm test` passed (6 files, 34 tests); `pnpm build` passed; `pnpm exec drizzle-kit check` passed; `/api/health` returned HTTP 200; `/manus-routes.json` returned HTTP 200 and matched declared routes. Desktop and 390px mobile Preview screenshots were reviewed. Protected reviewer/workspace pages showed the sign-in gate when no session was present.

These are **not** end-to-end proof of database-backed or authenticated user journeys. Still unverified against disposable staging data: assessment persistence/scoring/submission cycles; real evidence storage/signing; cross-user and cross-organization API denial; organization member lifecycle; invitation/accept/decline/expiry/completion; authenticated export/email flows. The shared managed database was not mutated during this verification pass.

## Security, data and release constraints — must follow
1. Preserve the existing assessment behavior, data model, routes and scoring while finishing work.
2. Keep AI-system records private and tenant-scoped. Only explicitly curated, published, source-linked Observatory records are public.
3. Keep owner/admin/reviewer authorization on the server; never rely on UI hiding. Only the organization owner may grant/change/remove organization admin privileges.
4. Do not invent test accounts or claim a runtime flow passed based only on code inspection or a screenshot.
5. Do not use the shared managed or production database for test writes/deletes. Wait for a disposable/non-production staging database and identities.
6. Do not begin the Supabase Auth/PostgreSQL replacement until Phases 1–6 are verified with evidence. Before migration, get approval for target Supabase project and a data-preservation/migration plan. No data discard or unapproved dual-write.
7. Never commit, print or package secrets; collect protected values only through a secure input card. Never expose Supabase service-role credentials to browser code.
8. Do not publish or deploy unless the user explicitly approves it.

## Suggested next-agent instruction
Start by inspecting this guide, `NEXT_STEPS_TODO.md`, `TODO.md`, and the current source/tests. Treat commit `3553ded` as the package baseline, not as proof of production readiness. First obtain/provision isolated non-production MySQL/TiDB staging and test identities via the secure secret-input flow. Complete and document Phase 1–6 end-to-end verification, repair issues and rerun checks. Only after those criteria pass should you prepare (not silently execute) a Supabase migration plan and request approval. Do not publish/deploy.

## Progress estimate (snapshot date: 2026-11-12)
This is a rough roadmap estimate, not a production-readiness rating. The feature/security implementation for Phases 1–5 is substantially present and passed static checks; Phase 6 has static/regression coverage but key database-backed/authenticated acceptance flows remain open; Phase 7 has not started. Counting Phases 1–5 as implemented, Phase 6 as partially verified, and Phase 7 as not started gives **about 75–80% of the planned engineering work implemented**, while **production readiness is not established**. Do not report this as “80% production ready.” The evidence gap is concentrated in real staging-data, account-role and migration validation.


## Vercel deployment and code update workflow
The project already includes `vercel.json`, a Vercel serverless Express adapter at `api/[...path].ts`, and the Vite frontend. This package adds `VERCEL_DEPLOY_GUIDE.md`, `VERCEL_ENVIRONMENT_VARIABLES.md`, and `.github/workflows/quality.yml`. The workflow runs typecheck, tests, and Vite build on GitHub pushes/PRs; it does not deploy. To enable automatic Preview/Production deployments, the user must create/push this source to their own GitHub repository and connect that repository to Vercel. The present Manus-managed Git remote is not GitHub.

The runtime currently depends on Manus OAuth and MySQL/Drizzle. Those integrations and their credentials are not transferred to Vercel by this ZIP. Do not claim a full Vercel release works until the required providers, protected environment variables, callback URLs, and a separately approved database are configured and tested. The user's preferred product sequence is feature/UI completion first, then final authentication/API integration; UI-only preview with mocks is not a secure, persistent production system. See `NEXT_STEPS_TODO.md`.
