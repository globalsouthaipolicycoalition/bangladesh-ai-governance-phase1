import { BANGLADESH_SECTOR_OPTIONS } from "./bangladeshSectors";
import type { BangladeshSector } from "./bangladeshSectors";

export type BangladeshControlLifecycle = "draft" | "in_review" | "approved" | "published" | "retired";
export type BangladeshSourceStatus = "binding_law" | "policy" | "draft_policy" | "regulatory_guidance" | "international_standard" | "recommended_practice" | "research_reference";
export type BangladeshLifecycleStage = "design" | "data" | "development" | "procurement" | "validation" | "deployment" | "decision" | "operations" | "material_change" | "incident_response" | "renewal" | "retirement";
export type BangladeshRiskTier = "low" | "moderate" | "high" | "critical";
export type BangladeshRiskGate = {
  minimumTier: BangladeshRiskTier;
  triggers: readonly ("personal_data" | "sensitive_data" | "high_impact_decision" | "essential_service" | "regulated_entity" | "public_service" | "external_exposure" | "third_party_dependency" | "large_scale" | "research_participant")[];
  proportionalityNote: string;
};
export type BangladeshEvidenceRequirement = "accountable_owner" | "risk_assessment" | "decision_rights" | "qualified_review" | "policy_or_procedure" | "testing_or_validation" | "monitoring_or_drift" | "incident_or_escalation" | "audit_log" | "training_or_competence" | "supplier_or_contract" | "continuity_or_exit" | "data_inventory_or_provenance" | "access_or_retention" | "notice_or_appeal" | "remediation_closure";

export const BANGLADESH_CONTROL_LABEL = "Bangladesh AI Readiness Assessment assessment control — mapped to reference sources; not itself a legal requirement.";

export type BangladeshSourceVerification = { verifiedAt: string; reviewer: string; outcome: "source_confirmed" | "scope_confirmed" | "legal_review_required"; notes: string };
export type BangladeshSource = {
  id: string; title: string; authority: string; url: string; publicationDate?: string; effectiveDate?: string;
  status: BangladeshSourceStatus; lastVerified: string; legalReview: "not_reviewed" | "reviewed"; verificationHistory: readonly BangladeshSourceVerification[];
};

export type BangladeshControl = {
  code: string; title: string; titleBn: string; objective: string; evidenceRequirement: string; evidenceRequirements: readonly BangladeshEvidenceRequirement[]; applicability: string; sectorApplicability: BangladeshSector[];
  jurisdiction: "Bangladesh"; lifecycleStage: string; controlType: "governance" | "data" | "security" | "human_impact" | "assurance";
  lifecycleStages: readonly BangladeshLifecycleStage[]; riskGate: BangladeshRiskGate; criticality: "low" | "moderate" | "high" | "critical"; weight: number; sourceRefs: string[]; version: string; effectiveDate: string;
  lastReviewed: string; reviewerNotes: string; lifecycle: BangladeshControlLifecycle; label: string; changeOwner: string; reviewDueDate: string;
};

const REVIEW_DATE = "2026-11-12";
const mappingNote = "Provisional assessment mapping; qualified Bangladesh legal and sector review is required before approval or publication.";

