import { and, asc, desc, eq, gt, inArray, like, lt, or, sql } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { assessments, assessmentControls, controls, domains, evidence, findings, organizations, organizationMembers, reviewerAssignments, reviewEvents, users, externalReviewerInvites, aiSystems, actionItems } from "../drizzle/schema";
import type { AISystemDecisionImpact, AISystemLifecycleStatus } from "@shared/aiSystems";
import { GAAF_DOMAINS, PROFILE_CONTROL_LIMITS, PROFILE_DOMAIN_COUNTS } from "./agarasCatalog";
import { EXPANDED_CONTROLS } from "./expandedCatalog";
import { getDb } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { normalizeBangladeshSector } from "@shared/bangladeshSectors";

export async function ensureCatalog() {
  const db = await getDb();
  if (!db) return;
  const existingDomains = await db.select({ code: domains.code }).from(domains);
  const existingDomainCodes = new Set(existingDomains.map(row => row.code));
  const missingDomains = GAAF_DOMAINS.map(([code, title], index) => ({ code, title, sortOrder: index + 1, description: `Assessment domain for ${title}.` }))
    .filter(domain => !existingDomainCodes.has(domain.code));
  if (missingDomains.length) await db.insert(domains).values(missingDomains);
  const domainRows = await db.select({ id: domains.id, code: domains.code }).from(domains).orderBy(asc(domains.sortOrder));
  const domainMap = new Map(domainRows.map(row => [row.code, row.id]));
  const existingControls = await db.select({ code: controls.code }).from(controls);
  const existingCodes = new Set(existingControls.map(row => row.code));
  const missing = EXPANDED_CONTROLS.filter(control => !existingCodes.has(control.code)).map(control => ({ ...control, domainId: domainMap.get(control.domainCode) })).filter(control => control.domainId);
  for (let i = 0; i < missing.length; i += 200) {
    await db.insert(controls).values(missing.slice(i, i + 200).map(control => ({ code: control.code, domainId: control.domainId as number, title: control.title, objective: control.objective, evidenceRequirement: control.evidenceRequirement, applicability: control.applicability, sourceRefs: control.sourceRefs, lifecycleStage: control.lifecycleStage, controlType: control.controlType, criticality: control.criticality as "low" | "moderate" | "high" | "critical", weight: "1.00", version: "GAAF-1.1" })));
  }
}


const SECTOR_SELECTION_TERMS: Record<string, string[]> = {
  banking: ["financial", "bank", "credit", "fraud", "payment", "risk"], healthcare: ["health", "clinical", "patient", "safety", "privacy"], pharmaceuticals: ["health", "clinical", "quality", "safety", "research"], schools: ["education", "student", "child", "safety", "privacy"], higher_education: ["education", "research", "student", "academic"], telecom: ["network", "telecom", "security", "availability", "infrastructure"], technology: ["software", "model", "security", "product", "data"], government: ["public", "government", "rights", "service", "accountability"], agriculture: ["agriculture", "environment", "field", "data"], energy_utilities: ["energy", "utility", "infrastructure", "safety", "resilience"], transportation: ["transport", "safety", "infrastructure", "availability"], manufacturing: ["manufacturing", "industrial", "worker", "quality", "safety"], retail_ecommerce: ["consumer", "retail", "fraud", "privacy", "fairness"], media_journalism: ["media", "content", "misinformation", "provenance", "rights"], insurance: ["insurance", "underwriting", "claims", "fairness", "privacy"], legal_justice: ["legal", "justice", "rights", "due process", "confidentiality"],
};

export function rankAssessmentControls(input: { controls: Array<{ id: number; domainId: number; code: string; title: string; objective: string | null; applicability: string | null; criticality: string | null }>; sector?: string; organizationType?: string; regulatedSector?: boolean; perDomain: number }) {
  const terms = [...(SECTOR_SELECTION_TERMS[input.sector ?? ""] ?? []), ...(input.regulatedSector ? ["regulatory", "compliance", "audit"] : []), ...(input.organizationType === "government_agency" ? ["public", "government"] : [])];
  const haystack = (control: typeof input.controls[number]) => `${control.code} ${control.title} ${control.objective ?? ""} ${control.applicability ?? ""}`.toLocaleLowerCase("en");
  const score = (control: typeof input.controls[number]) => terms.reduce((total, term) => total + (haystack(control).includes(term) ? 1 : 0), 0) + (control.criticality === "critical" ? 2 : control.criticality === "high" ? 1 : 0);
  const byDomain = new Map<number, typeof input.controls>();
  for (const control of input.controls) byDomain.set(control.domainId, [...(byDomain.get(control.domainId) ?? []), control]);
  return [...byDomain.values()].flatMap(domainControls => [...domainControls].sort((a, b) => score(b) - score(a) || a.code.localeCompare(b.code)).slice(0, input.perDomain)).map(control => control.id);
}

export async function createAssessment(input: { userId: number; profileType: keyof typeof PROFILE_DOMAIN_COUNTS; title: string; jurisdiction?: string; sector?: string; organizationName?: string; division?: string; district?: string; locality?: string; organizationType?: string; ownershipType?: string; employeeCount?: string; dataResidency?: string; primaryLanguage?: string; regulatedSector?: boolean; entityClassification?: string; posture?: "self_assessment" | "evidence_audit" | "expert_review" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await ensureCatalog();
  return db.transaction(async tx => {
    const domainRows = await tx.select({ id: domains.id }).from(domains).orderBy(asc(domains.sortOrder));
    const selectedDomainCount = PROFILE_DOMAIN_COUNTS[input.profileType];
    const perDomain = PROFILE_CONTROL_LIMITS[input.profileType];
    const selectedDomainIds = new Set(domainRows.slice(0, selectedDomainCount).map(row => row.id));
    if (selectedDomainIds.size !== selectedDomainCount) throw new Error("Assessment catalogue is incomplete; no assessment was created");
    const allControls = await tx.select({ id: controls.id, domainId: controls.domainId, code: controls.code, title: controls.title, objective: controls.objective, applicability: controls.applicability, criticality: controls.criticality }).from(controls).where(eq(controls.active, true)).orderBy(asc(controls.code));
    const candidateControls = allControls.filter(control => selectedDomainIds.has(control.domainId));
    const selectedControls = rankAssessmentControls({ controls: candidateControls, sector: normalizeBangladeshSector(input.sector) ?? input.sector, organizationType: input.organizationType, regulatedSector: input.regulatedSector, perDomain });
    if (selectedControls.length !== selectedDomainCount * perDomain) throw new Error("Assessment catalogue does not contain the required controls for this profile");
    const selectionSnapshot = JSON.stringify({ version: "selection-1.0", profileType: input.profileType, sector: normalizeBangladeshSector(input.sector) ?? input.sector ?? null, organizationType: input.organizationType ?? null, regulatedSector: input.regulatedSector ?? false, selectedDomainIds: [...selectedDomainIds], selectedControlIds: selectedControls });
    const [assessment] = await tx.insert(assessments).values({ userId: input.userId, profileType: input.profileType, title: input.title, jurisdiction: input.jurisdiction, sector: normalizeBangladeshSector(input.sector) ?? input.sector, organizationName: input.organizationName, division: input.division, district: input.district, locality: input.locality, organizationType: input.organizationType, ownershipType: input.ownershipType, employeeCount: input.employeeCount, dataResidency: input.dataResidency, primaryLanguage: input.primaryLanguage, regulatedSector: input.regulatedSector ?? false, entityClassification: input.entityClassification, posture: input.posture ?? "self_assessment", status: "in_progress", controlSelectionVersion: "selection-1.0", controlSelectionSnapshot: selectionSnapshot, controlSelectionHash: createHash("sha256").update(selectionSnapshot).digest("hex") }).$returningId();
    await tx.insert(assessmentControls).values(selectedControls.map(controlId => ({ assessmentId: assessment.id, controlId })));
    return tx.select().from(assessments).where(eq(assessments.id, assessment.id)).limit(1).then(rows => rows[0]);
  });
}

export async function getAssessmentForUser(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(assessments).where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId))).limit(1);
  return rows[0];
}

export async function listAssessments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [owned, memberships, reviewerAssignmentsForUser] = await Promise.all([
    db.select().from(assessments).where(eq(assessments.userId, userId)),
    db.select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role }).from(organizationMembers)
      .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"))),
    db.select({ assessmentId: reviewerAssignments.assessmentId }).from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.reviewerId, userId), inArray(reviewerAssignments.status, ["active", "completed"]))),
  ]);
  const readableOrgIds = memberships.filter(row => mayUseAssessmentRole(row.role)).map(row => row.organizationId);
  const reviewerAssessmentIds = new Set(reviewerAssignmentsForUser.map(row => row.assessmentId));
  const shared = readableOrgIds.length
    ? (await db.select().from(assessments).where(inArray(assessments.organizationId, readableOrgIds))).filter(row => !reviewerAssessmentIds.has(row.id))
    : [];
  // Reviewer assignments are exposed through review.myAssignments, where every record is scope-filtered.
  // Do not return full assessment rows here: that would bypass evidence/findings/domain assignment limits.
  const rows = [...new Map([...owned, ...shared].map(row => [row.id, row])).values()]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const roleByOrganization = new Map(memberships.map(row => [row.organizationId, row.role]));
  return rows.map(row => ({
    ...row,
    canEdit: row.userId === userId || Boolean(row.organizationId && mayUseAssessmentRole(roleByOrganization.get(row.organizationId), true)),
  }));
}

type AssessmentControlView = {
  assignment: Omit<typeof assessmentControls.$inferSelect, "applicabilityStatus" | "applicabilityRationale" | "applicabilityReviewedBy" | "applicabilityReviewedAt"> & {
    applicabilityStatus: typeof assessmentControls.$inferSelect.applicabilityStatus | null;
    applicabilityRationale: string | null;
    applicabilityReviewedBy: number | null;
    applicabilityReviewedAt: Date | null;
  };
  control: typeof controls.$inferSelect;
  domain: typeof domains.$inferSelect;
};

export async function getAssessmentControls(assessmentId: number, userId: number): Promise<AssessmentControlView[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const access=await canReviewAssessment(assessmentId,userId); if(!access) return [];
  const rows=await db.select({ assignment: assessmentControls, control: controls, domain: domains }).from(assessmentControls).innerJoin(controls, eq(assessmentControls.controlId, controls.id)).innerJoin(domains, eq(controls.domainId, domains.id)).where(eq(assessmentControls.assessmentId, assessmentId));
  const viewRows = rows as AssessmentControlView[];
  if (access.kind !== "reviewer") return viewRows;
  const assignment = access.assignment!;
  if (!scopeAllows(assignment.status, assignment.scope, "controls")) return [];
  if (assignment.scope === "domain") return viewRows.filter(row => row.domain.id === assignment.domainId);
  if (assignment.scope === "evidence") {
    return viewRows.map(row => ({
      ...row,
      assignment: {
        ...row.assignment,
        responseScore: null,
        responseNotes: null,
        applicabilityStatus: null,
        applicabilityRationale: null,
        applicabilityReviewedBy: null,
        applicabilityReviewedAt: null,
        reviewDecision: "pending" as const,
        reviewedBy: null,
        reviewedAt: null,
      },
    }));
  }
  return viewRows;
}

