import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "../const";
import { useLocale } from "../contexts/LocaleContext";

export default function AuthGate({ children, label = "this workspace" }: { children: React.ReactNode; label?: string }) {
  const me = trpc.auth.me.useQuery();
  const { isBangla } = useLocale();
  const t = (en: string, bn: string) => isBangla ? bn : en;
  const labels: Record<string, string> = isBangla ? {
    "your organization AI-system register": "আপনার প্রতিষ্ঠানের AI সিস্টেম তালিকা",
    "your organization AI-system record": "আপনার প্রতিষ্ঠানের AI সিস্টেম রেকর্ড",
    "incident reporting": "ঘটনা প্রতিবেদন", "your assessment": "আপনার মূল্যায়ন",
    "your workspace": "আপনার কর্মক্ষেত্র", "the admin control plane": "প্রশাসনিক নিয়ন্ত্রণকেন্দ্র",
    "the reviewer queue": "পর্যালোচকের কাজের তালিকা", "review management": "পর্যালোচনা ব্যবস্থাপনা",
    "the control review": "নিয়ন্ত্রণ পর্যালোচনা",
  } : {};
  if (me.isLoading) return <div className="assessment-shell"><main className="auth-gate-main container"><div className="auth-gate-card"><div className="auth-gate-spinner" /><span>{t("Checking your secure session…", "আপনার নিরাপদ সেশন যাচাই হচ্ছে…")}</span></div></main></div>;
  if (!me.data) return <div className="assessment-shell"><header className="assessment-header container"><Link href="/" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong></Link></header><main className="auth-gate-main container"><div className="auth-gate-card"><div className="auth-gate-icon"><ShieldCheck size={24} /></div><span className="card-kicker">{t("AUTHENTICATION REQUIRED", "প্রমাণীকরণ আবশ্যক")}</span><h1>{t("Sign in to access", "প্রবেশ করতে সাইন ইন করুন")} <em>{labels[label] ?? label}.</em></h1><p>{t("Your assessment data, evidence and reviewer decisions are private to your account. Continue with secure Bangladesh AI Readiness Assessment login to proceed.", "আপনার মূল্যায়নের তথ্য, প্রমাণ এবং পর্যালোচনার সিদ্ধান্ত আপনার অ্যাকাউন্টে ব্যক্তিগতভাবে সংরক্ষিত। এগিয়ে যেতে নিরাপদ লগইন ব্যবহার করুন।")}</p><button className="button button-dark" onClick={startLogin}>{t("Sign in securely", "নিরাপদে সাইন ইন করুন")} <LogIn size={16} /></button><Link className="back-button" href="/"><ArrowLeft size={15} /> {t("Back to Bangladesh AI Readiness Assessment", "বাংলাদেশ AI প্রস্তুতি মূল্যায়নে ফিরুন")}</Link></div></main></div>;
  return <>{children}</>;
}
