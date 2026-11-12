import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, ChevronRight, FileCheck2, FileSpreadsheet, FileText, ShieldAlert, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AssessmentOrganizationPanel from "@/components/AssessmentOrganizationPanel";
import ActionItemsPanel from "@/components/ActionItemsPanel";
import { useLocale } from "../contexts/LocaleContext";
import { getBangladeshSectorLabel } from "@shared/bangladeshSectors";

function downloadBlob(fileName: string, contentType: string, contents: BlobPart) {
  const url = URL.createObjectURL(new Blob([contents], { type: contentType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Workspace() {
  const { isBangla, toggleLocale, t: translate } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const queryId = Number(new URLSearchParams(window.location.search).get("assessmentId") ?? 0);
  const [selectedId, setSelectedId] = useState(Number.isSafeInteger(queryId) && queryId > 0 ? queryId : 0);
  const assessmentId = selectedId;
  const [reportLanguage, setReportLanguage] = useState<"en" | "bn" | "bilingual">(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("atlas-report-language") : null;
    return stored === "bn" || stored === "bilingual" ? stored : "en";
  });
  useEffect(() => { window.localStorage.setItem("atlas-report-language", reportLanguage); }, [reportLanguage]);
  const assessments = trpc.agaras.myAssessments.useQuery();
  const me = trpc.auth.me.useQuery();
  const dashboardQuery = trpc.agaras.dashboard.useQuery({ assessmentId }, { enabled: assessmentId > 0 });
  const reportQuery = trpc.agaras.reportSnapshot.useQuery({ assessmentId }, { enabled: assessmentId > 0 });
  const pdfQuery = trpc.agaras.reportPdf.useQuery({ assessmentId, language: reportLanguage }, { enabled: false });
  const excelQuery = trpc.agaras.reportExcel.useQuery({ assessmentId, language: reportLanguage }, { enabled: false });
  const submitAssessment = trpc.agaras.submitAssessment.useMutation({
    onSuccess: async () => {
      setExportMessage(t("Assessment submitted. Responses are locked while review is pending.", "মূল্যায়ন জমা হয়েছে। পর্যালোচনা চলাকালে উত্তর লক থাকবে।"));
      await Promise.all([dashboardQuery.refetch(), assessments.refetch()]);
    },
    onError: error => setExportMessage(`${t("Assessment submission failed", "মূল্যায়ন জমা ব্যর্থ")}: ${error.message}`),
  });
  const [exportMessage, setExportMessage] = useState("");
  const dashboard = dashboardQuery.data;
  const readyDashboard = dashboard?.assessment ? dashboard : undefined;
  const assessment = readyDashboard?.assessment;
  const isAssessmentOwner = Boolean(assessment && assessment.userId === me.data?.id);
  const controls = readyDashboard?.controls ?? [];
  const findings = readyDashboard?.findings ?? [];
  const systems = readyDashboard?.aiSystems ?? [];

  const groupedControls = useMemo(() => controls.reduce<Record<string, { title: string; rows: typeof controls }>>((groups, row) => {
    const code = row.domain.code;
    groups[code] ??= { title: row.domain.title, rows: [] };
    groups[code].rows.push(row);
    return groups;
  }, {}), [controls]);

  const selectAssessment = (id: number) => {
    setSelectedId(id);
    const nextUrl = new URL(window.location.href);
    if (id > 0) nextUrl.searchParams.set("assessmentId", String(id));
    else nextUrl.searchParams.delete("assessmentId");
    window.history.replaceState(null, "", nextUrl.toString());
  };

  const exportJson = async () => {
    setExportMessage(t("Preparing JSON report…", "JSON প্রতিবেদন প্রস্তুত হচ্ছে…"));
    try {
      const result = await reportQuery.refetch();
      if (result.error || !result.data) {
        setExportMessage(`${t("JSON export failed", "JSON এক্সপোর্ট ব্যর্থ")}: ${result.error?.message ?? t("No report data was returned.", "কোনো প্রতিবেদন ডেটা ফেরত আসেনি।")}`);
        return;
      }
      const exportEnvelope = { ...result.data, schemaVersion: "1.0", generatedAt: new Date().toISOString(), locale: isBangla ? "bn" : "en", reportLanguage, notice: isBangla ? "স্ব-প্রতিবেদিত মূল্যায়ন — স্বাধীনভাবে যাচাই করা হয়নি।" : "Self-reported assessment — not independently verified.", disclaimer: isBangla ? "এই প্রতিবেদনটি মূল্যায়নের ফল; এটি আইনি পরামর্শ, সরকারি সনদ, ISO স্বীকৃতি বা স্বাধীন নিশ্চয়তা নয়।" : "This report is an assessment output and does not constitute legal advice, government certification, ISO accreditation or independent assurance." };
      downloadBlob(`bangladesh-ai-readiness-report-${assessmentId}-${reportLanguage}.json`, "application/json", JSON.stringify(exportEnvelope, null, 2));
      setExportMessage(t("JSON download started.", "JSON ডাউনলোড শুরু হয়েছে।"));
    } catch (error) {
      setExportMessage(`${t("JSON export failed", "JSON এক্সপোর্ট ব্যর্থ")}: ${error instanceof Error ? error.message : t("Unknown error", "অজানা ত্রুটি")}`);
    }
  };

  const downloadBinary = (payload: { fileName: string; contentType: string; base64: string } | undefined) => {
    if (!payload) {
      setExportMessage(t("Export failed: no report file was returned.", "এক্সপোর্ট ব্যর্থ: কোনো প্রতিবেদন ফাইল ফেরত আসেনি।"));
      return;
    }
    try {
      const bytes = Uint8Array.from(atob(payload.base64), character => character.charCodeAt(0));
      downloadBlob(payload.fileName, payload.contentType, bytes);
      setExportMessage(`${payload.fileName} ${t("download started.", "ডাউনলোড শুরু হয়েছে।")}`);
    } catch (error) {
      setExportMessage(`${t("Export failed", "এক্সপোর্ট ব্যর্থ")}: ${error instanceof Error ? error.message : t("Invalid file data", "ফাইলের ডেটা অবৈধ")}`);
    }
  };

  const exportFile = async (format: "pdf" | "excel") => {
    setExportMessage(`${t("Preparing", "প্রস্তুত হচ্ছে")} ${format.toUpperCase()} ${t("report…", "প্রতিবেদন…")}`);
    try {
      const result = await (format === "pdf" ? pdfQuery.refetch() : excelQuery.refetch());
      if (result.error) {
        setExportMessage(`${format.toUpperCase()} ${t("export failed", "এক্সপোর্ট ব্যর্থ")}: ${result.error.message}`);
        return;
      }
      downloadBinary(result.data);
    } catch (error) {
      setExportMessage(`${format.toUpperCase()} ${t("export failed", "এক্সপোর্ট ব্যর্থ")}: ${error instanceof Error ? error.message : t("Unknown error", "অজানা ত্রুটি")}`);
    }
  };

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link href="/" className="workspace-brand">
          <span className="brand-mark"><span /><span /><span /></span>
          <span><strong>Bangladesh AI Readiness Assessment</strong><small>{t("Assessment workspace", "মূল্যায়ন ওয়ার্কস্পেস")}</small></span>
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-avatar">{assessment ? assessment.title.slice(0, 2).toUpperCase() : "—"}</span>
          <span><strong>{assessment?.title ?? "Select assessment"}</strong><small>{assessment ? assessment.profileType.replaceAll("_", " ") : "No assessment selected"}</small></span>
          <ChevronRight size={15} />
        </div>
        <nav className="workspace-nav" aria-label={t("Assessment workspace", "মূল্যায়ন ওয়ার্কস্পেস")}>
          <span className="workspace-nav-label">{t("WORKSPACE", "ওয়ার্কস্পেস")}</span>
          <a className="active" href="#overview"><BarChart3 size={17} /> {t("Overview", "ওভারভিউ")}</a>
          <a href="#domains"><SlidersHorizontal size={17} /> {t("Domains", "ডোমেইন")} <span className="nav-count">{Object.keys(groupedControls).length}</span></a>
          <a href="#findings"><ShieldAlert size={17} /> {t("Findings", "ফাইন্ডিংস")} <span className="nav-count">{findings.length}</span></a>
          <span className="workspace-nav-label spaced">{t("MANAGE", "পরিচালনা")}</span>
          {assessment && <Link href={`/observatory/systems?assessmentId=${assessmentId}`}><FileCheck2 size={17} /> {t("AI systems", "AI সিস্টেম")} <span className="nav-count">{systems.length}</span></Link>}
          <Link href="/"><ArrowLeft size={15} /> {t("Back to platform", "প্ল্যাটফর্মে ফিরুন")}</Link>
        </nav>
      </aside>
      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="mobile-workspace-brand"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong><button className="language-button" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button></div>
          <div className="breadcrumbs"><span>{t("Workspaces", "ওয়ার্কস্পেসসমূহ")}</span><ChevronRight size={14} /><strong>{assessment?.title ?? t("Assessment", "মূল্যায়ন")}</strong></div>
        </header>
        <div className="workspace-content" id="overview">
          {!queryId && (
            <section className="workspace-panel">
              <div className="panel-header"><div><span className="card-kicker">{t("YOUR ASSESSMENTS", "আপনার মূল্যায়ন")}</span><h2>{t("Select an assessment", "একটি মূল্যায়ন বাছুন")}</h2></div></div>
              {assessments.isLoading ? <p role="status">{t("Loading your assessments…", "আপনার মূল্যায়নগুলো লোড হচ্ছে…")}</p> : assessments.isError ? <p role="alert">{t("Could not load assessments", "মূল্যায়ন লোড করা যায়নি")}: {assessments.error.message}</p> : !assessments.data?.length ? <p>{t("No assessments found. Create one to open a workspace.", "কোনো মূল্যায়ন পাওয়া যায়নি। ওয়ার্কস্পেস খুলতে একটি তৈরি করুন।")}</p> : (
                <label>{t("Assessment", "মূল্যায়ন")}
                  <select aria-label={t("Select assessment", "মূল্যায়ন বাছুন")} value={assessmentId || ""} onChange={event => selectAssessment(Number(event.target.value))}>
                    <option value="" disabled>{t("Choose an assessment", "একটি মূল্যায়ন বাছুন")}</option>
                    {assessments.data.map(item => <option key={item.id} value={item.id}>{item.title} · #{item.id}</option>)}
                  </select>
                </label>
              )}
            </section>
          )}
          {assessmentId > 0 && dashboardQuery.isLoading && <div className="empty-questionnaire" role="status">{t("Loading assessment dashboard…", "মূল্যায়ন ড্যাশবোর্ড লোড হচ্ছে…")}</div>}
          {assessmentId > 0 && dashboardQuery.isError && <div className="empty-questionnaire" role="alert">{t("Could not load dashboard", "ড্যাশবোর্ড লোড করা যায়নি")}: {dashboardQuery.error.message}</div>}
          {assessmentId > 0 && dashboardQuery.isSuccess && !readyDashboard && <div className="empty-questionnaire" role="alert">{t("Assessment not found or you do not have access to it.", "মূল্যায়নটি পাওয়া যায়নি অথবা এতে আপনার প্রবেশাধিকার নেই।")}</div>}
          {readyDashboard && assessment && (
            <>
              <div className="workspace-heading">
                <div>
                  <span className="card-kicker">{assessment.profileType.replaceAll("_", " ").toUpperCase()} / {assessment.posture.replaceAll("_", " ").toUpperCase()}</span>
                  <h1>{assessment.title}</h1>
                  <p>{assessment.jurisdiction ?? t("Jurisdiction not specified", "এখতিয়ার উল্লেখ করা হয়নি")} · {getBangladeshSectorLabel(assessment.sector, isBangla) ?? t("Sector not specified", "খাত উল্লেখ করা হয়নি")}</p>
                </div>
                <div className="workspace-heading-actions">
                  {isAssessmentOwner && ["draft", "in_progress", "changes_requested"].includes(assessment.status) && <button className="button button-dark" onClick={() => { if (window.confirm(t("Submit this assessment? You will not be able to edit responses until changes are requested.", "এই মূল্যায়ন জমা দেবেন? পরিবর্তনের অনুরোধ না আসা পর্যন্ত উত্তর সম্পাদনা করতে পারবেন না।"))) submitAssessment.mutate({ assessmentId }); }} disabled={submitAssessment.isPending || !controls.length || controls.some(row => row.assignment.responseScore === null)} title={controls.some(row => row.assignment.responseScore === null) ? t("Answer every scoped control before submitting.", "জমা দেওয়ার আগে নির্ধারিত প্রতিটি কন্ট্রোলের উত্তর দিন।") : undefined}>{submitAssessment.isPending ? t("Submitting…", "জমা হচ্ছে…") : t("Submit assessment", "মূল্যায়ন জমা দিন")}</button>}
                  <button className="outline-button" onClick={exportJson} disabled={reportQuery.isFetching}>JSON</button>
                  <label className="report-language-picker">{translate("reportLanguage")}
                    <select value={reportLanguage} onChange={event => setReportLanguage(event.target.value as typeof reportLanguage)} aria-label={t("Report language", "প্রতিবেদনের ভাষা")}>
                      <option value="en">{translate("english")}</option><option value="bn">{translate("bangla")}</option><option value="bilingual">{translate("bilingual")}</option>
                    </select>
                  </label>
                  <button className="outline-button" onClick={() => void exportFile("pdf")} disabled={pdfQuery.isFetching}><FileText size={16} /> PDF</button>
                  <button className="outline-button" onClick={() => void exportFile("excel")} disabled={excelQuery.isFetching}><FileSpreadsheet size={16} /> Excel</button>
                  <Link className="button button-dark" href={`/observatory/systems?assessmentId=${assessmentId}`}>{translate("aiSystems")} <ArrowUpRight size={16} /></Link>
                </div>
              </div>
              <AssessmentOrganizationPanel
                assessmentId={assessmentId}
                organizationId={assessment.organizationId}
                sector={assessment.sector}
                jurisdiction={assessment.jurisdiction}
                isAssessmentOwner={isAssessmentOwner}
              />
              {assessment.organizationId && <section className="workspace-panel team-collaboration-note"><div className="panel-header"><div><span className="card-kicker">{t("TEAM COLLABORATION", "দলীয় সহযোগিতা")}</span><h2>{t("Shared assessment workspace", "যৌথ মূল্যায়ন ওয়ার্কস্পেস")}</h2></div></div><p>{t("Active organization members can view this assessment. Organization owners, admins, and contributors can edit responses while the assessment is open; regular members and reviewers remain read-only. The assessment owner controls final submission.", "সক্রিয় প্রতিষ্ঠানের সদস্যরা এই মূল্যায়ন দেখতে পারেন। মূল্যায়ন খোলা থাকলে প্রতিষ্ঠানের owner, admin ও contributor উত্তর সম্পাদনা করতে পারেন; সাধারণ সদস্য ও reviewer শুধু দেখতে পারেন। চূড়ান্ত জমা দেওয়ার নিয়ন্ত্রণ মূল্যায়নের মালিকের কাছে থাকে।")}</p></section>}
              {exportMessage && <p role="status">{exportMessage}</p>}
              {reportQuery.isError && <p role="alert">{t("Report data could not be loaded", "প্রতিবেদনের ডেটা লোড করা যায়নি")}: {reportQuery.error.message}</p>}
              <div className="workspace-metrics">
                <div className="workspace-metric main"><div className="metric-head"><span>{t("READINESS SCORE · ANSWERED CONTROLS", "প্রস্তুতি স্কোর · উত্তর দেওয়া কন্ট্রোল")}</span></div><div className="big-score">{Math.round(Number(assessment.score))}<span>/100</span></div><div className="score-progress"><i style={{ width: `${Math.max(0, Math.min(100, Number(assessment.score)))}%` }} /></div><p>{controls.filter(row => row.assignment.responseScore !== null).length} of {controls.length} {t("controls answered · unanswered controls are excluded · ", "টি কন্ট্রোলের উত্তর দেওয়া হয়েছে · উত্তরহীন কন্ট্রোল বাদ · ")}{assessment.status.replaceAll("_", " ")} · {assessment.methodologyVersion}</p></div>
                <div className="workspace-metric"><div className="metric-head"><span>{t("EVIDENCE COVERAGE", "প্রমাণের আওতা")}</span><FileCheck2 size={16} /></div><strong className="metric-value">{Math.round(Number(assessment.evidenceCoverage))}<span>%</span></strong><p>{controls.filter(row => row.assignment.evidenceStatus === "submitted" || row.assignment.evidenceStatus === "verified").length} of {controls.length} {t("scoped controls have submitted or verified evidence", "টি নির্ধারিত কন্ট্রোলে প্রমাণ জমা বা যাচাই করা হয়েছে")}</p><div className="mini-progress lime"><i style={{ width: `${Math.max(0, Math.min(100, Number(assessment.evidenceCoverage)))}%` }} /></div></div>
                <div className="workspace-metric"><div className="metric-head"><span>{t("OPEN FINDINGS", "উন্মুক্ত ফাইন্ডিংস")}</span><ShieldAlert size={16} /></div><strong className="metric-value">{findings.length}</strong><p>{systems.length} {t("registered AI systems", "নিবন্ধিত AI সিস্টেম")}</p><div className="finding-dots" /></div>
              </div>
              {assessments.data && assessments.data.filter(item => item.id !== assessmentId && (!assessment.organizationId || item.organizationId === assessment.organizationId)).length > 0 && <section className="workspace-panel assessment-history-panel"><div className="panel-header"><div><span className="card-kicker">{t("ASSESSMENT HISTORY", "মূল্যায়নের ইতিহাস")}</span><h2>{t("Compare previous assessments", "আগের মূল্যায়নের সঙ্গে তুলনা")}</h2></div></div><p>{t("This comparison uses saved assessment snapshots and scores available to your account; it is not a national benchmark.", "এই তুলনা আপনার অ্যাকাউন্টে থাকা সংরক্ষিত snapshot ও score ব্যবহার করে; এটি কোনো জাতীয় benchmark নয়।")}</p><div className="assessment-history-table"><div className="assessment-history-head"><span>{t("Assessment", "মূল্যায়ন")}</span><span>{t("Status", "অবস্থা")}</span><span>{t("Score", "স্কোর")}</span><span>{t("Selection", "নির্বাচন")}</span></div>{[assessment, ...assessments.data.filter(item => item.id !== assessmentId && (!assessment.organizationId || item.organizationId === assessment.organizationId))].map(item => <div className="assessment-history-row" key={item.id}><strong>{item.title}</strong><span>{item.status.replaceAll("_", " ")}</span><span>{Math.round(Number(item.score))}/100</span><span>{item.controlSelectionVersion ?? item.methodologyVersion}</span></div>)}</div></section>}
              <div className="workspace-two-col">
                <section className="workspace-panel" id="domains">
                  <div className="panel-header"><div><span className="card-kicker">GAAF / DOMAIN SIGNAL</span><h2>{t("Controls by domain", "ডোমেইন অনুযায়ী কন্ট্রোল")}</h2></div></div>
                  {!Object.keys(groupedControls).length ? <p>{t("No controls are available for this assessment.", "এই মূল্যায়নের জন্য কোনো কন্ট্রোল পাওয়া যায়নি।")}</p> : <div className="domain-table">{Object.entries(groupedControls).map(([code, domain]) => {
                    const scores = domain.rows.map(row => row.assignment.responseScore).filter((value): value is number => value !== null);
                    const score = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / (scores.length * 4) * 100) : 0;
                    const tone = score >= 70 ? "good" : score >= 40 ? "warm" : "risk";
                    return <div className="domain-row" key={code}><span className="domain-code">{code}</span><strong>{domain.title}</strong><div className="row-bar"><i className={tone} style={{ width: `${score}%` }} /></div><b>{scores.length ? score : "—"}</b><span className={`row-state ${tone}`}>{scores.length ? `${scores.length}/${domain.rows.length} ${t("scored", "স্কোর দেওয়া হয়েছে")}` : t("Not scored", "স্কোর দেওয়া হয়নি")}</span></div>;
                  })}</div>}
                </section>
                <section className="workspace-panel" id="findings">
                  <div className="panel-header"><div><span className="card-kicker">{t("RECORDED FINDINGS", "রেকর্ডকৃত ফাইন্ডিংস")}</span><h2>{t("Findings", "ফাইন্ডিংস")}</h2></div></div>
                  {findings.length ? findings.map(finding => <article key={finding.id}><strong>{finding.title}</strong><p>{finding.description || t("No description provided.", "কোনো বিবরণ দেওয়া হয়নি।")}</p><small>{finding.severity} · {finding.status.replaceAll("_", " ")}</small></article>) : <p>{t("No findings recorded for this assessment.", "এই মূল্যায়নের জন্য কোনো ফাইন্ডিংস নথিভুক্ত নেই।")}</p>}
                  <Link className="panel-link" href={`/observatory/systems?assessmentId=${assessmentId}`}>{t("View AI systems", "AI সিস্টেম দেখুন")} ({systems.length}) <ArrowUpRight size={15} /></Link>
                </section>
              </div>
              <ActionItemsPanel assessmentId={assessmentId} organizationId={assessment.organizationId} isAssessmentOwner={isAssessmentOwner} />
              <div className="workspace-footnote"><ShieldCheck size={15} /><span>{assessment.posture === "self_assessment" ? t("Self-reported · Not independently verified", "স্ব-প্রতিবেদিত · স্বাধীনভাবে যাচাই করা হয়নি") : t("Pending reviewer verification", "পর্যালোচকের যাচাই অপেক্ষমাণ")}</span></div>
            </>
          )}
          {assessmentId <= 0 && !assessments.isLoading && !assessments.isError && !assessments.data?.length && <div className="empty-questionnaire">{t("No assessments are available for this account.", "এই অ্যাকাউন্টে কোনো মূল্যায়ন নেই।")}</div>}
        </div>
      </main>
    </div>
  );
}
