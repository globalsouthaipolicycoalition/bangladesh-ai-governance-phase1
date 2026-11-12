import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Archive, ArrowLeft, Save } from "lucide-react";
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
const label = (value: string, isBangla: boolean) => {
  const words = value.replaceAll("_", " ").toLowerCase();
  const bn: Record<string, string> = { low: "নিম্ন", moderate: "মাঝারি", high: "উচ্চ", critical: "সংকটপূর্ণ", unrated: "ঝুঁকি নির্ধারিত নয়", unspecified: "অনির্দিষ্ট", active: "সক্রিয়", proposed: "প্রস্তাবিত", pilot: "পরীক্ষামূলক", retired: "অবসরপ্রাপ্ত", development: "উন্নয়নাধীন", deployed: "স্থাপিত" };
  return isBangla ? (bn[words] ?? words) : words.replace(/\b\w/g, character => character.toUpperCase());
};

type EditFields = { name: string; provider: string; purpose: string; decisionImpact: DecisionImpact | ""; humanOversight: string; riskLevel: RiskLevel | ""; lifecycleStatus: Lifecycle | "" };

export default function AISystemDetail() {
  const { isBangla, toggleLocale } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const [, params] = useRoute("/observatory/systems/:id");
  const systemId = Number(params?.id ?? 0);
  const detail = trpc.agaras.aiSystems.detail.useQuery({ systemId }, { enabled: Number.isSafeInteger(systemId) && systemId > 0 });
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<EditFields | null>(null);
  const system = detail.data?.system;

  useEffect(() => {
    if (!system) return;
    setFields({ name: system.name, provider: system.provider ?? "", purpose: system.purpose ?? "", decisionImpact: AI_SYSTEM_DECISION_IMPACTS.includes(system.decisionImpact as DecisionImpact) ? system.decisionImpact as DecisionImpact : "", humanOversight: system.humanOversight ?? "", riskLevel: system.riskLevel, lifecycleStatus: system.lifecycleStatus as Lifecycle });
  }, [system]);

  const update = trpc.agaras.aiSystems.update.useMutation({
    onSuccess: async () => {
      setEditing(false);
      setNotice(t("AI system updated.", "এআই সিস্টেম হালনাগাদ হয়েছে।"));
      await Promise.all([utils.agaras.aiSystems.detail.invalidate({ systemId }), utils.agaras.aiSystems.list.invalidate()]);
    },
  });
  const retire = trpc.agaras.aiSystems.retire.useMutation({
    onSuccess: async () => {
      setConfirmRetire(false);
      setNotice(t("AI system retired. The record remains available for authorized audit history.", "এআই সিস্টেমটি অবসর দেওয়া হয়েছে। অনুমোদিত নিরীক্ষা-ইতিহাসের জন্য রেকর্ডটি থাকবে।"));
      await Promise.all([utils.agaras.aiSystems.detail.invalidate({ systemId }), utils.agaras.aiSystems.list.invalidate()]);
    },
  });
  const setField = <K extends keyof EditFields>(key: K, value: EditFields[K]) => setFields(current => current ? { ...current, [key]: value } : current);
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fields || fields.name.trim().length < 2) return;
    setNotice("");
    update.mutate({ systemId, name: fields.name.trim(), provider: fields.provider.trim() || undefined, purpose: fields.purpose.trim() || undefined, decisionImpact: fields.decisionImpact || undefined, humanOversight: fields.humanOversight.trim() || undefined, riskLevel: fields.riskLevel || undefined, lifecycleStatus: fields.lifecycleStatus || undefined });
  };

  return (
    <main className="ai-registry">
      <header className="ai-registry-head"><button type="button" className="ai-back" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button><Link href="/observatory/systems" className="ai-back"><ArrowLeft size={16} />{t("Back to AI systems", "এআই সিস্টেমে ফিরুন")}</Link><span className="ai-kicker">{t("PRIVATE SYSTEM RECORD", "ব্যক্তিগত সিস্টেম রেকর্ড")}</span><h1>{system?.name ?? t("AI system details", "এআই সিস্টেমের বিবরণ")}</h1><p>{t("Private organization and assessment record; not part of the public national register.", "প্রতিষ্ঠান ও মূল্যায়নের ব্যক্তিগত রেকর্ড; এটি জাতীয় উন্মুক্ত নিবন্ধনের অংশ নয়।")}</p></header>
      {detail.isLoading ? <p role="status" className="ai-empty">{t("Loading system details…", "সিস্টেমের বিবরণ লোড হচ্ছে…")}</p> : detail.isError ? <p role="alert" className="ai-error">{t("Could not load this system: ", "এই সিস্টেম লোড করা যায়নি: ")}{detail.error.message}</p> : !system ? <p role="alert" className="ai-empty">{t("This system record is unavailable.", "এই সিস্টেমের রেকর্ডটি অনুপলভ্য।")}</p> : (
        <section className="ai-panel">
          <div className="ai-panel-head"><div><span className="ai-kicker">{t("SYSTEM PROFILE", "সিস্টেম প্রোফাইল")}</span><h2>{editing ? t("Edit record", "রেকর্ড সম্পাদনা") : system.name}</h2></div><div className="ai-actions"><button type="button" onClick={() => { setNotice(""); setEditing(value => !value); if (!editing) setFields({ name: system.name, provider: system.provider ?? "", purpose: system.purpose ?? "", decisionImpact: AI_SYSTEM_DECISION_IMPACTS.includes(system.decisionImpact as DecisionImpact) ? system.decisionImpact as DecisionImpact : "", humanOversight: system.humanOversight ?? "", riskLevel: system.riskLevel, lifecycleStatus: system.lifecycleStatus as Lifecycle }); }}>{editing ? t("Cancel edit", "সম্পাদনা বাতিল") : t("Edit", "সম্পাদনা")}</button>{system.lifecycleStatus !== "retired" && <button type="button" className="ai-danger" onClick={() => setConfirmRetire(true)}><Archive size={15} /> {t("Retire", "অবসর দিন")}</button>}</div></div>
          {notice && <p role="status" className="ai-success">{notice}</p>}
          {editing && fields ? (
            <form className="ai-form" onSubmit={save}>
              <label>{t("Name", "নাম")}<input required minLength={2} maxLength={255} value={fields.name} onChange={event => setField("name", event.target.value)} /></label>
              <label>{t("Provider", "প্রদানকারী")}<input maxLength={255} value={fields.provider} onChange={event => setField("provider", event.target.value)} /></label>
              <label>{t("Purpose", "উদ্দেশ্য")}<textarea maxLength={5000} value={fields.purpose} onChange={event => setField("purpose", event.target.value)} /></label>
              <label>{t("Category / decision impact", "বিভাগ / সিদ্ধান্তের প্রভাব")}<select value={fields.decisionImpact} onChange={event => setField("decisionImpact", event.target.value as DecisionImpact | "")}><option value="">{t("Unspecified", "অনির্দিষ্ট")}</option>{impacts.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
              <label>{t("Human oversight", "মানব তদারকি")}<input maxLength={80} value={fields.humanOversight} onChange={event => setField("humanOversight", event.target.value)} /></label>
              <label>{t("Risk level", "ঝুঁকির মাত্রা")}<select value={fields.riskLevel} onChange={event => setField("riskLevel", event.target.value as RiskLevel | "")}><option value="">{t("Unspecified", "অনির্দিষ্ট")}</option>{risks.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
              <label>{t("Lifecycle status", "জীবনচক্রের অবস্থা")}<select value={fields.lifecycleStatus} onChange={event => setField("lifecycleStatus", event.target.value as Lifecycle | "")}><option value="">{t("Unspecified", "অনির্দিষ্ট")}</option>{lifecycles.map(value => <option key={value} value={value}>{label(value, isBangla)}</option>)}</select></label>
              {update.error && <p role="alert" className="ai-error">{update.error.message}</p>}
              <div className="ai-actions"><button type="button" onClick={() => setEditing(false)}>{t("Cancel", "বাতিল")}</button><button className="ai-primary" disabled={update.isPending}><Save size={15} /> {update.isPending ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Save changes", "পরিবর্তন সংরক্ষণ করুন")}</button></div>
            </form>
          ) : (
            <dl className="ai-details">{[[t("Provider", "প্রদানকারী"), system.provider], [t("Purpose", "উদ্দেশ্য"), system.purpose], [t("Category / decision impact", "বিভাগ / সিদ্ধান্তের প্রভাব"), system.decisionImpact ? label(system.decisionImpact, isBangla) : null], [t("Human oversight", "মানব তদারকি"), system.humanOversight], [t("Risk level", "ঝুঁকির মাত্রা"), label(system.riskLevel, isBangla)], [t("Lifecycle status", "জীবনচক্রের অবস্থা"), label(system.lifecycleStatus, isBangla)]].map(([key, value]) => <div key={String(key)}><dt>{key}</dt><dd>{value || t("Not specified", "উল্লেখ করা হয়নি")}</dd></div>)}</dl>
          )}
        </section>
      )}
      {confirmRetire && <div className="ai-modal-backdrop" role="presentation"><section className="ai-modal" role="alertdialog" aria-modal="true" aria-labelledby="retire-title"><h2 id="retire-title">{t("Retire this AI system?", "এই এআই সিস্টেমটি অবসর দেবেন?")}</h2><p>{t("This changes its lifecycle status. It does not delete the record.", "এতে জীবনচক্রের অবস্থা বদলাবে, তবে রেকর্ড মুছে যাবে না।")}</p>{retire.error && <p role="alert" className="ai-error">{retire.error.message}</p>}<div className="ai-actions"><button type="button" onClick={() => setConfirmRetire(false)}>{t("Cancel", "বাতিল")}</button><button type="button" className="ai-danger" disabled={retire.isPending} onClick={() => retire.mutate({ systemId })}>{retire.isPending ? t("Retiring…", "অবসর দেওয়া হচ্ছে…") : t("Confirm retirement", "অবসর নিশ্চিত করুন")}</button></div></section></div>}
    </main>
  );
}
