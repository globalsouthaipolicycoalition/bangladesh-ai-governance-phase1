# Vercel-এ deploy ও update করার নির্দেশিকা

## সংক্ষেপে

এই source-এ Vercel-এর জন্য কিছু গুরুত্বপূর্ণ অংশ আগে থেকেই আছে: `vercel.json`, Vite-এর static build, `/api/[...path].ts` serverless entrypoint এবং Express backend। এটি Vercel-এ deploy-ready কাঠামোর দিকে এগোনো, কিন্তু **এখনই পূর্ণ production-ready নয়**। বর্তমান login Manus OAuth এবং data layer MySQL/Drizzle-এর উপর নির্ভরশীল। Manus project-এর runtime credentials ও managed database স্বয়ংক্রিয়ভাবে Vercel-এ যায় না। Vercel-এ কাজ করাতে আলাদা, অনুমোদিত environment variables, OAuth configuration এবং database সংযোগ লাগবে। Supabase migration এখনো করা হয়নি।

## Vercel-এ deploy করার আগে

1. ZIP extract করে project-টি আপনার নিজের GitHub account-এ private repository হিসেবে রাখুন। ZIP-এ Git history নেই; `git init`, initial commit এবং GitHub-এ push আপনাকেই করতে হবে। ZIP download কোনো GitHub account-এ স্বয়ংক্রিয় connection তৈরি করে না।
2. Vercel-এ **Add New Project → Import Git Repository** দিয়ে repository import করুন। Root Directory repository root রাখুন; Framework Vite, Install Command `corepack enable && pnpm install --frozen-lockfile`, Build Command `pnpm build:vercel`, Output Directory `dist/public`। এগুলো project-এর `vercel.json`-এ আগেই সংজ্ঞায়িত।
3. Vercel-এর Preview ও Production environment আলাদা রাখুন। প্রথমে Preview-তে non-production database ও OAuth callback configuration যাচাই করুন; Production domain-এ যাওয়ার আগে data, roles, evidence storage ও OAuth return URL যাচাই আবশ্যক।
4. Environment variables শুধু Vercel Project Settings-এর protected Environment Variables-এ দিন। `.env` file, Git, ZIP, browser code বা logs-এ secret দেবেন না।

### বর্তমান server runtime-এর environment dependency

Variable-এর মান এখানে লিখবেন না। সঠিক values অনুমোদিত provider/project থেকে নিন এবং Vercel-এর secure settings-এ বসান।

- আবশ্যক authentication/session values: `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `MANUS_OAUTH_API_URL`। Manus OAuth ব্যবহার করতে না চাইলে এগুলো deploy করলেই কাজ হবে—এমন ধরে নেবেন না; তখন Auth integration-কে পরবর্তী অনুমোদিত Supabase phase-এ বদলাতে হবে।
- আবশ্যক database value: `DATABASE_URL`—Vercel-compatible, আলাদা non-production/production MySQL database connection হিসেবে নির্বাচন করুন। Manus-এর shared managed database URL কপি করবেন না। `drizzle/schema.ts` ও `drizzle/` migration chain অনুসারে অনুমোদিত target-এ schema তৈরি/প্রয়োগ এবং connection/pooling behavior যাচাই দরকার।
- feature অনুযায়ী: `OWNER_OPEN_ID` (admin bootstrap), `APP_PUBLIC_ORIGIN` (canonical HTTPS public origin), `RESEND_API_KEY` ও `EMAIL_FROM` (reviewer email), `MANUS_API_URL` ও `MANUS_API_KEY` (Manus platform storage/LLM/map/notification proxy ব্যবহার করা code path-গুলোর জন্য)। কোন feature ব্যবহার হবে না তা যাচাই না করে optional variables-কে required ধরে নেবেন না।
- OAuth provider/project-এ redirect/callback URI হিসেবে `https://আপনার-ডোমেইন/api/oauth/callback` নিবন্ধন করতে হবে। Vercel Preview domain-গুলোর জন্য আলাদা callback support আছে কি না provider-এর সাথে নিশ্চিত করুন।

> বর্তমান code path Manus OAuth-এর উপর নির্ভর করে; “login একেবারে শেষে করব” মানে ওই সময়ের আগে protected assessment/reviewer/organization flows নিরাপদে live ব্যবহারযোগ্য হবে না। Login/Auth এবং API-কে বাদ দিয়ে শুধু public UI preview করা যায়, কিন্তু সেটা সম্পূর্ণ কার্যকর production system নয়। পরে Supabase Auth/PostgreSQL-এ যাওয়ার আগ পর্যন্ত Manus auth/database রেখে চললে Vercel environment-এ সেই provider ও data service-এর অনুমোদিত, test করা configuration থাকতে হবে।

