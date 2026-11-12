# Bangladesh AI Observatory — সম্পূর্ণ Project Status ও বাকি TODO

**পর্যালোচনার তারিখ:** ১২ নভেম্বর ২০২৬  
**বর্তমান catalogue version:** `BD-0.3-provisional`  
**Project অবস্থান:** source-only project; কোনো production deployment বা production database mutation করা হয়নি।

## Project-এ বর্তমানে যা আছে

### Readiness Assessment

Assessment creation, Bangladesh organization context, profile/posture, division/district/locality fields, deterministic 0–4 control response, response notes, evidence status, progress/scoring, submission lock, findings, action items, workspace dashboard, reviewer assignment, and JSON/PDF/Excel export আছে। নতুন update-এ response autosave এবং linked organization-এর owner/admin/contributor-এর জন্য role-based co-edit আছে; final submission assessment owner-ই করবেন। Action-item tracker-এ assignee, priority, deadline ও status আছে। Assessment, questionnaire, workspace, review, admin, Observatory, private AI registry এবং invitation routes route manifest-এ রয়েছে।

### Bangladesh context ও control catalogue

বাংলাদেশের division, district, organization type, employee band, data residency, primary language, sector profile এবং evidence examples আছে। Bangladesh library এখন ১৬টি provisional control এবং ৮টি source record নিয়ে গঠিত। Banking/NBFI, payments/fintech, healthcare, pharmaceuticals, public health, education, research, telecom, government/public services, local government, public body, SME/startup এবং cross-sector taxonomy আছে।

প্রতিটি control-এ English/Bangla title, objective, evidence description, normalized sectors, primary lifecycle stage, expanded lifecycle stages, criticality, weight, risk/materiality gate, structured minimum evidence, source references, version, effective date, review date, review due date, change owner, reviewer note, lifecycle state এবং assessment-mapping disclaimer আছে। সব control এখনও `in_review`; কোনোটি legal requirement, government approval, certification বা independent assurance হিসেবে প্রকাশ করা হয়নি।

### Risk, lifecycle ও evidence rules

প্রতিটি control-এর জন্য risk/materiality triggers আছে: regulated entity, high-impact decision, sensitive data, essential service, third-party dependency, public-service exposure, external exposure, large-scale use এবং research-participant impact। Lifecycle coverage design থেকে deployment, operations, material change, incident response এবং retirement পর্যন্ত বাড়ানো হয়েছে। Minimum evidence হিসেবে accountable owner, risk assessment, decision rights, qualified review, audit log এবং remediation closure বাধ্যতামূলক করা হয়েছে; control type অনুযায়ী data, testing, monitoring, incident, notice/appeal, supplier, continuity, access/retention এবং training evidence যোগ হয়।

### Observatory ও private AI-system registry

Public Observatory source-linked published observations দেখায়। Admin source, indicator, observation create/update/status controls আছে। নতুন CSV import-এ সর্বোচ্চ ২০০ সারি/১ MiB preview করে নির্বাচিত active source-এর অধীনে draft হিসেবে আমদানি করা যায়; server-side validation ব্যর্থ হলে কোনো row-ই insert হয় না। একই numeric indicator-এর date ও source অনুযায়ী comparative trend chart আছে। Private AI-system registry authenticated এবং organization/assessment scoped; create, list, detail, update, retire, search/filter এবং risk/lifecycle/impact fields আছে। Public Observatory এবং private registry আলাদা query path ব্যবহার করে।

### Organization, reviewer ও security

Manus OAuth/session, protected tRPC procedures, organization membership/roles, owner/admin permissions, reviewer scope checks, assessment ownership checks, evidence URL/MIME/signature/size validation, invite rate limiting, member-change rate limiting, audit events এবং organization isolation checks আছে। Reviewer metadata-এর internal assignment fields আছে: role, expertise, sector experience, Bangladesh jurisdiction familiarity, language capability, conflict declaration এবং independence status।

### Incident reporting ও response

প্রমাণীকরণ-সুরক্ষিত `/incidents` কর্মপ্রবাহে প্রতিষ্ঠানভিত্তিক প্রতিবেদন, reporter/অনুমোদিত manager access, investigation/response, assignment, note/comment/file audit timeline এবং Bangla/English UI আছে। Reporter বা authorized manager সর্বোচ্চ ১০ MiB PDF/JPEG/PNG/GIF/WebP/TXT/DOC(X)/XLS(X) upload করতে পারেন; server MIME/signature যাচাই করে, random scoped storage key রাখে এবং authorized access check-এর পর temporary signed download link দেয়। Link issuance audit হয়, signed URL/key সংরক্ষণ হয় না; actual file fetch provider access log ছাড়া audit হয় না। Malware scan নেই। Additive migration `0008`/`0009`/`0010` generate/check হয়েছে, apply হয়নি; authenticated staging ও real storage integration বাকি।

### Reports, localization ও accessibility foundations

