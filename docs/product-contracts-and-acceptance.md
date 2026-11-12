# Bangladesh AI Observatory — Product Contract and Acceptance Criteria

Last updated: 2026-11-12. This document is the source-of-truth scope for preview and staging review. It does not certify legal compliance, government approval, or independent assurance.

## Release boundary

The platform is an assessment and governance workflow tool. Every self-reported surface and report must display: “Self-reported assessment — not independently verified.” Every control must display: “Bangladesh AI Readiness Assessment assessment control — mapped to reference sources; not itself a legal requirement.” Legal mappings, sector interpretations, publication status, production deployment, and database migration require qualified reviewers or explicit owner approval.

## Modules and acceptance criteria

### Readiness Assessment

A user can choose a global or Bangladesh profile, create a draft assessment, enter organization context, navigate all scoped domains, answer each control on a deterministic 0–4 scale, add notes and evidence status, save and reload progress, see answered/unanswered progress, and submit only when every scoped control is answered. Submission locks responses until an authorized reviewer requests changes. The workspace shows score, evidence coverage, open findings, limitations, methodology version, and the self-reported notice; it never labels a score as compliance or certification.

### Observatory

The public Observatory shows only source-linked observations explicitly published by an authorized administrator. It supports indicator, source, date/period, methodology version, numeric/text value, and draft/published/archived lifecycle. Empty, loading, error, locked, and permission-denied states are explicit. Unpublished or private organization records never appear in the public query.

### Private AI-system registry

An authenticated organization member can create, search, filter, inspect, update, and retire AI-system records. Records are tenant-scoped by organization and assessment ownership. Fields include name, provider, purpose, lifecycle, decision impact, human oversight, and risk level. A user cannot read or mutate another organization’s records by changing an ID, query parameter, or route.

### Organization and reviewer journeys

Owners/admins manage members and roles; assignment managers assign reviewers with explicit scope; reviewers see only assigned assessments and scoped controls. Assignment states are invited, active, completed, declined, and revoked. External invitations are single-use and expire. Reviewer metadata includes professional role, expertise, sector experience, Bangladesh jurisdiction familiarity, language capability, conflict declaration, and independence status. A declared conflict or missing independence confirmation must block completion until an authorized owner resolves it; this policy must be confirmed by qualified governance reviewers before production use.

### Reports and exports

Workspace users can export JSON, PDF, and Excel in English, Bangla, or bilingual mode. Exports use stable locale-neutral enum/code fields plus translated display fields, consistent filenames, Bengali font support, the self-reported notice, the assessment disclaimer, methodology version, assessment context, controls, evidence states, findings, and reviewer metadata subject to least-privilege rules. Exports never say legal compliance, government certification, ISO accreditation, or independent assurance.

### Future incident workflows

The incident module remains clearly marked as upcoming until implemented. Its approved future scope is intake, severity/risk classification, affected AI system, reporter, containment, investigation, response owner, evidence, notifications, lessons learned, closure, audit history, and retention. No placeholder must imply that incident handling is operational.

### Admin tools

Authorized site admins can manage Observatory sources, indicators, observations, catalogue lifecycle, and review history. Owner bootstrap is explicit through protected configuration. Admin pages expose loading, empty, error, locked, read-only, and denied states. Ordinary users never receive admin mutation procedures.

### English/Bangla UI

All navigation, headings, controls, labels, table headers, statuses, confirmation dialogs, validation errors, empty/loading/success/locked/denied states, reviewer workflows, admin workflows, and email templates have English and Bangla strings with English fallback only for missing developer keys. The document language attribute follows the selected locale, persisted in local storage. Bangla text must remain readable at mobile widths and in generated reports.

## Core data contracts

Assessment: `id`, `userId`, optional `organizationId`, profile, title, jurisdiction, sector, Bangladesh organization context, posture, lifecycle status, deterministic score, evidence coverage, and methodology/catalogue version.

Control: stable code, English/Bangla title, objective, evidence requirement, applicability, sector applicability, Bangladesh jurisdiction, lifecycle stage, control type, criticality, weight, source references, version, effective date, last reviewed date, reviewer notes, lifecycle state, review history, and the mapping disclaimer.

Response: assessment and control IDs, integer score 0–4, notes, evidence status, review decision, and timestamps. Evidence: assessment/control IDs, uploader, filename, storage key/URL, MIME/signature validation, size, verification state, notes, and timestamps.

Reviewer assignment: assessment/reviewer/assigner IDs, scope/domain, lifecycle state, reviewer metadata, accepted/declined/completed/revoked timestamps, and audit events. External invite: assessment, email, single-use token hash, scope/domain, reviewer metadata, inviter, lifecycle state, expiry, accept/decline actor, and timestamps.

Report export: `schemaVersion`, `generatedAt`, `locale`, `reportLanguage`, `assessment`, `controls`, `findings`, `reviewers`, `notice`, and `disclaimer`. Enum values remain stable machine-readable codes; translated labels are display fields.

## Permission and validation rules

The server is authoritative. Assessment owners can read and mutate their own draft responses, evidence, findings, and exports. Organization members receive only the permissions granted by their role. Reviewers can read and act only within active assignments and scope. Admin procedures require the protected admin role. IDs are checked against ownership or assignment before every read and mutation. Inputs use strict Zod schemas, bounded strings, enumerated statuses, positive integer IDs, evidence MIME/signature/size checks, HTTPS or project-storage URLs, and rate limits for invitations, membership changes, assessment creation, and uploads.

## Integration points

The browser uses the typed tRPC router. Authentication/session and cookies are supplied by the Manus OAuth runtime. Drizzle/MySQL owns durable application records and additive migrations. Project storage owns evidence bytes. Resend is optional for reviewer email; without a trusted public origin the system returns a secure copyable invitation link. PDFKit and ExcelJS generate reports. The public route manifest must match `client/src/App.tsx`; `/api/health` must remain unauthenticated and return 2xx.

## Acceptance evidence still required

Source-controlled evidence includes typecheck, unit/regression tests, build, catalogue verifier, route-manifest check, and static contract review. Manual evidence still required includes responsive walkthrough at desktop/tablet/390px, keyboard and screen-reader audit, Bangla PDF/Excel visual inspection, authenticated cross-tenant staging tests, evidence storage/download, external invite lifecycle, and qualified Bangladesh sector/legal review. These are not marked complete from source inspection alone.
