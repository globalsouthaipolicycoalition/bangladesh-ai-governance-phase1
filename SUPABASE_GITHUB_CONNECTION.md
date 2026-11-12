# Supabase–GitHub connection standard

This project uses GitHub as the source of truth and Supabase migrations as version-controlled database changes. The application source, migration files, and CI configuration belong in GitHub. Supabase project credentials and passwords must remain in protected environment variables.

## One-time access setup

For a new GitHub account, add the account to the repository as a collaborator or use a fork and pull request workflow. For a new Supabase account, add the person to the Supabase organization with the lowest role that supports the required work. Repository access and Supabase organization access are separate permissions; granting one does not grant the other.

In Supabase Dashboard, connect the repository from **Project Settings → Integrations → GitHub**, authorize Supabase in GitHub, select the repository, set the working directory to `.` when the `supabase/` folder is at the repository root, and enable the integration. Automatic branching can be enabled later after migrations are stable.

## Repeatable CLI connection

Install the Supabase CLI, clone the repository, authenticate with the user's own Supabase account, and link the local checkout to the intended project:

```bash
git clone https://github.com/globalsouthaipolicycoalition/bangladesh-ai-governance-phase1.git
cd bangladesh-ai-governance-phase1
supabase login
supabase link --project-ref ytjuewyomyswvgnibqeq
```

The project reference identifies the target Supabase project. It is safe to store in documentation. Never store the database password, access token, service-role key, or other secret in GitHub, source files, browser code, logs, or chat.

## Standard sync workflow

Pull the latest source and migrations before making changes:

```bash
git checkout main
git pull --ff-only origin main
```

Create database changes as migration files under `supabase/migrations/`. Test them locally or in a disposable staging project before applying them to a shared or production project. Use a feature branch and pull request for review:

```bash
git checkout -b feature/your-change
supabase migration new describe_your_change
# edit the generated SQL migration
supabase db reset
git add supabase/migrations
git commit -m "Describe the database change"
git push -u origin feature/your-change
```

## Recommended environments

Use separate Supabase projects for local development, staging, and production. Map Git branches to environments: feature branches for review, `develop` for staging, and `main` for production. Production migrations should run only after staging verification and a pull request review.

For GitHub Actions, keep these as encrypted repository or environment secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, and the corresponding staging or production database password. Use separate GitHub environments so staging credentials cannot be used by ordinary pull requests.

## Reusable request phrase

To repeat this setup for another repository or account, use:

> Connect this GitHub repository and Supabase project using the project’s Supabase–GitHub connection standard. Verify repository access, Supabase organization access, project reference, CLI linking, migration directory, and protected secrets. Do not expose credentials or run production migrations without explicit approval.