English, Bangla এবং bilingual PDF/Excel export আছে; Bengali font bundled আছে। Report filename standardized, worksheet/header labels localized, JSON export-এ stable schema metadata আছে, report language local storage-এ persisted হয়। Assessment, questionnaire, workspace, review, admin, Observatory, AI-system registry/detail, auth/loading এবং incident-এর static UI copy-তে English/Bangla toggle ও localized labels যুক্ত হয়েছে। API-provided error, user/record content, কিছু taxonomy value এবং Bangla export-এর visual review এখনো বাকি।

### Documentation ও verification

Product scope, data contracts, permissions, validation rules, integration points এবং acceptance criteria document আছে। Bangladesh control-by-control sector review document আছে। Rules 1–4 implementation record আছে। TypeScript check, catalogue verification, automated tests এবং production build pass করেছে।

## Validation ফলাফল

- `pnpm check`: passed
- `pnpm catalog:verify:bangladesh`: passed — ১৬ controls, ৮ sources
- `pnpm test`: passed — ৪৭ tests; ৩ authenticated staging tests skipped
- `pnpm build`: passed
- Existing Vite warning: `/api/platform/config.js` script-এ `type="module"` নেই; build fail করে না
- `pnpm exec drizzle-kit check`: dummy local URL ব্যবহার করে pass; database-এ কোনো সংযোগ বা mutation হয়নি

## এখনও যেগুলো বাকি

### এখনো source-code-এ সম্পূর্ণ নয়

1. External reviewer invitation-এ reviewer metadata carry-through, display, conflict/independence enforcement, revoke/resend/expiry management সম্পূর্ণ নয়।
2. Static UI Bangla coverage বহু route-এ যোগ হয়েছে; তবে server/API error messages, user/record-supplied values, কিছু rare taxonomy এবং Bangla PDF/Excel visual review বাকি।
3. Incident source workflow, private file-evidence upload/download endpoints, signed-link audit, additive migrations `0008`/`0009`/`0010` এবং regression tests তৈরি হয়েছে; approved staging-এ migration apply, authenticated cross-tenant tests, body-size checks এবং real storage integration বাকি।
4. Report-এ reviewer metadata এবং সব translated findings/status/severity/value field পুরোপুরি যুক্ত করা বাকি।
5. Bangladesh sources-এর legal review status এখনো `not_reviewed`; sector-specific authoritative source-এর pinpoint passage, effective status এবং qualified reviewer record যোগ করা বাকি।
6. Team collaboration এখন organization-role ভিত্তিক whole-assessment co-edit; control/department অনুযায়ী পৃথক প্রশ্ন assignment বা merge workflow এখনো নেই।

### Manual বা secure environment ছাড়া সত্যভাবে শেষ করা যায় না

1. Desktop/tablet/390px mobile responsive walkthrough সব page-এ করা বাকি।
2. Keyboard-only, focus order, visible focus, screen-reader labels, dialogs, tables, live regions এবং assistive-technology audit করা বাকি।
3. Bangla PDF glyph, wrapping, page break এবং Bangla/bilingual Excel visual inspection করা বাকি।
4. Disposable staging MySQL/TiDB database এবং আলাদা owner/reviewer identities দিয়ে authenticated E2E চালানো বাকি।
5. Evidence upload/storage/signed download, cross-user denial, cross-organization denial, member revocation, invite decline/expiry/revoke/completion, email fallback এবং export download staging-এ যাচাই করা বাকি।
6. Qualified Bangladesh legal, banking/NBFI, health, education, telecom, public-administration এবং accessibility reviewer দিয়ে controls review করা বাকি।
7. কোনো control-কে `approved` বা `published` করা যাবে না যতক্ষণ না সংশ্লিষ্ট qualified review record নেই।

### Owner approval এবং credentials প্রয়োজন

GitHub private repository, branch protection, Vercel Preview/Production, OAuth callback, environment variables, email/storage configuration, custom domain, Supabase project, Supabase Auth/PostgreSQL migration, production deployment এবং destructive migration করা হয়নি। এসবের জন্য user-এর explicit approval, secure credential flow এবং non-production verification দরকার।

## Safe release decision

বর্তমান project-টি **feature-rich source/preview baseline** হিসেবে ব্যবহারযোগ্য। এটি **fully production-verified, legally compliant, government-approved, ISO-certified বা independently assured নয়**। Bangladesh catalogue-টি **provisional assessment mapping library**, legal requirement library নয়।

## Recommended next order

প্রথমে staging database ও দুইটি আলাদা test identity secureভাবে provision করতে হবে। এরপর authenticated E2E ও cross-tenant security tests চালাতে হবে। একই সময়ে qualified sector/legal reviewers দিয়ে source mappings review করতে হবে। তারপর manual responsive/accessibility/Bangla export audit করতে হবে। সব acceptance evidence মিলে গেলে তবেই controls-এর lifecycle review এবং Preview deployment বিবেচনা করা যাবে; Production publish বা Supabase migration এখনো করা উচিত নয়।
