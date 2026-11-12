# Bangladesh AI Readiness Assessment — Implementation & Design Plan

## Product direction

Bangladesh AI Readiness Assessment is the Bangladesh AI Readiness Assessment System: a Bangladesh-focused assessment and assurance-readiness platform for organizations, public bodies, sectors, and AI teams. It extends the existing Bangladesh AI Readiness Assessment foundation without removing its Drizzle/MySQL-compatible persistence, Manus OAuth, reviewer/RBAC, evidence, action items, report exports, route manifest, Vercel entrypoint, or test suite.

Every self-reported result must display: “Self-reported assessment — not independently verified.” The product must not claim legal certification, government approval, ISO certification, official regulatory compliance, independent audit accreditation, a final legal opinion, or guaranteed AI safety.

## Implementation approach

- Preserve the existing React + TypeScript + Vite + Wouter client, Express/tRPC API, Drizzle ORM/MySQL/TiDB database layer, OAuth/session layer, and server-side report generation.
- Add additive schema migrations only. Existing assessments retain their original methodology and catalogue versions; new assessments use only approved/published catalogue versions.
- Introduce a typed Bangladesh catalogue module for divisions, maintainable districts, organization types, sectors, profiles, domains, controls, policy sources, and translations. Keep global profiles/catalogue available.
- Add a locale context with English as default and a functional Bangla toggle. Use translation keys rather than embedding language branching in components.
- Keep deterministic 0–4 scoring. Add transparent calculations for inherent/residual risk, evidence confidence, criticality, sector/data sensitivity, human/public-service impact, regulatory relevance, and third-party dependency. Never use opaque AI-generated scores.
- Extend report snapshots and PDF/Excel exports with Bangladesh AI Readiness Assessment branding, English/Bangla/bilingual selection, Bangladesh organization context, catalogue/source metadata, limitations, and the required disclaimer.
- Preserve tenant isolation and reviewer scope isolation in every new procedure. Add audit events for sensitive changes and validate upload size/MIME type and invite/authentication rate boundaries where the current API permits.
- Maintain `/manus-routes.json`, Vercel API/static separation, `/api/health`, SPA refresh behavior, and deployment documentation.

## Product information architecture

- `/`: Bangladesh AI Readiness Assessment public product narrative, methodology, scope profiles, domain overview, disclaimer, language toggle, and assessment CTA.
- `/assessment`: profile and Bangladesh context setup, including division, district, upazila/city, organization type, ownership, employee count, data residency preference, operating language, and regulated-sector status.
- `/assessment/:id`: localized questionnaire, evidence, findings, and deterministic score surfaces.
- `/workspace`: organization/assessment dashboard with readiness, governance maturity, evidence coverage/confidence, findings, critical gaps, residual risk, limitations, action plan, and reviewer status.
- `/review`, `/review/manage`, `/review/:id`, `/review/invite/:token`: existing reviewer workflow extended with professional role, expertise, sector experience, Bangladesh jurisdiction familiarity, language capability, conflict declaration, and independence status.
- `/admin`: catalogue/source registry overview and controlled version status.

## Data model and catalogue

Add additive entities/columns for organization Bangladesh context; assessment catalogue/methodology version and report language; localized profile/domain/control descriptions; catalogue versions and status (`draft`, `in_review`, `approved`, `published`, `retired`); policy/source registry; sector/jurisdiction applicability overlays; reviewer metadata; and risk dimensions. Add indexes for organization, assessment, control, reviewer, evidence, and source/version queries.

Localized controls use stable versioned codes such as `BD-GOV-001`, `BD-DATA-001`, `BD-CYBER-001`, `BD-BANK-001`, `BD-HEALTH-001`, `BD-EDU-001`, `BD-TELECOM-001`, and `BD-EMERGING-001`. Each includes English/Bangla descriptions, objective, evidence requirement, applicability, Bangladesh sector applicability, jurisdiction, lifecycle stage, control type, criticality, weight, source references/authority/status, version, effective/last-reviewed dates, and reviewer notes. They are labelled: “Bangladesh AI Readiness Assessment assessment control — mapped to reference sources; not itself a legal requirement.”

