
## Expanded Assessment + Observatory backlog increment

এই increment-এ সরাসরি implement করা হয়েছে:

- Admin Observatory indicator form-এ sector, geographic coverage, data type, baseline/current/target fields
- Admin source form-এ freshness window এবং quality threshold policy fields
- Public Observatory JSON export এবং CSV export
- Assessment workspace-এ একই organization/account-এর prior assessment comparison panel
- Reviewer workspace-এ pending Not Applicable request-এর rationale দেখা এবং full/domain reviewer-এর accept/reject action
- Review API ও database update path-এ applicability reviewer, timestamp এবং review event support
- Observatory source policy schema এবং migration

নতুন migration: `0015_kind_jack_flag.sql`

Validation:
- `pnpm check`: pass
- `pnpm test -- --run`: ৫৫ pass, ৩ authenticated staging test skipped
- `pnpm build`: pass
- offline `drizzle-kit check`: pass
- Bangladesh catalog verification: pass — ১৬ controls, ৮ sources

এখনও ইচ্ছাকৃতভাবে database apply করা হয়নি। Legal/sector mapping review, malware scanner integration, real storage E2E, manual PDF/Excel QA, independent research databases এবং production deployment আলাদা পরবর্তী increment।