type ApplicabilityStatus = "applicable" | "not_applicable_pending" | "not_applicable_accepted" | "not_applicable_rejected";
type AssessmentResponseInput = { controlId: number; responseScore?: number; responseNotes?: string; evidenceStatus?: "not_requested" | "missing" | "submitted" | "verified" | "rejected"; applicabilityStatus?: ApplicabilityStatus; applicabilityRationale?: string };
export function buildResponseUpdate(input: { responseScore?: number; responseNotes?: string; evidenceStatus?: AssessmentResponseInput["evidenceStatus"]; applicabilityStatus?: ApplicabilityStatus; applicabilityRationale?: string }) {
  const applicabilityStatus = input.applicabilityStatus;
  if (applicabilityStatus && applicabilityStatus !== "applicable" && (!input.applicabilityRationale || input.applicabilityRationale.trim().length < 10)) throw new Error("A Not Applicable decision requires a rationale of at least 10 characters");
  return {
    responseScore: input.responseScore,
    responseNotes: input.responseNotes,
    ...(applicabilityStatus === undefined ? {} : { applicabilityStatus, applicabilityRationale: input.applicabilityRationale?.trim() || null }),
    ...(input.evidenceStatus === undefined ? {} : { evidenceStatus: input.evidenceStatus }),
  };
}

export async function saveResponses(input: { assessmentId: number; userId: number; responses: AssessmentResponseInput[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!input.responses.length || input.responses.length > 500) throw new Error("Save between 1 and 500 responses at a time");
  const ids = input.responses.map(response => response.controlId);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate control responses are not allowed");
  return db.transaction(async tx => {
    const assessment = await tx.select({ status: assessments.status, userId: assessments.userId, organizationId: assessments.organizationId }).from(assessments)
      .where(eq(assessments.id, input.assessmentId)).limit(1).for("update").then(rows => rows[0]);
    if (!assessment) throw new Error("Assessment not found");
    const member = assessment.organizationId ? await tx.select({ role: organizationMembers.role }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, assessment.organizationId), eq(organizationMembers.userId, input.userId), eq(organizationMembers.status, "active"))).limit(1).then(rows => rows[0]) : undefined;
    const isOwner = assessment.userId === input.userId;
    const assignmentRows = isOwner ? [] : await tx.select().from(reviewerAssignments).where(and(
      eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, input.userId),
      inArray(reviewerAssignments.status, ["active", "completed"]),
    )).for("update");
    const currentAssignment = choosePreferredReviewerAssignment(assignmentRows);
    if (!mayEditAssessmentResponses({ owner: isOwner, activeOrganizationRole: member?.role, reviewerAssignmentStatus: currentAssignment?.status })) throw new Error("You do not have permission to edit this assessment");
    if (!isAssessmentEditable(assessment.status)) throw new Error("This assessment is locked while submitted or under review");
    const assignedControls = await tx.select({ controlId: assessmentControls.controlId, responseScore: assessmentControls.responseScore, evidenceStatus: assessmentControls.evidenceStatus, applicabilityStatus: assessmentControls.applicabilityStatus })
      .from(assessmentControls).where(eq(assessmentControls.assessmentId, input.assessmentId));
    const assignedIds = new Set(assignedControls.map(row => row.controlId));
    if (ids.some(controlId => !assignedIds.has(controlId))) throw new Error("One or more controls are not part of this assessment");
    for (const response of input.responses) {
      if (response.applicabilityStatus === "applicable" && response.responseScore === undefined) throw new Error("An applicable control requires a score from 0 to 4");
      await tx.update(assessmentControls).set(buildResponseUpdate(response))
        .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, response.controlId)));
    }
    const rows = await tx.select({ score: assessmentControls.responseScore, evidenceStatus: assessmentControls.evidenceStatus, applicabilityStatus: assessmentControls.applicabilityStatus })
      .from(assessmentControls).where(eq(assessmentControls.assessmentId, input.assessmentId));
    const scoredRows = rows.filter(row => row.applicabilityStatus !== "not_applicable_accepted");
    const answered = scoredRows.filter(row => row.score !== null);
    const score = answered.length ? (answered.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / (answered.length * 4)) * 100 : 0;
    const evidenceCount = scoredRows.filter(row => row.evidenceStatus === "submitted" || row.evidenceStatus === "verified").length;
    const evidenceCoverage = scoredRows.length ? (evidenceCount / scoredRows.length) * 100 : 0;
    const protectedStatuses = ["submitted", "review", "changes_requested", "verified", "complete", "closed"] as const;
    const status = (protectedStatuses as readonly string[]).includes(assessment.status) ? assessment.status : answered.length ? "in_progress" : "draft";
    await tx.update(assessments).set({ score: score.toFixed(2), evidenceCoverage: evidenceCoverage.toFixed(2), status }).where(eq(assessments.id, input.assessmentId));
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, actorId: input.userId, entityType: "assessment", entityId: input.assessmentId, eventType: "comment", message: `Saved ${input.responses.length} assessment response(s)` });
    return tx.select().from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).then(result => result[0]);
  });
}

export async function saveResponse(input: { assessmentId: number; userId: number } & AssessmentResponseInput) {
  return saveResponses({ ...input, responses: [{ controlId: input.controlId, responseScore: input.responseScore, responseNotes: input.responseNotes, evidenceStatus: input.evidenceStatus }] });
}

export async function recalculateAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select({ score: assessmentControls.responseScore, evidenceStatus: assessmentControls.evidenceStatus, applicabilityStatus: assessmentControls.applicabilityStatus }).from(assessmentControls).where(eq(assessmentControls.assessmentId, assessmentId));
  const scoredRows = rows.filter(row => row.applicabilityStatus !== "not_applicable_accepted");
  const answered = scoredRows.filter(row => row.score !== null);
  const score = answered.length ? (answered.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / (answered.length * 4)) * 100 : 0;
  const evidenceCount = scoredRows.filter(row => row.evidenceStatus === "submitted" || row.evidenceStatus === "verified").length;
  const evidenceCoverage = scoredRows.length ? (evidenceCount / scoredRows.length) * 100 : 0;
  const current = await db.select({ status: assessments.status }).from(assessments).where(eq(assessments.id, assessmentId)).limit(1).then(rows => rows[0]);
  const protectedStatuses = ["submitted", "review", "changes_requested", "verified", "complete", "closed"] as const;
  const status = current && (protectedStatuses as readonly string[]).includes(current.status) ? current.status : answered.length ? "in_progress" : "draft";
  await db.update(assessments).set({ score: score.toFixed(2), evidenceCoverage: evidenceCoverage.toFixed(2), status }).where(eq(assessments.id, assessmentId));
}

export async function submitAssessment(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const assessment = await getAssessmentForUser(assessmentId, userId);
  if (!assessment) throw new Error("Assessment not found");
  if (["submitted", "review", "verified", "complete", "closed"].includes(assessment.status)) return { ok: true, status: assessment.status } as const;
  if (!isAssessmentEditable(assessment.status)) throw new Error("This assessment cannot be submitted from its current state");
    const responseRows = await db.select({ score: assessmentControls.responseScore, applicabilityStatus: assessmentControls.applicabilityStatus }).from(assessmentControls).where(eq(assessmentControls.assessmentId, assessmentId));
  if (!responseRows.length) throw new Error("This assessment has no scoped controls to submit");
    const unanswered = responseRows.filter(row => row.score === null && row.applicabilityStatus !== "not_applicable_accepted").length;
  if (unanswered) throw new Error(`Answer all scoped controls before submission (${unanswered} remaining)`);
  const submittedAt = new Date();
  return db.transaction(async tx => {
    const result = await tx.update(assessments).set({ status: "submitted" })
      .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, userId), inArray(assessments.status, ["draft", "in_progress", "changes_requested"])));
    if (result[0].affectedRows !== 1) throw new Error("Assessment state changed before submission; refresh and try again");
    await tx.insert(reviewEvents).values({ assessmentId, actorId: userId, entityType: "assessment", entityId: assessmentId, eventType: "status_change", message: `Assessment submitted at ${submittedAt.toISOString()}` });
    return { ok: true, status: "submitted" } as const;
  });
}