The source registry stores title, issuing authority, URL, publication date, effective date, status, last-verified date, and legal-review flag. It distinguishes binding law, policy, draft policy, regulatory guidance, international standard, recommended practice, and research reference. No legal requirement is invented; drafts are never presented as enacted law.

## Design system

### Style options considered

- **Assurance command center** — 0.06: executive evidence surfaces with deep navy framing and clear readiness signals.
- **Civic systems atlas** — 0.08: public-interest information design with cartographic structure and institutional calm.
- **Bengal delta editorial** — 0.04: restrained red/green signal accents, warm paper surfaces, and highly legible bilingual typography.

### Selected style: Assurance command center, localized for Bangladesh

**Design Movement:** Editorial enterprise software influenced by Swiss information design and public-sector control rooms.

**Core Principles:** Evidence before decoration; institutional trust without overclaiming; bilingual clarity; every score paired with context and limitations.

**Color Philosophy:** Deep navy provides authority, Bangladesh green marks verified or constructive progress, warm white keeps long reports readable, and signal red is reserved for risk states. Red/green references remain subtle rather than flag-like.

**Layout Paradigm:** Asymmetric command surfaces with a persistent context rail, horizontal domain/risk bands, and offset evidence panels rather than generic centered marketing grids.

**Signature Elements:** A green evidence signal line, compact index labels, and paired English/Bangla metadata rows.

**Interaction Philosophy:** Controls describe outcomes such as “Save assessment context” or “Request evidence,” not vague sales language. Every risk indicator exposes its underlying deterministic factors.

**Animation:** Short ease-out transitions for route panels and score changes; no looping decoration; honor reduced-motion preferences.

**Typography System:** A Unicode-safe sans stack with `Noto Sans Bengali`, `Inter`, and system fallbacks. Use a compact mono fallback for stable control IDs. Keep Bangla line-height generous and avoid overly tight display text.

**Brand Essence:** A clear, evidence-led way for Bangladesh organizations to understand AI readiness and improve responsibly. Personality: rigorous, grounded, constructive.

**Brand Voice:** Direct, careful, and non-certifying. Example lines: “Make AI readiness visible.” and “Choose a Bangladesh context. Build an evidence trail.”

**Wordmark & Logo:** Bangladesh AI Readiness Assessment wordmark with an open square scope mark, a vertical green evidence signal, and a small red review point; no oversized flag treatment.

**Signature Brand Color:** Bangladesh green `#006A4E`, balanced by deep navy `#102A43` and warm white `#F8F6F0`.

## Project structure

- `client/src/App.tsx`: route registration and providers.
- `client/src/i18n/`: locale context, translation keys, English/Bangla dictionaries.
- `client/src/pages/`: public, assessment, workspace, reviewer, admin, and invite surfaces.
- `client/src/components/`: shared Bangladesh AI Readiness Assessment shell, language toggle, disclaimers, context fields, and risk/evidence cards.
- `client/src/index.css`: Bangladesh AI Readiness Assessment tokens, bilingual typography, responsive layout, motion, and risk-state styles.
- `shared/`: typed catalog, locale, profile, scoring, and report contracts.
- `server/agarasCatalog.ts` and new Bangladesh catalog modules: global and Bangladesh domains/profiles/controls/source registry.
- `server/agarasDb.ts`: protected persistence, deterministic scoring, isolation checks, and audit events.
- `server/reportExport.ts`: branded PDF/Excel generation with language modes and Unicode-safe fonts.
- `drizzle/`: additive migrations and relations.
- `public/manus-routes.json`: synchronized page route declarations.
- `README.md`, `.env.example`, and deployment docs: Bangladesh AI Readiness Assessment setup and Vercel operations.

## Validation and delivery

