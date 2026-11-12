import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Link } from "wouter";

type UpcomingModuleProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  focus: string[];
};

export default function UpcomingModule({ eyebrow, title, description, icon: Icon, focus }: UpcomingModuleProps) {
  return (
    <div className="upcoming-module-page">
      <header className="assessment-header container"><Link href="/" className="assessment-logo"><span className="brand-mark"><span /><span /><span /></span><strong>Bangladesh AI Readiness Assessment</strong></Link><Link href="/" className="close-link"><ArrowLeft size={15} /> Platform home</Link></header>
      <main className="upcoming-module-main container">
        <div className="upcoming-module-icon"><Icon size={30} strokeWidth={1.6} /></div>
        <div className="eyebrow"><span className="eyebrow-index">{eyebrow}</span> PLATFORM ROADMAP</div>
        <h1>{title}</h1>
        <span className="upcoming-module-badge"><Clock3 size={14} /> Upcoming module</span>
        <p className="upcoming-module-lede">{description}</p>
        <section className="upcoming-module-panel"><span className="card-kicker">DESIGNING FOR BANGLADESH</span><h2>Built to become a trusted public-interest capability.</h2><div className="upcoming-focus-list">{focus.map(item => <div key={item}><span />{item}</div>)}</div></section>
        <Link className="back-button" href="/"><ArrowLeft size={16} /> Return to platform homepage</Link>
      </main>
    </div>
  );
}
