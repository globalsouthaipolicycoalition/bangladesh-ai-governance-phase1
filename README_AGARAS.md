# Bangladesh AI Readiness Assessment — Bangladesh AI Readiness Assessment

Bangladesh AI Readiness Assessment is Bangladesh AI Readiness Assessment’s evidence-led foundation for AI readiness, governance, risk, compliance and institutional maturity assessment. The project now includes a responsive public product surface plus a database-backed assessment workflow.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsumaiyabintaywadud-git%2Faagra-ai-governance-system&project-name=aagra-ai-governance-system&repository-name=aagra-ai-governance-system&env=DATABASE_URL%2CVITE_APP_ID%2CBUILT_IN_FORGE_API_URL%2CBUILT_IN_FORGE_API_KEY%2COAUTH_SERVER_URL)

## Included in this build

The application includes Manus OAuth application login, a MySQL-compatible Drizzle schema, organizations and assessments, GAAF domains and starter controls, profile-based control assignment, deterministic 0–4 response scoring, evidence metadata and durable platform storage upload, findings, AI system inventory records, JSON report snapshots, an admin control-plane overview, responsive landing/assessment/workspace/questionnaire/admin routes, and a route manifest for Webdev. Protected assessment, workspace, admin and review routes now show a secure login gate before loading private data; the public landing page exposes session-aware sign-in and sign-out controls.

The current catalog contains 20 GAAF domain definitions and a 1,000-control GAAF 1.1 baseline. Every expanded record carries an objective, evidence expectation, applicability statement, lifecycle stage, control type, criticality and high-level source references. Catalog seeding is additive and idempotent. The schema is versioned so new content does not rewrite existing assessment records.

External reviewer invitations use a one-time, seven-day token whose SHA-256 hash is stored in the database. The invited reviewer must sign in with the invited email before accepting. Owners can create full, evidence, findings or domain-scoped invitations from `/review/manage?assessmentId=<id>` and copy the generated link for delivery through an approved email channel.

The reviewer release includes a control-plane dashboard, assignment accept/decline lifecycle, scoped control-by-control review, approve/reject/request-changes decisions, evidence verification, reviewer notes, completion transitions to `verified` or `changes_requested`, and an audit-event trail. Organization RBAC includes owner, admin, lead reviewer, reviewer, domain reviewer, evidence reviewer, auditor, contributor and member roles. Member search and role updates are permission-checked server-side. Reviewer invitation email delivery is Resend-compatible and reports `EMAIL_NOT_CONFIGURED` when email credentials are intentionally absent. Assessment action items now have protected list/create/update procedures with owner or authorized-reviewer checks, status, priority, due date and assignment fields.

## Routes

- `/` — public Bangladesh AI Readiness Assessment product and methodology overview
- `/assessment` — assessment profile and context setup
- `/assessment/:id` — live dynamic questionnaire with deterministic scoring and evidence upload
- `/workspace` — dashboard preview; `?assessmentId=<id>` loads a persisted assessment
- `/admin` — admin-only methodology and catalog overview
- `/review` — scoped reviewer assignment queue
- `/review/:id` — control-by-control reviewer decision screen
- `/review/manage?assessmentId=<id>` — member RBAC and reviewer assignment manager
- `/review/invite/:token` — one-time external reviewer invitation acceptance
- `/manus-routes.json` — Webdev route manifest

## Local development

```bash
pnpm install
pnpm dev
```

The project uses the managed server and database resources configured by Webdev by default. The same codebase can now run on Vercel: Vercel serves the Vite frontend and invokes the Express app factory through the catch-all Node function. The server reads `DATABASE_URL`, Manus OAuth values, platform storage values and optional Resend email values from runtime environment variables. Do not commit credentials or replace the managed OAuth flow with a separate password system.

The backend regression suite covers public catalog/control availability, protected assessment/report/reviewer/organization procedures, input-boundary behavior, session cookies, signed sessions, platform configuration, storage integration and the safe missing-email fallback. Run `pnpm test` before a release.

