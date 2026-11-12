# Bangladesh AI Governance Platform — চলমান কাজ ও বাকি TODO

**হালনাগাদের তারিখ:** ১২ নভেম্বর ২০২৬  
**এই নথির উদ্দেশ্য:** এই source increment-এ যা বাস্তবে যোগ হয়েছে এবং এখনো যা বাকি—দুটিই আলাদা করে জানানো। এটি production readiness, আইনগত অনুমোদন বা deploy সম্পন্ন হওয়ার দাবি নয়।

## এই increment-এ সম্পন্ন

- Assessment তৈরির সময় স্থিতিশীল primary-sector নির্বাচন ও বাংলা/ইংরেজি label দেখানোর ব্যবস্থা আছে। Bangladesh-এর বর্তমান provisional controls আলাদা, read-only, unscored annex-এ দেখানো হয়। sector mapping না থাকলে “global baseline only” বলে; নতুন sector-এ control coverage আছে বলে অনুমান করে না।
- `/admin`-এ site-admin-only public Observatory workbench যোগ হয়েছে। এখানে public data-এর source ও indicator সম্পাদনা/deactivate, observation সংশোধন/archive/publish করা যায়। প্রতিটি পরিবর্তনে কারণ দিতে হয় এবং actor, সময়, action, কারণ ও before/after মান audit history-তে থাকে। Published data সংশোধন করলে পুনঃপর্যালোচনা ও republish না করা পর্যন্ত সংশ্লিষ্ট observation draft থাকে।
- Global Admin workbench থেকে organization-private assessment, AI-system record, private incident narrative/evidence বা survivor-sensitive data দেখা যায় না—নির্বাচিত access policy অনুযায়ী এগুলো tenant-scoped রাখা হয়েছে।
- `0011_admin_data_audit.sql` additive migration ও migration snapshot তৈরি হয়েছে; কোনো database-এ apply করা হয়নি।

## অগ্রাধিকারভিত্তিক বাকি TODO

### P0 — Admin থেকে সব system/catalog data পরিচালনা

বর্তমান Admin workbench কেবল public Observatory data-এর প্রথম slice; তাই “পুরো system-এর সব data Admin থেকে update করা যায়” এখনো সম্পন্ন নয়। পরবর্তী ধাপে versioned, audited admin authoring যোগ করতে হবে:

- Global GAAF domain/control catalog—draft/update, supersede, archive এবং reviewed approval/publish lifecycle; পুরোনো assessment-এর control text/version/score যেন বদলে না যায়, তাই snapshot ও historical reproducibility আগে নিশ্চিত করতে হবে।
- Bangladesh-এর ১৬টি provisional control ও ৮টি source, sector/control crosswalk, sector taxonomy, profile/domain-selection options এবং অন্য system-managed lists। পরিবর্তনগুলো database-backed হবে; কেবল code constant সম্পাদনা করে production-এ update হয়েছে এমন ভান করা যাবে না।
- ভবিষ্যৎ research-এর category, severity, verification scale এবং publication criteria—আলাদা data domain ও উপযুক্ত role/approval দিয়ে পরিচালনা করতে হবে।
- প্রত্যেক edit server-side admin authorization, কারণ, actor, timestamp, before/after audit এবং version history-সহ হবে। Published/history-bearing record hard-delete না করে supersede/archive করতে হবে। Admin-editable content আর authentication/security/audit invariants আলাদা রাখতে হবে।

### P0 — Sector/risk-ভিত্তিক assessment ও Not Applicable

- Sector, organization type/size, AI use case, materiality/risk এবং explicitly reviewed applicability data অনুযায়ী control selection তৈরি করতে হবে; catalogue order থেকে প্রথম N control নেওয়া যথেষ্ট নয়।
- প্রতিটি sector-এর AI risk, use case, governance expectation ও evidence requirement qualified review-সহ নির্ধারণ করতে হবে। Agriculture, energy/utilities, transport, manufacturing, retail, media, insurance ও legal/justice-এর option থাকা মানেই Bangladesh-specific coverage নয়।
- “Not Applicable” হলে কারণ আবশ্যক, reviewer-পর্যালোচনাযোগ্য এবং audit-যোগ্য হবে। Pending/rejected N/A যেন score উন্নত না করে; accepted N/A-এর denominator, finalization ও historical score semantics স্পষ্ট করতে হবে।
- Global control ও Bangladesh-specific control-এর reviewed crosswalk, approval/publish gate এবং versioned per-assessment control snapshot তৈরি করতে হবে।

