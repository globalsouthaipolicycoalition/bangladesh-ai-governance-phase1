import { ArrowLeft, Database, FileCheck2, Layers3, LockKeyhole, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";
import AdminDataWorkbench from "../components/AdminDataWorkbench";

export default function Admin() {
  const { isBangla, toggleLocale } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const me = trpc.auth.me.useQuery();
  const isAdmin = me.data?.role === "admin";
  const overview = trpc.admin.overview.useQuery(undefined, { enabled: isAdmin });

  if (me.isLoading) return <main className="admin-main container" role="status">{t("Checking administrator access…", "অ্যাডমিন access যাচাই হচ্ছে…")}</main>;
  if (!isAdmin) return <main className="admin-main container" role="alert"><h1>{t("Administrator access required", "অ্যাডমিন access প্রয়োজন")}</h1><p>{t("This control plane is restricted to site administrators. Organization-private records remain available only through their tenant-scoped workflows.", "এই control plane শুধু site administrator-এর জন্য। Organization-private record শুধু tenant-scoped workflow থেকেই পাওয়া যাবে।")}</p><Link href="/" className="button button-dark">{t("Back to platform", "প্ল্যাটফর্মে ফিরুন")}</Link></main>;
  if (overview.isLoading) return <main className="admin-main container" role="status">{t("Loading verified admin metrics…", "যাচাইকৃত admin metric লোড হচ্ছে…")}</main>;
  if (overview.error || !overview.data) return <main className="admin-main container" role="alert"><h1>{t("Admin overview unavailable", "Admin overview অনুপলব্ধ")}</h1><p>{overview.error?.message ?? t("No overview data was returned.", "কোনো overview data পাওয়া যায়নি।")}</p></main>;

  const data = overview.data;
  return <div className="admin-shell">
    <header className="assessment-header container"><Link href="/" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>{t("Bangladesh AI Readiness Assessment", "বাংলাদেশ AI প্রস্তুতি মূল্যায়ন")}</strong></Link><div className="assessment-header-right"><span className="assessment-version">{t("ADMIN / DATA STEWARDSHIP", "প্রশাসন / ডেটা পরিচালনা")}</span><button className="language-button" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button><Link href="/" className="close-link">{t("Back to platform", "প্ল্যাটফর্মে ফিরুন")} <ArrowLeft size={15} /></Link></div></header>
    <main className="admin-main container">
      <div className="eyebrow"><span className="eyebrow-index">{t("ADMINISTRATION / GAAF 1.0", "প্রশাসন / GAAF ১.০")}</span></div>
      <div className="admin-heading"><div><h1>{t("Keep the data", "তথ্যকে রাখুন")} <em>{t("auditable.", "নিরীক্ষাযোগ্য।")}</em></h1><p>{t("The current admin workbench edits public Observatory catalogue data and retains a reasoned before/after history. It does not grant access to organization-private assessments, AI-system records, incidents or evidence.", "বর্তমান admin workbench public Observatory catalog সম্পাদনা করে এবং কারণসহ before/after history রাখে। এটি organization-private assessment, AI-system record, incident বা evidence দেখার access দেয় না।")}</p></div><span className="admin-lock"><LockKeyhole size={16} /> {t("Site admin only", "শুধু site admin")}</span></div>
      <div className="admin-metrics">
        <div><span>{t("CORE DOMAINS", "মূল ক্ষেত্রসমূহ")}</span><strong>{data.domains}</strong><small>{t("Database records", "ডেটাবেস রেকর্ড")}</small></div>
        <div><span>{t("CONTROL RECORDS", "কন্ট্রোল রেকর্ড")}</span><strong>{data.controls}</strong><small>{t("Global catalogue records", "বৈশ্বিক catalog record")}</small></div>
        <div><span>{t("ASSESSMENTS", "মূল্যায়ন")}</span><strong>{data.assessments}</strong><small>{t("Aggregate count only", "শুধু মোট সংখ্যা")}</small></div>
        <div><span>{t("EVIDENCE ITEMS", "প্রমাণের উপাদান")}</span><strong>{data.evidence}</strong><small>{t("Aggregate count only", "শুধু মোট সংখ্যা")}</small></div>
      </div>
      <div className="admin-grid">
        <section className="admin-panel"><div className="admin-panel-head"><div><span className="card-kicker">{t("CONTROL LIBRARY", "নিয়ন্ত্রণের সংগ্রহ")}</span><h2>{t("Global assessment catalogue", "বৈশ্বিক assessment catalog")}</h2></div><SlidersHorizontal size={19} /></div><div className="admin-list"><div><span className="admin-icon"><Layers3 size={16} /></span><div><strong>{t("Core domains", "মূল ক্ষেত্রসমূহ")}</strong><small>{t("Definitions are currently seeded from the application catalogue.", "সংজ্ঞাগুলো বর্তমানে application catalog থেকে seed করা হয়।")}</small></div><b>{data.domains}</b></div><div><span className="admin-icon"><Database size={16} /></span><div><strong>{t("Global controls", "বৈশ্বিক control")}</strong><small>{t("No site-admin editing workflow yet; changes must not alter historical assessment semantics.", "এখনো site-admin editing workflow নেই; পরিবর্তনে পুরোনো assessment semantics বদলানো যাবে না।")}</small></div><b>{data.controls}</b></div><div><span className="admin-icon"><FileCheck2 size={16} /></span><div><strong>{t("Bangladesh control annex", "বাংলাদেশি control annex")}</strong><small>{t("16 provisional controls remain unscored and in review.", "১৬টি provisional control এখনো unscored ও review অবস্থায়।")}</small></div><b>{t("Review", "পর্যালোচনা")}</b></div></div></section>
        <section className="admin-panel"><div className="admin-panel-head"><div><span className="card-kicker">{t("QUALITY SIGNAL", "গুণমানের নির্দেশক")}</span><h2>{t("Assurance activity", "নিশ্চয়তা কার্যক্রম")}</h2></div><ShieldAlert size={19} /></div><div className="admin-quality"><div><strong>{data.findings}</strong><span>{t("aggregate open findings", "মোট অমীমাংসিত finding")}</span></div><div><strong>GAAF-1.0</strong><span>{t("current global methodology label", "বর্তমান global methodology label")}</span></div><p>{t("Counts shown here are aggregate metrics. Individual assessment, evidence and finding records remain tenant-scoped. Scoring remains deterministic; no Bangladesh control has been promoted to the score.", "এখানে শুধু aggregate metric দেখানো হয়। পৃথক assessment, evidence ও finding tenant-scoped থাকে। স্কোর পূর্বনির্ধারিত; কোনো Bangladesh control score-এ উন্নীত হয়নি।")}</p></div></section>
      </div>
      <AdminDataWorkbench />
      <div className="admin-disclaimer"><LockKeyhole size={15} /><span>{t("Legal applicability, certification and independent assurance remain separate expert-reviewed layers.", "আইনি প্রযোজ্যতা, সনদায়ন ও স্বাধীন নিশ্চয়তা বিশেষজ্ঞ-পর্যালোচিত পৃথক স্তর হিসেবে থাকবে।")}</span></div>
    </main>
  </div>;
}
