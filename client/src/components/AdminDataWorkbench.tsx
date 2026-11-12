import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";

type SourceDraft = { name: string; publisher: string; url: string; description: string; freshnessWindowDays: string; qualityThreshold: string; active: boolean };
type IndicatorDraft = { title: string; domain: string; sector: string; geographicCoverage: string; definition: string; unit: string; dataType: "numeric" | "percentage" | "count" | "currency" | "text" | "binary"; baselineValue: string; currentValue: string; targetValue: string; methodologyVersion: string; active: boolean };
type ObservationDraft = { indicatorId: string; sourceId: string; value: string; valueLabel: string; observationDate: string; periodLabel: string; notes: string; methodologyVersion: string };

const dateInputValue = (value: Date | string) => new Date(value).toISOString().slice(0, 10);

export default function AdminDataWorkbench() {
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const utils = trpc.useUtils();
  const data = trpc.observatory.adminData.useQuery();
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [sourceDraft, setSourceDraft] = useState<SourceDraft | null>(null);
  const [sourceReason, setSourceReason] = useState("");
  const [indicatorId, setIndicatorId] = useState<number | null>(null);
  const [indicatorDraft, setIndicatorDraft] = useState<IndicatorDraft | null>(null);
  const [indicatorReason, setIndicatorReason] = useState("");
  const [observationId, setObservationId] = useState<number | null>(null);
  const [observationDraft, setObservationDraft] = useState<ObservationDraft | null>(null);
  const [observationReason, setObservationReason] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [message, setMessage] = useState("");

  const refresh = async () => {
    await Promise.all([utils.observatory.adminData.invalidate(), utils.observatory.publicData.invalidate()]);
  };
  const onSuccess = async (success: string) => { setMessage(success); await refresh(); };
  const sourceUpdate = trpc.observatory.updateSource.useMutation({ onSuccess: async () => { setSourceId(null); setSourceDraft(null); setSourceReason(""); await onSuccess(t("Source saved. Published observations using changed source metadata were returned to draft for review.", "উৎস সংরক্ষিত। পরিবর্তিত উৎসের প্রকাশিত পর্যবেক্ষণ পুনঃপর্যালোচনার জন্য খসড়ায় ফেরত গেছে।")); } });
  const indicatorUpdate = trpc.observatory.updateIndicator.useMutation({ onSuccess: async () => { setIndicatorId(null); setIndicatorDraft(null); setIndicatorReason(""); await onSuccess(t("Indicator saved. Published observations using changed definitions were returned to draft.", "সূচক সংরক্ষিত। পরিবর্তিত সংজ্ঞা-নির্ভর প্রকাশিত পর্যবেক্ষণ খসড়ায় ফেরত গেছে।")); } });
  const observationUpdate = trpc.observatory.updateObservation.useMutation({ onSuccess: async () => { setObservationId(null); setObservationDraft(null); setObservationReason(""); await onSuccess(t("Correction saved as a draft. Republish it after reviewing the audit history.", "সংশোধন খসড়া হিসেবে সংরক্ষিত। audit history দেখে পুনরায় প্রকাশ করুন।")); } });
  const statusUpdate = trpc.observatory.setObservationStatus.useMutation({ onSuccess: async () => { setStatusReason(""); await onSuccess(t("Status changed and recorded in the admin audit history.", "অবস্থা বদলেছে এবং admin audit history-তে সংরক্ষিত হয়েছে।")); } });

  const sources = data.data?.sources ?? [];
  const indicators = data.data?.indicators ?? [];
  const observations = data.data?.observations ?? [];
  const audit = data.data?.audit ?? [];
  const error = sourceUpdate.error ?? indicatorUpdate.error ?? observationUpdate.error ?? statusUpdate.error ?? data.error;

  return <section className="admin-panel admin-data-workbench">
    <div className="admin-panel-head"><div><span className="card-kicker">{t("SYSTEM DATA / PUBLIC CURATION", "সিস্টেম ডেটা / পাবলিক কিউরেশন")}</span><h2>{t("Admin data workbench", "অ্যাডমিন ডেটা ওয়ার্কবেঞ্চ")}</h2></div><span className="admin-workbench-badge">{t("Site admin only", "শুধু সাইট অ্যাডমিন")}</span></div>
    <p>{t("Manage public Observatory catalogue content here. Every change requires a reason and is recorded with before/after values. Corrections to published data return the affected record to draft until it is reviewed and republished. Private tenant assessments, AI-system records, incidents and evidence are intentionally not exposed here.", "এখানে public Observatory catalog পরিচালনা করুন। প্রতিটি পরিবর্তনে কারণ দিতে হয় এবং আগের/পরের মানসহ log হয়। প্রকাশিত তথ্য সংশোধন করলে review ও পুনঃপ্রকাশ না হওয়া পর্যন্ত সেটি draft হয়। ব্যক্তিগত tenant assessment, AI-system record, incident ও evidence এখানে দেখানো হয় না।")}</p>
    {data.isLoading && <p role="status">{t("Loading curated data…", "কিউরেট করা তথ্য লোড হচ্ছে…")}</p>}
    {data.error && <p className="admin-workbench-error" role="alert">{t("Curation data is unavailable or you do not have site-admin access.", "কিউরেশন তথ্য অনুপলব্ধ অথবা আপনার site-admin access নেই।")}</p>}
    {message && <p className="admin-workbench-success" role="status">{message}</p>}
    {error && !data.error && <p className="admin-workbench-error" role="alert">{error.message}</p>}
    <div className="admin-workbench-actions"><Link className="button button-dark" href="/observatory">{t("Open Observatory to add/import records", "রেকর্ড যোগ/ইমপোর্ট করতে Observatory খুলুন")}</Link><button type="button" className="observatory-refresh" onClick={() => void data.refetch()}>{t("Refresh inventory", "তালিকা রিফ্রেশ")}</button></div>

    <section className="admin-data-section"><h3>{t("Sources", "উৎস")}</h3>
      {sources.length === 0 && <p>{t("No sources registered.", "কোনো উৎস নিবন্ধিত নেই।")}</p>}
      {sources.map(source => <article className="admin-data-row" key={source.id}>
        <div className="admin-data-row-head"><strong>{source.publisher} · {source.name}</strong><span>{source.active ? t("Active", "সক্রিয়") : t("Archived", "আর্কাইভ")}</span><button type="button" onClick={() => { setSourceId(source.id); setSourceDraft({ name: source.name, publisher: source.publisher, url: source.url, description: source.description ?? "", freshnessWindowDays: source.freshnessWindowDays ? String(source.freshnessWindowDays) : "", qualityThreshold: source.qualityThreshold ?? "", active: source.active }); setSourceReason(""); }}>{t("Edit", "সম্পাদনা")}</button></div>
        {sourceId === source.id && sourceDraft && <form className="admin-data-form" onSubmit={event => { event.preventDefault(); sourceUpdate.mutate({ sourceId: source.id, ...sourceDraft, description: sourceDraft.description || undefined, freshnessWindowDays: sourceDraft.freshnessWindowDays ? Number(sourceDraft.freshnessWindowDays) : undefined, qualityThreshold: sourceDraft.qualityThreshold || undefined, reason: sourceReason }); }}>
          <label>{t("Name", "নাম")}<input required minLength={2} maxLength={255} value={sourceDraft.name} onChange={e => setSourceDraft({ ...sourceDraft, name: e.target.value })} /></label>
          <label>{t("Publisher", "প্রকাশক")}<input required minLength={2} maxLength={255} value={sourceDraft.publisher} onChange={e => setSourceDraft({ ...sourceDraft, publisher: e.target.value })} /></label>
          <label>URL<input required type="url" maxLength={700} value={sourceDraft.url} onChange={e => setSourceDraft({ ...sourceDraft, url: e.target.value })} /></label>
          <label>{t("Description", "বিবরণ")}<textarea maxLength={5000} value={sourceDraft.description} onChange={e => setSourceDraft({ ...sourceDraft, description: e.target.value })} /></label><div className="admin-data-two-col"><label>{t("Freshness window (days)", "তথ্য সতেজতার সময় (দিন)")}<input type="number" min="1" max="3650" value={sourceDraft.freshnessWindowDays} onChange={e => setSourceDraft({ ...sourceDraft, freshnessWindowDays: e.target.value })} /></label><label>{t("Quality threshold (%)", "মানের threshold (%)")}<input inputMode="decimal" value={sourceDraft.qualityThreshold} onChange={e => setSourceDraft({ ...sourceDraft, qualityThreshold: e.target.value })} /></label></div>
          <label className="admin-data-checkbox"><input type="checkbox" checked={sourceDraft.active} onChange={e => setSourceDraft({ ...sourceDraft, active: e.target.checked })} />{t("Active", "সক্রিয়")}</label>
          <label>{t("Reason for change (required)", "পরিবর্তনের কারণ (আবশ্যক)")}<textarea required minLength={5} maxLength={1000} value={sourceReason} onChange={e => setSourceReason(e.target.value)} /></label>
          <div><button className="button button-dark" disabled={sourceUpdate.isPending}>{t("Save audited change", "audit-সহ সংরক্ষণ")}</button><button type="button" onClick={() => { setSourceId(null); setSourceDraft(null); }}>{t("Cancel", "বাতিল")}</button></div>
        </form>}
      </article>)}
    </section>

    <section className="admin-data-section"><h3>{t("Indicators", "সূচক")}</h3>
      {indicators.length === 0 && <p>{t("No indicators registered.", "কোনো সূচক নিবন্ধিত নেই।")}</p>}
      {indicators.map(indicator => <article className="admin-data-row" key={indicator.id}>
        <div className="admin-data-row-head"><strong>{indicator.code} · {indicator.title}</strong><span>{indicator.active ? t("Active", "সক্রিয়") : t("Archived", "আর্কাইভ")}</span><button type="button" onClick={() => { setIndicatorId(indicator.id); setIndicatorDraft({ title: indicator.title, domain: indicator.domain, sector: indicator.sector ?? "", geographicCoverage: indicator.geographicCoverage ?? "", definition: indicator.definition, unit: indicator.unit ?? "", dataType: indicator.dataType ?? "numeric", baselineValue: indicator.baselineValue ?? "", currentValue: indicator.currentValue ?? "", targetValue: indicator.targetValue ?? "", methodologyVersion: indicator.methodologyVersion, active: indicator.active }); setIndicatorReason(""); }}>{t("Edit", "সম্পাদনা")}</button></div>
        {indicatorId === indicator.id && indicatorDraft && <form className="admin-data-form" onSubmit={event => { event.preventDefault(); indicatorUpdate.mutate({ indicatorId: indicator.id, ...indicatorDraft, unit: indicatorDraft.unit || undefined, reason: indicatorReason }); }}>
          <label>{t("Code (immutable; create a new indicator for a different concept)", "কোড (অপরিবর্তনীয়; ভিন্ন বিষয়ের জন্য নতুন সূচক তৈরি করুন)")}<input readOnly value={indicator.code} /></label>
          <label>{t("Title", "শিরোনাম")}<input required minLength={2} maxLength={255} value={indicatorDraft.title} onChange={e => setIndicatorDraft({ ...indicatorDraft, title: e.target.value })} /></label>
          <label>{t("Domain", "ক্ষেত্র")}<input required minLength={2} maxLength={120} value={indicatorDraft.domain} onChange={e => setIndicatorDraft({ ...indicatorDraft, domain: e.target.value })} /></label>
          <label>{t("Definition", "সংজ্ঞা")}<textarea required minLength={10} maxLength={5000} value={indicatorDraft.definition} onChange={e => setIndicatorDraft({ ...indicatorDraft, definition: e.target.value })} /></label>
          <div className="admin-data-two-col"><label>{t("Sector", "খাত")}<input maxLength={120} value={indicatorDraft.sector} onChange={e => setIndicatorDraft({ ...indicatorDraft, sector: e.target.value })} /></label><label>{t("Geographic coverage", "ভৌগোলিক কভারেজ")}<input maxLength={255} value={indicatorDraft.geographicCoverage} onChange={e => setIndicatorDraft({ ...indicatorDraft, geographicCoverage: e.target.value })} /></label></div>
          <div className="admin-data-two-col"><label>{t("Data type", "ডেটার ধরন")}<select value={indicatorDraft.dataType} onChange={e => setIndicatorDraft({ ...indicatorDraft, dataType: e.target.value as IndicatorDraft["dataType"] })}>{["numeric", "percentage", "count", "currency", "text", "binary"].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>{t("Unit", "একক")}<input maxLength={80} value={indicatorDraft.unit} onChange={e => setIndicatorDraft({ ...indicatorDraft, unit: e.target.value })} /></label></div>
          <div className="admin-data-three-col"><label>{t("Baseline", "বেসলাইন")}<input value={indicatorDraft.baselineValue} onChange={e => setIndicatorDraft({ ...indicatorDraft, baselineValue: e.target.value })} /></label><label>{t("Current", "বর্তমান")}<input value={indicatorDraft.currentValue} onChange={e => setIndicatorDraft({ ...indicatorDraft, currentValue: e.target.value })} /></label><label>{t("Target", "লক্ষ্য")}<input value={indicatorDraft.targetValue} onChange={e => setIndicatorDraft({ ...indicatorDraft, targetValue: e.target.value })} /></label></div>
          <label>{t("Methodology version", "পদ্ধতির সংস্করণ")}<input required maxLength={48} value={indicatorDraft.methodologyVersion} onChange={e => setIndicatorDraft({ ...indicatorDraft, methodologyVersion: e.target.value })} /></label>
          <label className="admin-data-checkbox"><input type="checkbox" checked={indicatorDraft.active} onChange={e => setIndicatorDraft({ ...indicatorDraft, active: e.target.checked })} />{t("Active", "সক্রিয়")}</label>
          <label>{t("Reason for change (required)", "পরিবর্তনের কারণ (আবশ্যক)")}<textarea required minLength={5} maxLength={1000} value={indicatorReason} onChange={e => setIndicatorReason(e.target.value)} /></label>
          <div><button className="button button-dark" disabled={indicatorUpdate.isPending}>{t("Save audited change", "audit-সহ সংরক্ষণ")}</button><button type="button" onClick={() => { setIndicatorId(null); setIndicatorDraft(null); }}>{t("Cancel", "বাতিল")}</button></div>
        </form>}
      </article>)}
    </section>

    <section className="admin-data-section"><h3>{t("Observations", "পর্যবেক্ষণ")}</h3>
      {observations.length === 0 && <p>{t("No observations registered.", "কোনো পর্যবেক্ষণ নিবন্ধিত নেই।")}</p>}
      {observations.map(({ observation, indicator, source }) => <article className="admin-data-row" key={observation.id}>
        <div className="admin-data-row-head"><strong>#{observation.id} · {indicator.code} · {source.name}</strong><span className={`observatory-status ${observation.status}`}>{t(observation.status, observation.status === "draft" ? "খসড়া" : observation.status === "published" ? "প্রকাশিত" : "আর্কাইভ")}</span><button type="button" onClick={() => { setObservationId(observation.id); setObservationDraft({ indicatorId: String(observation.indicatorId), sourceId: String(observation.sourceId), value: observation.value ?? "", valueLabel: observation.valueLabel ?? "", observationDate: dateInputValue(observation.observationDate), periodLabel: observation.periodLabel ?? "", notes: observation.notes ?? "", methodologyVersion: observation.methodologyVersion }); setObservationReason(""); }}>{t("Correct", "সংশোধন")}</button></div>
        <div className="admin-data-status-controls"><span>{new Date(observation.observationDate).toLocaleDateString(isBangla ? "bn-BD" : "en-BD")}</span><select aria-label={t("Publication status", "প্রকাশনার অবস্থা")} value={observation.status} onChange={e => { if (statusReason.trim().length >= 5) statusUpdate.mutate({ observationId: observation.id, status: e.target.value as "draft" | "published" | "archived", reason: statusReason }); else setMessage(t("Enter a change reason (at least 5 characters) first.", "আগে পরিবর্তনের কারণ লিখুন (কমপক্ষে ৫ অক্ষর)।")); }}><option value="draft">{t("Draft", "খসড়া")}</option><option value="published">{t("Published", "প্রকাশিত")}</option><option value="archived">{t("Archived", "আর্কাইভ")}</option></select></div>
        {observationId === observation.id && observationDraft && <form className="admin-data-form" onSubmit={event => { event.preventDefault(); observationUpdate.mutate({ observationId: observation.id, indicatorId: Number(observationDraft.indicatorId), sourceId: Number(observationDraft.sourceId), value: observationDraft.value || undefined, valueLabel: observationDraft.valueLabel || undefined, observationDate: new Date(`${observationDraft.observationDate}T00:00:00`), periodLabel: observationDraft.periodLabel || undefined, notes: observationDraft.notes || undefined, methodologyVersion: observationDraft.methodologyVersion, reason: observationReason }); }}>
          <div className="admin-data-two-col"><label>{t("Indicator", "সূচক")}<select required value={observationDraft.indicatorId} onChange={e => setObservationDraft({ ...observationDraft, indicatorId: e.target.value })}>{indicators.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}</select></label><label>{t("Source", "উৎস")}<select required value={observationDraft.sourceId} onChange={e => setObservationDraft({ ...observationDraft, sourceId: e.target.value })}>{sources.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.publisher} · {item.name}</option>)}</select></label></div>
          <div className="admin-data-two-col"><label>{t("Numeric value", "সংখ্যাগত মান")}<input inputMode="decimal" pattern="-?[0-9]+(\.[0-9]{1,6})?" value={observationDraft.value} onChange={e => setObservationDraft({ ...observationDraft, value: e.target.value, valueLabel: e.target.value ? "" : observationDraft.valueLabel })} /></label><label>{t("Text value", "পাঠ্য মান")}<input maxLength={255} value={observationDraft.valueLabel} onChange={e => setObservationDraft({ ...observationDraft, valueLabel: e.target.value, value: e.target.value ? "" : observationDraft.value })} /></label></div>
          <div className="admin-data-two-col"><label>{t("Observation date", "পর্যবেক্ষণের তারিখ")}<input required type="date" value={observationDraft.observationDate} onChange={e => setObservationDraft({ ...observationDraft, observationDate: e.target.value })} /></label><label>{t("Period", "সময়কাল")}<input maxLength={120} value={observationDraft.periodLabel} onChange={e => setObservationDraft({ ...observationDraft, periodLabel: e.target.value })} /></label></div>
          <label>{t("Methodology version", "পদ্ধতির সংস্করণ")}<input required maxLength={48} value={observationDraft.methodologyVersion} onChange={e => setObservationDraft({ ...observationDraft, methodologyVersion: e.target.value })} /></label>
          <label>{t("Notes / caveats", "মন্তব্য / সীমাবদ্ধতা")}<textarea maxLength={5000} value={observationDraft.notes} onChange={e => setObservationDraft({ ...observationDraft, notes: e.target.value })} /></label>
          <label>{t("Correction reason (required)", "সংশোধনের কারণ (আবশ্যক)")}<textarea required minLength={5} maxLength={1000} value={observationReason} onChange={e => setObservationReason(e.target.value)} /></label>
          <p>{t("Saving a correction creates an audit entry and returns the observation to draft; its previous values remain in history.", "সংশোধন সংরক্ষণে audit entry তৈরি হয় এবং পর্যবেক্ষণ draft-এ ফেরে; আগের মান history-তে থাকে।")}</p>
          <div><button className="button button-dark" disabled={observationUpdate.isPending || (!observationDraft.value && !observationDraft.valueLabel)}>{t("Save correction", "সংশোধন সংরক্ষণ")}</button><button type="button" onClick={() => { setObservationId(null); setObservationDraft(null); }}>{t("Cancel", "বাতিল")}</button></div>
        </form>}
      </article>)}
      <label className="admin-data-reason">{t("Reason for status changes (required)", "অবস্থা পরিবর্তনের কারণ (আবশ্যক)")}<input minLength={5} maxLength={1000} value={statusReason} onChange={e => setStatusReason(e.target.value)} /></label>
    </section>

    <section className="admin-data-section"><h3>{t("Recent admin audit history", "সাম্প্রতিক অ্যাডমিন audit history")}</h3>
      {audit.length === 0 && <p>{t("No admin changes recorded yet.", "এখনো কোনো অ্যাডমিন পরিবর্তন log হয়নি।")}</p>}
      {audit.map(entry => <details className="admin-audit-row" key={entry.id}><summary><strong>{entry.action}</strong> · {entry.entityId} · {new Date(entry.createdAt).toLocaleString(isBangla ? "bn-BD" : "en-BD")} · {t("Admin", "অ্যাডমিন")} #{entry.actorId}<small>{entry.reason}</small></summary><div className="admin-audit-diff"><div><b>{t("Before", "আগে")}</b><pre>{entry.beforeData ?? "—"}</pre></div><div><b>{t("After", "পরে")}</b><pre>{entry.afterData ?? "—"}</pre></div></div></details>)}
    </section>
  </section>;
}
