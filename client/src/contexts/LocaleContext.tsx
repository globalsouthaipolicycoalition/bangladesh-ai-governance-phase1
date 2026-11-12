import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Locale = "en" | "bn";
type TranslationKey = keyof typeof translations.en;
const translations = {
  en: {
    loading: "Loading…", tryAgain: "Try again", noData: "No data available.", noAccess: "You do not have permission to view this.", saving: "Saving changes…", selectAssessment: "Select an assessment", reportLanguage: "Report language", english: "English", bangla: "বাংলা", bilingual: "English + বাংলা", backToPlatform: "Back to platform", assessment: "Assessment", controls: "Controls", findings: "Findings", aiSystems: "AI systems", submit: "Submit assessment", submitting: "Submitting…", selfReported: "Self-reported · Not independently verified", notFound: "Not found or access denied",
  },
  bn: {
    loading: "লোড হচ্ছে…", tryAgain: "আবার চেষ্টা করুন", noData: "কোনো তথ্য পাওয়া যায়নি।", noAccess: "এটি দেখার অনুমতি আপনার নেই।", saving: "পরিবর্তন সংরক্ষণ হচ্ছে…", selectAssessment: "একটি মূল্যায়ন বাছুন", reportLanguage: "প্রতিবেদনের ভাষা", english: "English", bangla: "বাংলা", bilingual: "English + বাংলা", backToPlatform: "প্ল্যাটফর্মে ফিরুন", assessment: "মূল্যায়ন", controls: "কন্ট্রোল", findings: "ফাইন্ডিংস", aiSystems: "AI সিস্টেম", submit: "মূল্যায়ন জমা দিন", submitting: "জমা দেওয়া হচ্ছে…", selfReported: "স্ব-প্রতিবেদিত · স্বাধীনভাবে যাচাই করা হয়নি", notFound: "পাওয়া যায়নি বা প্রবেশাধিকার নেই",
  },
} as const;

type LocaleContextValue = { locale: Locale; isBangla: boolean; setLocale: (locale: Locale) => void; toggleLocale: () => void; t: (key: TranslationKey) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyLocale(locale: Locale) {
  if (typeof window !== "undefined") { window.localStorage.setItem("atlas-locale", locale); document.documentElement.lang = locale; }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => typeof window !== "undefined" && window.localStorage.getItem("atlas-locale") === "bn" ? "bn" : "en");
  useEffect(() => { applyLocale(locale); }, [locale]);
  const value = useMemo<LocaleContextValue>(() => ({ locale, isBangla: locale === "bn", setLocale: next => { setLocaleState(next); applyLocale(next); }, toggleLocale: () => { const next = locale === "en" ? "bn" : "en"; setLocaleState(next); applyLocale(next); }, t: key => translations[locale][key] ?? translations.en[key] }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() { const context = useContext(LocaleContext); if (!context) throw new Error("useLocale must be used within LocaleProvider"); return context; }
export type { Locale, TranslationKey };
