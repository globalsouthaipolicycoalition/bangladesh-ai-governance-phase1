

## Separate Manus-hosted deployment

This Manus project is a separate hosted copy of the GitHub feature-branch application. It does not modify or synchronize with the original GitHub/Vercel deployment. Its Manus-managed MySQL database is separate and starts without the original project's users, assessments, organizations, or Observatory observations. The existing migration chain creates the schema; assessment catalogue records are initialized by the application when an assessment is created.

The Manus Webdev runtime supplies the project OAuth and managed database variables. Do not commit runtime values or reuse the original production database. `/api/health` is the container readiness endpoint and the complete page route list is served from `/manus-routes.json`.

The application's global administrator bootstrap is intentionally restricted: `OWNER_OPEN_ID` must match the authorized owner's Manus openId before that account is granted the site-admin role. Configure that value only through the project's protected environment/secret settings; do not promote an arbitrary first visitor or commit the identifier. Until it is configured, ordinary signed-in assessment use remains separate from site-admin and Observatory curation access. The public Observatory has no seeded observations in this new database and will remain empty until an administrator adds and publishes source-linked data.


### Sensitive integrations and invitation links

- Set `OWNER_OPEN_ID` only through the project's protected configuration to enable the explicitly authorized site-admin bootstrap.
- Transactional reviewer email requires `RESEND_API_KEY` and `EMAIL_FROM`. `APP_PUBLIC_ORIGIN` must be the canonical HTTPS origin (for example `https://platform.example`) before email delivery is enabled; email links are never derived from an untrusted request `Host` header. If it is unset, the application creates the invitation and shows the owner a secure copyable link instead.
- Sensitive mutations use per-process burst limits. For multiple production replicas, use a shared edge/Redis rate limiter so those limits are consistent across instances.
