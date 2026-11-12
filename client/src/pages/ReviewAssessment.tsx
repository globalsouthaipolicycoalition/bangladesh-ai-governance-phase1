import { ArrowLeft, Check, CheckCircle2, ChevronRight, FileCheck2, MessageSquareText, ShieldAlert, ShieldCheck, X, XCircle } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";

const decisionEvents = new Set(["approve", "reject", "request_changes"]);

export default function ReviewAssessment() {
  const { isBangla, toggleLocale } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const [, params] = useRoute("/review/:id");
  const assignmentId = Number(params?.id ?? 0);
  const assignments = trpc.review.myAssignments.useQuery();
  const assignmentRow = assignments.data?.find(item => item.assignment.id === assignmentId);
  const assessmentId = assignmentRow?.assessment?.id ?? 0;
  const scope = assignmentRow?.assignment.scope;
  const status = assignmentRow?.assignment.status;
  const isFindingScope = scope === "findings";

  const controls = trpc.agaras.controls.useQuery({ assessmentId }, { enabled: assessmentId > 0 && !isFindingScope && status === "active" });
  const findings = trpc.agaras.findings.useQuery({ assessmentId }, { enabled: assessmentId > 0 && isFindingScope && status === "active" });
  const events = trpc.review.events.useQuery({ assessmentId }, { enabled: assessmentId > 0 && status !== "invited" });
  const evidence = trpc.review.evidence.useQuery({ assessmentId }, { enabled: assessmentId > 0 && status === "active" && ["full", "domain", "evidence"].includes(scope ?? "") });
  const review = trpc.review.control.useMutation();
  const reviewFinding = trpc.review.finding.useMutation();
  const complete = trpc.review.complete.useMutation({ onSuccess: async () => { await Promise.all([assignments.refetch(), events.refetch()]); } });
  const [message, setMessage] = useState("");
  const [activeControl, setActiveControl] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const rows = controls.data ?? [];
  const visibleEvidence = evidence.data ?? [];
  const findingRows = findings.data ?? [];
  const findingDecisions = useMemo(() => {
    const decisions = new Map<number, string>();
    for (const event of events.data ?? []) {
      if (event.entityType === "finding" && typeof event.entityId === "number" && decisionEvents.has(event.eventType) && !decisions.has(event.entityId)) decisions.set(event.entityId, event.eventType);
    }
    return decisions;
  }, [events.data]);
  const pending = isFindingScope
    ? findingRows.filter(item => !findingDecisions.has(item.id)).length
    : scope === "evidence"
      ? rows.filter(row => row.assignment.evidenceStatus === "submitted").length
      : rows.filter(row => row.assignment.reviewDecision === "pending").length;
  const workLoading = isFindingScope
    ? findings.isLoading || events.isLoading
    : controls.isLoading || (scope === "evidence" && evidence.isLoading);
  const workError = isFindingScope ? findings.error?.message : controls.error?.message;
  const canReview = status === "active";

  const decideControl = (controlId: number, eventType: "approve" | "reject" | "request_changes" | "status_change" | "comment", evidenceStatus?: "verified" | "rejected", note?: string, applicabilityDecision?: "accept" | "reject") => {
    setActionError("");
    review.mutate({ assessmentId, controlId, eventType, evidenceStatus, applicabilityDecision, message: note }, {
      onSuccess: async () => {
        setNotice(eventType === "status_change" ? t(`Evidence marked ${evidenceStatus}.`, `প্রমাণ ${evidenceStatus === "verified" ? "যাচাইকৃত" : "প্রত্যাখ্যাত"} হিসেবে চিহ্নিত হয়েছে।`) : t("Control decision saved.", "নিয়ন্ত্রণের সিদ্ধান্ত সংরক্ষিত হয়েছে।"));
        setMessage("");
        setActiveControl(null);
        await Promise.all([controls.refetch(), events.refetch(), evidence.refetch(), assignments.refetch()]);
      },
      onError: error => setActionError(error.message),
    });
  };
  const decideFinding = (findingId: number, eventType: "approve" | "reject" | "request_changes") => {
    setActionError("");
    reviewFinding.mutate({ assessmentId, findingId, eventType, message: message.trim() || undefined }, {
      onSuccess: async () => {
        setNotice(t("Finding decision saved to the review trail.", "পর্যালোচনা নথিতে অনুসন্ধানের সিদ্ধান্ত সংরক্ষিত হয়েছে।"));
        setMessage("");
        await Promise.all([findings.refetch(), events.refetch(), assignments.refetch()]);
      },
      onError: error => setActionError(error.message),
    });
  };
  const completeAssignment = () => {
    setActionError("");
    complete.mutate({ assignmentId }, {
      onSuccess: () => setNotice(t("Review completed.", "পর্যালোচনা সম্পন্ন হয়েছে।")),
      onError: error => setActionError(error.message),
    });
  };

  if (assignments.isLoading) return <div className="assessment-shell"><main className="review-detail-main container"><div className="review-empty" role="status">{t("Loading review assignment…", "পর্যালোচনা-দায়িত্ব লোড হচ্ছে…")}</div></main></div>;
  if (assignments.isError) return <div className="assessment-shell"><main className="review-detail-main container"><div className="review-empty" role="alert"><XCircle size={20} /><strong>{t("Could not load review assignment", "পর্যালোচনা-দায়িত্ব লোড করা যায়নি")}</strong><span>{assignments.error.message}</span><button className="review-action open" onClick={() => assignments.refetch()}>{t("Try again", "আবার চেষ্টা করুন")}</button></div></main></div>;
  if (!assignmentRow) return <div className="assessment-shell"><main className="review-detail-main container"><div className="review-empty"><XCircle size={20} /><strong>{t("Review assignment not found", "পর্যালোচনা-দায়িত্ব পাওয়া যায়নি")}</strong><Link href="/review" className="back-button">{t("Back to queue", "সারিতে ফিরে যান")}</Link></div></main></div>;
  if (!assignmentRow.assessment) {
    const invitation = assignmentRow.assignment.status === "invited";
    const title = invitation ? t("Invitation awaiting response", "আমন্ত্রণের জবাবের অপেক্ষায়") : assignmentRow.assignment.status === "declined" ? t("Invitation declined", "আমন্ত্রণ প্রত্যাখ্যাত") : t("Assignment access ended", "দায়িত্বের অ্যাক্সেস শেষ হয়েছে");
    const description = invitation ? t("Assessment information stays hidden until this invitation is accepted. Accept or decline it from your review queue.", "আমন্ত্রণ গ্রহণ না করা পর্যন্ত মূল্যায়নের তথ্য গোপন থাকবে। পর্যালোচনা সারি থেকে আমন্ত্রণ গ্রহণ বা প্রত্যাখ্যান করুন।") : t("Assessment information remains hidden because this assignment is no longer active.", "এই দায়িত্বটি আর সক্রিয় না থাকায় মূল্যায়নের তথ্য গোপন রয়েছে।");
    return <div className="assessment-shell"><header className="assessment-header container"><Link href="/review" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong></Link><div className="assessment-header-right"><button className="language-button" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button></div></header><main className="review-detail-main container"><div className="review-empty"><ShieldCheck size={20} /><strong>{title}</strong><span>{description}</span><Link href="/review" className="review-action open">Open review queue <ArrowLeft size={15} /></Link></div></main></div>;
  }

  const assessment = assignmentRow.assessment;
  const isReadOnly = status !== "active";
  const readyToComplete = !workLoading && !workError && pending === 0;

  return (
    <div className="assessment-shell">
      <header className="assessment-header container"><Link href="/review" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong></Link><div className="assessment-header-right"><button className="language-button" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button><span className="assessment-version">{t("CONTROL REVIEW", "নিয়ন্ত্রণ পর্যালোচনা")} / {t(scope ?? "", scope === "findings" ? "অনুসন্ধান" : scope === "evidence" ? "প্রমাণ" : scope === "domain" ? "ডোমেইন" : "সম্পূর্ণ")}</span><Link href="/review" className="close-link">Exit review <ArrowLeft size={15} /></Link></div></header>
      <main className="review-detail-main container">
        <div className="review-detail-top"><div><div className="eyebrow"><span className="eyebrow-index">ASSIGNMENT {assignmentId}</span> / {t(status ?? "", status === "active" ? "সক্রিয়" : status === "completed" ? "সম্পন্ন" : status === "invited" ? "আমন্ত্রিত" : status === "declined" ? "প্রত্যাখ্যাত" : status === "revoked" ? "প্রত্যাহৃত" : status ?? "")}</div><h1>{assessment.title}</h1><p>{assessment.jurisdiction ?? t("Jurisdiction not set", "এখতিয়ার নির্ধারিত নয়")} · {assessment.methodologyVersion} · {scope === "findings" ? t("Findings scope", "অনুসন্ধানের পরিধি") : `${rows.length} ${t("controls in scope", "টি নিয়ন্ত্রণ পরিধিতে")} `}</p></div><div className="review-detail-actions">{status === "active" && <button className="button button-lime" disabled={complete.isPending || !readyToComplete} title={pending ? `Resolve ${pending} pending item${pending === 1 ? "" : "s"} before completing.` : undefined} onClick={completeAssignment}>{complete.isPending ? "Closing review…" : "Complete review"} <CheckCircle2 size={16} /></button>}{status === "completed" && <span className="verified-pill"><ShieldCheck size={15} /> Review closed</span>}{status === "invited" && <span className="muted-status">{t("Invitation pending acceptance", "আমন্ত্রণ গ্রহণের অপেক্ষায়")}</span>}{(status === "declined" || status === "revoked") && <span className="muted-status">{t(status, status === "declined" ? "প্রত্যাখ্যাত" : "প্রত্যাহৃত")}</span>}</div></div>
        {notice && <p role="status" className="muted-copy">{notice}</p>}{actionError && <p role="alert" className="muted-copy">{actionError}</p>}{(review.isPending || reviewFinding.isPending || complete.isPending) && <p role="status" className="muted-copy">{t("Saving review update…", "পর্যালোচনার হালনাগাদ সংরক্ষণ হচ্ছে…")}</p>}
        {workLoading && <div className="review-empty" role="status">{t("Loading assigned work and scope…", "নির্ধারিত কাজ ও পরিধি লোড হচ্ছে…")}</div>}
        {workError && <div className="review-empty" role="alert"><strong>{t("Could not load assigned work", "নির্ধারিত কাজ লোড করা যায়নি")}</strong><span>{workError}</span><button className="review-action open" onClick={() => { void (isFindingScope ? findings.refetch() : controls.refetch()); }}>{t("Try again", "আবার চেষ্টা করুন")}</button></div>}
        {status === "active" && !workLoading && !workError && <p className="review-notice" role="status">{pending ? `${pending} assigned item${pending === 1 ? " remains" : "s remain"} before this review can be completed.` : "All work currently visible in this assignment is resolved."}</p>}
        {status === "invited" ? <div className="review-empty">{t("Accept this assignment from the review queue before viewing review work.", "পর্যালোচনার কাজ দেখতে সারি থেকে এই দায়িত্ব গ্রহণ করুন।")}</div> : (
          <div className="review-detail-layout">
            <section>
              <div className="review-detail-banner"><ShieldCheck size={17} /><span>{t("Decision standard: review only the evidence and records in the assigned scope. Every decision is written to the review event trail.", "সিদ্ধান্তের মানদণ্ড: নির্ধারিত পরিধির প্রমাণ ও নথিই কেবল পর্যালোচনা করুন। প্রতিটি সিদ্ধান্ত পর্যালোচনা-ঘটনার নথিতে লেখা হয়।")}</span></div>
              {status === "completed" ? <div className="review-empty" role="status">{t("This assignment is closed and read-only. Its permitted audit events remain available.", "এই দায়িত্ব বন্ধ এবং শুধু-পাঠযোগ্য। অনুমোদিত নিরীক্ষা-ঘটনাগুলো দেখা যাবে।")}</div> : isFindingScope ? <div className="control-review-list">
                {findings.isSuccess && !findingRows.length && <div className="review-empty">{t("No findings are available in this assignment scope.", "এই দায়িত্বের পরিধিতে কোনো অনুসন্ধান নেই।")}</div>}
                {findingRows.map(item => {
                  const decision = findingDecisions.get(item.id);
                  return <article className="control-review-card" key={item.id}><span className="control-review-code">{item.severity ?? "Finding"} · {decision ? t(decision.replaceAll("_", " "), ({ approve: "অনুমোদিত", reject: "প্রত্যাখ্যাত", request_changes: "সংশোধন অনুরোধ" } as Record<string, string>)[decision] ?? decision) : t("decision pending", "সিদ্ধান্ত অপেক্ষমাণ")}</span><h2>{item.title}</h2><p>{item.description ?? "No description provided."}</p>{item.recommendation && <p><strong>{t("Recommendation:", "সুপারিশ:")}</strong> {item.recommendation}</p>}{canReview && <><label>{t("Reviewer note (optional)", "পর্যালোচকের নোট (ঐচ্ছিক)")}<textarea aria-label={`Reviewer note for ${item.title}`} value={message} onChange={event => setMessage(event.target.value)} maxLength={5000} rows={2} /></label><div className="control-review-actions"><button disabled={reviewFinding.isPending} onClick={() => decideFinding(item.id, "approve")} className="review-action accept"><Check size={14} /> {t("Approve", "অনুমোদন")}</button><button disabled={reviewFinding.isPending} onClick={() => decideFinding(item.id, "request_changes")} className="review-action changes"><ChevronRight size={14} /> {t("Request changes", "সংশোধনের অনুরোধ")}</button><button disabled={reviewFinding.isPending} onClick={() => decideFinding(item.id, "reject")} className="review-action decline"><X size={14} /> {t("Reject", "প্রত্যাখ্যান")}</button></div></>}</article>;
                })}
              </div> : <div className="control-review-list">
                {controls.isSuccess && !rows.length && <div className="review-empty">{t("No controls are available in this assignment scope.", "এই দায়িত্বের পরিধিতে কোনো নিয়ন্ত্রণ নেই।")}</div>}
                {rows.map(({ assignment, control, domain }) => {
                  const attachments = visibleEvidence.filter(item => item.evidence.controlId === control.id);
                  const canVerifyEvidence = canReview && assignment.evidenceStatus === "submitted" && attachments.length > 0 && ["full", "domain", "evidence"].includes(scope ?? "");
                  return <article className={`control-review-card ${assignment.reviewDecision}`} key={assignment.id}>
                    <div className="control-review-head"><span className="domain-chip">{domain.code}</span><span className={`criticality-chip ${control.criticality}`}>{control.criticality}</span><span className="control-review-code">{control.code}</span>{scope !== "evidence" && <span className="control-review-decision">{t(assignment.reviewDecision.replace("_", " "), ({ pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "প্রত্যাখ্যাত", request_changes: "সংশোধন অনুরোধ" } as Record<string, string>)[assignment.reviewDecision] ?? assignment.reviewDecision)}</span>}</div>
                    <h2>{control.title}</h2><p>{control.objective}</p>{assignment.applicabilityStatus === "not_applicable_pending" && <div className="review-na-request"><strong>{t("Not Applicable request pending", "প্রযোজ্য নয় অনুরোধ পর্যালোচনার অপেক্ষায়")}</strong><p>{assignment.applicabilityRationale ?? t("No rationale supplied.", "কোনো যুক্তি দেওয়া হয়নি।")}</p>{canReview && ["full", "domain"].includes(scope ?? "") && <div className="control-review-actions"><button disabled={review.isPending} onClick={() => decideControl(control.id, "status_change", undefined, undefined, "accept")} className="review-action accept">{t("Accept Not Applicable", "প্রযোজ্য নয় গ্রহণ")}</button><button disabled={review.isPending} onClick={() => decideControl(control.id, "status_change", undefined, undefined, "reject")} className="review-action decline">{t("Reject Not Applicable", "প্রযোজ্য নয় প্রত্যাখ্যান")}</button></div>}</div>}<div className="control-evidence-line"><FileCheck2 size={15} /><span>{control.evidenceRequirement}</span><b className={`evidence-state ${assignment.evidenceStatus}`}>{t(assignment.evidenceStatus.replaceAll("_", " "), ({ submitted: "জমা হয়েছে", verified: "যাচাইকৃত", rejected: "প্রত্যাখ্যাত" } as Record<string, string>)[assignment.evidenceStatus] ?? assignment.evidenceStatus)}</b></div>
                    {scope === "evidence" && <p className="muted-copy">{t("Answer scores, response notes, and control decisions are withheld from evidence-only assignments.", "শুধু-প্রমাণভিত্তিক দায়িত্বে উত্তরের স্কোর, জবাবের নোট এবং নিয়ন্ত্রণ-সিদ্ধান্ত দেখানো হয় না।")}</p>}
                    {evidence.isError && <p role="alert" className="muted-copy">Evidence links unavailable: {evidence.error.message}</p>}
                    {attachments.length > 0 && <ul className="review-evidence-files">{attachments.map(item => <li key={item.evidence.id}><a href={item.downloadUrl} target="_blank" rel="noreferrer">{item.evidence.fileName}</a><small>{item.control?.code ?? "Control attachment"} · {item.evidence.mimeType ?? "Unknown type"} · {item.evidence.fileSize ?? 0} bytes</small></li>)}</ul>}
                    {activeControl === control.id && canReview && scope !== "evidence" && <div className="review-comment-box"><MessageSquareText size={15} /><textarea aria-label={t("Reviewer note", "পর্যালোচকের নোট")} value={message} onChange={event => setMessage(event.target.value)} placeholder={t("Add a reviewer note or evidence rationale…", "পর্যালোচকের নোট বা প্রমাণের যুক্তি লিখুন…")} rows={3} maxLength={5000} /><button className="text-button" onClick={() => { setActiveControl(null); setMessage(""); }}>{t("Cancel", "বাতিল")}</button><button className="text-button" disabled={review.isPending || !message.trim()} onClick={() => decideControl(control.id, "comment", undefined, message.trim())}>{t("Save note", "নোট সংরক্ষণ")}</button></div>}
                    {canReview && <div className="control-review-actions">{scope !== "evidence" && <><button disabled={review.isPending} onClick={() => decideControl(control.id, "approve")} className="review-action accept"><Check size={14} /> {t("Approve", "অনুমোদন")}</button><button disabled={review.isPending} onClick={() => decideControl(control.id, "request_changes")} className="review-action changes"><ChevronRight size={14} /> {t("Request changes", "সংশোধনের অনুরোধ")}</button><button disabled={review.isPending} onClick={() => decideControl(control.id, "reject")} className="review-action decline"><X size={14} /> {t("Reject", "প্রত্যাখ্যান")}</button><button disabled={review.isPending} onClick={() => { setActiveControl(activeControl === control.id ? null : control.id); setMessage(""); }} className="review-action comment"><MessageSquareText size={14} /> Note</button></>}{canVerifyEvidence && <><button disabled={review.isPending} onClick={() => decideControl(control.id, "status_change", "verified")} className="review-action evidence"><FileCheck2 size={14} /> {t("Verify evidence", "প্রমাণ যাচাই")}</button><button disabled={review.isPending} onClick={() => decideControl(control.id, "status_change", "rejected")} className="review-action decline"><XCircle size={14} /> {t("Reject evidence", "প্রমাণ প্রত্যাখ্যান")}</button></>}</div>}
                  </article>;
                })}
              </div>}
            </section>
            <aside className="review-event-panel"><div className="panel-header"><div><span className="card-kicker">{t("AUDIT TRAIL", "নিরীক্ষা-নথি")}</span><h2>{t("Review events", "পর্যালোচনার ঘটনা")}</h2></div><ShieldAlert size={18} /></div><div className="review-event-list">{events.isLoading && <p role="status" className="muted-copy">{t("Loading events…", "ঘটনা লোড হচ্ছে…")}</p>}{events.isError && <p role="alert" className="muted-copy">{t("Could not load events:", "ঘটনা লোড করা যায়নি:")} {events.error.message} <button className="text-button" onClick={() => events.refetch()}>{t("Retry", "আবার চেষ্টা করুন")}</button></p>}{events.data?.slice(0, 12).map(event => <div className="review-event" key={event.id}><span /><div><strong>{event.eventType.replace("_", " ")}</strong><p>{event.message ?? "Review decision recorded"}</p><small>{new Date(event.createdAt).toLocaleString()}</small></div></div>)}{events.isSuccess && !events.data?.length && <p className="muted-copy">{t("Events will appear as you review assigned work.", "নির্ধারিত কাজ পর্যালোচনা করলে ঘটনাগুলো এখানে দেখা যাবে।")}</p>}</div></aside>
          </div>
        )}
        {isReadOnly && status === "completed" && <p className="workspace-footnote"><ShieldCheck size={15} /><span>{t("This review is closed and read-only. Its permitted audit events remain available.", "এই পর্যালোচনা বন্ধ এবং শুধু-পাঠযোগ্য। অনুমোদিত নিরীক্ষা-ঘটনাগুলো দেখা যাবে।")}</span></p>}
        <Link href="/review" className="back-button"><ArrowLeft size={16} /> {t("Back to review queue", "পর্যালোচনা সারিতে ফিরে যান")}</Link>
      </main>
    </div>
  );
}
