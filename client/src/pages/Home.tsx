import {
  ArrowUpRight,
  BarChart3,
  Binoculars,
  Check,
  ClipboardCheck,
  Clock3,
  Globe2,
  Menu,
  Network,
  ShieldCheck,
  Siren,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "../const";
import { useLocale } from "../contexts/LocaleContext";
import { SELF_REPORTED_NOTICE } from "@shared/bangladesh";

const LOGO_SRC = "/manus-storage/bangladesh-ai-governance-logo_29827c3b.png";
const HERO_SRC = "/manus-storage/bangladesh-ai-governance-hero_9a89313a.webp";

type ModuleCard = {
  title: string;
  description: string;
  href: string;
  status: "Available" | "Upcoming";
  action: string;
  tone: "assessment" | "observatory" | "incident";
  icon: LucideIcon;
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isBangla, locale, toggleLocale } = useLocale();
  const me = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });
  const closeMenu = () => setMenuOpen(false);

  const labels = isBangla
    ? {
        home: "হোম",
        platform: "আমাদের প্ল্যাটফর্ম",
        resources: "রিসোর্স",
        about: "আমাদের লক্ষ্য",
        contact: "যোগাযোগ",
        signIn: "লগইন",
        signOut: "লগআউট",
        assessmentCta: "মূল্যায়ন শুরু করুন",
        heroPill: "দায়িত্বশীল AI ভবিষ্যৎ গড়ি",
        heroLead: "বাংলাদেশের জন্য বিশ্বস্ত, অন্তর্ভুক্তিমূলক ও দায়িত্বশীল AI ইকোসিস্টেম গড়ে তুলি।",
        heroBody: "প্রস্তুতি মূল্যায়ন করুন, অগ্রগতি পর্যবেক্ষণ করুন এবং সবার জন্য আরও অন্তর্ভুক্তিমূলক AI ভবিষ্যৎ তৈরি করুন।",
        explore: "আমাদের টুল দেখুন",
        learn: "আরও জানুন",
        toolsEyebrow: "বাংলাদেশ AI GOVERNANCE PLATFORM",
        toolsTitle: "দায়িত্বশীল AI-এর জন্য\nএকটি জাতীয় প্ল্যাটফর্ম",
        toolsBody: "আজই readiness assessment দিয়ে শুরু করুন; Observatory-তে দেখুন উৎস-সংযুক্ত তথ্য ও অগ্রগতির সংকেত।",
        available: "চালু আছে",
        upcoming: "আসছে",
        assessment: "BD AI Governance Readiness Assessment",
        assessmentDescription: "বাংলাদেশে AI governance readiness, প্রাতিষ্ঠানিক সক্ষমতা এবং উন্নয়নের ক্ষেত্র মূল্যায়ন করুন।",
        assessmentAction: "মূল্যায়ন শুরু করুন",
        observatory: "Bangladesh AI Observatory",
        observatoryDescription: "বাংলাদেশের AI ইকোসিস্টেম, নীতি, উদ্যোগ ও উৎস-সংযুক্ত governance সূচক দেখুন।",
        observatoryAction: "Observatory দেখুন",
        incidents: "ঘটনা প্রতিবেদন ও ব্যবস্থাপনা",
        incidentDescription: "প্রতিষ্ঠানের মধ্যে AI-সম্পর্কিত ঘটনা প্রতিবেদন, তদন্ত, প্রতিক্রিয়া ও অডিট ইতিহাস পরিচালনা করুন।",
        comingSoon: "ঘটনা প্রতিবেদন খুলুন",
        missionEyebrow: "আমাদের লক্ষ্য",
        missionTitle: "বাংলাদেশে দায়িত্বশীল AI governance এগিয়ে নেওয়া",
        missionBody: "তথ্য, স্বচ্ছতা এবং সহযোগিতার মাধ্যমে বাংলাদেশে AI-এর দায়িত্বশীল বিকাশ ও ব্যবহারকে এগিয়ে নেওয়া।",
        pillar1: "দায়িত্বশীল AI",
        pillar1Body: "নৈতিক ও দায়িত্বশীল AI উন্নয়ন ও ব্যবহার উৎসাহিত করা।",
        pillar2: "শক্তিশালী governance",
        pillar2Body: "AI-এর জন্য দৃঢ় governance কাঠামো গড়ে তোলা।",
        pillar3: "তথ্যভিত্তিক নীতি",
        pillar3Body: "নির্ভরযোগ্য তথ্য দিয়ে সিদ্ধান্ত গ্রহণে সহায়তা করা।",
        pillar4: "সহযোগিতা",
        pillar4Body: "সরকার, গবেষণা ও শিল্পখাতকে একসঙ্গে কাজ করতে সহায়তা করা।",
        standards: "নির্ভরযোগ্য নীতি ও রেফারেন্সের সঙ্গে মানচিত্রায়িত",
        footerCopy: "বাংলাদেশের AI readiness, governance এবং দায়িত্বশীল উদ্ভাবনের জন্য।",
        exploreLabel: "দেখুন",
      }
    : {
        home: "Home",
        platform: "Our Platform",
        resources: "Resources",
        about: "About",
        contact: "Contact",
        signIn: "Login",
        signOut: "Sign out",
        assessmentCta: "Start assessment",
        heroPill: "Building a Responsible AI Future",
        heroLead: "Building a trusted, inclusive and responsible AI ecosystem for Bangladesh.",
        heroBody: "Assess readiness, monitor progress, and build a responsible AI future for a smarter, more inclusive Bangladesh.",
        explore: "Explore Our Tools",
        learn: "Learn More",
        toolsEyebrow: "OUR PLATFORM TOOLS",
        toolsTitle: "Comprehensive tools for AI governance and policy development in Bangladesh.",
        toolsBody: "Start with the working readiness assessment and explore source-linked signals from the Bangladesh AI Observatory.",
        available: "Available",
        upcoming: "Upcoming",
        assessment: "BD AI Governance Readiness Assessment",
        assessmentDescription: "Assess AI governance readiness, institutional maturity, and governance gaps in Bangladesh.",
        assessmentAction: "Start assessment",
        observatory: "Bangladesh AI Observatory",
        observatoryDescription: "Monitor Bangladesh’s AI ecosystem, policies, projects, adoption, and source-linked governance indicators.",
        observatoryAction: "Explore Observatory",
        incidents: "AI Incident Reporting & Management",
        incidentDescription: "Submit and manage organization-scoped reports, investigation, response actions, evidence notes, and audit history.",
        comingSoon: "Open incident reporting",
        missionEyebrow: "OUR MISSION",
        missionTitle: "Advance responsible AI governance in Bangladesh",
        missionBody: "To advance responsible AI governance in Bangladesh through data, transparency and collaboration.",
        pillar1: "Promote Responsible AI",
        pillar1Body: "Ensure ethical and responsible AI development and use.",
        pillar2: "Strengthen Governance",
        pillar2Body: "Build robust governance frameworks for AI in Bangladesh.",
        pillar3: "Enable Data-Driven Policy",
        pillar3Body: "Support evidence-based decision making with reliable data.",
        pillar4: "Foster Collaboration",
        pillar4Body: "Bring government, research and industry together.",
        standards: "Designed to map to the language of",
        footerCopy: "Bangladesh AI readiness, governance and responsible innovation.",
        exploreLabel: "Explore",
      };

  const modules: ModuleCard[] = [
    {
      title: labels.assessment,
      description: labels.assessmentDescription,
      href: "/assessment",
      status: "Available",
      action: labels.assessmentAction,
      tone: "assessment",
      icon: ClipboardCheck,
    },
    {
      title: labels.observatory,
      description: labels.observatoryDescription,
      href: "/observatory",
      status: "Available",
      action: labels.observatoryAction,
      tone: "observatory",
      icon: Binoculars,
    },
    {
      title: labels.incidents,
      description: labels.incidentDescription,
      href: "/incidents",
      status: "Available",
      action: labels.comingSoon,
      tone: "incident",
      icon: Siren,
    },
  ];

  const pillars = [
    { title: labels.pillar1, description: labels.pillar1Body, icon: Sparkles },
    { title: labels.pillar2, description: labels.pillar2Body, icon: ShieldCheck },
    { title: labels.pillar3, description: labels.pillar3Body, icon: BarChart3 },
    { title: labels.pillar4, description: labels.pillar4Body, icon: Network },
  ];

  return (
    <div className="bd-home" lang={isBangla ? "bn" : "en"}>


      <main>
        <section className="bd-home-hero" aria-labelledby="bd-home-title">
          <div className="bd-home-hero-image" aria-hidden="true">
            <img src={HERO_SRC} alt="" />
          </div>
          <div className="bd-home-hero-shade" aria-hidden="true" />
          <div className="bd-home-map-dots" aria-hidden="true" />
          <div className="bd-home-circuit-lines" aria-hidden="true" />
          <div className="bd-home-container bd-home-hero-content">
            <div className="bd-home-hero-copy">
              <span className="bd-home-hero-pill"><i />{labels.heroPill}</span>
              <h1 id="bd-home-title">Bangladesh<br /><em>AI Observatory</em></h1>
              <p className="bd-home-hero-lead">{labels.heroLead}</p>
              <p className="bd-home-hero-body">{labels.heroBody}</p>
              <div className="bd-home-hero-actions">
                <a className="bd-home-button bd-home-button-primary" href="#tools" onClick={closeMenu}>{labels.explore}<ArrowUpRight size={17} /></a>
                <a className="bd-home-button bd-home-button-ghost" href="#mission" onClick={closeMenu}><span className="bd-home-play">›</span>{labels.learn}</a>
              </div>
            </div>
            <div className="bd-home-hero-caption"><span /> BANGLADESH / RESPONSIBLE AI</div>
          </div>
          <div className="bd-home-hero-bottom-line" aria-hidden="true" />
        </section>

        <section className="bd-home-tools" id="tools" aria-labelledby="bd-home-tools-title">
          <div className="bd-home-container">
            <div className="bd-home-tools-heading">
              <div>
                <p className="bd-home-section-kicker"><span />{labels.toolsEyebrow}</p>
                <h2 id="bd-home-tools-title">{isBangla ? labels.toolsTitle : <>Our Platform Tools</>}</h2>
              </div>
              <p>{labels.toolsBody}</p>
            </div>
            <div className="bd-home-module-grid">
              {modules.map(({ title, description, href, status, action, tone, icon: Icon }, index) => {
                const cardContent = (
                  <>
                    <div className="bd-home-module-top">
                      <span className={`bd-home-module-icon ${tone}`}><Icon size={25} strokeWidth={1.8} /></span>
                      <span className={`bd-home-status ${status === "Available" ? "is-available" : "is-upcoming"}`}>
                        {status === "Available" ? <Check size={12} /> : <Clock3 size={12} />}
                        {status === "Available" ? labels.available : labels.upcoming}
                      </span>
                    </div>
                    <span className="bd-home-module-index">0{index + 1} / PLATFORM CAPABILITY</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <span className={`bd-home-module-action ${status === "Upcoming" ? "is-muted" : ""}`}>
                      {action}<ArrowUpRight size={15} />
                    </span>
                    <Icon className="bd-home-module-art" aria-hidden="true" size={105} strokeWidth={0.9} />
                  </>
                );

                return status === "Available" ? (
                  <Link key={tone} className={`bd-home-module-card ${tone}`} href={href}>
                    {cardContent}
                  </Link>
                ) : (
                  <article key={tone} className={`bd-home-module-card ${tone}`} aria-label={`${title}, ${labels.comingSoon}`}>
                    {cardContent}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bd-home-resources" id="resources" aria-label="Governance references">
          <div className="bd-home-container bd-home-resources-inner">
            <span>{labels.standards}</span>
            <div className="bd-home-standard-list">
              <strong>NIST AI RMF</strong>
              <strong>ISO/IEC 42001</strong>
              <strong>OECD AI Principles</strong>
              <strong>UNESCO Ethics</strong>
            </div>
          </div>
        </section>

        <section className="bd-home-mission" id="mission" aria-labelledby="bd-home-mission-title">
          <div className="bd-home-container">
            <div className="bd-home-mission-heading">
              <p className="bd-home-section-kicker"><span />{labels.missionEyebrow}</p>
              <h2 id="bd-home-mission-title">{labels.missionTitle}</h2>
              <p>{labels.missionBody}</p>
            </div>
            <div className="bd-home-pillars">
              {pillars.map(({ title, description, icon: Icon }, index) => (
                <article className="bd-home-pillar" key={title}>
                  <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <span className="bd-home-pillar-index">0{index + 1}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bd-home-footer" id="contact">
        <div className="bd-home-container">
          <div className="bd-home-footer-main">
            <Link href="/" className="bd-home-brand bd-home-brand-footer" aria-label="Bangladesh AI Governance Platform home">
              <img className="bd-home-logo" src={LOGO_SRC} alt="Bangladesh AI Governance emblem" />
              <span className="bd-home-brand-copy">
                <strong>Bangladesh<br className="bd-home-brand-break" /> AI Governance Platform</strong>
                <small>An Atlas AI Institute initiative</small>
              </span>
            </Link>
            <p>{labels.footerCopy}</p>
            <nav className="bd-home-footer-nav" aria-label="Footer navigation">
              <a href="#tools">{labels.platform}</a>
              <Link href="/assessment">{labels.assessmentCta}</Link>
              <Link href="/observatory">{labels.observatory}</Link>
              <a href="#resources">{labels.resources}</a>
            </nav>
          </div>
          <div className="bd-home-footer-bottom">
            <span>© 2026 Bangladesh AI Observatory</span>
            <span>{SELF_REPORTED_NOTICE}</span>
            <a href="#home">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