Run `pnpm check`, `pnpm test`, `pnpm build`, `pnpm exec drizzle-kit check`, and controlled `pnpm db:migrate` only against staging. Add regression coverage for public/global/Bangladesh catalogues, assessment creation, deterministic scoring, upload validation, organization/reviewer isolation, RBAC, invite expiry, email fallback, action-item permissions, PDF/Excel generation, Bengali Unicode, OAuth sessions, health, and Vercel routes. Report test status, migrations, routes/procedures, environment variables, regulatory source registry, known limitations, and remaining production blockers. Use small reviewable commits and never commit secrets or production data.


## Separate Manus-hosted copy — approved deployment plan (2026-11-09)

### Scope and boundaries

- Source is the clean, pushed GitHub branch `feature/bangladesh-ai-observatory`, commit `8c5e972e55fdda45b29ac1545ef738cbbfbe4f45`, from `sumaiyabintaywadud-git/bangladesh-ai-readiness-assessment`.
- Target is the separate Manus Webdev project `bdaiobs` (resource `manus-resource://manus-webdev/project/wdp_652860559d8321346c7dadb3`). Keep its Manus-managed Git remote, `main`, and project initialization metadata; import application files only. Do not modify the original GitHub/Vercel project or its database.
- Preserve the source assessment, review, organization, evidence, reporting, localization, and Observatory routes/API unchanged. The approved follow-up changes homepage presentation only; it does not redesign or remove Assessment or Observatory behavior.
- The target uses its own project-scoped managed MySQL database, which is new and empty apart from the identical initialized `users` migration. Do not copy source/production database records. OAuth and platform runtime values are supplied for this separate project.

### Serving, migration, and delivery

- Reuse the repository's React/Vite frontend, Express/tRPC server, Drizzle/MySQL schema, Manus OAuth, and `Dockerfile`. Keep port `3000` and unauthenticated health endpoint `/api/health`.
- Keep the complete route manifest at `client/public/manus-routes.json`; retain the existing Vercel configuration and entrypoint in the copied source, while the new Manus project serves via its container configuration.
- The target's `0000_initial_users.sql` is byte-identical to the source migration and was applied during initialization. Preserve that migration/journal and run the remaining checked-in migrations `0001`–`0005` once against only the new project's managed database, after importing the matching source journal/snapshots. Never use destructive SQL or source data.
- Install the source lockfile, run the existing checks (`pnpm check`, `pnpm test`, `pnpm build`), start Preview, and verify `/api/health`, `/manus-routes.json`, and the route/source correspondence.
- Set a literal HTTPS `logoUrl` in `app.config.ts`, checkpoint the intended version by a normal push to this new project's Manus-managed `origin/main`, then explicitly publish because `auto_publish` is false. The first Agent publication is private; only the user can choose public visibility in the publish result card.

### Approved homepage design update (2026-11-09)

- Treat the user's supplied desktop/mobile homepage reference as the visual authority. Use the emblem/logo shown in that reference; use its memorial photograph crop as the homepage hero image, not a generated lookalike.
- Rework only the public homepage presentation: desktop brand header/navigation, deep Bangladesh-green hero with memorial photo and subtle map/technology motif, two clear calls to action, three platform capability cards, mission/pillar strip, and dark-green footer.
- Preserve the existing English/Bangla toggle, Manus sign-in/sign-out behavior, and all current route targets. Keep BD AI Governance Readiness Assessment marked available, mark Bangladesh AI Observatory available because `/observatory` is implemented, and keep AI Incident Reporting & Management marked upcoming.
- On mobile, retain a working compact menu, use a legible stacked hero with both actions, stack the module cards and mission pillars, and prevent horizontal overflow.
- Scope code changes to the homepage and homepage-specific CSS plus project-stored assets. Do not modify assessment/Observatory pages, route declarations, server procedures, authorization, schema, database records, or migrations.
- Do not publish or deploy this change. Show the updated Preview (desktop and mobile) and wait for the user's explicit approval before any publication.

### Known operational risks

