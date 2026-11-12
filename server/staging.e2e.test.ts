import { afterAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { assessments, assessmentControls, reviewerAssignments, reviewEvents, externalReviewerInvites, organizationMembers, organizations, users, incidentReports, incidentEvents } from "../drizzle/schema";

const enabled = process.env.STAGING_E2E === "1" && Boolean(process.env.DATABASE_URL) && Boolean(process.env.STAGING_OWNER_USER_ID) && Boolean(process.env.STAGING_REVIEWER_USER_ID);
const ownerId = Number(process.env.STAGING_OWNER_USER_ID ?? 0);
const reviewerId = Number(process.env.STAGING_REVIEWER_USER_ID ?? 0);
let assessmentId = 0;
let assignmentId = 0;
let evidenceScopeAssessmentId = 0;
let evidenceScopeAssignmentId = 0;
let evidenceScopeOrganizationId = 0;
let evidenceScopeInviteId = 0;
const incidentOrganizationIds: number[] = [];
const request = (_id: number) => ({ protocol: "https", headers: {}, get: () => "staging.invalid" });
const context = (id: number) => ({ user: { id, role: "user" }, req: request(id), res: { clearCookie() {} } }) as unknown as TrpcContext;

describe.skipIf(!enabled)("disposable staging authenticated E2E", () => {
  it("persists an assessment, scores all controls, and submits it", async () => {
    const owner = appRouter.createCaller(context(ownerId));
    const created = await owner.agaras.createAssessment({
      profileType: "organization",
      title: `STAGING E2E ${Date.now()}`,
      jurisdiction: "Bangladesh",
      sector: "Technology",
      organizationName: "Disposable staging organization",
      division: "Dhaka",
      district: "Dhaka",
      organizationType: "private_organization",
      employeeCount: "1–10",
      dataResidency: "Bangladesh preferred",
      primaryLanguage: "Bangla and English",
      regulatedSector: false,
      posture: "self_assessment",
    });
    assessmentId = created.id;
    const controls = await owner.agaras.controls({ assessmentId });
    expect(controls.length).toBeGreaterThan(0);
    const saved = await owner.agaras.saveResponses({ assessmentId, responses: controls.map(row => ({ controlId: row.assignment.controlId, responseScore: 2, responseNotes: "Disposable staging E2E" })) });
    expect(Number(saved.score)).toBe(50);
    const submitted = await owner.agaras.submitAssessment({ assessmentId });
    expect(submitted.status).toBe("submitted");
  });

  it("assigns and accepts a reviewer, then exposes only the assigned assessment", async () => {
    const owner = appRouter.createCaller(context(ownerId));
    const reviewer = appRouter.createCaller(context(reviewerId));
    const assignment = await owner.review.assign({ assessmentId, reviewerId, scope: "full", professionalRole: "AI governance reviewer", expertise: "Risk and responsible AI", sectorExperience: "Technology", jurisdictionFamiliarity: "Bangladesh", languageCapability: "Bangla and English", conflictDeclared: false, independenceStatus: "Independent reviewer" });
    assignmentId = assignment.id;
    expect(assignment.professionalRole).toBe("AI governance reviewer");
    const accepted = await reviewer.review.respond({ assignmentId, response: "accept" });
    expect(accepted.status).toBe("active");
    const controls = await reviewer.agaras.controls({ assessmentId });
    expect(controls.length).toBeGreaterThan(0);
    expect((await reviewer.agaras.myAssessments()).some(item => item.id === assessmentId)).toBe(false);
  });

  it("limits an evidence reviewer to evidence scope and withholds assessment answers", async () => {
    const owner = appRouter.createCaller(context(ownerId));
    const reviewer = appRouter.createCaller(context(reviewerId));
    const db = await getDb();
    if (!db) throw new Error("Staging E2E requires a connected disposable database");
    const [reviewerRecord] = await db.select({ email: users.email }).from(users).where(eq(users.id, reviewerId)).limit(1);
    if (!reviewerRecord?.email) throw new Error("The staging reviewer account must have an email address");
    const created = await owner.agaras.createAssessment({ profileType: "individual", title: `STAGING evidence scope ${Date.now()}` });
    evidenceScopeAssessmentId = created.id;
    const organization = await owner.organization.createOrganization({ name: `STAGING Evidence Scope ${Date.now()}`, sector: "Technology", jurisdiction: "Bangladesh" });
    evidenceScopeOrganizationId = organization.id;
    await db.insert(organizationMembers).values({ organizationId: evidenceScopeOrganizationId, userId: reviewerId, role: "member", status: "active", invitedBy: ownerId });
    await owner.agaras.linkAssessmentOrganization({ assessmentId: evidenceScopeAssessmentId, organizationId: evidenceScopeOrganizationId });
    const ownerControls = await owner.agaras.controls({ assessmentId: evidenceScopeAssessmentId });
    const responses: Array<{ controlId: number; responseScore?: number; applicabilityStatus?: "applicable" | "not_applicable_pending" | "not_applicable_accepted" | "not_applicable_rejected"; applicabilityRationale?: string }> = ownerControls.map(row => ({ controlId: row.assignment.controlId, responseScore: 2 }));
    const notApplicableId = ownerControls[0]!.assignment.controlId;
    const notApplicableIndex = responses.findIndex(row => row.controlId === notApplicableId);
    responses[notApplicableIndex] = { controlId: notApplicableId, applicabilityStatus: "not_applicable_accepted", applicabilityRationale: "No applicable use case under this assessment scope" };
    await owner.agaras.saveResponses({ assessmentId: evidenceScopeAssessmentId, responses });
    await owner.agaras.submitAssessment({ assessmentId: evidenceScopeAssessmentId });
    const invite = await owner.review.createExternalInvite({ assessmentId: evidenceScopeAssessmentId, email: reviewerRecord.email, scope: "evidence", notes: "Private invitation note for staging" });
    evidenceScopeInviteId = invite.id;
    const pendingInvite = await reviewer.review.externalInvite({ token: invite.token });
    expect(pendingInvite?.emailHint).not.toBe(reviewerRecord.email);
    expect(pendingInvite).not.toHaveProperty("email");
    expect(pendingInvite).not.toHaveProperty("notes");
    const acceptedInvite = await reviewer.review.respondToExternalInvite({ token: invite.token, response: "accept" });
    evidenceScopeAssignmentId = acceptedInvite.assignmentId!;
    expect(await reviewer.review.externalInvite({ token: invite.token })).toBeUndefined();

    expect((await reviewer.agaras.myAssessments()).some(item => item.id === evidenceScopeAssessmentId)).toBe(false);
    const reviewerControls = await reviewer.agaras.controls({ assessmentId: evidenceScopeAssessmentId });
    const scopedControl = reviewerControls.find(row => row.assignment.controlId === notApplicableId);
    expect(scopedControl?.assignment.responseScore).toBeNull();
    expect(scopedControl?.assignment.responseNotes).toBeNull();
    expect(scopedControl?.assignment.applicabilityStatus).toBeNull();
    expect(scopedControl?.assignment.applicabilityRationale).toBeNull();
    expect(await reviewer.agaras.dashboard({ assessmentId: evidenceScopeAssessmentId })).toBeUndefined();
    expect(await reviewer.agaras.reportSnapshot({ assessmentId: evidenceScopeAssessmentId })).toBeUndefined();
    await db.update(organizationMembers).set({ role: "contributor" }).where(and(eq(organizationMembers.organizationId, evidenceScopeOrganizationId), eq(organizationMembers.userId, reviewerId)));
    await db.update(reviewerAssignments).set({ status: "completed" }).where(eq(reviewerAssignments.id, evidenceScopeAssignmentId));
    await db.update(assessments).set({ status: "changes_requested" }).where(eq(assessments.id, evidenceScopeAssessmentId));
    await expect(reviewer.agaras.saveResponses({ assessmentId: evidenceScopeAssessmentId, responses: [{ controlId: ownerControls[1]!.assignment.controlId, responseScore: 4 }] })).rejects.toThrow();
  });

  it("enforces incident reporter privacy and manager-only triage, assignment, evidence and closure", async () => {
    const db = await getDb();
    if (!db) throw new Error("Staging E2E requires a connected disposable database");
    const owner = appRouter.createCaller(context(ownerId));
    const reviewer = appRouter.createCaller(context(reviewerId));
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const organization = await owner.organization.createOrganization({ name: `STAGING Incident Shared ${suffix}`, sector: "Technology", jurisdiction: "Bangladesh" });
    incidentOrganizationIds.push(organization.id);
    const unrelatedOrganization = await owner.organization.createOrganization({ name: `STAGING Incident Private ${suffix}`, sector: "Technology", jurisdiction: "Bangladesh" });
    incidentOrganizationIds.push(unrelatedOrganization.id);
    await db.insert(organizationMembers).values({ organizationId: organization.id, userId: reviewerId, role: "contributor", status: "active", invitedBy: ownerId });

    const ownerReport = await owner.incident.create({ organizationId: organization.id, title: `Owner incident ${suffix}`, description: "Disposable staging incident report from the organization owner.", category: "safety", severity: "moderate" });
    const reviewerReport = await reviewer.incident.create({ organizationId: organization.id, title: `Reviewer incident ${suffix}`, description: "Disposable staging incident report from an active contributor.", category: "security", severity: "high", evidenceNotes: "Initial staging evidence reference" });
    const unrelatedReport = await owner.incident.create({ organizationId: unrelatedOrganization.id, title: `Private incident ${suffix}`, description: "Disposable staging incident in an unrelated organization.", category: "privacy", severity: "low" });

    const reporterList = await reviewer.incident.list({ organizationId: organization.id });
    expect(reporterList.map(row => row.id)).toEqual([reviewerReport.id]);
    await expect(reviewer.incident.detail({ incidentId: ownerReport.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reviewer.incident.detail({ incidentId: unrelatedReport.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reviewer.incident.list({ organizationId: unrelatedOrganization.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(reviewer.incident.members({ organizationId: organization.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reviewer.incident.update({ incidentId: reviewerReport.id, status: "investigating" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const ownerList = await owner.incident.list({ organizationId: organization.id });
    expect(ownerList).toHaveLength(2);
    const triaged = await owner.incident.update({ incidentId: reviewerReport.id, status: "triage", assignedTo: reviewerId, containment: "Disable affected staging integration" });
    expect(triaged.status).toBe("triage");
    expect(triaged.assignedTo).toBe(reviewerId);
    await reviewer.incident.activity({ incidentId: reviewerReport.id, message: "Staging evidence reference added", evidence: true });
    const detail = await reviewer.incident.detail({ incidentId: reviewerReport.id });
    expect(detail.incident.evidenceNotes).toContain("Staging evidence reference added");
    expect(detail.events.some(event => event.eventType === "evidence_added")).toBe(true);
    await expect(owner.incident.update({ incidentId: reviewerReport.id, status: "closed" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const closed = await owner.incident.update({ incidentId: reviewerReport.id, status: "closed", closureSummary: "Disposable staging workflow verified" });
    expect(closed.status).toBe("closed");
    expect(closed.closureSummary).toContain("verified");
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    if (assessmentId) {
      await db.delete(reviewEvents).where(eq(reviewEvents.assessmentId, assessmentId));
      await db.delete(reviewerAssignments).where(and(eq(reviewerAssignments.assessmentId, assessmentId), eq(reviewerAssignments.reviewerId, reviewerId)));
      await db.delete(assessmentControls).where(eq(assessmentControls.assessmentId, assessmentId));
      await db.delete(assessments).where(eq(assessments.id, assessmentId));
    }
    if (evidenceScopeAssessmentId) {
      await db.delete(reviewEvents).where(eq(reviewEvents.assessmentId, evidenceScopeAssessmentId));
      if (evidenceScopeAssignmentId) await db.delete(reviewerAssignments).where(and(eq(reviewerAssignments.id, evidenceScopeAssignmentId), eq(reviewerAssignments.reviewerId, reviewerId)));
      if (evidenceScopeInviteId) await db.delete(externalReviewerInvites).where(eq(externalReviewerInvites.id, evidenceScopeInviteId));
      await db.delete(assessmentControls).where(eq(assessmentControls.assessmentId, evidenceScopeAssessmentId));
      await db.delete(assessments).where(eq(assessments.id, evidenceScopeAssessmentId));
    }
    if (evidenceScopeOrganizationId) {
      await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, evidenceScopeOrganizationId));
      await db.delete(organizations).where(eq(organizations.id, evidenceScopeOrganizationId));
    }
    if (incidentOrganizationIds.length) {
      await db.delete(incidentEvents).where(inArray(incidentEvents.organizationId, incidentOrganizationIds));
      await db.delete(incidentReports).where(inArray(incidentReports.organizationId, incidentOrganizationIds));
      await db.delete(organizationMembers).where(inArray(organizationMembers.organizationId, incidentOrganizationIds));
      await db.delete(organizations).where(inArray(organizations.id, incidentOrganizationIds));
    }
  });
});
