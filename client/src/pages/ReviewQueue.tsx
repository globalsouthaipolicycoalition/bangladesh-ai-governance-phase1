import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, FileCheck2, Flag, ListChecks, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";

export default function ReviewQueue() {
  const { isBangla, toggleLocale } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const dashboard = trpc.review.dashboard.useQuery();
  const utils = trpc.useUtils();
  const respond = trpc.review.respond.useMutation({
    onSuccess: async () => {
      await Promise.all([dashboard.refetch(), utils.review.myAssignments.invalidate()]);
    },
  });
  const totals = dashboard.data?.totals;
  const assignments = dashboard.data?.assignments ?? [];

  return (
    <div className="assessment-shell">
      <header className="assessment-header container">
        <Link href="/" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong></Link>
        <div className="assessment-header-right"><span className="assessment-version">{t("ASSURANCE / REVIEW CONTROL PLANE", "নিশ্চয়তা / পর্যালোচনা নিয়ন্ত্রণকেন্দ্র")}</span><button className="language-button" onClick={toggleLocale}>{isBangla ? "English" : "বাংলা"}</button><Link href="/workspace" className="close-link">{t("Open workspace", "কর্মক্ষেত্র খুলুন")} <ArrowUpRight size={15} /></Link></div>
      </header>
      <main className="review-main container">
        <div className="eyebrow"><span className="eyebrow-index">{t("REVIEWER CONTROL PLANE / SCOPED ACCESS", "পর্যালোচক নিয়ন্ত্রণকেন্দ্র / নির্ধারিত প্রবেশাধিকার")}</span></div>
        <div className="review-heading"><div><h1>{t("Make assurance", "নিশ্চয়তা কার্যক্রমকে করুন")} <em>{t("traceable.", "অনুসরণযোগ্য।")}</em></h1><p>{t("See assigned work, follow its declared scope, and close reviews with a visible decision trail.", "নিয়োগকৃত কাজ দেখুন, নির্ধারিত পরিধি অনুসরণ করুন এবং দৃশ্যমান সিদ্ধান্ত-ইতিহাসসহ পর্যালোচনা সম্পন্ন করুন।")}</p></div><span className="review-badge"><ShieldCheck size={15} /> {t("Role-scoped access", "ভূমিকাভিত্তিক প্রবেশাধিকার")}</span></div>
        {dashboard.isSuccess && <div className="review-metrics">
          <div><span>{t("ASSIGNMENTS", "নিয়োগসমূহ")}</span><strong>{totals?.assignments ?? 0}</strong><small>{t("Across your review queue", "আপনার পর্যালোচনা তালিকায়")}</small></div>
          <div><span>{t("PENDING ITEMS", "বিচারাধীন বিষয়")}</span><strong>{totals?.pending ?? 0}</strong><small>{t("Need a reviewer decision", "পর্যালোচকের সিদ্ধান্ত প্রয়োজন")}</small></div>
          <div><span>{t("APPROVED", "অনুমোদিত")}</span><strong>{totals?.approved ?? 0}</strong><small>{t("Decisions recorded", "সিদ্ধান্ত নথিভুক্ত হয়েছে")}</small></div>
          <div className="risk"><span>{t("CHANGES / REJECTED", "সংশোধন / প্রত্যাখ্যাত")}</span><strong>{totals?.rejected ?? 0}</strong><small>{t("Need owner follow-up", "মালিকের পরবর্তী পদক্ষেপ প্রয়োজন")}</small></div>
          <div><span>{t("EVIDENCE WAITING", "প্রমাণ অপেক্ষমাণ")}</span><strong>{totals?.evidencePending ?? 0}</strong><small>{t("Submitted for verification", "যাচাইয়ের জন্য জমা হয়েছে")}</small></div>
        </div>}
        <div className="review-notice"><FileCheck2 size={16} /><span>{t("Reviewer access never grants organization ownership. Assessment details appear only after the assignment is accepted, and every action is restricted to its declared scope.", "পর্যালোচকের প্রবেশাধিকার কখনোই প্রতিষ্ঠানের মালিকানা দেয় না। নিয়োগ গ্রহণের পরেই মূল্যায়নের বিবরণ দেখা যাবে এবং প্রতিটি কাজ নির্ধারিত পরিধির মধ্যে সীমাবদ্ধ থাকবে।")}</span></div>
        <section className="review-section-head"><div><span className="card-kicker">{t("MY ASSIGNMENTS", "আমার নিয়োগসমূহ")}</span><h2>{t("Work queue", "কাজের তালিকা")}</h2></div>{dashboard.isSuccess && <span className="review-total">{assignments.length} {t("record(s)", "টি রেকর্ড")}</span>}</section>
        <div className="review-list">
          {dashboard.isLoading && <div className="review-empty" role="status">{t("Loading review control plane…", "পর্যালোচনা নিয়ন্ত্রণকেন্দ্র লোড হচ্ছে…")}</div>}
          {dashboard.isError && <div className="review-empty" role="alert"><XCircle size={19} /><strong>{t("Could not load review assignments", "পর্যালোচনা নিয়োগ লোড করা যায়নি")}</strong><span>{dashboard.error.message}</span><button className="review-action open" onClick={() => dashboard.refetch()}>{t("Try again", "আবার চেষ্টা করুন")}</button></div>}
          {dashboard.isSuccess && assignments.map(({ assignment, assessment, stats }) => (
            <article className="review-card review-card-rich" key={assignment.id}>
              <div className="review-card-icon">{assignment.status === "completed" ? <CheckCircle2 size={19} /> : assignment.status === "declined" || assignment.status === "revoked" ? <XCircle size={19} /> : <ListChecks size={19} />}</div>
              <div className="review-card-body">
                <span className="card-kicker">{t(assignment.scope.toUpperCase(), assignment.scope === "full" ? "সম্পূর্ণ" : assignment.scope === "domain" ? "ডোমেইন" : "প্রমাণ")} {t("SCOPE", "পরিধি")} / {t(assignment.status.toUpperCase(), assignment.status === "invited" ? "আমন্ত্রিত" : assignment.status === "active" ? "সক্রিয়" : assignment.status === "completed" ? "সম্পন্ন" : assignment.status === "declined" ? "প্রত্যাখ্যাত" : assignment.status === "revoked" ? "বাতিল" : assignment.status)}</span>
                <h2>{assessment?.title ?? (assignment.status === "invited" ? t("Assessment invitation", "মূল্যায়নের আমন্ত্রণ") : t("Assessment unavailable", "মূল্যায়ন অনুপলভ্য"))}</h2>
                {assessment ? <p>{assessment.jurisdiction ?? t("Jurisdiction not set", "এখতিয়ার নির্ধারিত নয়")} · {assessment.methodologyVersion} · {t("Assigned", "নিয়োগের তারিখ")} {new Date(assignment.assignedAt).toLocaleDateString(isBangla ? "bn-BD" : "en-US")}</p> : <p>{assignment.status === "invited" ? t("Accept or decline this assignment to continue. Assessment details are withheld until acceptance.", "এগিয়ে যেতে এই নিয়োগ গ্রহণ বা প্রত্যাখ্যান করুন। গ্রহণ না করা পর্যন্ত মূল্যায়নের বিবরণ গোপন থাকবে।") : t("The assessment record is no longer available.", "মূল্যায়নের রেকর্ডটি আর উপলভ্য নেই।")}</p>}
                {assessment && assignment.status !== "invited" && assignment.status !== "declined" && assignment.status !== "revoked" && <div className="review-progress"><span><b>{stats.approved}</b>{t("approved", "অনুমোদিত")}</span><span><b>{stats.pending}</b>{t("pending", "বিচারাধীন")}</span><span><b>{stats.rejected}</b>{t("changes", "সংশোধন")}</span><i><em style={{ width: `${stats.total ? ((stats.approved + stats.rejected) / stats.total) * 100 : 0}%` }} /></i></div>}
              </div>
              <div className="review-card-actions">
                {assignment.status === "invited" ? <>
                  <button className="review-action accept" disabled={respond.isPending} onClick={() => respond.mutate({ assignmentId: assignment.id, response: "accept" })}>{t("Accept", "গ্রহণ করুন")} <CheckCircle2 size={14} /></button>
                  <button className="review-action decline" disabled={respond.isPending} onClick={() => respond.mutate({ assignmentId: assignment.id, response: "decline" })}>{t("Decline", "প্রত্যাখ্যান করুন")} <XCircle size={14} /></button>
                </> : assignment.status === "declined" || assignment.status === "revoked" || !assessment ? <span className="muted-status">{assignment.status === "declined" ? t("declined", "প্রত্যাখ্যাত") : assignment.status === "revoked" ? t("revoked", "বাতিল") : t("Unavailable", "অনুপলভ্য")}</span> : <Link className="review-action open" href={`/review/${assignment.id}`}>{assignment.status === "completed" ? t("View review", "পর্যালোচনা দেখুন") : t("Open review", "পর্যালোচনা খুলুন")} <ArrowUpRight size={14} /></Link>}
              </div>
            </article>
          ))}
          {respond.isPending && <p role="status" className="muted-copy">{t("Saving invitation response…", "আমন্ত্রণের উত্তর সংরক্ষণ হচ্ছে…")}</p>}
          {respond.isError && <p role="alert" className="muted-copy">{t("Invitation response failed", "আমন্ত্রণের উত্তর ব্যর্থ হয়েছে")}: {respond.error.message}</p>}
          {respond.isSuccess && <p role="status" className="muted-copy">{t("Invitation response saved.", "আমন্ত্রণের উত্তর সংরক্ষিত হয়েছে।")}</p>}
          {dashboard.isSuccess && !assignments.length && <div className="review-empty"><UsersRound size={19} /><strong>{t("No reviewer assignments yet", "এখনো কোনো পর্যালোচনা নিয়োগ নেই")}</strong><span>{t("When an assessment owner assigns you a scope, it will appear here.", "মূল্যায়নের মালিক আপনাকে কোনো পরিধি নিয়োগ করলে তা এখানে দেখা যাবে।")}</span></div>}
        </div>
        <div className="review-footer-grid"><div><Flag size={17} /><div><strong>{t("Review standard", "পর্যালোচনা মানদণ্ড")}</strong><span>{t("Every control decision includes reviewer identity, timestamp and event history.", "প্রতিটি নিয়ন্ত্রণ-সিদ্ধান্তে পর্যালোচকের পরিচয়, সময় এবং ঘটনার ইতিহাস থাকে।")}</span></div></div><div><Clock3 size={17} /><div><strong>{t("Complete with care", "যত্নসহকারে সম্পন্ন করুন")}</strong><span>{t("Resolve the work covered by your assignment before closing the review.", "পর্যালোচনা বন্ধ করার আগে নিয়োগের আওতাভুক্ত কাজ সম্পন্ন করুন।")}</span></div></div></div>
        <Link className="back-button" href="/"><ArrowLeft size={16} /> {t("Back to Bangladesh AI Readiness Assessment", "বাংলাদেশ এআই প্রস্তুতি মূল্যায়নে ফিরুন")}</Link>
      </main>
    </div>
  );
}