function organizationSlug(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "organization"}-${randomUUID().slice(0, 12)}`;
}

export async function createOrganizationForUser(input: { userId: number; name: string; sector?: string; jurisdiction?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const [row] = await tx.insert(organizations).values({ name: input.name, sector: input.sector, jurisdiction: input.jurisdiction, ownerId: input.userId, slug: organizationSlug(input.name) }).$returningId();
    await tx.insert(organizationMembers).values({ organizationId: row.id, userId: input.userId, role: "owner", status: "active" });
    return tx.select().from(organizations).where(eq(organizations.id, row.id)).limit(1).then(rows => rows[0]);
  });
}

export async function listManagedOrganizations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owned = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.ownerId, userId));
  const administered = await db.select({ id: organizationMembers.organizationId }).from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"), inArray(organizationMembers.role, ["owner", "admin"])));
  const ids = [...new Set([...owned, ...administered].map(row => row.id))];
  return ids.length ? db.select({ id: organizations.id, name: organizations.name, sector: organizations.sector, jurisdiction: organizations.jurisdiction })
    .from(organizations).where(inArray(organizations.id, ids)).orderBy(asc(organizations.name)) : [];
}

async function assertCanManageOrganization(tx: any, organizationId: number, userId: number) {
  const organization = await tx.select({ id: organizations.id, ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, organizationId)).limit(1).then((rows: any[]) => rows[0]);
  if (!organization) throw new Error("Organization not found or not authorized");
  if (organization.ownerId === userId) return organization;
  const membership = await tx.select({ role: organizationMembers.role }).from(organizationMembers)
    .where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"))).limit(1).then((rows: any[]) => rows[0]);
  if (!membership || !["owner", "admin"].includes(membership.role)) throw new Error("Organization not found or not authorized");
  return organization;
}

export async function linkAssessmentToOrganization(input: { assessmentId: number; organizationId: number; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const assessment = await tx.select({ id: assessments.id, userId: assessments.userId, status: assessments.status, organizationId: assessments.organizationId })
      .from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).for("update").then(rows => rows[0]);
    if (!assessment || assessment.userId !== input.userId) throw new Error("Assessment not found or not authorized");
    if (!isAssessmentEditable(assessment.status)) throw new Error("Organization context cannot be changed after assessment submission");
    if (assessment.organizationId && assessment.organizationId !== input.organizationId) throw new Error("Assessment is already linked to another organization");
    const organization = await assertCanManageOrganization(tx, input.organizationId, input.userId);
    await tx.update(assessments).set({ organizationId: organization.id }).where(eq(assessments.id, input.assessmentId));
    return { ok: true, organizationId: organization.id } as const;
  });
}

export async function createOrganizationForAssessment(input: { assessmentId: number; userId: number; name: string; sector?: string; jurisdiction?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const assessment = await tx.select({ id: assessments.id, userId: assessments.userId, status: assessments.status, organizationId: assessments.organizationId })
      .from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).for("update").then(rows => rows[0]);
    if (!assessment || assessment.userId !== input.userId) throw new Error("Assessment not found or not authorized");
    if (!isAssessmentEditable(assessment.status)) throw new Error("Organization context cannot be changed after assessment submission");
    if (assessment.organizationId) throw new Error("Assessment is already linked to an organization");
    const [created] = await tx.insert(organizations).values({ name: input.name, sector: input.sector, jurisdiction: input.jurisdiction, ownerId: input.userId, slug: organizationSlug(input.name) }).$returningId();
    await tx.insert(organizationMembers).values({ organizationId: created.id, userId: input.userId, role: "owner", status: "active" });
    await tx.update(assessments).set({ organizationId: created.id }).where(eq(assessments.id, input.assessmentId));
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, actorId: input.userId, entityType: "assessment", entityId: input.assessmentId, eventType: "status_change", message: "Assessment linked to a new organization workspace" });
    return tx.select().from(organizations).where(eq(organizations.id, created.id)).limit(1).then(rows => rows[0]);
  });
}

export type AISystemContext = { id: number; title: string; organizationId: number | null };
export type AISystemOrganization = { id: number; name: string };
export type AISystemFilters = { assessmentId?: number; organizationId?: number; search?: string; riskLevel?: "low" | "moderate" | "high" | "critical"; lifecycleStatus?: AISystemLifecycleStatus; decisionImpact?: AISystemDecisionImpact };
export type AISystemInput = { assessmentId?: number; organizationId?: number; name: string; provider?: string; purpose?: string; decisionImpact?: AISystemDecisionImpact; humanOversight?: string; riskLevel?: "low" | "moderate" | "high" | "critical"; lifecycleStatus?: AISystemLifecycleStatus };

export function isAssessmentEditable(status: string) { return ["draft", "in_progress", "changes_requested"].includes(status); }

export function parentOrganizationsMatch(assessmentOrganizationId: number | null | undefined, requestedOrganizationId: number | undefined) {
  return requestedOrganizationId === undefined || assessmentOrganizationId === requestedOrganizationId;
}
export function mayUseParentContext(input: { assessmentOwner: boolean; organizationOwner: boolean; activeMember: boolean; parentsMatch: boolean }) {
  return input.parentsMatch && (input.assessmentOwner || input.organizationOwner || input.activeMember);
}
export function mayGrantOrganizationAdmin(isOrganizationOwner: boolean) { return isOrganizationOwner; }
export function mayChangeOrganizationAdminRole(isOrganizationOwner: boolean, targetRole: string, requestedRole?: string) {
  return isOrganizationOwner || (targetRole !== "admin" && requestedRole !== "admin");
}
export function mayManageAISystems(input: { owner: boolean; activeRole?: string; reviewer?: boolean }) {
  return input.owner || ["owner", "admin", "contributor"].includes(input.activeRole ?? "");
}
export function mayReadReviewerScope(status: string, scope: string) { return status === "active" && scope === "full"; }
export function mayListAISystemRow(input: { assessmentId: number | null; organizationId: number | null; assessmentOrganizationId?: number | null; readableAssessmentIds: readonly number[]; readableOrganizationIds: readonly number[]; restrictedAssessmentIds: readonly number[] }) {
  if (input.assessmentId === null && input.organizationId === null) return false;
  if (input.assessmentId !== null && input.restrictedAssessmentIds.includes(input.assessmentId)) return false;
  if (input.assessmentId !== null && input.organizationId !== null) {
    return input.assessmentOrganizationId === input.organizationId
      && (input.readableAssessmentIds.includes(input.assessmentId) || input.readableOrganizationIds.includes(input.organizationId));
  }
  if (input.assessmentId !== null) return input.readableAssessmentIds.includes(input.assessmentId);
  return input.organizationId !== null && input.readableOrganizationIds.includes(input.organizationId);
}
export function mayUseAssessmentRole(role: string | undefined, write = false) { return write ? ["owner", "admin", "contributor"].includes(role ?? "") : ["owner", "admin", "contributor", "member"].includes(role ?? ""); }
export function resolveAssessmentAccessKind(input: { isOwner: boolean; reviewerAssignmentStatus?: string; organizationRole?: string }) {
  if (input.isOwner) return "owner" as const;
  if (input.reviewerAssignmentStatus === "active" || input.reviewerAssignmentStatus === "completed") return "reviewer" as const;
  if (mayUseAssessmentRole(input.organizationRole)) return "member" as const;
  return undefined;
}
export function choosePreferredReviewerAssignment<T extends { id: number; status: string; assignedAt: Date }>(assignments: readonly T[]) {
  return [...assignments]
    .filter(assignment => assignment.status === "active" || assignment.status === "completed")
    .sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || b.assignedAt.getTime() - a.assignedAt.getTime() || b.id - a.id)[0];
}
export function mayEditAssessmentResponses(input: { owner: boolean; activeOrganizationRole?: string; reviewerAssignmentStatus?: string }) {
  if (input.owner) return true;
  if (input.reviewerAssignmentStatus === "active" || input.reviewerAssignmentStatus === "completed") return false;
  return mayUseAssessmentRole(input.activeOrganizationRole, true);
}
export function scopeAllows(status: string, scope: string, resource: "controls"|"findings"|"evidence"|"dashboard"|"report"|"events", domainMatches = true) { return mayAccessReviewScope(status, scope, resource, domainMatches); }
export function resolveAssessmentReviewStatus(input: { hasOpenAssignments: boolean; hasChanges: boolean; allControlsApproved: boolean }): "review" | "changes_requested" | "verified" | "submitted" {
  if (input.hasOpenAssignments) return "review";
  if (input.hasChanges) return "changes_requested";
  if (input.allControlsApproved) return "verified";
  return "submitted";
}
export function mayAccessReviewScope(status: string, scope: string, resource: "controls" | "findings" | "evidence" | "dashboard" | "report" | "events", domainMatches = true) {
  if (status !== "active" && status !== "completed") return false;
  if (status === "completed" && resource !== "events") return false;
  if (scope === "full") return true;
  if (scope === "domain") return resource === "controls" || resource === "findings" || resource === "evidence" || resource === "events" ? domainMatches : false;
  if (scope === "findings") return resource === "findings" || resource === "events";
  if (scope === "evidence") return resource === "controls" || resource === "evidence" || resource === "events";
  return false;
}

async function authorizedAISystemParent(input: { userId: number; assessmentId?: number; organizationId?: number; write: boolean }) {
  const db = await getDb();
  if (!db || (!input.assessmentId && !input.organizationId)) throw new Error("Authorized parent context required");
  let assessment: typeof assessments.$inferSelect | undefined;
  let organization: typeof organizations.$inferSelect | undefined;
  if (input.assessmentId) {
    assessment = await db.select().from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).then(rows => rows[0]);
    if (!assessment) throw new Error("Authorized parent context required");
  }
  const orgId = input.organizationId ?? assessment?.organizationId ?? undefined;
  if (orgId) {
    organization = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1).then(rows => rows[0]);
    if (!organization) throw new Error("Authorized parent context required");
  }
  if (assessment && input.organizationId && assessment.organizationId !== input.organizationId) throw new Error("Authorized parent context required");
  if (assessment && organization && assessment.organizationId !== organization.id) throw new Error("Authorized parent context required");
  const membership = orgId ? await getMembership(orgId, input.userId) : undefined;
  const ownAssessment=assessment?.userId===input.userId, ownOrg=organization?.ownerId===input.userId;
  const parentsMatch = (!assessment || !organization || parentOrganizationsMatch(assessment.organizationId, organization.id))
    && (!assessment || parentOrganizationsMatch(assessment.organizationId, input.organizationId));
  let assignment: typeof reviewerAssignments.$inferSelect | undefined;
  if(assessment && !ownAssessment) {
    const assignmentRows=await db.select().from(reviewerAssignments).where(and(eq(reviewerAssignments.assessmentId,assessment.id),eq(reviewerAssignments.reviewerId,input.userId),inArray(reviewerAssignments.status,["active","completed"])));
    assignment=choosePreferredReviewerAssignment(assignmentRows);
  }
  const reviewerFull=Boolean(assignment&&mayReadReviewerScope(assignment.status,assignment.scope));
  const roleAccess=mayUseParentContext({ assessmentOwner: ownAssessment, organizationOwner: ownOrg, activeMember: Boolean(membership && mayUseAssessmentRole(membership.role ?? undefined)), parentsMatch });
  const allowed = assignment ? reviewerFull && parentsMatch : roleAccess || reviewerFull;
  const writable=ownAssessment || ownOrg || mayManageAISystems({owner:false,activeRole:membership?.role??undefined});
  if(!allowed || (input.write&&!writable)) throw new Error("Authorized parent context required");
  return {db,assessment,organization};
}
async function buildAISystemContextOptions(userId:number) {
 const db=await getDb(); if(!db) throw new Error("Database is not available");
 const own=await db.select({id:assessments.id,title:assessments.title,organizationId:assessments.organizationId}).from(assessments).where(eq(assessments.userId,userId));
 const memberships=await db.select({organizationId:organizationMembers.organizationId,role:organizationMembers.role}).from(organizationMembers).where(and(eq(organizationMembers.userId,userId),eq(organizationMembers.status,"active")));
 const regular=memberships.filter(m=>mayUseAssessmentRole(m.role??undefined)); const orgIds=[...new Set([...regular.map(m=>m.organizationId),...(await db.select({id:organizations.id}).from(organizations).where(eq(organizations.ownerId,userId))).map(o=>o.id)])];
 const orgs=orgIds.length?await db.select({id:organizations.id,name:organizations.name}).from(organizations).where(inArray(organizations.id,orgIds)):[];
 const assigned=await db.select({assignment:reviewerAssignments,assessment:{id:assessments.id,title:assessments.title,organizationId:assessments.organizationId}}).from(reviewerAssignments).innerJoin(assessments,eq(reviewerAssignments.assessmentId,assessments.id)).where(and(eq(reviewerAssignments.reviewerId,userId),inArray(reviewerAssignments.status,["active","completed"])));
 const assignedAssessmentIds=new Set(assigned.map(row=>row.assignment.assessmentId));
 const shared=orgIds.length?(await db.select({id:assessments.id,title:assessments.title,organizationId:assessments.organizationId}).from(assessments).where(inArray(assessments.organizationId,orgIds))).filter(row=>!assignedAssessmentIds.has(row.id)):[];
 const ownAssessmentIds=new Set(own.map(row=>row.id));
 const restrictedAssessmentIds=assigned.filter(row=>!ownAssessmentIds.has(row.assessment.id)&&!mayReadReviewerScope(row.assignment.status,row.assignment.scope)).map(row=>row.assessment.id);
 return {assessments:[...new Map([...own,...shared,...assigned.filter(r=>mayReadReviewerScope(r.assignment.status,r.assignment.scope)).map(r=>r.assessment)].map(r=>[r.id,r])).values()],organizations:orgs,restrictedAssessmentIds};
}
export async function aiSystemContextOptions(userId:number) {
 const {assessments,organizations}=await buildAISystemContextOptions(userId);
 return {assessments,organizations};
}
export async function listAISystems(userId: number, filters: AISystemFilters = {}) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const contexts = await buildAISystemContextOptions(userId);
  const accessibleOrgIds = contexts.organizations.map(o => o.id);
  const accessibleAssessmentIds = contexts.assessments.map(a => a.id);
  const clauses = [or(accessibleOrgIds.length ? inArray(aiSystems.organizationId, accessibleOrgIds) : sql`false`, accessibleAssessmentIds.length ? inArray(aiSystems.assessmentId, accessibleAssessmentIds) : sql`false`)!];
  if (filters.assessmentId) clauses.push(eq(aiSystems.assessmentId, filters.assessmentId));
  if (filters.organizationId) clauses.push(eq(aiSystems.organizationId, filters.organizationId));
  if (filters.riskLevel) clauses.push(eq(aiSystems.riskLevel, filters.riskLevel));
  if (filters.lifecycleStatus) clauses.push(eq(aiSystems.lifecycleStatus, filters.lifecycleStatus));
  if (filters.decisionImpact) clauses.push(eq(aiSystems.decisionImpact, filters.decisionImpact));
  if (filters.search) { const term=filters.search.replace(/[\\%_]/g, "\\$&"); const pattern=`%${term}%`; clauses.push(or(like(aiSystems.name,pattern),like(aiSystems.provider,pattern),like(aiSystems.purpose,pattern))!); }
  const rows = await db.select().from(aiSystems).where(and(...clauses)).orderBy(desc(aiSystems.updatedAt));
  const dualParentIds = [...new Set(rows.filter(row => row.assessmentId !== null && row.organizationId !== null).map(row => row.assessmentId!))];
  const parentOrganizations = dualParentIds.length
    ? await db.select({ id: assessments.id, organizationId: assessments.organizationId }).from(assessments).where(inArray(assessments.id, dualParentIds))
    : [];
  const organizationByAssessment = new Map(parentOrganizations.map(row => [row.id, row.organizationId]));
  const systems = rows.filter(row => mayListAISystemRow({
    assessmentId: row.assessmentId,
    organizationId: row.organizationId,
    assessmentOrganizationId: row.assessmentId === null ? undefined : organizationByAssessment.get(row.assessmentId),
    readableAssessmentIds: accessibleAssessmentIds,
    readableOrganizationIds: accessibleOrgIds,
    restrictedAssessmentIds: contexts.restrictedAssessmentIds,
  }));
  const byRisk: Record<string, number> = {}; const byLifecycle: Record<string, number> = {};
  for (const row of systems) { byRisk[row.riskLevel] = (byRisk[row.riskLevel] ?? 0) + 1; byLifecycle[row.lifecycleStatus] = (byLifecycle[row.lifecycleStatus] ?? 0) + 1; }
  return { systems, stats: { total: systems.length, byRisk, byLifecycle } };
}
export async function getAISystem(userId: number, systemId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const row = await db.select().from(aiSystems).where(eq(aiSystems.id, systemId)).limit(1).then(rows => rows[0]);
  if (!row) throw new Error("AI system not found or not authorized");
  await authorizedAISystemParent({ userId, assessmentId: row.assessmentId ?? undefined, organizationId: row.organizationId ?? undefined, write: false });
  const assessment = row.assessmentId ? await db.select({ title: assessments.title }).from(assessments).where(eq(assessments.id, row.assessmentId)).limit(1).then(rows => rows[0]) : undefined;
  const organization = row.organizationId ? await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, row.organizationId)).limit(1).then(rows => rows[0]) : undefined;
  return { system: row, assessment: assessment ?? null, organization: organization ?? null };
}
export async function addAISystem(input: AISystemInput & { userId: number }) {
  const { db } = await authorizedAISystemParent({ userId: input.userId, assessmentId: input.assessmentId, organizationId: input.organizationId, write: true });
  const [row] = await db.insert(aiSystems).values({ assessmentId: input.assessmentId, organizationId: input.organizationId, name: input.name, provider: input.provider, purpose: input.purpose, decisionImpact: input.decisionImpact, humanOversight: input.humanOversight, riskLevel: input.riskLevel, lifecycleStatus: input.lifecycleStatus, createdBy: input.userId }).$returningId();
  return db.select().from(aiSystems).where(eq(aiSystems.id, row.id)).limit(1).then(rows => rows[0]);
}
export async function updateAISystem(input: { userId: number; systemId: number } & Partial<Omit<AISystemInput, "assessmentId" | "organizationId">>) {
  const db = await getDb(); if (!db) throw new Error("AI system not found or not authorized");
  const row = await db.select().from(aiSystems).where(eq(aiSystems.id, input.systemId)).limit(1).then(rows => rows[0]);
  if (!row) throw new Error("AI system not found or not authorized");
  await authorizedAISystemParent({ userId: input.userId, assessmentId: row.assessmentId ?? undefined, organizationId: row.organizationId ?? undefined, write: true });
  const { userId: _userId, systemId: _systemId, ...changes } = input; await db.update(aiSystems).set(changes).where(eq(aiSystems.id, row.id));
  return db.select().from(aiSystems).where(eq(aiSystems.id, row.id)).limit(1).then(rows => rows[0]);
}
export async function retireAISystem(userId: number, systemId: number) { return updateAISystem({ userId, systemId, lifecycleStatus: "retired" }); }
export async function addFinding(input: { userId: number; assessmentId: number; controlId?: number; title: string; description?: string; recommendation?: string; severity?: "low" | "moderate" | "high" | "critical"; dueDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const assessment = await getAssessmentForUser(input.assessmentId, input.userId);
  if (!assessment) throw new Error("Assessment not found");
  if (!isAssessmentEditable(assessment.status)) throw new Error("This assessment is locked while submitted or under review");
  if(input.controlId) { const valid=await db.select({id:assessmentControls.id}).from(assessmentControls).where(and(eq(assessmentControls.assessmentId,input.assessmentId),eq(assessmentControls.controlId,input.controlId))).limit(1); if(!valid.length) throw new Error("Assessment not found"); }
  const [row] = await db.insert(findings).values({ assessmentId: input.assessmentId, controlId: input.controlId, title: input.title, description: input.description, recommendation: input.recommendation, severity: input.severity, dueDate: input.dueDate }).$returningId();
  return db.select().from(findings).where(eq(findings.id, row.id)).limit(1).then(rows => rows[0]);
}

export async function listFindings(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const access=await canReviewAssessment(assessmentId,userId); if(!access) return [];
  if(access.kind==="reviewer" && !scopeAllows(access.assignment!.status,access.assignment!.scope,"findings")) return [];
  const rows=await db.select().from(findings).where(eq(findings.assessmentId, assessmentId)).orderBy(desc(findings.createdAt));
  if(access.kind==="reviewer" && access.assignment!.scope==="domain") { const cs=await db.select({id:controls.id,domainId:controls.domainId}).from(controls); const ids=new Set(cs.filter(c=>c.domainId===access.assignment!.domainId).map(c=>c.id)); return rows.filter(f=>f.controlId!=null&&ids.has(f.controlId)); }
  return rows;
}

export async function listActionItems(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const access = await canReviewAssessment(assessmentId, userId);
  if (!access) return [];
  if (access.kind === "reviewer" && !scopeAllows(access.assignment!.status, access.assignment!.scope, "findings")) return [];
  const rows = await db.select({ item: actionItems, owner: { id: users.id, name: users.name, email: users.email } })
    .from(actionItems).leftJoin(users, eq(actionItems.ownerId, users.id))
    .where(eq(actionItems.assessmentId, assessmentId)).orderBy(desc(actionItems.dueDate), desc(actionItems.createdAt));
  let visible = rows;
  if (access.kind === "reviewer" && access.assignment!.scope !== "full") {
    const permittedFindings = access.assignment!.scope === "domain"
      ? await db.select({ id: findings.id }).from(findings).innerJoin(controls, eq(findings.controlId, controls.id))
          .where(and(eq(findings.assessmentId, assessmentId), eq(controls.domainId, access.assignment!.domainId!)))
      : await db.select({ id: findings.id }).from(findings).where(eq(findings.assessmentId, assessmentId));
    const findingIds = new Set(permittedFindings.map(finding => finding.id));
    visible = rows.filter(row => row.item.findingId !== null && findingIds.has(row.item.findingId));
  }
  return visible.map(row => ({ ...row.item, ownerInfo: row.owner?.id ? row.owner : null }));
}

export async function createActionItem(input: { assessmentId: number; userId: number; findingId?: number; title: string; description?: string; ownerId?: number; dueDate?: Date; priority?: "low" | "medium" | "high" }) {
  const db = await getDb();
  if (!db || !(await canManageReviewers(input.assessmentId, input.userId))) throw new Error("Only the assessment owner or authorized reviewer can create action items");
  if(input.findingId) { const f=await db.select({id:findings.id}).from(findings).where(and(eq(findings.id,input.findingId),eq(findings.assessmentId,input.assessmentId))).limit(1); if(!f.length) throw new Error("Action item not found or not authorized"); }
  if(input.ownerId) { const assessment=await db.select({userId:assessments.userId,organizationId:assessments.organizationId}).from(assessments).where(eq(assessments.id,input.assessmentId)).limit(1).then(r=>r[0]); const member=assessment?.organizationId?await getMembership(assessment.organizationId,input.ownerId):undefined; if(!assessment||(assessment.userId!==input.ownerId&&!member)) throw new Error("Assignee must be an active member of the linked organization"); }
  const itemId = await db.transaction(async tx => {
    const [row] = await tx.insert(actionItems).values({ assessmentId: input.assessmentId, findingId: input.findingId, title: input.title, description: input.description, ownerId: input.ownerId, dueDate: input.dueDate, priority: input.priority ?? "medium", status: "planned" }).$returningId();
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, actorId: input.userId, entityType: "assessment", entityId: input.assessmentId, eventType: "comment", message: `Created action item #${row.id}` });
    return row.id;
  });
  return db.select().from(actionItems).where(eq(actionItems.id, itemId)).limit(1).then(rows => rows[0]);
}

