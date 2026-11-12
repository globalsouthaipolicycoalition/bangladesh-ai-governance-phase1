# যোগ করা ফিচার — ১২ নভেম্বর ২০২৬

## ১. Observatory CSV import

Admin panel-এ CSV ফাইল বেছে নিলে import-এর আগে row preview দেখা যায়। একটি active source নির্বাচন করে import করতে হয়। প্রতি ফাইলে সর্বোচ্চ ২০০টি data row এবং ১ MiB অনুমোদিত। CSV-তে `indicator_code`, `observation_date`, `methodology_version` এবং `value` বা `value_label`-এর ঠিক একটি থাকতে হবে; `period_label` ও `notes` ঐচ্ছিক। সব row server-side validate হয় এবং একটিও invalid হলে batch import হয় না। সফল import সব observation-কে unpublished draft হিসেবে রাখে—admin আলাদাভাবে যাচাই ও publish করবেন। Template button থেকে sample CSV পাওয়া যাবে।

## ২. Observatory comparison chart

একটি numeric indicator নির্বাচন করে তার historical values-কে date ও source publisher অনুযায়ী রেখাচিত্রে তুলনা করা যায়। একক না মেলা indicator একসঙ্গে তুলনা করা হয় না; missing dates interpolate করা হয় না।

## ৩. Assessment team collaboration ও autosave

Assessment কোনো organization-এর সঙ্গে যুক্ত থাকলে active `owner`, `admin` ও `contributor` সদস্যরা open assessment response সম্পাদনা করতে পারেন; `member` ও reviewer read-only। Response পরিবর্তনের প্রায় ০.৯ সেকেন্ড পরে স্বয়ংক্রিয় save হয়, এবং save status UI-তে দেখা যায়। জমা দেওয়া/পর্যালোচনাধীন assessment locked থাকে; final submit কেবল assessment owner করতে পারেন। Save event-এ response-এর মান নয়, শুধু কতগুলো response সংরক্ষণ হয়েছে তা audit event-এ লেখা হয়।

বর্তমান collaboration পুরো assessment-এ organization-role ভিত্তিক; বিভাগ বা control ধরে আলাদা assignee/response merge workflow অন্তর্ভুক্ত করা হয়নি।

## ৪. Action-item tracking

Workspace-এ করণীয় কাজ তৈরি করে সক্রিয় organization member-কে দায়িত্ব দেওয়া যায়; priority, due date ও status (`planned`, `in_progress`, `blocked`, `done`) রাখা যায়। Status/assignment পরিবর্তনের audit event সংরক্ষিত হয়। কেবল assessment owner বা অনুমোদিত organization manager কাজ তৈরি/হালনাগাদ করতে পারেন।

## ৫. Incident report evidence file upload

`/incidents`-এ reporter বা অনুমোদিত organization manager সর্বোচ্চ ১০ MiB-এর PDF, JPEG, PNG, GIF, WebP, TXT, DOC/DOCX বা XLS/XLSX ফাইল যুক্ত করতে পারেন। Server MIME ও file signature যাচাই করে, upload rate limit করে এবং random organization/incident-scoped storage key ব্যবহার করে; key client-এ প্রকাশ হয় না। Access check পাস করলে temporary signed download URL দেওয়া হয় এবং link issuance audit timeline-এ লেখা হয়—signed URL বা key সেখানে রাখা হয় না। Migration `0009` file metadata table/index এবং `0010` audit event enum যোগ করে; দুটিই generated/check করা, apply করা হয়নি।

**সতর্কতা:** file malware-scanned নয়। পাসওয়ার্ড, গোপন তথ্য বা অপ্রয়োজনীয় ব্যক্তিগত তথ্য দেবেন না। Link issuance audit হয়, actual object fetch নয়; provider access log ছাড়া কে file download করেছে তা জানা যায় না। Storage write-এর পর DB write ব্যর্থ হলে orphan file থাকতে পারে। Migration `0008`–`0010` approved staging-এ যাচাই/apply করা বাকি; authenticated multi-tenant storage E2E এখনো হয়নি।

## যাচাই

- `pnpm check` — সফল
- Bangladesh catalog verification — সফল: ১৬টি control, ৮টি source
- `pnpm test` — ৪৭টি passed, ৩টি authenticated staging test skipped
- `pnpm build` — সফল; বিদ্যমান Vite classic-script warning রয়ে গেছে
- `drizzle-kit check` — সফল; কেবল dummy local URL ব্যবহার, কোনো DB connection বা migration apply হয়নি
- Authenticated multi-tenant storage E2E, real object storage integration এবং browser-ভিত্তিক manual accessibility যাচাই বাকি
