# Authenticated staging E2E

The authenticated suite is intentionally opt-in and skips by default so ordinary CI never writes to a database.

## Required protected environment values

Set these through the project secret manager, not in source control or chat:

- `DATABASE_URL`: disposable non-production MySQL/TiDB staging database
- `STAGING_OWNER_USER_ID`: existing staging user ID for the assessment owner
- `STAGING_REVIEWER_USER_ID`: different existing staging user ID for the reviewer

The database must be isolated from production, backed up or disposable, and safe for temporary test records. The suite creates an assessment, reviewer assignment, two organizations and incident reports, then removes assessment/review/incident records and test organizations in `afterAll`. Keep both configured user IDs valid; the reviewer must be a distinct existing account. Apply migration `0008_incident_reporting.sql` through the approved staging migration process before the suite.

## Run

```bash
STAGING_E2E=1 pnpm test:e2e:staging
```

The suite verifies:

1. Authenticated owner assessment creation with Bangladesh context fields.
2. Control retrieval and persistence of scores and notes.
3. Submission locking and readiness score calculation.
4. Reviewer assignment with professional metadata.
5. Reviewer acceptance and access to the assigned assessment.
6. Organization incident privacy: reporters see only their reports; unrelated users cannot read/list another organization’s incidents.
7. Manager-only assignment options, triage/assignment, evidence-note audit events, and closure rationale enforcement.

If the protected inputs are absent, the suite is reported as skipped rather than silently running against an unknown database.