export async function updateActionItem(input: { actionItemId: number; userId: number; title?: string; description?: string; ownerId?: number; dueDate?: Date; status?: "planned" | "in_progress" | "blocked" | "done"; priority?: "low" | "medium" | "high" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(actionItems).where(eq(actionItems.id, input.actionItemId)).limit(1).then(rows => rows[0]);
  if (!existing || !(await canManageReviewers(existing.assessmentId, input.userId))) throw new Error("Action item not found or not authorized");
  if (input.ownerId !== undefined) {
    const assessment = await db.select({ userId: assessments.userId, organizationId: assessments.organizationId }).from(assessments).where(eq(assessments.id, existing.assessmentId)).limit(1).then(rows => rows[0]);
    const member = input.ownerId && assessment?.organizationId ? await getMembership(assessment.organizationId, input.ownerId) : undefined;
    if (!assessment || (input.ownerId !== assessment.userId && !member)) throw new Error("Assignee must be an active member of the linked organization");
  }
  const { actionItemId: _actionItemId, userId: _userId, ...changes } = input;
  await db.transaction(async tx => {
    await tx.update(actionItems).set(changes).where(eq(actionItems.id, input.actionItemId));
    const changed = input.status ? `status changed to ${input.status}` : input.ownerId !== undefined ? "assignee updated" : "details updated";
    await tx.insert(reviewEvents).values({ assessmentId: existing.assessmentId, actorId: input.userId, entityType: "assessment", entityId: existing.assessmentId, eventType: "comment", message: `Action item #${input.actionItemId} ${changed}` });
  });
  return db.select().from(actionItems).where(eq(actionItems.id, input.actionItemId)).limit(1).then(rows => rows[0]);
}

export function isOwnedEvidenceReference(input: { userId: number; assessmentId: number; storageKey: string; storageUrl: string }) {
  const prefix = `agaras/${input.userId}/${input.assessmentId}/`;
  if (!input.storageKey.startsWith(prefix)) return false;
  const objectName = input.storageKey.slice(prefix.length);
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(objectName)
    && input.storageUrl === `/manus-storage/${input.storageKey}`;
}

function safeEvidenceObjectName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop()?.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 180);
  return baseName || "evidence.bin";
}

