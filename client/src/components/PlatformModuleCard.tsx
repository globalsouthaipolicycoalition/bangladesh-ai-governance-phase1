import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "wouter";

type PlatformModuleCardProps = {
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  status: "Available" | "Upcoming";
};

export default function PlatformModuleCard({ index, title, description, icon: Icon, href, status }: PlatformModuleCardProps) {
  const content = (
    <>
      <div className="platform-module-top"><span className="platform-module-index">{index}</span><span className={`platform-module-status ${status === "Available" ? "available" : "upcoming"}`}>{status === "Available" ? <ArrowUpRight size={13} /> : <Clock3 size={13} />}{status}</span></div>
      <div className="platform-module-icon"><Icon size={24} strokeWidth={1.7} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="platform-module-action">{status === "Available" ? "Open module" : "Explore roadmap"} <ArrowUpRight size={15} /></span>
    </>
  );

  return href && status === "Available" ? <Link className="platform-module-card" href={href}>{content}</Link> : <div className="platform-module-card upcoming-card">{content}</div>;
}
