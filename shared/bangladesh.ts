export const BANGLADESH_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
] as const;

export type BangladeshDivision = (typeof BANGLADESH_DIVISIONS)[number];

export const BANGLADESH_DISTRICTS: Record<BangladeshDivision, readonly string[]> = {
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Chattogram: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Rajshahi: ["Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"],
  Khulna: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Barishal: ["Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
  Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
};
export const BANGLADESH_EMPLOYEE_BANDS = ["1–10", "11–50", "51–250", "251–1000", "1001+"] as const;
export const BANGLADESH_DATA_RESIDENCY_OPTIONS = ["Bangladesh preferred", "Bangladesh required", "No preference", "To be determined"] as const;
export const BANGLADESH_PRIMARY_LANGUAGES = ["Bangla", "English", "Bangla and English", "Other"] as const;
export const BANGLADESH_ORGANIZATION_TYPES = [
  ["individual", "Individual professional", "ব্যক্তিগত পেশাজীবী"],
  ["ai_team", "AI team", "AI দল"],
  ["startup_sme", "Startup / SME", "স্টার্টআপ / SME"],
  ["private_organization", "Private organization", "বেসরকারি প্রতিষ্ঠান"],
  ["bank_nfI", "Bank / NBFI", "ব্যাংক / NBFI"],
  ["healthcare", "Healthcare organization", "স্বাস্থ্যসেবা প্রতিষ্ঠান"],
  ["university_research", "University / research", "বিশ্ববিদ্যালয় / গবেষণা"],
  ["ngo_development", "NGO / development", "এনজিও / উন্নয়ন"],
  ["manufacturing_garments", "Manufacturing / garments", "উৎপাদন / তৈরি পোশাক"],
  ["telecom_technology", "Telecom / technology", "টেলিকম / প্রযুক্তি"],
  ["government_agency", "Government agency", "সরকারি সংস্থা"],
  ["ministry_public_administration", "Ministry / public administration", "মন্ত্রণালয় / জনপ্রশাসন"],
  ["national_ai_ecosystem", "National AI ecosystem", "জাতীয় AI ইকোসিস্টেম"],
] as const;

export const BANGLADESH_PROFILES = [
  { id: "individual", title: "Individual professional", titleBn: "ব্যক্তিগত পেশাজীবী", domains: 9, evidence: "Self-reported", timeline: "30 days", sectors: ["Professional services", "Education & research"] },
  { id: "ai_team", title: "AI team", titleBn: "AI দল", domains: 12, evidence: "Policies + team records", timeline: "30–90 days", sectors: ["Technology", "Research"] },
  { id: "startup_sme", title: "Startup / SME", titleBn: "স্টার্টআপ / SME", domains: 12, evidence: "Documents + interviews", timeline: "30–90 days", sectors: ["Technology", "Commerce", "Services"] },
  { id: "organization", title: "Private organization", titleBn: "বেসরকারি প্রতিষ্ঠান", domains: 14, evidence: "Documents + interviews", timeline: "90 days", sectors: ["All private sectors"] },
  { id: "bank_nfI", title: "Bank / NBFI", titleBn: "ব্যাংক / NBFI", domains: 18, evidence: "Control evidence + review", timeline: "90–180 days", sectors: ["Banking", "Financial services"] },
  { id: "healthcare", title: "Healthcare organization", titleBn: "স্বাস্থ্যসেবা প্রতিষ্ঠান", domains: 17, evidence: "Records + clinical governance", timeline: "90–180 days", sectors: ["Healthcare"] },
  { id: "university", title: "University / research institution", titleBn: "বিশ্ববিদ্যালয় / গবেষণা প্রতিষ্ঠান", domains: 15, evidence: "Policies + research records", timeline: "90 days", sectors: ["Education", "Research"] },
  { id: "ngo", title: "NGO / development organization", titleBn: "এনজিও / উন্নয়ন প্রতিষ্ঠান", domains: 14, evidence: "Programme + governance evidence", timeline: "90 days", sectors: ["Development", "Non-profit"] },
  { id: "manufacturing", title: "Manufacturing / garments", titleBn: "উৎপাদন / তৈরি পোশাক", domains: 16, evidence: "Operations + supplier evidence", timeline: "90–180 days", sectors: ["Manufacturing", "Garments"] },
  { id: "telecom", title: "Telecom / technology company", titleBn: "টেলিকম / প্রযুক্তি কোম্পানি", domains: 18, evidence: "Technical + supplier evidence", timeline: "90–180 days", sectors: ["Telecom", "Technology"] },
  { id: "government", title: "Government agency", titleBn: "সরকারি সংস্থা", domains: 20, evidence: "Policy + oversight evidence", timeline: "180 days", sectors: ["Public administration"] },
  { id: "ministry", title: "Ministry / public administration", titleBn: "মন্ত্রণালয় / জনপ্রশাসন", domains: 20, evidence: "Mandate + programme evidence", timeline: "180 days", sectors: ["Government"] },
  { id: "national", title: "National AI ecosystem", titleBn: "জাতীয় AI ইকোসিস্টেম", domains: 20, evidence: "Ecosystem evidence + review", timeline: "180 days", sectors: ["National ecosystem"] },
] as const;

export const BANGLADESH_DOMAINS = [
  ["BD-D01", "AI literacy and human capability", "AI সাক্ষরতা ও মানব সক্ষমতা"],
  ["BD-D02", "AI strategy and leadership", "AI কৌশল ও নেতৃত্ব"],
  ["BD-D03", "Digital and compute infrastructure", "ডিজিটাল ও কম্পিউট অবকাঠামো"],
  ["BD-D04", "Data readiness and governance", "ডেটা প্রস্তুতি ও শাসন"],
  ["BD-D05", "AI adoption and operational integration", "AI গ্রহণ ও কার্যকর সংযুক্তি"],
  ["BD-D06", "AI governance and institutional oversight", "AI শাসন ও প্রাতিষ্ঠানিক তদারকি"],
  ["BD-D07", "AI risk management", "AI ঝুঁকি ব্যবস্থাপনা"],
  ["BD-D08", "Responsible AI and ethics", "দায়িত্বশীল AI ও নৈতিকতা"],
  ["BD-D09", "Privacy and data protection", "গোপনীয়তা ও ডেটা সুরক্ষা"],
  ["BD-D10", "AI security and resilience", "AI নিরাপত্তা ও স্থিতিস্থাপকতা"],
  ["BD-D11", "Legal and regulatory readiness", "আইনি ও নিয়ন্ত্রক প্রস্তুতি"],
  ["BD-D12", "AI system quality and reliability", "AI সিস্টেমের গুণমান ও নির্ভরযোগ্যতা"],
  ["BD-D13", "Human rights and societal impact", "মানবাধিকার ও সামাজিক প্রভাব"],
  ["BD-D14", "AI procurement and third-party risk", "AI ক্রয় ও তৃতীয় পক্ষের ঝুঁকি"],
  ["BD-D15", "Workforce transformation", "কর্মশক্তির রূপান্তর"],
  ["BD-D16", "Innovation and research capacity", "উদ্ভাবন ও গবেষণা সক্ষমতা"],
  ["BD-D17", "AI economics and financial sustainability", "AI অর্থনীতি ও আর্থিক স্থায়িত্ব"],
  ["BD-D18", "Monitoring, evaluation and assurance", "পর্যবেক্ষণ, মূল্যায়ন ও নিশ্চয়তা"],
  ["BD-D19", "Environmental sustainability", "পরিবেশগত স্থায়িত্ব"],
  ["BD-D20", "AI sovereignty and ecosystem resilience", "AI সার্বভৌমত্ব ও ইকোসিস্টেম স্থিতিস্থাপকতা"],
] as const;

export const BANGLADESH_EVIDENCE_EXAMPLES = [
  "ICT policy or digital service policy",
  "Internal AI usage and data classification policy",
  "Cybersecurity policy and incident response plan",
  "Vendor contracts and procurement records",
  "HR and workforce training records",
  "Board, ministry, or institutional oversight records",
  "Bangladesh-specific data handling procedures",
  "Local-language communication and accessibility evidence",
] as const;

export const ATLAS_DISCLAIMER = "This report is an assessment output and does not constitute legal advice, government certification, ISO accreditation or independent assurance.";
export const SELF_REPORTED_NOTICE = "Self-reported assessment — not independently verified.";
