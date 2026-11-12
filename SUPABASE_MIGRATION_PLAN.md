# Supabase migration plan

## Current state

- Supabase project: `bangladesh-ai-governance-phase1`
- Project ref: `ytjuewyomyswvgnibqeq`
- Region: `ap-southeast-1` (Singapore)
- Status at setup: `ACTIVE_HEALTHY`
- Current Supabase public schema: empty
- Security and performance advisors at setup: no lints
- Existing application database: MySQL through Drizzle ORM
- Existing application authentication: Manus OAuth/session runtime

## Important boundary

The new Supabase project is a clean target. No existing MySQL data has been copied, no application `DATABASE_URL` has been changed, and no Auth provider has been replaced. The application must continue using its existing MySQL/Manus integration until the PostgreSQL/Auth migration is reviewed and tested.

## Recommended migration sequence

1. Freeze the current MySQL schema and export a schema inventory. Preserve the existing source and migrations as the reference implementation.
2. Design a PostgreSQL schema mapping for all application tables, enum values, timestamps, indexes, uniqueness rules, audit records, and relationships.
3. Decide the identity model: Supabase Auth user UUIDs versus a compatibility mapping for existing Manus OAuth identities. Do not silently change ownership semantics.
4. Add organization, assessment-owner, reviewer, evidence, incident, Observatory, and private AI-system authorization rules to an explicit RLS matrix.
5. Apply the translated schema only to this empty non-production Supabase project, using versioned SQL migrations.
6. Add RLS policies and verify positive and negative cases with separate test identities and organizations.
7. Add a reversible data migration plan. No data discard, destructive migration, or unapproved dual-write.
8. Integrate Supabase Auth/PostgreSQL behind a controlled application change, then run authenticated end-to-end tests.
9. Only after non-production acceptance, prepare a separately approved production migration and rollback plan.

## Immediate blockers requiring protected input or an explicit design decision

- Supabase database password/connection credentials must be provided through a secure secret flow if direct connection testing is required.
- The project needs an explicit decision on whether to keep Manus OAuth temporarily or replace it with Supabase Auth.
- Existing MySQL data needs a preservation/export plan before any migration.
- RLS policies require named roles and test identities for owner, admin, contributor, reviewer, and non-member cases.
- Storage and email providers need separate configuration; these are not automatically transferred by creating the Supabase project.

## Do not do yet

- Do not point the live application at Supabase.
- Do not run MySQL-to-PostgreSQL data writes without an approved preservation plan.
- Do not expose service-role keys or database passwords in source, GitHub, browser code, logs, or chat.
- Do not claim Supabase Auth, persistence, RLS, or migration acceptance until authenticated staging tests pass.
