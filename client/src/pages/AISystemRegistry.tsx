import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Activity, ArrowLeft, Plus, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";
import { AI_SYSTEM_DECISION_IMPACTS, AI_SYSTEM_LIFECYCLE_STATUSES, type AISystemDecisionImpact } from "@shared/aiSystems";
import "./ai-systems.css";

type RiskLevel = "low" | "moderate" | "high" | "critical";
type Lifecycle = typeof AI_SYSTEM_LIFECYCLE_STATUSES[number];
type DecisionImpact = AISystemDecisionImpact;
const risks: RiskLevel[] = ["low", "moderate", "high", "critical"];
const lifecycles = AI_SYSTEM_LIFECYCLE_STATUSES;
const impacts = AI_SYSTEM_DECISION_IMPACTS;
const emptyForm = { name: "", provider: "", purpose: "", decisionImpact: "" as DecisionImpact | "", humanOversight: "", riskLevel: "" as RiskLevel | "", lifecycleStatus: "" as Lifecycle | "" };
const label = (value: string, isBangla: boolean) => {
  const words = value.replaceAll("_", " ").toLowerCase();
  const bn: Record<string, string> = { low: "নিম্ন", moderate: "মাঝারি", high: "উচ্চ", critical: "সংকটপূর্ণ", unrated: "ঝুঁকি নির্ধারিত নয়", unspecified: "অনির্দিষ্ট", active: "সক্রিয়", proposed: "প্রস্তাবিত", pilot: "পরীক্ষামূলক", retired: "অবসরপ্রাপ্ত", development: "উন্নয়নাধীন", deployed: "স্থাপিত" };
  return isBangla ? (bn[words] ?? words) : words.replace(/\b\w/g, character => character.toUpperCase());
};