- The separate database has no migrated assessments, user rows, or Observatory observations. The application can create its assessment catalogue on first assessment creation, but Observatory public data starts empty until an administrator curates and publishes observations.
- Source role provisioning grants site-admin only when `OWNER_OPEN_ID` matches the signed-in Manus openId. The new project's current environment does not include `OWNER_OPEN_ID`; do not weaken admin authorization or guess the user's ID. Assessment login remains available, but site-admin/Observatory management needs an authorized owner-ID configuration before claiming the admin workflow is operational.
- A checkpoint and a successful Preview are not publication success. Report a live URL only after the explicit publish job succeeds; report the initial private visibility accurately.


## Approved remediation and backend transition amendment — 2026-11-10

### User-approved scope and phase gate

The user approved implementation of Phases 1–6 on the current stack, with Phase 7 replacing Manus OAuth and MySQL/Drizzle with Supabase Auth and Supabase Postgres. This amendment supersedes the earlier TODO statement against a Supabase replacement only for the final phase. Do not begin Supabase Auth, Supabase schema, migration, or RLS work before Phases 1–6 have been implemented and verified. Until that gate is passed, preserve Manus OAuth, the application session model, MySQL/Drizzle persistence, existing data, and current URLs. Authorization hardening in Phases 1–6 is still required, but must not change the identity provider/session implementation.

Phase 7 requires a user-selected Supabase project and protected configuration. Before starting it, pause for the project URL/public key and server-only credentials through the protected secret flow, agree a data-preservation/migration approach, and verify which datasets exist. Do not silently discard MySQL data, dual-write to both databases, expose service-role credentials to the browser, or treat a successful schema application as proof of RLS correctness. If a safe staging target or migration approval is unavailable, leave Phase 7 blocked and report that limitation.

### Implementation sequence and architecture

1. **Phase 1 — authorization remediation:** Use authenticated `ctx.user.id` as the trusted actor. Centralize assessment/organization access checks and apply them to every tRPC read and mutation. AI-system records must have a valid authorized parent; verify assessment ownership or active organization membership/role before creating, viewing, or changing them. Reviewers receive only explicitly assigned data: enforce assignment status and `full`, `evidence`, `findings`, and `domain` scope on assessment, control, evidence, finding, event, dashboard, report, and mutation paths. Validate parent-child IDs against the same assessment/organization, apply consistent not-found/forbidden behavior, and add direct-router regression tests. Hiding a control in the UI is never an authorization boundary.
2. **Phase 2 — Readiness Assessment workflows:** Complete setup context and question navigation, answer/note management, progress, deterministic score/readiness calculations, submission and review transitions, and clear loading/empty/success/error handling. Carry the assessment ID through setup, questionnaire, workspace, and exports. Remove illustrative fallback data from operational routes. Separate score recomputation from assessment lifecycle transitions so editing answers cannot erase a review/completion state. Preserve assessment and report disclaimers and existing supported routes.
3. **Phase 3 — Observatory and AI-system registry:** Preserve the public, source-linked Observatory indicator/observation register and its published-data boundary. Implement a private organization/assessment-scoped AI-system register with create/read/update/retire, search, filtering, categorization, detail views, and dashboard counts/charts; only explicitly published, curated, source-backed Observatory records may be public. Do not expose organization AI-system records or infer national statistics from private registry rows. Add input validation and distinguish an empty dataset from a failed query.
4. **Phase 4 — reviewer and administrative workflows:** Complete assignment creation, acceptance/decline, review status, notes/decisions, evidence verification, completion prerequisites, admin interfaces, and organization roles. Enforce every role and scope server-side, retain audit events, and expose actionable pending/empty/error states. Verify user journeys via direct API and UI paths.
5. **Phase 5 — UI/application quality:** Retain the approved Bangladesh-green/navy design direction and responsive layout. Fix broken navigation, remove placeholder behavior from operational features, implement loading/empty/success/error states, and improve keyboard use, labels, focus, reduced-motion behavior, and narrow-screen layouts without unnecessary redesign or route breakage.
6. **Phase 6 — verification before provider/database transition:** Run `pnpm check` and all existing tests; add direct regression tests for both P0 authorization concerns, unauthorized users, cross-assessment/cross-organization access, and reviewer scopes/status. Verify routes and important user journeys, and document anything not verified. Database-mutating tests must use a disposable/staging database only; the managed Webdev database is shared with publication, so do not run destructive or write tests against it. Do not advance to Phase 7 until all Phase 1–6 acceptance criteria have evidence.
7. **Phase 7 — Supabase replacement, final phase only:** Replace the existing Manus OAuth/MySQL persistence after the Phase 1–6 gate. Implement Supabase Auth registration/login/logout/session persistence/password reset/protected routes/roles; migrate schema and data to Supabase Postgres with relationships, foreign keys, indexes, constraints and RLS. Policies must enforce organization isolation, assessment ownership, and reviewer assignment/scope restrictions. Replace applicable mock/placeholder paths with real Supabase-backed workflows, then verify CRUD, persistence, authentication, and RLS against a non-production Supabase target. Keep all private credentials server-side and never rely solely on frontend access checks.

