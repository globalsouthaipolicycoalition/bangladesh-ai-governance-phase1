# Bangladesh AI Governance Observatory — Feature Audit

**Audit date:** 2026-11-12  
**Basis:** Uploaded source archive, source-code inspection, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm catalog:verify:bangladesh`. This is a source/preview audit, not a production or legal assurance.

## Status definitions

- **Implemented and source-validated:** the code path exists and related type checks/tests/build pass. This does not imply authenticated staging, real-storage, accessibility, or production validation.
- **Implemented but incomplete:** usable functionality exists, but important fields, workflows, validation, or environment verification remain.
- **Implemented but needs optimization:** behavior exists but selection, clarity, accuracy, scale, or usability should improve.
- **Documented but not implemented:** scope appears in a prompt, TODO, or acceptance document but has no corresponding complete code path.
- **Missing but necessary:** required for the stated research-grade product and not found in the current implementation.

## 1. Implemented and source-validated

| Capability | Current implementation and validation |
|---|---|
| Global governance control catalog | `server/expandedCatalog.ts` contains 1,000 GAAF controls spanning 20 domains; `ensureCatalog()` seeds missing domains and controls. Profile creation attaches a subset of these controls to an assessment. |
| Assessment workflow foundation | Five profiles (individual, organization, enterprise, government, national); Bangladesh organization/location context; response score, notes, evidence state, progress/scoring, draft lifecycle, submission lock, findings, and workspace route. |
| Organization and reviewer access foundation | Manus session/auth, organization memberships and roles, assignment scope checks, review queue/manager, external invitations, and regression tests for authorization boundaries. |
| Organization-private AI-system registry | Authenticated list/search/filter/detail/create/update/retire paths with organization/assessment scoping and basic risk, lifecycle, impact, and oversight fields. |
| Assessment exports | PDF, Excel, and JSON export paths with English/Bangla/bilingual options and Bengali font support. |
| Observatory source-linked publication path | Public query returns active indicators and only published observations joined to active source and indicator records; admin procedures are protected. CSV import is bounded, validated, all-or-nothing, and inserts drafts. Central Admin now supports audited source/indicator edits, observation corrections, reasoned archive/publication, and before/after history. |
| Organization-private incident workflow | Authenticated organization-scoped reporting, triage/response, assignment, notes/events, evidence metadata, upload validation, and permission-checked signed download-link issuance. |
| Automated source checks | Final observed run after the Admin increment: `pnpm check` passed; `pnpm test` passed (52 passed, 3 authenticated staging tests skipped, including five sector-mapping regressions); `pnpm build` passed; `drizzle-kit check` passed without a database connection; Bangladesh catalog verifier passed (16 provisional controls, 8 sources). |

## 2. Implemented but incomplete

| Capability | What exists | Important gap |
|---|---|---|
| Bangladesh control registry | 16 localized provisional controls, 8 source records, sector tags, risk/materiality gates, evidence requirements, lifecycle metadata, and a verifier. All controls remain `in_review`. | The registry is served separately from the assessment control tables. `createAssessment()` selects from the global database catalog; the Bangladesh controls are not currently included in scored assessments. Sector-specific legal/technical validation is incomplete. |
| Sector context in assessment | New assessment setup offers stable sector IDs for the existing Bangladesh taxonomy and the additional sectors named in the prompt; recognized values are canonicalized, and workspace labels are localized. A tested matcher shows cross-sector controls plus only controls explicitly tagged for the selected sector in a read-only addendum. | The addendum is provisional/in-review and deliberately unscored. Sector selection still does not affect global-control selection or scoring; unmapped/legacy sectors show only the cross-sector baseline, and no Not Applicable-with-justification workflow exists. |
| Public Observatory | Source/indicator/observation creation, audited source/indicator edits and deactivation, observation correction, reasoned status changes, bounded CSV draft import, and numeric trend chart. A changed published record/definition returns affected observations to draft until reviewed and republished. | Audit/mutation support currently covers only Observatory public curation, not every system catalogue. Indicators still lack geography, confidence, verification, targets, and data-type contracts; duplicate detection and public filters/export remain absent. No seeded observations are included in the hosted copy. |
| Observatory map/dashboard | Map asset and dashboard markup exist. The first increment removes unsupported hotspot/coverage/telemetry/100% claims and states that geography is not collected. | Map remains illustrative until records have geographic fields; new command-center CSS selectors are missing, so the intended full layout/theme remains unfinished. |
| AI-system registry | Basic private CRUD, search/filter, lifecycle, risk and decision impact. | Provider/developer/model, data categories, user groups, third-party dependencies, review date, documentation, limitations, sector/subsector, and explicit relationships to incidents/findings are incomplete or absent. |
| Incident evidence | File type/signature/size checks and temporary signed downloads exist. | Malware scanning is absent; migrations `0008`–`0010` have not been applied to an approved staging database; real storage/cross-tenant E2E is pending; link issuance is logged but actual object fetch relies on provider logs. |
| Reviewer workflow | Reviewer assignment/scope and metadata fields exist. | Metadata carry-through, conflict/independence enforcement, invite revoke/resend/expiry management, and full report display remain incomplete per project status notes. |
| Localization and reports | Static UI and reports support English/Bangla/bilingual in many paths. | API/user-supplied error/value localization and visual review of Bangla PDF/Excel remain incomplete. |

## 3. Implemented but needing optimization

1. **Assessment selection is profile-count based, not sector/risk based.** The current code takes the first N ordered domains and first K controls per domain for each profile. Sector, organization size, risk, and applicability do not drive the selected controls.
2. **Bangladesh controls need a reviewed crosswalk before scoring integration.** They should not be silently added to the score while every control is provisional; first define stable relations to GAAF controls, sector triggers, version snapshots, and source/legal review requirements.
3. **Trend-chart ambiguity needs a deterministic policy.** Multiple observations for the same indicator/date/source can collapse into one chart cell; the project has no enforced unique key or explicit duplicate/correction resolution workflow.
4. **Observatory public data needs query limits and filters before growth.** Public reads still return all matching rows; pagination, date/category filters, and exportable aggregate queries are not implemented. The new edit/audit path applies only to public curation.
5. **The dashboard must remain evidence-led.** The map cannot claim geographic coverage or platform/system health without underlying location/health data. The command panel has been made more candid, but styling and a genuine geographic data model remain future work.

## 4. Documented but not implemented

- The full national public-interest AI incident research database alongside, not merged into, private organization incidents.
- The 25-category AI safety/ethics risk taxonomy and dedicated gender-based AI violence/child-safety research workflow from the earlier prompt.
- The latest prompt’s expanded incident taxonomy, S0–S4 severity, and independent verification scale (verified/corroborated/probable/suspected/unverified/disputed/inconclusive).
- Researcher, incident reviewer, verification analyst, policy analyst, and publication-editor roles with publication approval.
- Incident duplicate detection, source/evidence corroboration, verification history, correction requests, and anonymized organizational disclosure workflow.
- Framework-level incident/control crosswalks for UNESCO, OECD, NIST, EU AI Act, UNGP, UNICEF, UN Women, and other named frameworks, including jurisdiction/binding-status distinctions.
- Policy/regulatory tracker, AI ecosystem/stakeholder registry, research/innovation database, and talent/human-capital observatory.
- National AI adoption/infrastructure/talent/investment/risk indicators and time-series analytics based on real records.
- Scheduled monthly/quarterly/annual research-report workflow with approved conclusions and publication history.

## 5. Missing but necessary for the target product

- Reviewed sector-specific assessment logic and control mappings. New UI options now capture agriculture, energy/utilities, transportation, manufacturing, retail/e-commerce, media/journalism, insurance, legal/justice, and other sectors, but the provisional Bangladesh catalog has no sector-specific controls for those sectors; they must not be presented as locally covered.
- An explicit assessment-control crosswalk and selection policy using sector, entity type/size, risk/materiality, and applicability; a Not Applicable decision must require rationale and remain reviewable.
- Assessment/catalog version snapshots and historical comparison semantics so old scores remain reproducible after catalog changes.
- Indicator/observation provenance and quality model: observation kind (reported/estimate/projection), source timestamp, method, confidence, verification state, corrections, duplicates, and append-only history.
- Separate national research incident schema and strict access/publication boundary from private organization incidents.
- Survivor-centered sensitive-data classification, restricted evidence storage, consent/disclosure review, anonymization, child-data safeguards, retention/deletion, and safe aggregate thresholds before GBV data can be published.
- Domain-complete role/permission matrix, audit coverage across editable catalogues, human verification/publication gates, and cross-tenant tests. A logical append-only admin log now covers Observatory curation only; private tenant records remain outside the site-admin workbench.
- Real database/storage staging, migration verification, responsive/accessibility/Bangla-export manual QA, and qualified Bangladesh legal/sector review before publication claims.

## Priority implementation sequence

1. **P0 — Data honesty and integrity:** remove unsupported map claims (started in this increment); define duplicate/correction behavior; retain visible data limitations.
2. **P0 — Assessment relevance:** approve sector taxonomy and risk/applicability rules; design crosswalk and versioned assessment snapshots; then integrate Bangladesh controls without misrepresenting provisional controls as legal obligations.
3. **P0 — Incident safety boundary:** keep private org incidents private; design separate research records, sensitive access partitions, verification workflow, and human publication approval before adding public incident content.
4. **P1 — Observatory data model:** add indicator/observation dimensions, geographic scope, confidence/verification, history, correction, duplicate detection, filters and pagination, then data-backed analytics.
5. **P1 — Registry links and reports:** enrich AI-system records and relate them to assessment findings/incidents under explicit permissions; expand reproducible research exports.
6. **P2 — Ecosystem, research, talent, and policy modules:** add only with credible source records, curation ownership, and update methodology.
7. **Release gate:** run migration and cross-tenant tests on disposable staging, browser/device accessibility review, and qualified legal/sector review; do not infer production readiness from local typecheck/build.

## Implementation update — admin data stewardship increment

The `/admin` page now exposes an audited workbench for public Observatory sources, indicators, observations and recent changes. Server mutations require site-admin authorization and a human reason for edits/status changes. Each mutation records actor, timestamp, entity, action, reason and before/after values in additive migration `0011_admin_data_audit.sql`; CSV import summary logging is transactional. Corrected published observations, and observations affected by source/indicator changes or deactivation, are returned to draft. The workbench does not expose organization assessments, AI-system records, incident narratives, evidence or survivor-sensitive data. This is a first domain slice, not a claim that every system catalogue is editable: global GAAF controls, Bangladesh controls/source taxonomy, sector/profile catalogs and research-specific data still lack central admin authoring. Migration `0011` is generated but has not been applied to any database.

## Implementation update — sector relevance increment

New assessments now use a stable primary-sector option instead of a guessed default. Recognized sector IDs are persisted canonically without a migration, legacy values are preserved, and workspace displays localized labels. The questionnaire shows a tested, read-only addendum containing only cross-sector baseline controls and any provisional controls explicitly tagged for that sector. The annex clearly states that all Bangladesh controls remain in review, are not legal requirements, and do not affect scores. Sectors without local mappings are explicitly flagged; no mappings were invented. No score calculation or selected global GAAF controls were changed.

## Increment completion matrix

| State | Scope |
|---|---|
| Existing | 1,000-control global assessment catalog, 20 domains, core assessment/review/export workflows, private AI-system register and private incident workflow. |
| Improved | Observatory no longer implies fabricated geographic coverage or system-health percentages; assessment setup records a stable primary sector and the workspace localizes the label. |
| Newly implemented across sector/admin increments | Structured sector context with an unscored provisional annex; site-admin CRUD/correction for public Observatory data; logical append-only before/after audit entries; private tenant data stays outside global Admin. Audit migration generated but not applied. |
| Future work | Full admin authoring/version lifecycle for global and Bangladesh controls, sectors, profiles and remaining system catalogs; reviewed sector/risk-based scored control selection; Not Applicable with rationale; versioned assessment snapshots; independent research incidents and survivor-protective GBV; richer indicator/verification and policy/ecosystem/talent/research modules. |

## Production-readiness decision

**Not production-verified.** No production deployment or database mutation was made during this audit. The three authenticated staging tests are skipped; incident migrations `0008`–`0010` and admin audit migration `0011` are generated but not applied; real storage integration, cross-tenant evidence tests, accessibility review, Bangla export inspection, and qualified sector/legal approval remain open. The existing build emits a non-fatal Vite warning because `/api/platform/config.js` is included as a classic script without `type="module"`.