export function isValidEvidenceContent(mimeType: string, bytes: Uint8Array) {
  const prefix = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  switch (mimeType.toLowerCase()) {
    case "application/pdf": return bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
    case "image/jpeg": return prefix(0xff, 0xd8, 0xff);
    case "image/png": return prefix(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/gif": return bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(Buffer.from(bytes.subarray(0, 6)).toString("ascii"));
    case "image/webp": return bytes.length >= 12 && Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP";
    case "text/plain": return bytes.length > 0 && !Buffer.from(bytes).includes(0);
    case "application/msword":
    case "application/vnd.ms-excel": return prefix(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return prefix(0x50, 0x4b, 0x03, 0x04) && Buffer.from(bytes).includes(Buffer.from("word/document.xml"));
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return prefix(0x50, 0x4b, 0x03, 0x04) && Buffer.from(bytes).includes(Buffer.from("xl/workbook.xml"));
    default: return false;
  }
}

export async function addEvidence(input: { userId: number; assessmentId: number; controlId?: number; fileName: string; storageKey: string; storageUrl: string; mimeType?: string; fileSize?: number; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!isOwnedEvidenceReference(input)) throw new Error("Evidence reference is not authorized");
  if (input.fileSize !== undefined && (input.fileSize < 0 || input.fileSize > 10 * 1024 * 1024)) throw new Error("Evidence files must be 10 MiB or smaller");
  return db.transaction(async tx => {
    const assessment = await tx.select({ status: assessments.status }).from(assessments)
      .where(and(eq(assessments.id, input.assessmentId), eq(assessments.userId, input.userId))).limit(1).for("update").then(rows => rows[0]);
    if (!assessment || !isAssessmentEditable(assessment.status)) throw new Error("Evidence reference is not authorized or the assessment is locked");
    if (input.controlId) {
      const valid = await tx.select({ id: assessmentControls.id }).from(assessmentControls)
        .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId))).limit(1);
      if (!valid.length) throw new Error("Assessment not found");
    }
    const [row] = await tx.insert(evidence).values({ assessmentId: input.assessmentId, controlId: input.controlId, uploadedBy: input.userId, fileName: input.fileName, storageKey: input.storageKey, storageUrl: input.storageUrl, mimeType: input.mimeType, fileSize: input.fileSize, notes: input.notes }).$returningId();
    if (input.controlId) await tx.update(assessmentControls).set({ evidenceStatus: "submitted" })
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId)));
    const rows = await tx.select({ score: assessmentControls.responseScore, evidenceStatus: assessmentControls.evidenceStatus })
      .from(assessmentControls).where(eq(assessmentControls.assessmentId, input.assessmentId));
    const evidenceCount = rows.filter(item => item.evidenceStatus === "submitted" || item.evidenceStatus === "verified").length;
    const coverage = rows.length ? evidenceCount / rows.length * 100 : 0;
    await tx.update(assessments).set({ evidenceCoverage: coverage.toFixed(2) }).where(eq(assessments.id, input.assessmentId));
    return tx.select().from(evidence).where(eq(evidence.id, row.id)).limit(1).then(result => result[0]);
  });
}

export async function uploadEvidence(input: { userId: number; assessmentId: number; controlId?: number; fileName: string; mimeType: string; base64: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!input.fileName.trim() || input.fileName.length > 255 || input.fileName.includes("\0")) throw new Error("Invalid evidence file name");
  const mimeType = input.mimeType.trim().toLowerCase();
  const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
  if (!allowedMimeTypes.has(mimeType)) throw new Error("Unsupported evidence file type");
  const dataUrl = input.base64.match(/^data:([^;,]+);base64,/i);
  if (dataUrl && dataUrl[1].toLowerCase() !== mimeType) throw new Error("Evidence MIME type does not match the uploaded file data");
  const raw = input.base64.replace(/^data:[^;]+;base64,/i, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw)) throw new Error("Invalid evidence file data");
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("Evidence files must be between 1 byte and 10 MiB");
  if (!isValidEvidenceContent(mimeType, bytes)) throw new Error("Uploaded content does not match an accepted file type");
  const assessment = await getAssessmentForUser(input.assessmentId, input.userId);
  if (!assessment) throw new Error("Assessment not found");
  if (!isAssessmentEditable(assessment.status)) throw new Error("This assessment is locked while submitted or under review");
  if (input.controlId) {
    const valid = await db.select({ id: assessmentControls.id }).from(assessmentControls)
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId))).limit(1);
    if (!valid.length) throw new Error("Assessment not found");
  }
  const stored = await storagePut(`agaras/${input.userId}/${input.assessmentId}/${randomUUID()}-${safeEvidenceObjectName(input.fileName)}`, bytes, mimeType);
  return addEvidence({ userId: input.userId, assessmentId: input.assessmentId, controlId: input.controlId, fileName: input.fileName, mimeType, fileSize: bytes.length, storageKey: stored.key, storageUrl: stored.url, notes: input.notes });
}

export async function dashboard(assessmentId: number, userId: number) {
  if (!(await getDb())) throw new Error("Database is not available");
  const access = await canReviewAssessment(assessmentId, userId);
  const assessment = access?.assessment;
  if (!assessment) return undefined;
  if(access?.kind==="reviewer" && !scopeAllows(access.assignment!.status,access.assignment!.scope,"dashboard")) return undefined;
  const [controlRows, findingRows, systemRows] = await Promise.all([getAssessmentControls(assessmentId, userId), listFindings(assessmentId, userId), (async () => { const db = await getDb(); return db ? db.select().from(aiSystems).where(eq(aiSystems.assessmentId, assessmentId)) : []; })()]);
  return { assessment, controls: controlRows, findings: findingRows, aiSystems: systemRows, domainCount: PROFILE_DOMAIN_COUNTS[assessment.profileType] };
}

export async function reportSnapshot(assessmentId: number, userId: number) {
  const snapshot = await dashboard(assessmentId, userId);
  if (!snapshot) return undefined;
  return { generatedAt: new Date().toISOString(), reportType: snapshot.assessment.profileType, methodology: snapshot.assessment.methodologyVersion, verification: snapshot.assessment.posture === "self_assessment" ? "Self-reported — Not Independently Verified" : "Pending reviewer verification", assessment: snapshot.assessment, controls: snapshot.controls, findings: snapshot.findings, aiSystems: snapshot.aiSystems };
}

export async function adminOverview() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [domainRows, controlRows, assessmentRows, evidenceRows, findingRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(domains),
    db.select({ count: sql<number>`count(*)` }).from(controls),
    db.select({ count: sql<number>`count(*)` }).from(assessments),
    db.select({ count: sql<number>`count(*)` }).from(evidence),
    db.select({ count: sql<number>`count(*)` }).from(findings),
  ]);
  return { domains: Number(domainRows[0]?.count ?? 0), controls: Number(controlRows[0]?.count ?? 0), assessments: Number(assessmentRows[0]?.count ?? 0), evidence: Number(evidenceRows[0]?.count ?? 0), findings: Number(findingRows[0]?.count ?? 0) };
}

type OrganizationRole = "owner" | "admin" | "lead_reviewer" | "reviewer" | "domain_reviewer" | "evidence_reviewer" | "auditor" | "contributor" | "member";

const rolePermissions: Record<OrganizationRole, string[]> = {
  owner: ["organization:manage", "members:manage", "reviews:assign", "reviews:complete", "reviews:read", "controls:review", "evidence:verify"],
  admin: ["organization:manage", "members:manage", "reviews:assign", "reviews:complete", "reviews:read", "controls:review", "evidence:verify"],
  lead_reviewer: ["reviews:assign", "reviews:complete", "reviews:read", "controls:review", "evidence:verify"],
  reviewer: ["reviews:read", "controls:review"],
  domain_reviewer: ["reviews:read", "controls:review"],
  evidence_reviewer: ["reviews:read", "evidence:verify"],
  auditor: ["reviews:read"],
  contributor: ["reviews:read"],
  member: ["reviews:read"],
};

async function getMembership(organizationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(organizationMembers).where(and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId), eq(organizationMembers.status, "active"))).limit(1).then(rows => rows[0]);
}

function hasPermission(role: OrganizationRole | undefined, permission: string) {
  return Boolean(role && rolePermissions[role]?.includes(permission));
}

export async function listAssessmentReviewDomains(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!(await canManageReviewers(assessmentId, userId))) throw new Error("Only the assessment owner or authorized organization reviewer can assign domains");
  return db.select({ id: domains.id, code: domains.code, title: domains.title, controlCount: sql<number>`count(${assessmentControls.id})` })
    .from(assessmentControls)
    .innerJoin(controls, eq(assessmentControls.controlId, controls.id))
    .innerJoin(domains, eq(controls.domainId, domains.id))
    .where(eq(assessmentControls.assessmentId, assessmentId))
    .groupBy(domains.id, domains.code, domains.title)
    .orderBy(asc(domains.id));
}

async function canManageReviewers(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const assessment = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1).then(rows => rows[0]);
  if (!assessment) return false;
  if (assessment.userId === userId) return true;
  if (!assessment.organizationId) return false;
  return hasPermission((await getMembership(assessment.organizationId, userId))?.role as OrganizationRole | undefined, "reviews:assign");
}

async function canReviewAssessment(assessmentId: number, userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const assessment = await db.select().from(assessments).where(eq(assessments.id, assessmentId)).limit(1).then(r=>r[0]); if (!assessment) return undefined;
  const assignmentRows=assessment.userId===userId?[]:await db.select().from(reviewerAssignments).where(and(eq(reviewerAssignments.assessmentId,assessmentId),eq(reviewerAssignments.reviewerId,userId),inArray(reviewerAssignments.status,["active","completed"])));
  const assignment=choosePreferredReviewerAssignment(assignmentRows);
  const member=assessment.organizationId ? await getMembership(assessment.organizationId,userId) : undefined;
  const kind=resolveAssessmentAccessKind({isOwner:assessment.userId===userId,reviewerAssignmentStatus:assignment?.status,organizationRole:member?.role});
  if(kind==="owner") return {assessment,assignment:undefined,kind};
  if(kind==="reviewer"&&assignment) return {assessment,assignment,kind};
  return kind==="member" ? {assessment,assignment:undefined,kind} : undefined;
}
async function scopeRows<T extends { control?: {domainId:number} }>(rows:T[], access: Awaited<ReturnType<typeof canReviewAssessment>>, resource:"controls"|"findings"|"evidence") {
  if (!access || access.kind !== "reviewer") return rows;
  const a=access.assignment!; if (!scopeAllows(a.status,a.scope,resource)) return [];
  return a.scope === "domain" ? rows.filter(r=>r.control?.domainId===a.domainId) : rows;
}

