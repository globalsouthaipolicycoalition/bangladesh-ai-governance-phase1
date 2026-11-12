# Vercel Environment Variables (names only)

Configure values in the Vercel dashboard's protected environment-variable settings. Keep Preview values isolated from Production. Never commit values to this repository.

## Current Manus-backed runtime
- `MANUS_PROJECT_ID`
- `MANUS_JWT_SECRET`
- `MANUS_OAUTH_API_URL`
- `DATABASE_URL` (must point to an explicitly approved Vercel-compatible non-production/production database, not the shared Manus database)

## Feature-dependent integrations
- `OWNER_OPEN_ID`
- `APP_PUBLIC_ORIGIN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `MANUS_API_URL`
- `MANUS_API_KEY`

This name list does not prove that a provider account is configured or that a deployment can authenticate/connect. Confirm each code path and provider's redirect/callback settings before release. Do not define `VITE_`-prefixed secrets; those may be exposed to browser bundles.