### Project structure and responsibility boundaries

- `client/src/App.tsx` and `client/public/manus-routes.json`: page routing and synchronized route declarations; preserve existing page paths and add private registry routes only where required.
- `client/src/pages/Assessment.tsx`, `Questionnaire.tsx`, `Workspace.tsx`, and reviewer pages: assessment and review interactions, with no illustrative fallback on operational routes.
- `client/src/pages/Observatory.tsx` plus new authenticated registry/detail pages: public source-linked statistics versus private organization/assessment AI-system management.
- `client/src/components/` and `client/src/index.css`: reusable forms, state feedback, accessibility, and existing responsive design system.
- `server/routers.ts`: input validation and server-side auth boundaries for every procedure; never trust client-supplied user, organization, assessment, control, or reviewer IDs without a helper check.
- `server/agarasDb.ts` and `server/observatoryDb.ts`: current MySQL/Drizzle data operations and scope filters through Phase 6; additive migrations only where justified.
- `drizzle/` and `server/db.ts`: existing MySQL schema and connection through Phase 6. Phase 7 will introduce a reviewed Supabase/Postgres schema/migration and data-access boundary, replacing rather than silently dual-writing to MySQL.
- `server/_core/`: keep current Manus OAuth/session behavior unchanged until Phase 7; then replace it with the approved Supabase Auth session integration.
- `server/**/*.test.ts`: unit/router regression coverage; use a disposable/staging database for any test requiring writes.

### Design direction

Use the already approved Bangladesh-green homepage and assurance-command-center styling as the visual reference. Keep clear evidence-led hierarchy, bilingual-compatible typography, responsive layouts, and restrained risk colors. Preserve Assessment and public Observatory visual continuity; prioritize usable workflow state and privacy clarity over decorative redesign. Private registry rows are never public by default.


## Incident evidence attachments — implementation amendment (2026-11-12)

- Extend the existing `/incidents` report detail workflow with private file evidence; retain text notes and all existing incident permissions.
- Reuse the configured project object storage (`storagePut`) and the existing PDF/image/text/Office MIME-signature validation policy. Limit each file to 10 MiB and rate-limit upload requests.
- Store file metadata in an additive `incident_evidence` table with incident and organization IDs, uploader, safe display filename, MIME type, byte count, storage key, and timestamp. Keep the storage key server-side; return only metadata to the client.
- Require the existing incident visibility check before listing metadata, uploading, or issuing a short-lived signed download URL. Only the reporter or authorized organization incident managers can read evidence; do not grant access to all organization members. Reject cross-incident/tenant references and uploads after closure/dismissal.
- Record each authorized temporary download-link issuance in the incident audit timeline without storing the signed URL or raw storage key. Application audit covers link issuance; auditing the actual object fetch requires storage-provider access logs.
- Generate migrations `0009_incident_evidence.sql` and `0010_incident_evidence_audit.sql` and update the Drizzle schema/journal. Do not apply it to any database in this source-only task. Keep raw storage keys off client responses; signed URLs are issued only after authorization. Uploaded documents are not malware-scanned; make that limitation and safe-submission guidance visible.