export async function assignReviewer(input: { assessmentId: number; reviewerId: number; assignedBy: number; scope?: "full" | "evidence" | "findings" | "domain"; domainId?: number; notes?: string; professionalRole?: string; expertise?: string; sectorExperience?: string; jurisdictionFamiliarity?: string; languageCapability?: string; conflictDeclared?: boolean; independenceStatus?: string }) {
  const db = await getDb();
  if (!db || !(await canManageReviewers(input.assessmentId, input.assignedBy))) throw new Error("Only the assessment owner or authorized organization reviewer can assign reviewers");
  const assessment = await db.select().from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).then(rows => rows[0]);
  if (!assessment) throw new Error("Assessment not found");
  const reviewer = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, input.reviewerId)).limit(1).then(rows => rows[0]);
  if (!reviewer) throw new Error("Reviewer account not found");
  if (assessment.organizationId && !(await getMembership(assessment.organizationId, input.reviewerId))) throw new Error("Reviewer must be an active organization member");
  const scope = input.scope ?? "full";
  if (scope === "domain") {
    if (!input.domainId) throw new Error("Domain scope requires a domain");
    const scopedControls = await db.select({ id: assessmentControls.id }).from(assessmentControls)
      .innerJoin(controls, eq(assessmentControls.controlId, controls.id))
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(controls.domainId, input.domainId))).limit(1);
    if (!scopedControls.length) throw new Error("Selected domain has no controls in this assessment");
  } else if (input.domainId !== undefined) {
    throw new Error("A domain may only be supplied for domain scope");
  }
  const duplicate = await db.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
    .where(and(eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, input.reviewerId), inArray(reviewerAssignments.status, ["invited", "active"]))).limit(1);
  if (duplicate.length) throw new Error("This reviewer already has an open assignment for the assessment");
  return db.transaction(async tx => {
    const assessmentLock = await tx.select({ id: assessments.id, status: assessments.status }).from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).for("update");
    if (!assessmentLock.length) throw new Error("Assessment not found");
    if (!["submitted", "review", "changes_requested"].includes(assessmentLock[0].status)) throw new Error("Submit the assessment or request changes before assigning reviewers");
    const openAssignment = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, input.reviewerId), inArray(reviewerAssignments.status, ["invited", "active"]))).limit(1);
    if (openAssignment.length) throw new Error("This reviewer already has an open assignment for the assessment");
    if (reviewer.email) {
      const pendingInvite = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
        .where(and(eq(externalReviewerInvites.assessmentId, input.assessmentId), eq(externalReviewerInvites.email, reviewer.email.trim().toLowerCase()), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, new Date()))).limit(1);
      if (pendingInvite.length) throw new Error("This reviewer already has a pending external invitation");
    }
    const [row] = await tx.insert(reviewerAssignments).values({ assessmentId: input.assessmentId, reviewerId: input.reviewerId, assignedBy: input.assignedBy, scope, domainId: input.domainId, notes: input.notes, professionalRole: input.professionalRole, expertise: input.expertise, sectorExperience: input.sectorExperience, jurisdictionFamiliarity: input.jurisdictionFamiliarity, languageCapability: input.languageCapability, conflictDeclared: input.conflictDeclared ?? false, independenceStatus: input.independenceStatus, status: "invited" }).$returningId();
    await tx.update(assessments).set({ status: "review" }).where(eq(assessments.id, input.assessmentId));
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, reviewerAssignmentId: row.id, actorId: input.assignedBy, entityType: "assessment", entityId: input.assessmentId, eventType: "status_change", message: `Reviewer assignment created (${scope} scope)` });
    return tx.select().from(reviewerAssignments).where(eq(reviewerAssignments.id, row.id)).limit(1).then(rows => rows[0]);
  });
}

export async function listReviewAssignments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ assignment: reviewerAssignments, assessment: assessments }).from(reviewerAssignments)
    .leftJoin(assessments, eq(reviewerAssignments.assessmentId, assessments.id))
    .where(eq(reviewerAssignments.reviewerId, userId)).orderBy(desc(reviewerAssignments.assignedAt));
  return Promise.all(rows.map(async row => {
    const assignment = row.assignment;
    const emptyStats = { total: 0, pending: 0, approved: 0, rejected: 0, evidencePending: 0 };
    if (!row.assessment || !["active", "completed"].includes(assignment.status)) {
      return { assignment, assessment: null, stats: emptyStats };
    }
    const assessmentSummary = {
      id: row.assessment.id,
      title: row.assessment.title,
      jurisdiction: row.assessment.jurisdiction,
      methodologyVersion: row.assessment.methodologyVersion,
      status: row.assessment.status,
    };
    if (assignment.status === "completed") return { assignment, assessment: assessmentSummary, stats: emptyStats };
    if (assignment.scope === "findings") {
      const findingRows = await db.select({ id: findings.id }).from(findings).where(eq(findings.assessmentId, row.assessment.id));
      const decisionEvents = await db.select({ entityId: reviewEvents.entityId, eventType: reviewEvents.eventType }).from(reviewEvents)
        .where(and(eq(reviewEvents.reviewerAssignmentId, assignment.id), eq(reviewEvents.entityType, "finding"), inArray(reviewEvents.eventType, ["approve", "reject", "request_changes"])))
        .orderBy(desc(reviewEvents.createdAt));
      const decisions = new Map<number, string>();
      for (const event of decisionEvents) if (typeof event.entityId === "number" && !decisions.has(event.entityId)) decisions.set(event.entityId, event.eventType);
      return {
        assignment, assessment: assessmentSummary,
        stats: {
          total: findingRows.length,
          pending: findingRows.filter(finding => !decisions.has(finding.id)).length,
          approved: [...decisions.values()].filter(decision => decision === "approve").length,
          rejected: [...decisions.values()].filter(decision => decision === "reject" || decision === "request_changes").length,
          evidencePending: 0,
        },
      };
    }
    const controlRows = await db.select({ decision: assessmentControls.reviewDecision, evidenceStatus: assessmentControls.evidenceStatus, domainId: controls.domainId })
      .from(assessmentControls).innerJoin(controls, eq(assessmentControls.controlId, controls.id))
      .where(eq(assessmentControls.assessmentId, row.assessment.id));
    const scoped = controlRows.filter(control => assignment.scope !== "domain" || control.domainId === assignment.domainId);
    if (assignment.scope === "evidence") return {
      assignment, assessment: assessmentSummary,
      stats: {
        total: scoped.length,
        pending: scoped.filter(control => control.evidenceStatus === "submitted").length,
        approved: scoped.filter(control => control.evidenceStatus === "verified").length,
        rejected: scoped.filter(control => control.evidenceStatus === "rejected").length,
        evidencePending: scoped.filter(control => control.evidenceStatus === "submitted").length,
      },
    };
    return {
      assignment, assessment: assessmentSummary,
      stats: {
        total: scoped.length,
        pending: scoped.filter(control => control.decision === "pending").length,
        approved: scoped.filter(control => control.decision === "approved").length,
        rejected: scoped.filter(control => control.decision === "rejected" || control.decision === "changes_requested").length,
        evidencePending: 0,
      },
    };
  }));
}

export async function respondToReview(input: { assignmentId: number; userId: number; response: "accept" | "decline" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const known = await db.select({ assessmentId: reviewerAssignments.assessmentId }).from(reviewerAssignments)
    .where(and(eq(reviewerAssignments.id, input.assignmentId), eq(reviewerAssignments.reviewerId, input.userId))).limit(1).then(rows => rows[0]);
  if (!known) throw new Error("Review invitation is not available");
  const timestamp = new Date();
  await db.transaction(async tx => {
    const assessment = await tx.select({ id: assessments.id }).from(assessments).where(eq(assessments.id, known.assessmentId)).limit(1).for("update");
    if (!assessment.length) throw new Error("Assessment not found");
    const assignment = await tx.select().from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.id, input.assignmentId), eq(reviewerAssignments.reviewerId, input.userId), eq(reviewerAssignments.status, "invited")))
      .limit(1).for("update").then(rows => rows[0]);
    if (!assignment) throw new Error("Review invitation is not available");
    const result = await tx.update(reviewerAssignments)
      .set(input.response === "accept" ? { status: "active", acceptedAt: timestamp } : { status: "declined", declinedAt: timestamp })
      .where(and(eq(reviewerAssignments.id, assignment.id), eq(reviewerAssignments.reviewerId, input.userId), eq(reviewerAssignments.status, "invited")));
    if (result[0].affectedRows !== 1) throw new Error("Review invitation is not available");
    await tx.insert(reviewEvents).values({ assessmentId: assignment.assessmentId, reviewerAssignmentId: assignment.id, actorId: input.userId, entityType: "assessment", entityId: assignment.assessmentId, eventType: "status_change", message: input.response === "accept" ? "Reviewer accepted the assignment" : "Reviewer declined the assignment" });
    if (input.response === "decline") {
      const openAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, assignment.assessmentId), inArray(reviewerAssignments.status, ["invited", "active"])));
      const openInvites = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
        .where(and(eq(externalReviewerInvites.assessmentId, assignment.assessmentId), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, timestamp)));
      if (!openAssignments.length && !openInvites.length) await tx.update(assessments).set({ status: "submitted" }).where(and(eq(assessments.id, assignment.assessmentId), eq(assessments.status, "review")));
    }
  });
  return { ok: true } as const;
}

export async function completeReview(assignmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const knownAssignment = await tx.select({ assessmentId: reviewerAssignments.assessmentId }).from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.id, assignmentId), eq(reviewerAssignments.reviewerId, userId))).limit(1).then(rows => rows[0]);
    if (!knownAssignment) throw new Error("Active review assignment not found");
    const assessmentLock = await tx.select({ id: assessments.id }).from(assessments).where(eq(assessments.id, knownAssignment.assessmentId)).limit(1).for("update");
    if (!assessmentLock.length) throw new Error("Assessment not found");
    const assignment = await tx.select().from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.id, assignmentId), eq(reviewerAssignments.reviewerId, userId), eq(reviewerAssignments.status, "active")))
      .limit(1).for("update").then(rows => rows[0]);
    if (!assignment) throw new Error("Active review assignment not found");
    const controlRows = await tx.select({
      domainId: controls.domainId,
      decision: assessmentControls.reviewDecision,
      evidenceStatus: assessmentControls.evidenceStatus,
    }).from(assessmentControls).innerJoin(controls, eq(assessmentControls.controlId, controls.id))
      .where(eq(assessmentControls.assessmentId, assignment.assessmentId));
    const visible = controlRows.filter(row => assignment.scope !== "domain" || row.domainId === assignment.domainId);
    let pending = false;
    if (assignment.scope === "full" || assignment.scope === "domain") pending = visible.some(row => row.decision === "pending" || row.evidenceStatus === "submitted");
    if (assignment.scope === "evidence") pending = visible.some(row => row.evidenceStatus === "submitted");
    let ownFindingDecisions: { entityId: number | null; eventType: string }[] = [];
    if (assignment.scope === "findings") {
      const findingRows = await tx.select({ id: findings.id }).from(findings).where(eq(findings.assessmentId, assignment.assessmentId));
      ownFindingDecisions = await tx.select({ entityId: reviewEvents.entityId, eventType: reviewEvents.eventType }).from(reviewEvents)
        .where(and(eq(reviewEvents.reviewerAssignmentId, assignment.id), eq(reviewEvents.entityType, "finding"), inArray(reviewEvents.eventType, ["approve", "reject", "request_changes"])));
      const decided = new Set(ownFindingDecisions.map(event => event.entityId));
      pending = findingRows.some(finding => !decided.has(finding.id));
    }
    if (pending) throw new Error("Assigned review scope has pending work");
    const allFindingChanges = await tx.select({ id: reviewEvents.id }).from(reviewEvents)
      .where(and(eq(reviewEvents.assessmentId, assignment.assessmentId), eq(reviewEvents.entityType, "finding"), inArray(reviewEvents.eventType, ["reject", "request_changes"])));
    const hasChanges = controlRows.some(row => row.decision === "rejected" || row.decision === "changes_requested" || row.evidenceStatus === "rejected")
      || ownFindingDecisions.some(event => event.eventType === "reject" || event.eventType === "request_changes")
      || allFindingChanges.length > 0;
    const completedAt = new Date();
    const result = await tx.update(reviewerAssignments).set({ status: "completed", completedAt })
      .where(and(eq(reviewerAssignments.id, assignment.id), eq(reviewerAssignments.reviewerId, userId), eq(reviewerAssignments.status, "active")));
    if (result[0].affectedRows !== 1) throw new Error("Active review assignment not found");
    await tx.insert(reviewEvents).values({ assessmentId: assignment.assessmentId, reviewerAssignmentId: assignment.id, actorId: userId, entityType: "assessment", entityId: assignment.assessmentId, eventType: "status_change", message: "Reviewer completed the assigned scope" });
    const openAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.assessmentId, assignment.assessmentId), inArray(reviewerAssignments.status, ["invited", "active"])));
    const openExternalInvites = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
      .where(and(eq(externalReviewerInvites.assessmentId, assignment.assessmentId), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, new Date())));
    const allControlsApproved = controlRows.length > 0 && controlRows.every(row => row.decision === "approved");
    const nextStatus = resolveAssessmentReviewStatus({ hasOpenAssignments: openAssignments.length > 0 || openExternalInvites.length > 0, hasChanges, allControlsApproved });
    await tx.update(assessments).set({ status: nextStatus }).where(eq(assessments.id, assignment.assessmentId));
    return { ok: true, status: nextStatus } as const;
  });
}

