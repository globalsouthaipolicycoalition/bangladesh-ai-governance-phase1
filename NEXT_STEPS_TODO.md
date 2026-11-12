# Bangladesh AI Observatory — পরবর্তী কাজের TODO

বর্তমান package baseline: Manus project-এর `main` branch, commit `3553ded`। এতে source-only project ZIP, Vercel deployment guide, GitHub quality-check workflow এবং Vercel setup notes আছে। ZIP নিজে কোনো GitHub/Vercel account-এ linked নয়; কোনো live deployment করা হয়নি।

## A. Feature-complete system — Auth/API final integration-এর আগে

- [ ] User-এর পূর্ণ module/scope তালিকা final করুন: Readiness Assessment, Observatory, private AI-system registry, organization/reviewer journeys, reports/exports, implemented source-level incident workflow, admin tools ও English/Bangla UI। Incident migration apply, file-evidence integration এবং staging privacy tests এখনো বাকি; কোনো feature নীরবে বাদ দেওয়া যাবে না।
- [ ] Existing Assessment ও Observatory flows না ভেঙে UI, forms, loading/empty/error/success states, responsive layouts, accessibility এবং navigation সম্পূর্ণ করুন।
- [ ] API/Auth integration-এর আগে development-only mock/staging adapters দিয়ে end-user journeys ও UI states তৈরি/পর্যালোচনা করা যেতে পারে। Mock data-কে বাস্তব persistence, authorization বা production evidence বলা যাবে না।
- [ ] প্রতিটি module-এর data contracts, permissions, validation rules, acceptance criteria এবং API integration points লিখিতভাবে স্থির করুন।
- [ ] Feature-complete Preview walkthrough সম্পন্ন করুন; বাস্তব private data ছাড়া test করুন।

## B. Final Auth/API/Database integration ও security gate

- [ ] User যে “Auth এবং API শেষে” বলেছেন, সেই অনুযায়ী final integration phase-এর আগে feature scope/UI/flows review ও অনুমোদন নিন। তবে বর্তমান code-এ Manus OAuth, tRPC API ও MySQL/Drizzle ইতিমধ্যেই আছে; deploy package-এ এগুলো সরানো হয়নি।
- [ ] Secure full-system release-এর আগে Auth, APIs, database persistence, owner/member/reviewer roles, cross-tenant isolation, evidence storage এবং report/email paths বাস্তবে integrate ও test করুন। Mock adapter দিয়ে security sign-off দেবেন না।
- [ ] Isolated disposable/non-production MySQL/TiDB database ও পৃথক test identities provision করুন। Shared managed database বা production data-তে mutating tests করবেন না।
- [ ] Staging database credential কেবল secure input flow-এ যোগ করুন; chat, source, `.env`, log, Git বা ZIP-এ কখনো নয়।
- [ ] Assessment persistence/scoring/submission cycle, evidence upload/signing/download, cross-user/cross-organization denial, member role changes/revocation এবং reviewer invite/accept/decline/expiry/completion-এর e2e যাচাই করুন।
- [ ] Tests/verification evidence নথিবদ্ধ করে Phase 1–6 acceptance criteria বন্ধ করুন। তারপরই, আলাদা অনুমোদিত Supabase project ও data-preservation plan থাকলে Phase 7 (Supabase Auth/PostgreSQL migration) শুরু করুন।

## C. Vercel project ও automated update process

- [ ] User-এর নিজস্ব GitHub account-এ ZIP extract করে private repository তৈরি করুন; initial Git commit/push করুন। ZIP-এ Git history নেই। Current Manus remote-কে GitHub remote ধরে নেবেন না।
- [ ] GitHub repository Vercel project-এ import/connect করুন। `vercel.json`-এ build/output/API function/SPA rewrite আগে থেকেই আছে; Vercel dashboard-এ settings সেগুলোর সঙ্গে মিলিয়ে নিন।
- [ ] Vercel environment variables-এ আলাদা Preview/Production values secureভাবে যোগ করুন। বর্তমান Manus OAuth/MySQL এবং Manus API dependency না বুঝে live deploy করবেন না; shared Manus DB credentials reuse করবেন না। OAuth callback/custom domain configure করুন।
- [ ] `.github/workflows/quality.yml` হলো CI gate: PR/main push-এ Node 22, pnpm 10.18, typecheck, tests, Vercel frontend build. GitHub-এ repository push করলে workflow activate হবে; ZIP alone workflow চালуулах পারে না।
- [ ] GitHub–Vercel integration চালু হলে feature branch/PR = Preview; user review/approval-এর পরে production branch (`main`) merge = Production deployment. Production branch-এ direct push এড়িয়ে PR workflow ব্যবহার করুন.
- [ ] Vercel Preview-তে integration/test pass না হওয়া পর্যন্ত Production deploy করবেন না. Deployment history rollback website code-এ সাহায্য করে; database migration rollback-ও আলাদা plan করতে হবে.
- [ ] Actual Vercel project link, environment setup, build/function test, domain, callback, health check, data persistence, storage, observability, backup/rollback verify করুন. User-এর explicit permission ছাড়া Production publish/deploy করবেন না.

## D. Supabase Phase 7 — শেষ migration phase

- [ ] Phase 1–6 সম্পূর্ণ যাচাই/অনুমোদনের পরে non-production Supabase target ও credential secure input-এ নিন।
- [ ] Auth/session design, PostgreSQL schema/migrations, ownership constraints, indexes, RLS matrix, data migration/preservation/rollback plan আগে লিখুন এবং user approval নিন।
- [ ] Approved হলে Manus OAuth/MySQL dependency বদলে Supabase Auth/PostgreSQL integrate করুন; registration/login/logout/session/password reset, roles এবং organization association-সহ.
- [ ] Organization, assessment-owner ও reviewer assignment RLS policies adversarially verify করুন। Service-role secret browser code-এ প্রকাশ করবেন না। Data discard বা unapproved dual-write করবেন না.
- [ ] Non-production Supabase-এ migration, persistence, CRUD, auth, authorization, RLS ও rollback পরীক্ষা করে final limitations/report/deployment checklist দিন।

## Release boundary

কোনো Production publish/deploy, shared/production database mutation, বা destructive migration করবেন না যতক্ষণ না user নির্দিষ্টভাবে অনুমোদন দেন। UI/API mocks-সহ preview “feature/UI review” হতে পারে, কিন্তু সেটিকে 100% secure, persistent বা production-ready system বলবেন না।


## Current execution update — 2026-11-13

- [x] Public GitHub repository created: `globalsouthaipolicycoalition/bangladesh-ai-governance-phase1`; source and connection/migration documentation pushed to `main`.
- [x] Supabase project created in `globalsouthaipolicycoalition's Org`, Singapore region (`ap-southeast-1`), ref `ytjuewyomyswvgnibqeq`; project is `ACTIVE_HEALTHY` and the public schema is empty.
- [x] Local dependencies installed from the frozen lockfile; `pnpm check` passed; 12 test files and 59 tests passed; 4 authenticated staging tests remain skipped; Bangladesh catalogue verification passed with 16 controls and 8 sources; production build passed.
- [x] Feature audit and Bengali tutorial created at `PROJECT_FEATURE_AUDIT_AND_TUTORIAL_BN_2026-11-13.md`.
- [ ] Vercel integration intentionally deferred by user; no Vercel project or deployment was created.
- [ ] Supabase Auth/PostgreSQL runtime replacement remains gated on identity design, schema/RLS plan, protected credentials, data-preservation plan, and authenticated non-production verification.
