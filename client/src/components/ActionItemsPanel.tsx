import { useState } from "react";
import { CheckCircle2, ListChecks, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "../contexts/LocaleContext";

const statuses = ["planned", "in_progress", "blocked", "done"] as const;
const priorities = ["low", "medium", "high"] as const;

export default function ActionItemsPanel({ assessmentId, organizationId, isAssessmentOwner }: { assessmentId: number; organizationId: number | null; isAssessmentOwner: boolean }) {
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const utils = trpc.useUtils();
  const items = trpc.agaras.actionItems.useQuery({ assessmentId }, { enabled: assessmentId > 0 });
  const members = trpc.organization.members.useQuery({ organizationId: organizationId ?? 0 }, { enabled: Boolean(organizationId) });
  const [form, setForm] = useState({ title: "", description: "", ownerId: "", dueDate: "", priority: "medium" as typeof priorities[number] });
  const [message, setMessage] = useState("");
  const create = trpc.agaras.createActionItem.useMutation({
    onSuccess: async () => {
      setForm({ title: "", description: "", ownerId: "", dueDate: "", priority: "medium" });
      setMessage(t("Action item created.", "করণীয় কাজ যোগ হয়েছে।"));
      await utils.agaras.actionItems.invalidate({ assessmentId });
    },
    onError: error => setMessage(`${t("Could not create action item", "করণীয় কাজ যোগ করা যায়নি")}: ${error.message}`),
  });
  const update = trpc.agaras.updateActionItem.useMutation({
    onSuccess: async () => {
      setMessage(t("Action-item status updated.", "করণীয় কাজের অবস্থা হালনাগাদ হয়েছে।"));
      await utils.agaras.actionItems.invalidate({ assessmentId });
    },
    onError: error => setMessage(`${t("Could not update action item", "করণীয় কাজ হালনাগাদ করা যায়নি")}: ${error.message}`),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate({ assessmentId, title: form.title.trim(), description: form.description.trim() || undefined, ownerId: form.ownerId ? Number(form.ownerId) : undefined, dueDate: form.dueDate ? new Date(`${form.dueDate}T23:59:59`) : undefined, priority: form.priority });
  };
  const canManage = isAssessmentOwner || Boolean(members.data);
  return <section className="workspace-panel action-items-panel" id="action-items">
    <div className="panel-header"><div><span className="card-kicker">{t("IMPROVEMENT PLAN", "উন্নয়ন পরিকল্পনা")}</span><h2><ListChecks size={19} /> {t("Action-item tracking", "করণীয় কাজের অগ্রগতি")}</h2></div><span className="nav-count">{items.data?.length ?? 0}</span></div>
    <p>{t("Track remediation work with an owner, priority, due date, and progress status.", "দায়িত্বপ্রাপ্ত ব্যক্তি, অগ্রাধিকার, শেষ তারিখ ও অগ্রগতির অবস্থা দিয়ে প্রতিকারমূলক কাজ অনুসরণ করুন।")}</p>
    {items.isLoading && <p role="status">{t("Loading action items…", "করণীয় কাজ লোড হচ্ছে…")}</p>}
    {items.isError && <p role="alert">{t("Could not load action items", "করণীয় কাজ লোড করা যায়নি")}: {items.error.message}</p>}
    {items.data?.length ? <div className="action-item-list">{items.data.map(item => <article key={item.id} className="action-item-card">
      <div><strong>{item.title}</strong><p>{item.description || t("No details provided.", "কোনো বিবরণ দেওয়া হয়নি।")}</p><small>{t("Priority", "অগ্রাধিকার")}: {t(item.priority, item.priority === "high" ? "উচ্চ" : item.priority === "low" ? "কম" : "মাঝারি")} {item.ownerInfo ? ` · ${t("Owner", "দায়িত্বপ্রাপ্ত")}: ${item.ownerInfo.name ?? item.ownerInfo.email ?? `User ${item.ownerId}`}` : ""}{item.dueDate ? ` · ${t("Due", "শেষ তারিখ")}: ${new Date(item.dueDate).toLocaleDateString(isBangla ? "bn-BD" : "en-BD")}` : ""}</small></div>
      {canManage ? <label>{t("Status", "অবস্থা")}<select value={item.status} onChange={event => update.mutate({ actionItemId: item.id, status: event.target.value as typeof statuses[number] })}>{statuses.map(status => <option value={status} key={status}>{t(status.replaceAll("_", " "), status === "planned" ? "পরিকল্পিত" : status === "in_progress" ? "চলমান" : status === "blocked" ? "বাধাগ্রস্ত" : "সম্পন্ন")}</option>)}</select></label> : <span className="row-state">{t(item.status.replaceAll("_", " "), item.status === "planned" ? "পরিকল্পিত" : item.status === "in_progress" ? "চলমান" : item.status === "blocked" ? "বাধাগ্রস্ত" : "সম্পন্ন")}</span>}
    </article>)}</div> : !items.isLoading && <p className="incident-muted">{t("No action items yet.", "এখনো কোনো করণীয় কাজ নেই।")}</p>}
    {canManage ? <form className="action-item-create" onSubmit={submit}><h3><Plus size={16} /> {t("Add an action item", "করণীয় কাজ যোগ করুন")}</h3><label>{t("Task", "কাজ")}<input required minLength={2} maxLength={255} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>{t("Details", "বিবরণ")}<textarea maxLength={5000} rows={2} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label><div className="observatory-inline-fields"><label>{t("Owner", "দায়িত্বপ্রাপ্ত")}<select value={form.ownerId} onChange={event => setForm({ ...form, ownerId: event.target.value })}><option value="">{t("Unassigned", "দায়িত্ব দেওয়া হয়নি")}</option>{members.data?.map(row => <option key={row.user.id} value={row.user.id}>{row.user.name ?? row.user.email ?? `User ${row.user.id}`} · {row.member.role}</option>)}</select></label><label>{t("Due date", "শেষ তারিখ")}<input type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} /></label><label>{t("Priority", "অগ্রাধিকার")}<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as typeof priorities[number] })}>{priorities.map(priority => <option key={priority} value={priority}>{t(priority, priority === "high" ? "উচ্চ" : priority === "low" ? "কম" : "মাঝারি")}</option>)}</select></label></div><button className="button button-dark" disabled={create.isPending}>{create.isPending ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Create action item", "করণীয় কাজ তৈরি করুন")} <CheckCircle2 size={15} /></button></form> : organizationId && <p className="observatory-admin-note">{t("Only assessment owners and authorized organization managers can create or update action items.", "শুধু মূল্যায়নের মালিক ও অনুমোদিত প্রতিষ্ঠান ব্যবস্থাপক করণীয় কাজ তৈরি বা হালনাগাদ করতে পারেন।")}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