export async function reviewControl(input: { assessmentId: number; controlId: number; reviewerId: number; evidenceStatus?: "not_requested" | "missing" | "submitted" | "verified" | "rejected"; applicabilityDecision?: "accept" | "reject"; eventType: "comment" | "approve" | "reject" | "request_changes" | "status_change"; message?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Reviewer is not assigned to this assessment");
  return db.transaction(async tx => {
    const assignment = await tx.select().from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, input.reviewerId), eq(reviewerAssignments.status, "active")))
      .limit(1).for("update").then(rows => rows[0]);
    if (!assignment) throw new Error("Active reviewer assignment required");
    const controlRow = await tx.select({ domainId: controls.domainId }).from(assessmentControls)
      .innerJoin(controls, eq(assessmentControls.controlId, controls.id))
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId))).limit(1).then(rows => rows[0]);
    if (!controlRow || (assignment.scope === "domain" && controlRow.domainId !== assignment.domainId)) throw new Error("Control not found");
    if (input.eventType === "status_change" && !input.evidenceStatus && !input.applicabilityDecision) throw new Error("Unsupported review action");
    if (input.applicabilityDecision && !["full", "domain"].includes(assignment.scope)) throw new Error("Reviewer scope does not allow applicability decisions");
    if (input.applicabilityDecision) {
      const current = await tx.select({ applicabilityStatus: assessmentControls.applicabilityStatus }).from(assessmentControls).where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId))).limit(1).then(rows => rows[0]);
      if (!current || current.applicabilityStatus !== "not_applicable_pending") throw new Error("This control has no pending Not Applicable request");
      await tx.update(assessmentControls).set({ applicabilityStatus: input.applicabilityDecision === "accept" ? "not_applicable_accepted" : "not_applicable_rejected", applicabilityReviewedBy: input.reviewerId, applicabilityReviewedAt: new Date() }).where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId)));
    }
    if (input.eventType === "comment" && !["full", "domain"].includes(assignment.scope)) throw new Error("Reviewer scope does not allow control comments");
    if (["approve", "reject", "request_changes"].includes(input.eventType) && !["full", "domain"].includes(assignment.scope)) throw new Error("Reviewer scope does not allow control decisions");
    if (input.evidenceStatus && !["full", "domain", "evidence"].includes(assignment.scope)) throw new Error("Reviewer scope does not allow evidence verification");
    if (input.evidenceStatus && ["approve", "reject", "request_changes"].includes(input.eventType)) throw new Error("Evidence verification must be a separate action");
    if (input.evidenceStatus) {
      const attachedEvidence = await tx.select({ id: evidence.id }).from(evidence)
        .where(and(eq(evidence.assessmentId, input.assessmentId), eq(evidence.controlId, input.controlId))).limit(1);
      if (!attachedEvidence.length) throw new Error("Evidence not found");
      await tx.update(assessmentControls).set({ evidenceStatus: input.evidenceStatus })
        .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId)));
    }
    const decision = input.eventType === "approve" ? "approved" : input.eventType === "reject" ? "rejected" : input.eventType === "request_changes" ? "changes_requested" : undefined;
    if (decision) await tx.update(assessmentControls).set({ reviewDecision: decision, reviewedBy: input.reviewerId, reviewedAt: new Date() })
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(assessmentControls.controlId, input.controlId)));
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, reviewerAssignmentId: assignment.id, actorId: input.reviewerId, entityType: "control", entityId: input.controlId, eventType: input.eventType, message: input.message });
    return { ok: true } as const;
  });
}

export async function reviewFinding(input: { assessmentId: number; findingId: number; reviewerId: number; eventType: "comment" | "approve" | "reject" | "request_changes"; message?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Active findings assignment required");
  return db.transaction(async tx => {
    const assignment = await tx.select().from(reviewerAssignments)
      .where(and(eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, input.reviewerId), eq(reviewerAssignments.status, "active"), eq(reviewerAssignments.scope, "findings")))
      .limit(1).for("update").then(rows => rows[0]);
    if (!assignment) throw new Error("Active findings assignment required");
    const finding = await tx.select({ id: findings.id }).from(findings)
      .where(and(eq(findings.id, input.findingId), eq(findings.assessmentId, input.assessmentId))).limit(1);
    if (!finding.length) throw new Error("Finding not found");
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, reviewerAssignmentId: assignment.id, actorId: input.reviewerId, entityType: "finding", entityId: input.findingId, eventType: input.eventType, message: input.message });
    return { ok: true } as const;
  });
}

export async function listReviewEvents(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available"); const access=await canReviewAssessment(assessmentId,userId); if(!access) return [];
  const rows=await db.select().from(reviewEvents).where(eq(reviewEvents.assessmentId, assessmentId)).orderBy(desc(reviewEvents.createdAt)); if(access.kind!=="reviewer") return rows;
  const a=access.assignment!; return rows.filter(e=>e.reviewerAssignmentId===a.id && (a.scope==="full" || (a.scope==="domain"&&e.entityType==="control") || (a.scope==="findings"&&e.entityType==="finding") || (a.scope==="evidence"&&e.entityType==="control"&&e.eventType==="status_change")));
}

export async function listReviewEvidence(assessmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const access = await canReviewAssessment(assessmentId, userId);
  if (access?.kind !== "reviewer" || !scopeAllows(access.assignment!.status, access.assignment!.scope, "evidence")) return [];
  const assignment = access.assignment!;
  const rows = await db.select({
    evidence,
    control: { id: controls.id, code: controls.code, title: controls.title, domainId: controls.domainId },
  }).from(evidence)
    .leftJoin(controls, eq(evidence.controlId, controls.id))
    .where(eq(evidence.assessmentId, assessmentId))
    .orderBy(desc(evidence.createdAt));
  const scoped = assignment.scope === "domain"
    ? rows.filter(row => row.control?.domainId === assignment.domainId)
    : rows;
  return Promise.all(scoped.map(async row => ({
    ...row,
    downloadUrl: await storageGetSignedUrl(row.evidence.storageKey),
  })));
}

export async function reviewDashboard(userId: number) {
  const assignments = await listReviewAssignments(userId);
  const all = assignments.flatMap(item => item.stats);
  return { assignments, totals: { assignments: assignments.length, pending: all.reduce((sum, item) => sum + item.pending, 0), approved: all.reduce((sum, item) => sum + item.approved, 0), rejected: all.reduce((sum, item) => sum + item.rejected, 0), evidencePending: all.reduce((sum, item) => sum + item.evidencePending, 0), total: all.reduce((sum, item) => sum + item.total, 0) } };
}

export async function organizationPermissions(input: { organizationId: number; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const organization = await db.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1).then(rows => rows[0]);
  if (!organization) throw new Error("Organization not found or not authorized");
  const membership = await getMembership(input.organizationId, input.userId);
  const isOwner = organization.ownerId === input.userId;
  if (!isOwner && !membership) throw new Error("Organization not found or not authorized");
  return {
    canManageMembers: isOwner || hasPermission(membership?.role as OrganizationRole | undefined, "members:manage"),
    canAssignReviewers: isOwner || hasPermission(membership?.role as OrganizationRole | undefined, "reviews:assign"),
    canGrantAdmin: isOwner,
  };
}

export async function listOrganizationMembers(input: { organizationId: number; userId: number; search?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const organization = await db.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1).then(rows => rows[0]);
  if (!organization) throw new Error("Organization not found or not authorized");
  const actor = await getMembership(input.organizationId, input.userId);
  const isOwner = organization.ownerId === input.userId;
  if (!isOwner && !hasPermission(actor?.role as OrganizationRole | undefined, "members:manage") && !hasPermission(actor?.role as OrganizationRole | undefined, "reviews:assign")) throw new Error("You do not have permission to view organization members");
  const filters = [eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.status, "active")];
  if (input.search) filters.push(like(users.email, `%${input.search}%`));
  return db.select({ member: organizationMembers, user: { id: users.id, name: users.name, email: users.email, role: users.role } }).from(organizationMembers).innerJoin(users, eq(organizationMembers.userId, users.id)).where(and(...filters));
}

export async function revokeOrganizationMember(input: { organizationId: number; targetUserId: number; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const organization = await tx.select({ id: organizations.id, ownerId: organizations.ownerId }).from(organizations)
      .where(eq(organizations.id, input.organizationId)).limit(1).for("update").then(rows => rows[0]);
    if (!organization) throw new Error("Organization not found or not authorized");
    const actor = await tx.select({ role: organizationMembers.role }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, input.actorId), eq(organizationMembers.status, "active"))).limit(1).then(rows => rows[0]);
    if (organization.ownerId !== input.actorId && !["owner", "admin"].includes(actor?.role ?? "")) throw new Error("You do not have permission to manage members");
    if (input.targetUserId === organization.ownerId) throw new Error("The organization owner cannot be removed");
    const target = await tx.select({ id: organizationMembers.id, role: organizationMembers.role }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, input.targetUserId), eq(organizationMembers.status, "active"))).limit(1).then(rows => rows[0]);
    if (!target) throw new Error("Active organization member not found");
    if (!mayChangeOrganizationAdminRole(organization.ownerId === input.actorId, target.role)) throw new Error("Only the organization owner can remove an admin");
    await tx.update(organizationMembers).set({ status: "revoked" }).where(eq(organizationMembers.id, target.id));
    const linkedAssessments = await tx.select({ id: assessments.id, status: assessments.status }).from(assessments)
      .where(eq(assessments.organizationId, input.organizationId));
    let revokedAssignments = 0;
    for (const assessment of linkedAssessments) {
      const activeAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, assessment.id), eq(reviewerAssignments.reviewerId, input.targetUserId), inArray(reviewerAssignments.status, ["invited", "active"])));
      if (activeAssignments.length) {
        await tx.update(reviewerAssignments).set({ status: "revoked" })
          .where(inArray(reviewerAssignments.id, activeAssignments.map(item => item.id)));
        revokedAssignments += activeAssignments.length;
        await tx.insert(reviewEvents).values({ assessmentId: assessment.id, actorId: input.actorId, entityType: "assessment", entityId: assessment.id, eventType: "status_change", message: "Reviewer access revoked with organization membership" });
      }
      if (assessment.status === "review") {
        const openAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
          .where(and(eq(reviewerAssignments.assessmentId, assessment.id), inArray(reviewerAssignments.status, ["invited", "active"])));
        const openInvites = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
          .where(and(eq(externalReviewerInvites.assessmentId, assessment.id), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, new Date())));
        if (!openAssignments.length && !openInvites.length) await tx.update(assessments).set({ status: "submitted" })
          .where(and(eq(assessments.id, assessment.id), eq(assessments.status, "review")));
      }
    }
    return { ok: true, revokedAssignments } as const;
  });
}