export default function AISystemRegistry() {
  const { isBangla, toggleLocale } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const params = new URLSearchParams(window.location.search);
  const [assessmentId, setAssessmentId] = useState(params.get("assessmentId") ?? "");
  const [organizationId, setOrganizationId] = useState(params.get("organizationId") ?? "");
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "">("");
  const [decisionImpact, setDecisionImpact] = useState<DecisionImpact | "">("");
  const [lifecycleStatus, setLifecycleStatus] = useState<Lifecycle | "">("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const contexts = trpc.agaras.aiSystems.contextOptions.useQuery();
  const input = useMemo(() => ({
    assessmentId: assessmentId ? Number(assessmentId) : undefined,
    organizationId: organizationId ? Number(organizationId) : undefined,
    search: search.trim() || undefined,
    riskLevel: riskLevel || undefined,
    decisionImpact: decisionImpact || undefined,
    lifecycleStatus: lifecycleStatus || undefined,
  }), [assessmentId, organizationId, search, riskLevel, decisionImpact, lifecycleStatus]);
  const list = trpc.agaras.aiSystems.list.useQuery(input);
  const utils = trpc.useUtils();
  const create = trpc.agaras.aiSystems.create.useMutation({
    onSuccess: async () => {
      setForm(emptyForm);
      setShowForm(false);
      setNotice(t("AI system record saved. It remains private to authorized users.", "এআই সিস্টেমের রেকর্ড সংরক্ষিত হয়েছে। এটি কেবল অনুমোদিত ব্যবহারকারীদের জন্য ব্যক্তিগত থাকবে।"));
      await utils.agaras.aiSystems.list.invalidate();
    },
  });
  const systems = list.data?.systems ?? [];
  const selectedAssessment = contexts.data?.assessments.find(item => String(item.id) === assessmentId);
  const parentSelected = Boolean(assessmentId || organizationId);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parentSelected) {
      setNotice(t("Select an assessment or organization before saving a system.", "সিস্টেম সংরক্ষণের আগে একটি মূল্যায়ন বা প্রতিষ্ঠান নির্বাচন করুন।"));
      return;
    }
    if (form.name.trim().length < 2) {
      setNotice(t("Enter a system name of at least 2 characters.", "কমপক্ষে ২ অক্ষরের সিস্টেমের নাম লিখুন।"));
      return;
    }
    create.mutate({
      assessmentId: assessmentId ? Number(assessmentId) : undefined,
      organizationId: organizationId ? Number(organizationId) : undefined,
      name: form.name.trim(),
      provider: form.provider.trim() || undefined,
      purpose: form.purpose.trim() || undefined,
      decisionImpact: form.decisionImpact || undefined,
      humanOversight: form.humanOversight.trim() || undefined,
      riskLevel: form.riskLevel || undefined,
      lifecycleStatus: form.lifecycleStatus || undefined,
    });
  };

  return (
    <main className="ai-registry">
      <header className="ai-registry-head"><button type="button" className="ai-back" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button>
        <Link href="/observatory" className="ai-back"><ArrowLeft size={16} /> {t("Public Observatory", "পাবলিক অবজারভেটরি")}</Link>
        <span className="ai-kicker">{t("PRIVATE ORGANIZATION REGISTER", "ব্যক্তিগত প্রতিষ্ঠান নিবন্ধন")}</span>
        <h1>{t("AI system inventory", "এআই সিস্টেম তালিকা")}</h1>
        <p>{t("Organization and assessment records are private to authorized users. These records are not published in the national Observatory.", "প্রতিষ্ঠান ও মূল্যায়নের রেকর্ড কেবল অনুমোদিত ব্যবহারকারীদের জন্য ব্যক্তিগত। এসব রেকর্ড জাতীয় অবজারভেটরিতে প্রকাশিত হয় না।")}</p>
      </header>

      {contexts.isLoading ? <p role="status">{t("Loading assessment and organization choices…", "মূল্যায়ন ও প্রতিষ্ঠানের বিকল্প লোড হচ্ছে…")}</p> : contexts.isError ? <p role="alert" className="ai-error">{t("Could not load context options: ", "প্রসঙ্গের বিকল্প লোড করা যায়নি: ")}{contexts.error.message}</p> : (
        <div className="ai-context">
          <label>{t("Assessment context", "মূল্যায়নের প্রসঙ্গ")}
            <select value={assessmentId} onChange={event => { setAssessmentId(event.target.value); setOrganizationId(""); }}>
              <option value="">{t("All / none selected", "সব / কিছু নির্বাচিত নয়")}</option>
              {contexts.data?.assessments.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <label>{t("Organization context", "প্রতিষ্ঠানের প্রসঙ্গ")}
            <select value={organizationId} onChange={event => { setOrganizationId(event.target.value); setAssessmentId(""); }}>
              <option value="">{t("All / none selected", "সব / কিছু নির্বাচিত নয়")}</option>
              {contexts.data?.organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {selectedAssessment?.organizationId && <p className="ai-context-note">{t("This assessment is already linked to its organization; the server checks that relationship.", "এই মূল্যায়নটি ইতিমধ্যে প্রতিষ্ঠানের সঙ্গে যুক্ত; সার্ভার সেই সম্পর্ক যাচাই করে।")}</p>}
        </div>
      )}

      <section className="ai-stats" aria-label={t("Private inventory statistics", "ব্যক্তিগত তালিকার পরিসংখ্যান")}>
        <article><span>{t("Accessible records", "অভিগম্য রেকর্ড")}</span><strong>{list.isLoading ? "…" : list.data?.stats.total ?? "—"}</strong></article>
        <article><span>{t("By risk level", "ঝুঁকির মাত্রা অনুযায়ী")}</span><div>{list.data && Object.entries(list.data.stats.byRisk).map(([key, count]) => <small key={key}>{label(key, isBangla)} <b>{count}</b></small>)}</div></article>
        <article><span>{t("By lifecycle", "জীবনচক্র অনুযায়ী")}</span><div>{list.data && Object.entries(list.data.stats.byLifecycle).map(([key, count]) => <small key={key}>{label(key, isBangla)} <b>{count}</b></small>)}</div></article>
      </section>

      <section className="ai-panel">
        <div className="ai-panel-head"><div><span className="ai-kicker">{t("REGISTER", "নিবন্ধন")}</span><h2>{t("Organization AI systems", "প্রতিষ্ঠানের এআই সিস্টেম")}</h2></div><button className="ai-primary" onClick={() => { setNotice(""); setShowForm(value => !value); }}><Plus size={16} /> {t("Add system", "সিস্টেম যোগ করুন")}</button></div>
        <div className="ai-filters">
          <label className="ai-search"><span>{t("Search systems", "সিস্টেম খুঁজুন")}</span><div><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Name, provider, or purpose", "নাম, প্রদানকারী বা উদ্দেশ্য")} /></div></label>
          <label>{t("Risk", "ঝুঁকি")}<select value={riskLevel} onChange={event => setRiskLevel(event.target.value as RiskLevel | "")}><option value="">{t("All risks", "সব ঝুঁকি")}</option>{risks.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
          <label>{t("Category / decision impact", "বিভাগ / সিদ্ধান্তের প্রভাব")}<select value={decisionImpact} onChange={event => setDecisionImpact(event.target.value as DecisionImpact | "")}><option value="">{t("All categories", "সব বিভাগ")}</option>{impacts.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
          <label>{t("Lifecycle", "জীবনচক্র")}<select value={lifecycleStatus} onChange={event => setLifecycleStatus(event.target.value as Lifecycle | "")}><option value="">{t("All stages", "সব ধাপ")}</option>{lifecycles.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
        </div>

        {showForm && <form className="ai-form" onSubmit={submit}>
          <h3>{t("Register an AI system", "একটি এআই সিস্টেম নিবন্ধন করুন")}</h3>
          <p className="ai-form-note">{t("Choose one parent context above before saving. System records remain private.", "সংরক্ষণের আগে উপরের একটি মূল প্রসঙ্গ বেছে নিন। সিস্টেমের রেকর্ড ব্যক্তিগত থাকবে।")}</p>
          <label>{t("System name", "সিস্টেমের নাম")}<input required minLength={2} maxLength={255} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
          <label>{t("Provider", "প্রদানকারী")}<input maxLength={255} value={form.provider} onChange={event => setForm(current => ({ ...current, provider: event.target.value }))} /></label>
          <label>{t("Purpose", "উদ্দেশ্য")}<textarea maxLength={5000} value={form.purpose} onChange={event => setForm(current => ({ ...current, purpose: event.target.value }))} /></label>
          <label>{t("Category / decision impact", "বিভাগ / সিদ্ধান্তের প্রভাব")}<select value={form.decisionImpact} onChange={event => setForm(current => ({ ...current, decisionImpact: event.target.value as DecisionImpact | "" }))}><option value="">{t("Select…", "নির্বাচন করুন…")}</option>{impacts.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
          <label>{t("Human oversight", "মানব তদারকি")}<input maxLength={80} value={form.humanOversight} onChange={event => setForm(current => ({ ...current, humanOversight: event.target.value }))} /></label>
          <label>{t("Risk level", "ঝুঁকির মাত্রা")}<select value={form.riskLevel} onChange={event => setForm(current => ({ ...current, riskLevel: event.target.value as RiskLevel | "" }))}><option value="">{t("Select…", "নির্বাচন করুন…")}</option>{risks.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
          <label>{t("Lifecycle status", "জীবনচক্রের অবস্থা")}<select value={form.lifecycleStatus} onChange={event => setForm(current => ({ ...current, lifecycleStatus: event.target.value as Lifecycle | "" }))}><option value="">{t("Select…", "নির্বাচন করুন…")}</option>{lifecycles.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
          {create.error && <p role="alert" className="ai-error">{create.error.message}</p>}
          {notice && <p role="status" className="ai-success">{notice}</p>}
          <div className="ai-actions"><button type="button" onClick={() => setShowForm(false)}>{t("Cancel", "বাতিল")}</button><button className="ai-primary" disabled={create.isPending || !parentSelected}>{create.isPending ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Save system", "সিস্টেম সংরক্ষণ করুন")}</button></div>
        </form>}

        {!showForm && notice && <p role="status" className="ai-success">{notice}</p>}
        {list.isLoading ? <p role="status" className="ai-empty">{t("Loading AI systems…", "এআই সিস্টেম লোড হচ্ছে…")}</p> : list.isError ? <p role="alert" className="ai-error">{t("Could not load AI systems: ", "এআই সিস্টেম লোড করা যায়নি: ")}{list.error.message}</p> : systems.length === 0 ? (
          <div className="ai-empty"><Activity /><h3>{t("No system records match", "কোনো সিস্টেম রেকর্ড মেলেনি")}</h3><p>{search || riskLevel || decisionImpact || lifecycleStatus ? t("Adjust or clear filters to see matching records.", "মিলে যাওয়া রেকর্ড দেখতে ফিল্টার বদলান বা মুছে দিন.") : t("No private AI-system records are available for this context yet.", "এই প্রসঙ্গে এখনো কোনো ব্যক্তিগত এআই সিস্টেম রেকর্ড নেই।")}</p></div>
        ) : (
          <div className="ai-table">{systems.map(system => <Link key={system.id} href={`/observatory/systems/${system.id}`} className="ai-row"><div><strong>{system.name}</strong><span>{system.provider || t("Provider not specified", "প্রদানকারী উল্লেখ করা হয়নি")}</span></div><span className="ai-pill">{label(system.riskLevel || "unrated", isBangla)}</span><span>{label(system.decisionImpact || "unspecified", isBangla)}</span><span>{label(system.lifecycleStatus || "unspecified", isBangla)}</span></Link>)}</div>
        )}
      </section>
    </main>
  );
}
