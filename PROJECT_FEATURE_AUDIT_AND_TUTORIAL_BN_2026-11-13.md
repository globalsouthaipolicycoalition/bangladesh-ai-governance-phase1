# Bangladesh AI Governance Platform — Feature Audit ও Tutorial

**Audit date:** ১৩ নভেম্বর ২০২৬  
**GitHub:** `globalsouthaipolicycoalition/bangladesh-ai-governance-phase1`  
**Supabase target:** `bangladesh-ai-governance-phase1` / ref `ytjuewyomyswvgnibqeq`  
**Vercel:** এই increment-এ ইচ্ছাকৃতভাবে বাদ রাখা হয়েছে; কোনো Vercel project/deployment তৈরি হয়নি।

## এক নজরে বর্তমান অবস্থা

Source code-এ মূল product features-এর বড় অংশ তৈরি আছে। Documentation-এর roadmap estimate অনুযায়ী planned engineering work-এর আনুমানিক **৭৫–৮০% implementation** হয়েছে। এটি production readiness-এর percentage নয়। বর্তমান static validation সফল, কিন্তু database-backed authenticated acceptance এবং legal/sector/accessibility review এখনো বাকি।

বর্তমান application-এ route manifest-এ **১৪টি usable page route** আছে এবং backend-এ **৮টি প্রধান API domain** আছে: authentication, assessment/catalogue, review, organization, incident, Observatory, admin এবং system. Project validation-এ TypeScript check pass, **১২টি test file pass**, **৫৯টি test pass**, **৪টি staging test skipped**, Bangladesh catalogue **১৬টি control ও ৮টি source** হিসেবে valid, এবং production build pass হয়েছে।

## Feature status

### সম্পূর্ণ বা source-level-এ শক্তভাবে implemented

- Readiness Assessment setup, Bangladesh organization context, questionnaire, autosave, 0–4 response scoring, evidence status, findings, action items, workspace এবং submission lock.
- Organization membership, owner/admin/contributor/reviewer role paths এবং server-side authorization checks.
- Reviewer queue, assignment scope, review events, accept/decline/complete এবং control/finding review paths.
- Public Bangladesh Observatory-তে published/source-linked data filtering, admin source/indicator/observation management, CSV import এবং comparative trend view.
- Private organization-scoped AI-system registry: create, list, detail, update, retire, search/filter এবং risk/lifecycle fields.
- Incident reporting source workflow: organization-scoped incident, activity timeline, assignment/status updates, evidence metadata এবং signed-download design.
- JSON, PDF, Excel এবং bilingual export foundation.
- English/Bangla locale toggle এবং প্রধান page/module-এর localized UI.
- Rate limiting, evidence MIME/signature/size validation, audit event paths এবং public/private data separation.

### আংশিক implemented বা staging evidence ছাড়া অসম্পূর্ণ

- External reviewer metadata carry-through, conflict/independence enforcement এবং invite resend/revoke/expiry management.
- Incident migrations `0008`–`0010`, real storage integration, signed download এবং cross-tenant file denial.
- Report-এর সব reviewer metadata, translated findings/status/severity/value fields এবং Bengali PDF/Excel visual QA.
- Sector/organization type/size/risk ভিত্তিক reviewed control selection এবং final Bangladesh control approval gate.
- Control-level collaboration; বর্তমানে organization-role ভিত্তিক whole-assessment co-edit আছে.
- Complete API/server error localization, full accessibility audit এবং সব responsive page walkthrough.

### Implemented but not production-verified

- Existing Manus OAuth/session integration.
- MySQL/Drizzle migrations and persistence paths.
- Owner/admin/reviewer authorization behavior.
- Assessment persistence, scoring, submission, evidence upload/download এবং cross-organization denial.
- Reviewer invite lifecycle, email fallback এবং export download.

এসবের জন্য disposable staging database, পৃথক owner/reviewer identities এবং authenticated end-to-end evidence দরকার।

## সংযোগ ও infrastructure status

GitHub public repository তৈরি হয়েছে এবং `main` branch-এ source push হয়েছে। Supabase project Singapore region-এ তৈরি, PostgreSQL 17 এবং `ACTIVE_HEALTHY`; public schema বর্তমানে empty. Supabase security/performance advisor check-এ setup পর্যায়ে কোনো lint পাওয়া যায়নি। Supabase migration plan ও connection standard GitHub-এ version-controlled আছে।