## আপডেট যোগ ও Production-এ ছাড়ার পদ্ধতি

ZIP-এ `.github/workflows/quality.yml` নামে একটি CI workflow আছে। GitHub-এ push বা pull request হলে এটি Node 22/pnpm 10.18 দিয়ে frozen-lockfile install, typecheck, tests এবং Vercel frontend build চালাবে। CI pass না হলে Production branch-এ merge করবেন না। এটি নিজে Vercel-এ deploy করে না।

Vercel-এর Git integration যুক্ত হলে প্রতিটি branch/PR-এ Preview deployment তৈরি হয়; configured Production branch-এ merge/push হলে Production deployment তৈরি হয়। প্রস্তাবিত নিয়ম:

1. Issue/feature branch তৈরি করুন, পরিবর্তন করুন এবং local-এ `pnpm check`, `pnpm test`, `pnpm build:vercel` চালান। Database-mutating test শুধু disposable staging-এ চালাবেন।
2. Branch push করে GitHub pull request খুলুন। CI pass হলে Vercel Preview URL-এ UI ও integration যাচাই করুন। Preview-র database variables non-production রাখুন।
3. Review ও approval-এর পরে PR-টি `main` (অথবা Vercel-এ বেছে নেওয়া Production branch)-এ merge করুন। Vercel Production deployment স্বয়ংক্রিয়ভাবে চালাবে।
4. Deployment-এর পরে health (`/api/health`), route manifest, login callback, protected routes, data writes, evidence storage এবং logs যাচাই করুন। ব্যর্থ হলে Vercel deployment history থেকে আগের good deployment-এ rollback করুন; database migration rollback আলাদা করে পরিকল্পনা করতে হবে।
5. ছোট পরিবর্তনও Git commit/PR দিয়ে করুন; dashboard-এ production-এ সরাসরি code edit বা অরক্ষিত manual patch এড়ান।

বর্তমানে project-এর Git remote Manus-managed, GitHub নয়; এখানে কোনো GitHub account/repository বা Vercel project link করা হয়নি। সুতরাং automated Preview/Production deployment চালু করতে GitHub-এ repository import/push এবং Vercel-এ সেটি connect করা user-side prerequisite। ZIP-টি portable source handoff—এটি নিজে live URL বা automatic deployment setup তৈরি করে না।

## Authentication/API শেষে করার প্রস্তাবিত কাজের ধারা

Public pages ও responsive UI, Observatory display, forms, empty/loading/error states, admin/reviewer screens, data model/interfaces এবং mock/staging adapters প্রথমে সম্পূর্ণ করা যেতে পারে। API contract-কে পরিষ্কার interface-এ রাখুন যাতে পরে MySQL/Manus API বা Supabase backend connect করা যায়। তবে auth/API না থাকলে বাস্তব authorization, data persistence, reviewer isolation, evidence storage, reports, email এবং security acceptance যাচাই সম্ভব নয়। সেগুলো fake/mock করে “100% complete” বলা যাবে না। তাই দুটি আলাদা gate রাখুন:

- **UI/feature-complete preview:** API/Auth mock বা non-production test adapter দিয়ে interface review করা যাবে; কোনো real private data নয়।
- **Secure full-system release:** approved auth, database/API, migration, permissions ও staging end-to-end test pass না করা পর্যন্ত Production ব্যবহারকারীর জন্য চালু নয়।

## বর্তমান অবস্থা

`vercel.json`, Vercel Function adapter, CI quality workflow ও এই guide source package-এ আছে। Vercel account-এ project import, GitHub link, environment variable setup, database provisioning, callback registration, actual Vercel build/deploy, এবং user-acceptance verification এখনো করা হয়নি। কোনো deployment এই কাজের অংশ হিসেবে চালু করা হয়নি।

## অফিসিয়াল তথ্যসূত্র

- [Vercel: Express deployment](https://vercel.com/docs/frameworks/backend/express) — Express app একটি Vercel Function হিসেবে চালানো যায়; static assets `public/` থেকে পরিবেশন করতে হয়।
- [Vercel: Vite deployment](https://vercel.com/docs/frameworks/frontend/vite) — Vite SPA deep links-এর rewrite দরকার এবং Vercel Git integration Preview deployment দিতে পারে।
- [Vercel: Git deployments](https://vercel.com/docs/git) — branch pushes/PR Preview এবং Production branch merge/push deployment workflow।
- [Vercel: database connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions) — serverless function-এ pooled connections/idle connection handling বিবেচনা করতে হবে।