## Vercel deployment

The repository is Vercel-optimized for a full-stack deployment. The Vercel build uses Vite for the static React output and a Node.js 22 catch-all function at `api/[...path].ts` for Express, tRPC, OAuth callbacks and health checks. The original Docker/Manus runtime remains available through `pnpm build` and `pnpm start`.

### One-click setup

Use the **Deploy with Vercel** button above. Vercel will import the private GitHub repository, use `vercel.json`, install the pinned pnpm toolchain, prompt for the required environment variables and build the frontend plus serverless API. Connect the GitHub account that has access to the private repository before clicking the button.

```bash
vercel link
vercel env add DATABASE_URL production
vercel env add VITE_APP_ID production
vercel env add BUILT_IN_FORGE_API_URL production
vercel env add BUILT_IN_FORGE_API_KEY production
vercel --prod
```

Set the same runtime values shown in `.env.example` in Vercel Project Settings. Use a production MySQL-compatible database reachable from Vercel; do not run schema migrations from a serverless request. Run `pnpm db:migrate` from a controlled CI/release job against the production database before the first deployment. OAuth redirect configuration must point to `https://<your-domain>/api/oauth/callback`.

Required production variables:

```text
DATABASE_URL
VITE_APP_ID
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
OAUTH_SERVER_URL=https://api.manus.ai
RESEND_API_KEY
EMAIL_FROM
```

Workspace report exports now include JSON, PDF and Excel (`.xlsx`) formats. PDF and Excel generation runs through protected tRPC procedures and is limited to users who can access the assessment.

The production database client uses one lazily-created, bounded `mysql2` pool per warm Vercel function instance. Defaults are two connections per instance, a 10-second connect timeout, a 60-second idle timeout, keep-alive enabled and an unbounded request queue. Tune these with `DB_CONNECTION_LIMIT`, `DB_CONNECT_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`, `MYSQL_SSL` and `MYSQL_SSL_REJECT_UNAUTHORIZED`; keep the connection limit low enough for the database provider's total connection quota.

Vercel serves hashed assets from `dist/public`, rewrites browser routes to `index.html`, and routes `/api/*` to the Express function. API responses are marked `no-store`; hashed assets are immutable. The Vercel function is stateless, so durable assessment/evidence data belongs in the configured MySQL and platform/object storage services.

## Database

Generate and apply additive Drizzle migrations with:

```bash
pnpm db:push
```

The database is shared by development and publication. Treat schema changes and seed data as production-impacting. Catalog seeding happens lazily when the first assessment is created and is idempotent against an existing domain catalogue.

The Drizzle schema covers users, organizations, memberships, assessments, domains, controls, assessment responses, evidence, findings, AI systems, action items, reports, reviewer assignments, review events and external reviewer invitations. Drizzle relation coverage includes the external invite sender/acceptor and scoped reviewer domain links. The production audit found zero orphan references across the checked parent-child paths. Generated migrations remain additive and MySQL-specific; run `pnpm exec drizzle-kit check` and `pnpm db:migrate` from a controlled release environment before deploying a schema change.

To verify an optional Supabase Auth setup alongside the existing Drizzle MySQL connection, run:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
SUPABASE_ACCESS_TOKEN=your-user-access-token \
pnpm db:verify:supabase
```

The script deliberately reports `NOT_CONFIGURED` when Supabase variables are absent. It tests Supabase Auth independently and tests the existing Drizzle MySQL pool separately; it never claims that Supabase Auth is wired to the MySQL user table. The current Bangladesh AI Readiness Assessment production architecture remains Manus OAuth plus Drizzle MySQL.

## Product boundaries

The application does not present self-reported output as independent certification, legal advice or ISO accreditation. Legal applicability and expert assurance remain separate layers. AI assistance may later help with evidence analysis and recommendation drafting, but deterministic scoring stays in the application logic.

The next engineering expansion is external email/token invitations, controlled catalog authoring/version promotion, action-item persistence, PDF/Excel renderers, jurisdiction profiles and continuous monitoring connectors.
