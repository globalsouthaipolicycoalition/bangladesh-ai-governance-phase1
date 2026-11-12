# Implementation status — 2026-11-12

Implemented in this pass:

- Added `docs/product-contracts-and-acceptance.md` with complete module scope, field contracts, permissions, validation rules, integrations, and acceptance criteria for Assessment, Observatory, private AI systems, organizations/reviewers, exports, incidents, admin, and English/Bangla UI.
- Expanded the Bangladesh catalogue from 8 to 16 provisional controls across banking/NBFI, healthcare, education, telecom, government/public services, SME/startup, and cross-sector governance.
- Added official-source records and source verification history for UNESCO, NIST, ICT Division, Bangladesh Bank, DGDA, UGC, BTRC, and the National Portal.
- Added catalogue version, effective/review dates, review due date, change owner, lifecycle metadata, and explicit assessment-mapping disclaimer.
- Kept every new control `in_review`; no control was promoted to `approved` or `published` because qualified Bangladesh legal/sector approval has not been performed.
- Completed report label coverage for PDF/Excel, localized worksheet names/headers, Bengali font handling, stable report filenames, frozen header rows, recommendation fields, and a stable JSON export envelope.
- Persisted report-language preference and added a shared locale dictionary with document-language synchronization.
- Added authenticated organization-private `/incidents` intake/triage/investigation/response workflow, manager-only assignment options, closure rationale, evidence-note/comment/file timeline, rate limits, private object-storage uploads, and signed downloads after reporter/manager access checks. Each authorized signed-link issuance is recorded without storing the URL. Additive migrations `0008_incident_reporting.sql`, `0009_incident_evidence.sql` and `0010_incident_evidence_audit.sql` were generated/consistency-checked but not applied. Authenticated storage E2E remains pending until a disposable staging target and storage credentials are available.
- Extended Bangla/English static UI coverage across assessment, questionnaire, workspace, review, admin, Observatory, private AI-systems, shared authentication/loading/error states, and incident reporting. Reviewer invitation email now follows the selected locale.
- Added Observatory admin CSV preview/import (up to 200 rows, 1 MiB, active source required, strict validation, all-or-nothing insert as unpublished drafts) and a source-by-date trend comparison chart for one selected numeric indicator.
- Added debounced assessment response autosave and role-based organization collaboration: linked active owners/admins/contributors can co-edit open assessments; members/reviewers are read-only; final submission stays with the assessment owner. Saves and action-item changes add review-event audit entries. The earlier Observatory/assessment collaboration features needed no migration; incident file evidence uses separate additive migration `0009_incident_evidence.sql` (generated only, not applied).
- Added workspace action-item tracking for authorized owners/managers: create and assign tasks to active organization members, set priority and due date, and update planned/in-progress/blocked/done status.

Validation completed:

- `pnpm check` — passed.
- `pnpm catalog:verify:bangladesh` — passed: 16 controls, 8 sources.
- `pnpm test` — passed: 47 tests; 3 authenticated staging tests skipped because a disposable staging database and test accounts are not configured.
- `pnpm build` — passed. Existing Vite warning remains for `/api/platform/config.js` lacking `type="module"`.

Still blocked or requiring human/environment evidence:

- Manual responsive, keyboard, screen-reader, focus, live-region, and Bangla PDF/Excel visual audits; dynamic API errors and user-provided values are not all localized.
- Authenticated disposable staging run for incident cross-tenant privacy, real evidence storage/download and URL expiry, request-body parser limits, reviewer lifecycle, member revocation, email fallback, and export downloads. Incident migrations `0008`, `0009`, and `0010` have not been applied. Link issuance is audited; actual object fetch auditing needs provider access logs.
- Qualified Bangladesh legal and sector review before any control can move from `in_review` to `approved` or `published`.
- GitHub/Vercel/Supabase setup, production deployment, destructive migration, or credential configuration. None was performed.
- `pnpm exec drizzle-kit check` — passed using a dummy local URL; it did not connect to a database or run SQL. No database was mutated.