export async function addOrganizationMember(input: { organizationId: number; actorId: number; email: string; role: Exclude<OrganizationRole, "owner"> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const email = input.email.trim().toLowerCase();
  return db.transaction(async tx => {
    const organization = await tx.select({ id: organizations.id, ownerId: organizations.ownerId }).from(organizations)
      .where(eq(organizations.id, input.organizationId)).limit(1).for("update").then(rows => rows[0]);
    if (!organization) throw new Error("Organization not found or not authorized");
    const actorMembership = await tx.select({ role: organizationMembers.role }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, input.actorId), eq(organizationMembers.status, "active"))).limit(1).then(rows => rows[0]);
    if (organization.ownerId !== input.actorId && !["owner", "admin"].includes(actorMembership?.role ?? "")) throw new Error("You do not have permission to manage members");
    if (input.role === "admin" && !mayGrantOrganizationAdmin(organization.ownerId === input.actorId)) throw new Error("Only the organization owner can grant admin access");
    const target = await tx.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1).then(rows => rows[0]);
    if (!target) throw new Error("No account uses this email yet. The person must sign in once before being added.");
    if (target.id === organization.ownerId) throw new Error("The organization owner is already a member");
    const existing = await tx.select({ id: organizationMembers.id, status: organizationMembers.status }).from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, target.id))).limit(1).then(rows => rows[0]);
    if (existing?.status === "active") throw new Error("This person is already an active organization member");
    if (existing) {
      await tx.update(organizationMembers).set({ role: input.role, status: "active", invitedBy: input.actorId })
        .where(eq(organizationMembers.id, existing.id));
      return { ok: true, reactivated: true } as const;
    }
    await tx.insert(organizationMembers).values({ organizationId: input.organizationId, userId: target.id, role: input.role, status: "active", invitedBy: input.actorId });
    return { ok: true, reactivated: false } as const;
  });
}

export async function updateOrganizationMemberRole(input: { organizationId: number; targetUserId: number; actorId: number; role: OrganizationRole }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const organization = await db.select({ ownerId: organizations.ownerId }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1).then(rows => rows[0]);
  if (!organization) throw new Error("Organization not found or not authorized");
  const actor = await getMembership(input.organizationId, input.actorId);
  const isOwner = organization.ownerId === input.actorId;
  if (!isOwner && !hasPermission(actor?.role as OrganizationRole | undefined, "members:manage")) throw new Error("You do not have permission to manage members");
  const target = await getMembership(input.organizationId, input.targetUserId);
  if (!target) throw new Error("Organization member not found");
  if (target.role === "owner" || input.role === "owner") {
    if (target.role === "owner" && input.role === "owner") return { ok: true } as const;
    throw new Error("Organization ownership cannot be transferred or demoted through member role management");
  }
  if (!mayChangeOrganizationAdminRole(isOwner, target.role, input.role)) throw new Error("Only the organization owner can grant or change admin access");
  await db.update(organizationMembers).set({ role: input.role }).where(and(eq(organizationMembers.organizationId, input.organizationId), eq(organizationMembers.userId, input.targetUserId), eq(organizationMembers.status, "active")));
  return { ok: true } as const;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createExternalReviewerInvite(input: { assessmentId: number; email: string; invitedBy: number; scope?: "full" | "evidence" | "findings" | "domain"; domainId?: number; notes?: string }) {
  const db = await getDb();
  if (!db || !(await canManageReviewers(input.assessmentId, input.invitedBy))) throw new Error("Only an assessment owner or authorized organization reviewer can create invitations");
  const scope = input.scope ?? "full";
  if (scope === "domain") {
    if (!input.domainId) throw new Error("Domain scope requires a domain");
    const scopedControls = await db.select({ id: assessmentControls.id }).from(assessmentControls)
      .innerJoin(controls, eq(assessmentControls.controlId, controls.id))
      .where(and(eq(assessmentControls.assessmentId, input.assessmentId), eq(controls.domainId, input.domainId))).limit(1);
    if (!scopedControls.length) throw new Error("Selected domain has no controls in this assessment");
  } else if (input.domainId !== undefined) {
    throw new Error("A domain may only be supplied for domain scope");
  }
  const normalizedEmail = input.email.trim().toLowerCase();
  const duplicate = await db.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
    .where(and(eq(externalReviewerInvites.assessmentId, input.assessmentId), eq(externalReviewerInvites.email, normalizedEmail), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, new Date()))).limit(1);
  if (duplicate.length) throw new Error("A pending invitation already exists for this reviewer");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const created = await db.transaction(async tx => {
    const assessmentLock = await tx.select({ id: assessments.id, status: assessments.status }).from(assessments).where(eq(assessments.id, input.assessmentId)).limit(1).for("update");
    if (!assessmentLock.length) throw new Error("Assessment not found");
    if (!["submitted", "review", "changes_requested"].includes(assessmentLock[0].status)) throw new Error("Submit the assessment or request changes before inviting reviewers");
    const duplicatePending = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
      .where(and(eq(externalReviewerInvites.assessmentId, input.assessmentId), eq(externalReviewerInvites.email, normalizedEmail), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, new Date()))).limit(1);
    if (duplicatePending.length) throw new Error("A pending invitation already exists for this reviewer");
    const existingUser = await tx.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${normalizedEmail}`).limit(1).then(rows => rows[0]);
    if (existingUser) {
      const activeInternal = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, input.assessmentId), eq(reviewerAssignments.reviewerId, existingUser.id), inArray(reviewerAssignments.status, ["invited", "active"]))).limit(1);
      if (activeInternal.length) throw new Error("This reviewer already has an open internal assignment");
    }
    const [row] = await tx.insert(externalReviewerInvites).values({ assessmentId: input.assessmentId, email: normalizedEmail, tokenHash, scope, domainId: input.domainId, notes: input.notes, invitedBy: input.invitedBy, expiresAt, status: "pending" }).$returningId();
    await tx.update(assessments).set({ status: "review" }).where(eq(assessments.id, input.assessmentId));
    await tx.insert(reviewEvents).values({ assessmentId: input.assessmentId, actorId: input.invitedBy, entityType: "assessment", entityId: input.assessmentId, eventType: "status_change", message: `External reviewer invited (${scope} scope)` });
    return row;
  });
  return { id: created.id, token, expiresAt, email: normalizedEmail, scope } as const;
}

async function getValidInvite(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const invite = await db.select({ invite: externalReviewerInvites, assessment: assessments }).from(externalReviewerInvites).innerJoin(assessments, eq(externalReviewerInvites.assessmentId, assessments.id)).where(eq(externalReviewerInvites.tokenHash, hashInviteToken(token))).limit(1).then(rows => rows[0]);
  if (!invite) return undefined;
  if (invite.invite.status === "pending" && invite.invite.expiresAt.getTime() <= Date.now()) {
    await db.transaction(async tx => {
      const timestamp = new Date();
      await tx.select({ id: assessments.id }).from(assessments).where(eq(assessments.id, invite.invite.assessmentId)).limit(1).for("update");
      await tx.update(externalReviewerInvites).set({ status: "expired" })
        .where(and(eq(externalReviewerInvites.id, invite.invite.id), eq(externalReviewerInvites.status, "pending"), lt(externalReviewerInvites.expiresAt, timestamp)));
      const openAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, invite.invite.assessmentId), inArray(reviewerAssignments.status, ["invited", "active"])));
      const openInvites = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
        .where(and(eq(externalReviewerInvites.assessmentId, invite.invite.assessmentId), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, timestamp)));
      if (!openAssignments.length && !openInvites.length) await tx.update(assessments).set({ status: "submitted" })
        .where(and(eq(assessments.id, invite.invite.assessmentId), eq(assessments.status, "review")));
    });
    return { ...invite, invite: { ...invite.invite, status: "expired" as const } };
  }
  return invite;
}

export async function getExternalReviewerInvite(token: string) {
  const record = await getValidInvite(token);
  if (!record || record.invite.status !== "pending" || record.invite.expiresAt.getTime() <= Date.now()) return undefined;
  const [localPart, domain] = record.invite.email.split("@");
  const emailHint = localPart && domain ? `${localPart[0]}***@${domain}` : "invited email address";
  return { id: record.invite.id, emailHint, scope: record.invite.scope, status: "pending" as const, expiresAt: record.invite.expiresAt, assessment: { id: record.assessment.id, title: record.assessment.title, jurisdiction: record.assessment.jurisdiction, methodologyVersion: record.assessment.methodologyVersion } };
}

export async function respondToExternalInvite(input: { token: string; userId: number; response: "accept" | "decline" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const record = await getValidInvite(input.token);
  if (!record || record.invite.status !== "pending") throw new Error("This invitation is invalid, expired or already used");
  const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1).then(rows => rows[0]);
  if (!user?.email || user.email.trim().toLowerCase() !== record.invite.email) throw new Error("Sign in with the invited email address to continue");
  const timestamp = new Date();
  return db.transaction(async tx => {
    const assessmentLock = await tx.select({ id: assessments.id, status: assessments.status }).from(assessments).where(eq(assessments.id, record.invite.assessmentId)).limit(1).for("update");
    if (!assessmentLock.length || !["submitted", "review", "changes_requested"].includes(assessmentLock[0].status)) throw new Error("This invitation is invalid, expired or already used");
    if (input.response === "accept") {
      const existingAssignment = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, record.invite.assessmentId), eq(reviewerAssignments.reviewerId, input.userId), inArray(reviewerAssignments.status, ["invited", "active"]))).limit(1);
      if (existingAssignment.length) throw new Error("You already have an open assignment for this assessment");
    }
    const inviteUpdate = input.response === "decline"
      ? await tx.update(externalReviewerInvites).set({ status: "declined", declinedAt: timestamp })
          .where(and(eq(externalReviewerInvites.id, record.invite.id), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, timestamp)))
      : await tx.update(externalReviewerInvites).set({ status: "accepted", acceptedBy: input.userId, acceptedAt: timestamp })
          .where(and(eq(externalReviewerInvites.id, record.invite.id), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, timestamp)));
    if (inviteUpdate[0].affectedRows !== 1) throw new Error("This invitation is invalid, expired or already used");
    if (input.response === "decline") {
      await tx.insert(reviewEvents).values({ assessmentId: record.invite.assessmentId, actorId: input.userId, entityType: "assessment", entityId: record.invite.assessmentId, eventType: "status_change", message: "External reviewer declined the invitation" });
      const openAssignments = await tx.select({ id: reviewerAssignments.id }).from(reviewerAssignments)
        .where(and(eq(reviewerAssignments.assessmentId, record.invite.assessmentId), inArray(reviewerAssignments.status, ["invited", "active"])));
      const openInvites = await tx.select({ id: externalReviewerInvites.id }).from(externalReviewerInvites)
        .where(and(eq(externalReviewerInvites.assessmentId, record.invite.assessmentId), eq(externalReviewerInvites.status, "pending"), gt(externalReviewerInvites.expiresAt, timestamp)));
      if (!openAssignments.length && !openInvites.length) await tx.update(assessments).set({ status: "submitted" }).where(and(eq(assessments.id, record.invite.assessmentId), eq(assessments.status, "review")));
      return { ok: true, status: "declined" } as const;
    }
    const [assignmentId] = await tx.insert(reviewerAssignments).values({ assessmentId: record.invite.assessmentId, reviewerId: input.userId, assignedBy: record.invite.invitedBy, scope: record.invite.scope, domainId: record.invite.domainId, notes: record.invite.notes, status: "active", acceptedAt: timestamp }).$returningId();
    await tx.update(assessments).set({ status: "review" }).where(eq(assessments.id, record.invite.assessmentId));
    await tx.insert(reviewEvents).values({ assessmentId: record.invite.assessmentId, reviewerAssignmentId: assignmentId.id, actorId: input.userId, entityType: "assessment", entityId: record.invite.assessmentId, eventType: "status_change", message: "External reviewer accepted the invitation" });
    return { ok: true, status: "accepted", assignmentId: assignmentId.id } as const;
  });
}