বর্তমান application এখনো MySQL/Drizzle এবং Manus OAuth-এর উপর নির্ভরশীল। Supabase Auth/PostgreSQL এখনো application-এর active runtime connection নয়। এটি ইচ্ছাকৃত, কারণ migration-এর আগে data-preservation, identity mapping, RLS matrix এবং rollback plan দরকার।

## এখন যে কাজগুলো আগে করতে হবে

### ধাপ ১ — staging evidence

আলাদা non-production MySQL/TiDB database এবং owner/reviewer test identities তৈরি করুন। Secure secret flow-এ `DATABASE_URL`, OAuth configuration, `APP_PUBLIC_ORIGIN`, email/storage values দিন। Shared বা production database-এ mutating test করবেন না।

Assessment create → answer → autosave → score → evidence → finding → action item → submit → lock → PDF/Excel/JSON export flow চালান। এরপর দ্বিতীয় organization দিয়ে cross-user এবং cross-organization denial পরীক্ষা করুন। Reviewer invite accept/decline/expiry/revoke এবং reviewer scope পরীক্ষা করুন।

### ধাপ ২ — Supabase migration preparation

প্রথমে PostgreSQL schema mapping ও Auth identity design লিখিতভাবে approve করুন। এরপর `supabase/migrations/`-এ versioned SQL তৈরি করে empty Supabase project-এ non-production apply করুন। Organization, assessment owner, reviewer assignment, private AI-system এবং evidence access-এর RLS matrix তৈরি করুন।

### ধাপ ৩ — Supabase Auth decision

দুটি পথের একটি বেছে নিতে হবে: Manus OAuth সাময়িকভাবে রেখে PostgreSQL migration করা, অথবা Supabase Auth-এ registration/login/logout/session/password reset সম্পূর্ণ migrate করা। দুই provider একসঙ্গে চালু করে unapproved dual-write করবেন না।

### ধাপ ৪ — release QA

Desktop/tablet/390px mobile walkthrough, keyboard-only navigation, visible focus, screen-reader labels, dialog/table/live-region review এবং Bengali PDF/Excel visual review করুন। Qualified Bangladesh legal, banking/NBFI, health, education, telecom, public-administration এবং accessibility reviewers দিয়ে control/source mapping review করান।

## GitHub sync tutorial

```bash
git clone https://github.com/globalsouthaipolicycoalition/bangladesh-ai-governance-phase1.git
cd bangladesh-ai-governance-phase1
git checkout main
git pull --ff-only origin main
```

Feature কাজের জন্য fork বা collaborator access ব্যবহার করুন:

```bash
git checkout -b feature/your-change
# change files
git add .
git commit -m "Describe the change"
git push -u origin feature/your-change
```

`.env`, database password, OAuth secret, Supabase service-role key এবং storage credentials commit করবেন না।

## Supabase CLI tutorial

Supabase CLI দিয়ে account login এবং project link করার standard command:

```bash
supabase login
supabase link --project-ref ytjuewyomyswvgnibqeq
```

Migration folder তৈরি না হওয়া পর্যন্ত application-এ Supabase connection switch করবেন না। Migration থাকলে feature branch-এ পরিবর্তন করে local/disposable database-এ পরীক্ষা করুন, তারপর Pull Request করুন।

## Local validation tutorial

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
pnpm run catalog:verify:bangladesh
pnpm build
```

Current clean validation result: check pass, ৫৯ tests pass, ৪ staging tests skipped, catalogue ১৬ controls/৮ sources valid, build pass. Skipped staging testsকে pass হিসেবে গণনা করা যাবে না।

## Final release boundary

বর্তমান system-কে বলা যাবে: **feature-rich source/preview baseline**। বলা যাবে না: fully production-ready, legally compliant, government-approved, ISO-certified বা independently assured. Production deployment, live database mutation, destructive migration এবং Supabase Auth replacement এখনো explicit approval ও staging evidence ছাড়া করা যাবে না।

## Reusable instruction

পরবর্তী কোনো account/project connect করতে বলুন:

> এই repository-র feature audit ও Supabase–GitHub connection standard অনুসরণ করে access, project reference, migrations, protected secrets এবং environment separation verify করো। Current MySQL/Manus runtime না ভেঙে আগে staging evidence তৈরি করো; explicit approval ছাড়া production deploy, destructive migration বা Auth replacement করো না।

## Official references

- [Supabase GitHub Integration](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Supabase Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Project feature status](https://github.com/globalsouthaipolicycoalition/bangladesh-ai-governance-phase1)
