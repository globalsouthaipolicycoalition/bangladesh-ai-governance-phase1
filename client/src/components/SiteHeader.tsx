import { Globe2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "../const";
import { useLocale } from "../contexts/LocaleContext";

const LOGO_SRC = "/manus-storage/bangladesh-ai-governance-logo_29827c3b.png";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isBangla, locale, toggleLocale } = useLocale();
  const me = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });
  const closeMenu = () => setMenuOpen(false);

  const labels = isBangla
    ? { home: "হোম", platform: "প্ল্যাটফর্ম", resources: "রিসোর্স", about: "আমাদের লক্ষ্য", contact: "যোগাযোগ", signIn: "লগইন", signOut: "লগআউট" }
    : { home: "Home", platform: "Our platform", resources: "Resources", about: "About", contact: "Contact", signIn: "Login", signOut: "Sign out" };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="Bangladesh AI Governance Platform home" onClick={closeMenu}>
          <img src={LOGO_SRC} alt="Bangladesh AI Governance Platform mark" />
          <span className="site-brand-copy">
            <strong>Bangladesh<br className="site-brand-break" /> AI Governance Platform</strong>
            <small>An Atlas AI Institute initiative</small>
          </span>
        </Link>

        <button className="site-menu-button" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(open => !open)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav id="site-navigation" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          <Link href="/" onClick={closeMenu}>{labels.home}</Link>
          <a href="/#tools" onClick={closeMenu}>{labels.platform}</a>
          <a href="/#resources" onClick={closeMenu}>{labels.resources}</a>
          <a href="/#mission" onClick={closeMenu}>{labels.about}</a>
          <a href="/#contact" onClick={closeMenu}>{labels.contact}</a>
          <button className="site-language" type="button" onClick={toggleLocale} aria-label="Switch language"><Globe2 size={15} /> {locale === "en" ? "বাংলা" : "English"}</button>
          {me.data ? (
            <button className="site-auth" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <span className="site-user-dot">{(me.data.name ?? me.data.email ?? "A").slice(0, 1).toUpperCase()}</span>
              {logout.isPending ? "Signing out…" : labels.signOut}
            </button>
          ) : (
            <button className="site-auth" type="button" onClick={startLogin}><span className="site-user-dot">↗</span> {labels.signIn}</button>
          )}
        </nav>
      </div>
    </header>
  );
}