export const BANGLADESH_SOURCES: readonly BangladeshSource[] = [
  { id: "UNESCO-AI-ETHICS", title: "Recommendation on the Ethics of Artificial Intelligence", authority: "UNESCO", url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics", status: "international_standard", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "source_confirmed", notes: "Official UNESCO publication page." }] },
  { id: "NIST-AI-RMF", title: "AI Risk Management Framework", authority: "National Institute of Standards and Technology", url: "https://www.nist.gov/itl/ai-risk-management-framework", status: "recommended_practice", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "source_confirmed", notes: "Official NIST framework page." }] },
  { id: "BD-ICT-DIVISION", title: "ICT Division official portal", authority: "Information and Communication Technology Division, Government of Bangladesh", url: "https://ictd.gov.bd/", status: "policy", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official government portal; individual policy mappings require review." }] },
  { id: "BD-BB-ICT-2023", title: "Guideline on ICT Security, Version 4.0, 2023", authority: "Bangladesh Bank", url: "https://www.bb.org.bd/aboutus/regulationguideline/brpd/jun192023_ictsecurityv4.pdf", publicationDate: "2023-06-19", status: "regulatory_guidance", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official Bangladesh Bank PDF; use for banking/NBFI mapping review, not generic legal claims." }] },
  { id: "BD-DGDA", title: "Directorate General of Drug Administration official policies and laws portal", authority: "Directorate General of Drug Administration, Bangladesh", url: "https://dgda.gov.bd/pages/policies", status: "regulatory_guidance", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official DGDA policy and law index; clinical mappings require qualified review." }] },
  { id: "BD-UGC", title: "University Grants Commission of Bangladesh official portal", authority: "University Grants Commission of Bangladesh", url: "https://ugc.gov.bd/", status: "policy", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official UGC portal; higher-education mappings require institutional review." }] },
  { id: "BD-BTRC", title: "Bangladesh Telecommunication Regulatory Commission official portal", authority: "Bangladesh Telecommunication Regulatory Commission", url: "https://btrc.gov.bd/", status: "regulatory_guidance", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official regulator portal; telecom mappings require qualified review." }] },
  { id: "BD-NATIONAL-PORTAL", title: "Bangladesh National Portal", authority: "Government of Bangladesh", url: "https://bangladesh.gov.bd/", status: "policy", lastVerified: REVIEW_DATE, legalReview: "not_reviewed", verificationHistory: [{ verifiedAt: REVIEW_DATE, reviewer: "Source review queue", outcome: "scope_confirmed", notes: "Official public-service portal; service-specific mappings require review." }] },
];

const commonEvidence = (controlType: BangladeshControl["controlType"], criticality: BangladeshControl["criticality"]): BangladeshEvidenceRequirement[] => {
  const requirements: BangladeshEvidenceRequirement[] = ["accountable_owner", "risk_assessment", "decision_rights", "qualified_review", "audit_log", "remediation_closure"];
  if (controlType === "data") requirements.push("data_inventory_or_provenance", "access_or_retention");
  if (controlType === "governance") requirements.push("policy_or_procedure", "training_or_competence");
  if (controlType === "security" || controlType === "assurance") requirements.push("testing_or_validation", "monitoring_or_drift", "incident_or_escalation");
  if (controlType === "human_impact") requirements.push("notice_or_appeal", "incident_or_escalation", "monitoring_or_drift");
  if (criticality === "high" || criticality === "critical") requirements.push("continuity_or_exit");
  return [...new Set(requirements)];
};
const lifecycleFor = (stage: string): BangladeshLifecycleStage[] => {
  const common: BangladeshLifecycleStage[] = ["design", "deployment", "operations", "material_change", "incident_response", "retirement"];
  if (stage === "data") return ["design", "data", "development", "deployment", "operations", "material_change", "retirement"];
  if (stage === "development") return ["design", "data", "development", "validation", "deployment", "operations", "retirement"];
  if (stage === "procurement") return ["design", "procurement", "validation", "deployment", "operations", "renewal", "retirement"];
  if (stage === "decision") return ["design", "validation", "deployment", "decision", "operations", "material_change", "incident_response", "retirement"];
  return common;
};
const base = (input: Omit<BangladeshControl, "jurisdiction" | "version" | "effectiveDate" | "lastReviewed" | "reviewerNotes" | "lifecycle" | "label" | "changeOwner" | "reviewDueDate" | "evidenceRequirements" | "lifecycleStages" | "riskGate">): BangladeshControl => ({
  ...input,
  jurisdiction: "Bangladesh", version: "BD-0.3-provisional", effectiveDate: REVIEW_DATE, lastReviewed: REVIEW_DATE, reviewerNotes: mappingNote,
  evidenceRequirements: commonEvidence(input.controlType, input.criticality), lifecycleStages: lifecycleFor(input.lifecycleStage),
  riskGate: { minimumTier: input.criticality, triggers: ["regulated_entity", "high_impact_decision", "sensitive_data", "essential_service", "third_party_dependency", "public_service", "external_exposure", "large_scale", "research_participant"], proportionalityNote: "Apply the control proportionately to impact, data sensitivity, scale, essential-service dependence, regulated status, public-service exposure, research-participant impact, and third-party exposure; escalate to the higher applicable tier when any trigger is present." },
  lifecycle: "in_review", label: BANGLADESH_CONTROL_LABEL, changeOwner: "Bangladesh catalogue owner — qualified reviewer required", reviewDueDate: "2027-05-12",
});

export const BANGLADESH_CONTROLS: readonly BangladeshControl[] = [
  base({ code: "BD-GOV-001", title: "AI governance ownership is documented", titleBn: "AI শাসনের দায়িত্ব লিখিতভাবে নির্ধারিত", objective: "Define accountable ownership for AI systems, decisions, and oversight.", evidenceRequirement: "AI governance policy, responsibility matrix, or board/ministry mandate.", applicability: "Any entity developing, procuring, or operating AI.", sectorApplicability: ["all"], lifecycleStage: "all", controlType: "governance", criticality: "high", weight: 1, sourceRefs: ["UNESCO-AI-ETHICS", "NIST-AI-RMF"] }),
  base({ code: "BD-DATA-001", title: "Data classification and permitted use are recorded", titleBn: "ডেটা শ্রেণিবিন্যাস ও অনুমোদিত ব্যবহার নথিভুক্ত", objective: "Document data categories, permitted uses, retention, and access controls for AI workflows.", evidenceRequirement: "Data inventory, classification policy, retention schedule, and access review.", applicability: "Entities using personal, sensitive, public-service, or operational data.", sectorApplicability: ["all"], lifecycleStage: "data", controlType: "data", criticality: "critical", weight: 1.25, sourceRefs: ["UNESCO-AI-ETHICS", "NIST-AI-RMF"] }),
  base({ code: "BD-CYBER-001", title: "AI security and incident response are tested", titleBn: "AI নিরাপত্তা ও ঘটনা মোকাবিলা পরীক্ষা করা হয়", objective: "Maintain security controls and a tested response path for AI-related incidents.", evidenceRequirement: "Cybersecurity policy, threat model, incident plan, and exercise record.", applicability: "Any production or externally exposed AI system.", sectorApplicability: ["all"], lifecycleStage: "operations", controlType: "security", criticality: "high", weight: 1.25, sourceRefs: ["NIST-AI-RMF", "BD-ICT-DIVISION"] }),
  base({ code: "BD-BANK-001", title: "Financial-sector AI decisions have human oversight", titleBn: "আর্থিক খাতে AI সিদ্ধান্তে মানব তদারকি থাকে", objective: "Ensure consequential banking or NBFI decisions have accountable human review and escalation.", evidenceRequirement: "Decision policy, approval thresholds, override records, and staff training.", applicability: "Bank, NBFI, payment, credit, or financial-risk use cases.", sectorApplicability: ["banking", "nbfi", "payments", "fintech"], lifecycleStage: "decision", controlType: "human_impact", criticality: "critical", weight: 1.5, sourceRefs: ["BD-BB-ICT-2023", "UNESCO-AI-ETHICS"] }),
  base({ code: "BD-BANK-002", title: "Financial AI suppliers and cloud dependencies are risk-assessed", titleBn: "আর্থিক AI সরবরাহকারী ও ক্লাউড নির্ভরতা ঝুঁকি মূল্যায়িত", objective: "Assess supplier access, resilience, security, auditability, and exit arrangements.", evidenceRequirement: "Due diligence, contract, continuity plan, access review, and exit test.", applicability: "Banks, NBFIs, payment providers, and financial technology suppliers.", sectorApplicability: ["banking", "nbfi", "payments", "fintech"], lifecycleStage: "procurement", controlType: "assurance", criticality: "high", weight: 1.25, sourceRefs: ["BD-BB-ICT-2023"] }),
  base({ code: "BD-HEALTH-001", title: "Clinical AI use has safety escalation and consent controls", titleBn: "ক্লিনিক্যাল AI ব্যবহারে নিরাপত্তা ও সম্মতি নিয়ন্ত্রণ থাকে", objective: "Define clinical review, patient communication, escalation, and safety monitoring.", evidenceRequirement: "Clinical governance approval, safety case, consent/notice, and monitoring record.", applicability: "Healthcare providers and health-research AI use.", sectorApplicability: ["healthcare", "pharmaceuticals"], lifecycleStage: "decision", controlType: "human_impact", criticality: "critical", weight: 1.5, sourceRefs: ["BD-DGDA", "UNESCO-AI-ETHICS"] }),
  base({ code: "BD-HEALTH-002", title: "Health AI data access and retention are governed", titleBn: "স্বাস্থ্য AI ডেটার প্রবেশাধিকার ও সংরক্ষণ নিয়ন্ত্রিত", objective: "Limit health-data access to approved purposes and retain auditable access records.", evidenceRequirement: "Data map, access matrix, retention schedule, and audit logs.", applicability: "Clinical, public-health, pharmaceutical, and health-research AI.", sectorApplicability: ["healthcare", "pharmaceuticals", "public_health", "research"], lifecycleStage: "data", controlType: "data", criticality: "critical", weight: 1.5, sourceRefs: ["BD-DGDA", "NIST-AI-RMF"] }),
  base({ code: "BD-EDU-001", title: "Education AI use protects learners and supports appeal", titleBn: "শিক্ষাক্ষেত্রে AI শিক্ষার্থী সুরক্ষা ও আপিল নিশ্চিত করে", objective: "Provide transparency, accessibility, human review, and appeal for education decisions.", evidenceRequirement: "Learner notice, accessibility review, human appeal process, and impact assessment.", applicability: "Schools, universities, training providers, and education technology.", sectorApplicability: ["schools", "higher_education", "training", "edtech"], lifecycleStage: "decision", controlType: "human_impact", criticality: "high", weight: 1.25, sourceRefs: ["BD-UGC", "UNESCO-AI-ETHICS"] }),
  base({ code: "BD-EDU-002", title: "Research AI has reproducibility and responsible-use records", titleBn: "গবেষণায় AI ব্যবহারের পুনরুৎপাদনযোগ্যতা ও দায়িত্বশীলতার রেকর্ড থাকে", objective: "Document datasets, model versions, human review, and responsible research controls.", evidenceRequirement: "Research protocol, model/data register, review approval, and reproducibility notes.", applicability: "Universities, research institutes, and education technology.", sectorApplicability: ["higher_education", "research", "edtech"], lifecycleStage: "development", controlType: "assurance", criticality: "high", weight: 1, sourceRefs: ["BD-UGC", "NIST-AI-RMF"] }),
  base({ code: "BD-TELECOM-001", title: "Third-party AI suppliers are risk-assessed", titleBn: "তৃতীয় পক্ষের AI সরবরাহকারী ঝুঁকি মূল্যায়িত", objective: "Assess vendor security, data handling, service continuity, and accountability before use.", evidenceRequirement: "Due diligence, contract clauses, service-level controls, and supplier review.", applicability: "Telecom operators and material telecom AI suppliers.", sectorApplicability: ["telecom", "telecom_supplier"], lifecycleStage: "procurement", controlType: "governance", criticality: "high", weight: 1.25, sourceRefs: ["BD-BTRC", "BD-ICT-DIVISION", "NIST-AI-RMF"] }),
  base({ code: "BD-TELECOM-002", title: "Network and customer-impacting AI changes are monitored", titleBn: "নেটওয়ার্ক ও গ্রাহক-প্রভাবিত AI পরিবর্তন পর্যবেক্ষণ করা হয়", objective: "Monitor material changes, outages, harmful outcomes, and escalation for telecom AI.", evidenceRequirement: "Change records, monitoring dashboard, incident thresholds, and escalation log.", applicability: "Telecom operators and communications service providers.", sectorApplicability: ["telecom"], lifecycleStage: "operations", controlType: "security", criticality: "high", weight: 1.25, sourceRefs: ["BD-BTRC", "NIST-AI-RMF"] }),
  base({ code: "BD-GOV-002", title: "Public-service AI has accountable human escalation", titleBn: "জনসেবা AI ব্যবস্থায় জবাবদিহিমূলক মানবিক এসকেলেশন থাকে", objective: "Provide a responsible officer, notice, review, and appeal path for public-service AI.", evidenceRequirement: "Service policy, accountable officer, notice, appeal process, and audit trail.", applicability: "Government agencies and public-service providers.", sectorApplicability: ["government", "public_services"], lifecycleStage: "decision", controlType: "human_impact", criticality: "critical", weight: 1.5, sourceRefs: ["BD-NATIONAL-PORTAL", "BD-ICT-DIVISION", "UNESCO-AI-ETHICS"] }),
  base({ code: "BD-GOV-003", title: "Government AI procurement includes transparency and exit controls", titleBn: "সরকারি AI ক্রয়ে স্বচ্ছতা ও প্রস্থান নিয়ন্ত্রণ থাকে", objective: "Record purpose, supplier accountability, data handling, audit access, and exit conditions.", evidenceRequirement: "Procurement record, contract, data clauses, audit rights, and exit plan.", applicability: "Ministries, agencies, local government, and public bodies.", sectorApplicability: ["government", "local_government", "public_body", "public_services"], lifecycleStage: "procurement", controlType: "governance", criticality: "high", weight: 1.25, sourceRefs: ["BD-ICT-DIVISION", "BD-NATIONAL-PORTAL"] }),
  base({ code: "BD-SME-001", title: "SME and startup AI use has proportionate ownership and safeguards", titleBn: "SME ও স্টার্টআপের AI ব্যবহারে আনুপাতিক মালিকানা ও সুরক্ষা থাকে", objective: "Set practical ownership, supplier review, data controls, and incident contacts for smaller entities.", evidenceRequirement: "Named owner, vendor review, data inventory, basic testing, and incident contact.", applicability: "SMEs, startups, and early-stage technology organizations.", sectorApplicability: ["sme", "startup"], lifecycleStage: "all", controlType: "governance", criticality: "moderate", weight: 1, sourceRefs: ["BD-ICT-DIVISION", "NIST-AI-RMF"] }),
  base({ code: "BD-PUBLIC-001", title: "Public-facing AI communication is accessible in Bangla and English", titleBn: "জনসাধারণের AI যোগাযোগ বাংলা ও ইংরেজিতে প্রবেশযোগ্য", objective: "Make material notices understandable and usable for affected Bangladesh audiences.", evidenceRequirement: "Bangla/English communication samples, accessibility test, and user feedback.", applicability: "Public-facing, employee-facing, or high-impact AI systems.", sectorApplicability: ["public_services", "government", "all"], lifecycleStage: "all", controlType: "human_impact", criticality: "moderate", weight: 1, sourceRefs: ["BD-NATIONAL-PORTAL", "BD-ICT-DIVISION", "UNESCO-AI-ETHICS"] }),
  base({ code: "BD-EMERGING-001", title: "AI changes and material incidents are recorded", titleBn: "AI পরিবর্তন ও গুরুত্বপূর্ণ ঘটনা নথিভুক্ত করা হয়", objective: "Maintain traceability for model changes, incidents, decisions, and corrective actions.", evidenceRequirement: "Change log, incident record, decision log, corrective action, and owner.", applicability: "Any organization operating material AI systems.", sectorApplicability: ["all"], lifecycleStage: "operations", controlType: "assurance", criticality: "high", weight: 1.25, sourceRefs: ["NIST-AI-RMF", "BD-ICT-DIVISION"] }),
];

export function getPublishedBangladeshControls() { return BANGLADESH_CONTROLS.filter(control => control.lifecycle === "approved" || control.lifecycle === "published"); }
export function getPublicBangladeshCatalog() {
  const controls = getPublishedBangladeshControls().map(({ reviewerNotes: _reviewerNotes, changeOwner: _changeOwner, reviewDueDate: _reviewDueDate, label: _label, ...control }) => control);
  const sources = BANGLADESH_SOURCES.map(({ id, title, authority, url, publicationDate, effectiveDate, status }) => ({ id, title, authority, url, publicationDate, effectiveDate, status }));
  return {
    version: "BD-0.3-provisional",
    lifecycle: "in_review" as const,
    controls,
    publishedControls: controls,
    sources,
    verification: { publishedControlCount: controls.length, reviewRequired: BANGLADESH_CONTROLS.some(control => control.lifecycle === "draft" || control.lifecycle === "in_review") },
  };
}
export function verifyBangladeshCatalog() {
  const errors: string[] = []; const codes = new Set<string>();
  const sectors = new Set<BangladeshSector>(["all", ...BANGLADESH_SECTOR_OPTIONS.map(sector => sector.id)]);
  const stages = new Set<BangladeshLifecycleStage>(["design", "data", "development", "procurement", "validation", "deployment", "decision", "operations", "material_change", "incident_response", "renewal", "retirement"]);
  for (const control of BANGLADESH_CONTROLS) {
    if (codes.has(control.code)) errors.push(`Duplicate control code: ${control.code}`); codes.add(control.code);
    if (!/^BD-[A-Z0-9]+-\d{3}$/.test(control.code)) errors.push(`Invalid control code: ${control.code}`);
    if (!control.title || !control.titleBn || !control.objective || !control.evidenceRequirement || !control.label) errors.push(`Missing required text: ${control.code}`);
    if (!control.sourceRefs.length || control.sourceRefs.some(ref => !BANGLADESH_SOURCES.some(source => source.id === ref))) errors.push(`Invalid source reference: ${control.code}`);
    if (!control.sectorApplicability.length || control.sectorApplicability.some(sector => !sectors.has(sector))) errors.push(`Invalid sector taxonomy: ${control.code}`);
    if (!control.lifecycleStages.length || control.lifecycleStages.some(stage => !stages.has(stage)) || !control.lifecycleStages.includes("design") || !control.lifecycleStages.includes("operations")) errors.push(`Incomplete lifecycle coverage: ${control.code}`);
    if (!control.evidenceRequirements.length || !control.evidenceRequirements.includes("accountable_owner") || !control.evidenceRequirements.includes("risk_assessment") || !control.evidenceRequirements.includes("qualified_review") || !control.evidenceRequirements.includes("remediation_closure")) errors.push(`Incomplete minimum evidence: ${control.code}`);
    if (!control.riskGate.minimumTier || !control.riskGate.triggers.length || !control.riskGate.proportionalityNote) errors.push(`Missing risk/materiality gate: ${control.code}`);
    if (!control.reviewDueDate || !control.changeOwner) errors.push(`Missing lifecycle metadata: ${control.code}`);
    if (!["draft", "in_review", "approved", "published", "retired"].includes(control.lifecycle)) errors.push(`Invalid lifecycle: ${control.code}`);
  }
  for (const source of BANGLADESH_SOURCES) if (!/^https?:\/\//i.test(source.url) || !source.verificationHistory.length) errors.push(`Invalid source metadata: ${source.id}`);
  return { ok: errors.length === 0, errors, controlCount: BANGLADESH_CONTROLS.length, sourceCount: BANGLADESH_SOURCES.length, publishedControlCount: getPublishedBangladeshControls().length, reviewRequired: true };
}