### P0 — Bangladesh control lifecycle ও scoring gate

- বর্তমান ১৬টি Bangladesh control `in_review`/provisional; কোনোটি scored assessment-এ যুক্ত নয়। সেগুলো এখনো আইনি বাধ্যবাধকতা বা validated sector coverage নয়।
- qualified domain/legal reviewer, source/effective-date evidence, applicability/materiality gate, crosswalk এবং version snapshot অনুমোদনের আগে Bangladesh controls-কে score-এ তোলা যাবে না।
- Agriculture, energy, transportation, manufacturing, retail/e-commerce, media, insurance, legal/justice ইত্যাদি sector-এর control/use-case/evidence mapping qualified review-এর পরে যোগ করতে হবে; এখনকার taxonomic option-কে coverage হিসেবে দেখানো যাবে না।

### P0 — আলাদা public-interest incident research system

- বিদ্যমান `incident_reports` ও `incident_evidence` organization-private workflow; এগুলোকে national research database-এ রূপান্তর বা public করা যাবে না। নতুন schema/API/route ও permission boundary আলাদা লাগবে।
- Research intake, triage, source/evidence provenance, independent verification, dispute/correction, duplicate/corroboration, human approval ও publication history আলাদা ধাপে তৈরি করতে হবে।
- Severity (যেমন S0–S4) verification confidence/status থেকে আলাদা হবে। Raw intake/evidence নয়, কেবল অনুমোদিত de-identified record বা safe aggregate public view-তে যাবে। Researcher, verifier, reviewer ও publication editor-এর least-privilege roles লাগবে।

### P0 — Gender-based AI violence / survivor-protective workflow

এটি implement হয়নি। Survivor data ঝুঁকিপূর্ণ হওয়ায় সাধারণ incident/admin CRUD-এ তাড়াহুড়ো করে যোগ করা যাবে না। আগে safeguarding/threat-model review; data minimization; non-identifying optional intake; explicit consent/disclosure; সীমিত evidence access; child-safety; escalation guidance; retention/withdrawal/correction; de-identification এবং safe aggregate threshold নির্ধারণ করতে হবে। Survivor narrative কখনো স্বয়ংক্রিয়ভাবে public হবে না এবং general site-admin panel-এ প্রকাশ পাবে না।

### P1 — Observatory ও data stewardship আরও সম্পূর্ণ করা

- Indicator/observation-এ geography (যদি সংগ্রহ করা হয়), observation kind, source timestamp, method, confidence, independent verification, correction/duplicate lineage, filters, pagination এবং safe export যোগ করতে হবে। বর্তমানে location data সংগ্রহ করা হয় না এবং map illustrative।
- Admin audit history এখন শুধু Observatory public curation-এ scope করা। অন্য system catalog edit যোগ করলে একই কারণ/actor/before-after/version protections লাগবে। এটি private tenant record-এ blanket Admin access দেওয়ার অনুমতি নয়।

### P1/P2 — release ও staging gate

- Migrations `0008`–`0011` generated; disposable, অনুমোদিত staging database ও backup/rollback plan ছাড়া apply করা হয়নি। Production/shared database-এ এই task কোনো write করেনি।
- Authenticated staging-এ migration, role denial, cross-tenant access denial, correction/republication, audit immutability, storage permissions এবং failure/rollback পরীক্ষা করতে হবে। বর্তমানে ৩টি authenticated staging test skipped।
- Responsive/accessibility/Bangla report review এবং qualified Bangladesh sector/legal validation শেষ না হওয়া পর্যন্ত production-ready বা আইনগতভাবে অনুমোদিত দাবি করা যাবে না।

## এই increment-এ চালানো যাচাই

- `pnpm check` — pass.
- `pnpm test` — ৫২টি pass; ৩টি authenticated staging test skipped.
- `pnpm build` — pass.
- `pnpm catalog:verify:bangladesh` — pass; ১৬টি provisional control ও ৮টি source যাচাই.
- `drizzle-kit check` — migration journal/snapshot consistency pass; database connection/apply করা হয়নি।

**সারকথা:** এই ZIP-এ sector-context increment এবং audited public Observatory Admin slice আছে। কিন্তু সব system catalog Admin-সম্পাদনাযোগ্য নয়; sector/risk control selection, N/A, scored Bangladesh controls, national research incident database, verification/severity workflow এবং survivor-protective GBV workflow এখনো বাকি।
