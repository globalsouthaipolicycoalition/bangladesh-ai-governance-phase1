import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { consumeRateLimit } from "./rateLimit";
import { getTrustedAppOrigin } from "./appOrigin";
import { COOKIE_NAME } from "@shared/const";
import { AI_SYSTEM_DECISION_IMPACTS, AI_SYSTEM_LIFECYCLE_STATUSES } from "@shared/aiSystems";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addAISystem, aiSystemContextOptions, listAISystems, getAISystem, updateAISystem, retireAISystem, addEvidence, addFinding, adminOverview, assignReviewer, completeReview, createActionItem, createAssessment, createExternalReviewerInvite, createOrganizationForUser, dashboard, getAssessmentControls, getExternalReviewerInvite, listActionItems, listAssessmentReviewDomains, listAssessments, listManagedOrganizations, linkAssessmentToOrganization, createOrganizationForAssessment, addOrganizationMember, revokeOrganizationMember, organizationPermissions, listOrganizationMembers, listReviewAssignments, listReviewEvents, listReviewEvidence, listFindings, reportSnapshot, reviewFinding, respondToExternalInvite, respondToReview, reviewControl, reviewDashboard, saveResponse, saveResponses, submitAssessment, updateActionItem, updateOrganizationMemberRole, uploadEvidence } from "./agarasDb";
import { GAAF_DOMAINS, PROFILE_DOMAIN_COUNTS, STARTER_CONTROLS } from "./agarasCatalog";
import { EXPANDED_CONTROLS } from "./expandedCatalog";
import { sendReviewerInviteEmail } from "./email";
import { buildExcelReport, buildPdfReport, reportFileName, type ReportLanguage } from "./reportExport";
import { ATLAS_DISCLAIMER, BANGLADESH_DATA_RESIDENCY_OPTIONS, BANGLADESH_DIVISIONS, BANGLADESH_DISTRICTS, BANGLADESH_DOMAINS, BANGLADESH_EMPLOYEE_BANDS, BANGLADESH_EVIDENCE_EXAMPLES, BANGLADESH_ORGANIZATION_TYPES, BANGLADESH_PRIMARY_LANGUAGES, BANGLADESH_PROFILES, SELF_REPORTED_NOTICE } from "@shared/bangladesh";
import { createObservatoryIndicator, createObservatoryObservation, createObservatorySource, getObservatoryAdminData, getPublicObservatory, importObservatoryObservations, setObservatoryObservationStatus, updateObservatoryIndicator, updateObservatoryObservation, updateObservatorySource } from "./observatoryDb";
import { getPublicBangladeshCatalog } from "@shared/bangladeshCatalog";
import { addIncidentActivity, createIncident, getIncident, getIncidentEvidenceDownload, incidentMembers, incidentOrganizationOptions, listIncidents, updateIncident, uploadIncidentEvidence } from "./incidentDb";

const profileSchema = z.enum(["individual", "organization", "enterprise", "government", "national"]);
const aiSystemImpactSchema = z.enum(AI_SYSTEM_DECISION_IMPACTS);
const aiSystemLifecycleSchema = z.enum(AI_SYSTEM_LIFECYCLE_STATUSES);
const reportLanguageSchema = z.enum(["en", "bn", "bilingual"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  agaras: router({
    catalog: publicProcedure.query(() => ({
      domains: GAAF_DOMAINS.map(([code, title], index) => ({ code, title, sortOrder: index + 1 })),
      controls: STARTER_CONTROLS.map(([code, domainCode, title, objective]) => ({ code, domainCode, title, objective })),
      controlCount: EXPANDED_CONTROLS.length,
      profiles: Object.entries(PROFILE_DOMAIN_COUNTS).map(([id, domainCount]) => ({ id, domainCount })),
      bangladesh: {
        divisions: BANGLADESH_DIVISIONS,
        districts: BANGLADESH_DISTRICTS,
        organizationTypes: BANGLADESH_ORGANIZATION_TYPES,
        employeeBands: BANGLADESH_EMPLOYEE_BANDS,
        dataResidencyOptions: BANGLADESH_DATA_RESIDENCY_OPTIONS,
        primaryLanguages: BANGLADESH_PRIMARY_LANGUAGES,
        domains: BANGLADESH_DOMAINS.map(([code, title, titleBn], index) => ({ code, title, titleBn, sortOrder: index + 1 })),
        profiles: BANGLADESH_PROFILES,
        evidenceExamples: BANGLADESH_EVIDENCE_EXAMPLES,
        notice: SELF_REPORTED_NOTICE,
        disclaimer: ATLAS_DISCLAIMER,
        controlRegistry: getPublicBangladeshCatalog(),
      },
    })),
    myAssessments: protectedProcedure.query(({ ctx }) => listAssessments(ctx.user.id)),
    createAssessment: protectedProcedure.input(z.object({ profileType: profileSchema, title: z.string().min(2).max(255), jurisdiction: z.string().max(120).optional(), sector: z.string().max(120).optional(), organizationName: z.string().trim().max(255).optional(), division: z.enum(BANGLADESH_DIVISIONS).optional(), district: z.string().trim().max(120).optional(), locality: z.string().trim().max(120).optional(), organizationType: z.string().trim().max(80).optional(), ownershipType: z.string().trim().max(80).optional(), employeeCount: z.enum(BANGLADESH_EMPLOYEE_BANDS).optional(), dataResidency: z.enum(BANGLADESH_DATA_RESIDENCY_OPTIONS).optional(), primaryLanguage: z.enum(BANGLADESH_PRIMARY_LANGUAGES).optional(), regulatedSector: z.boolean().optional(), entityClassification: z.string().trim().max(80).optional(), posture: z.enum(["self_assessment", "evidence_audit", "expert_review"]).optional() }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`assessment-create:${ctx.user.id}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many assessment requests. Try again later." });
      return createAssessment({ ...input, userId: ctx.user.id });
    }),
    createOrganization: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(255), sector: z.string().max(120).optional(), jurisdiction: z.string().max(120).optional() })).mutation(({ ctx, input }) => createOrganizationForUser({ ...input, userId: ctx.user.id })),
    managedOrganizations: protectedProcedure.query(({ ctx }) => listManagedOrganizations(ctx.user.id)),
    linkAssessmentOrganization: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), organizationId: z.number().int().positive() })).mutation(({ ctx, input }) => linkAssessmentToOrganization({ ...input, userId: ctx.user.id })),
    createOrganizationForAssessment: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), name: z.string().trim().min(2).max(255), sector: z.string().max(120).optional(), jurisdiction: z.string().max(120).optional() })).mutation(({ ctx, input }) => createOrganizationForAssessment({ ...input, userId: ctx.user.id })),
    controls: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => getAssessmentControls(input.assessmentId, ctx.user.id)),
    dashboard: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => dashboard(input.assessmentId, ctx.user.id)),
    reportSnapshot: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => reportSnapshot(input.assessmentId, ctx.user.id)),
    reportPdf: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), language: reportLanguageSchema.default("en") })).query(async ({ ctx, input }) => { const language = input.language as ReportLanguage; const buffer = await buildPdfReport(input.assessmentId, ctx.user.id, language); return buffer ? { fileName: reportFileName(input.assessmentId, language, "pdf"), contentType: "application/pdf", base64: buffer.toString("base64") } : undefined; }),
    reportExcel: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), language: reportLanguageSchema.default("en") })).query(async ({ ctx, input }) => { const language = input.language as ReportLanguage; const buffer = await buildExcelReport(input.assessmentId, ctx.user.id, language); return buffer ? { fileName: reportFileName(input.assessmentId, language, "xlsx"), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: buffer.toString("base64") } : undefined; }),
    saveResponse: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), controlId: z.number().int().positive(), responseScore: z.number().int().min(0).max(4).optional(), responseNotes: z.string().max(5000).optional(), evidenceStatus: z.enum(["not_requested", "missing", "submitted", "verified", "rejected"]).optional(), applicabilityStatus: z.enum(["applicable", "not_applicable_pending", "not_applicable_accepted", "not_applicable_rejected"]).optional(), applicabilityRationale: z.string().max(5000).optional() }).refine(input => input.applicabilityStatus === "applicable" || input.applicabilityStatus === undefined || Boolean(input.applicabilityRationale?.trim()), "Not Applicable decisions require a rationale")).mutation(({ ctx, input }) => saveResponse({ ...input, userId: ctx.user.id })),
    saveResponses: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), responses: z.array(z.object({ controlId: z.number().int().positive(), responseScore: z.number().int().min(0).max(4).optional(), responseNotes: z.string().max(5000).optional(), evidenceStatus: z.enum(["not_requested", "missing", "submitted", "verified", "rejected"]).optional(), applicabilityStatus: z.enum(["applicable", "not_applicable_pending", "not_applicable_accepted", "not_applicable_rejected"]).optional(), applicabilityRationale: z.string().max(5000).optional() }).refine(input => input.applicabilityStatus === "applicable" || input.applicabilityStatus === undefined || Boolean(input.applicabilityRationale?.trim()), "Not Applicable decisions require a rationale")).min(1).max(500) })).mutation(({ ctx, input }) => saveResponses({ ...input, userId: ctx.user.id })),
    submitAssessment: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).mutation(({ ctx, input }) => submitAssessment(input.assessmentId, ctx.user.id)),
    addEvidence: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), controlId: z.number().int().positive().optional(), fileName: z.string().min(1).max(255), storageKey: z.string().min(1).max(500), storageUrl: z.string().min(1).max(700).refine(value => value.startsWith("/manus-storage/"), "Evidence must use project storage"), mimeType: z.string().max(120).optional(), fileSize: z.number().int().nonnegative().optional(), notes: z.string().max(5000).optional() })).mutation(({ ctx, input }) => addEvidence({ ...input, userId: ctx.user.id })),
    uploadEvidence: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), controlId: z.number().int().positive().optional(), fileName: z.string().min(1).max(255), mimeType: z.string().max(120), base64: z.string().min(1).max(15_000_000), notes: z.string().max(5000).optional() })).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`evidence-upload:${ctx.user.id}`, 20, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Upload limit reached. Try again later." });
      return uploadEvidence({ ...input, userId: ctx.user.id });
    }),
    addFinding: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), controlId: z.number().int().positive().optional(), title: z.string().min(2).max(255), description: z.string().max(5000).optional(), recommendation: z.string().max(5000).optional(), severity: z.enum(["low", "moderate", "high", "critical"]).optional(), dueDate: z.coerce.date().optional() })).mutation(({ ctx, input }) => addFinding({ ...input, userId: ctx.user.id })),
    findings: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => listFindings(input.assessmentId, ctx.user.id)),
    actionItems: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => listActionItems(input.assessmentId, ctx.user.id)),
    createActionItem: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), findingId: z.number().int().positive().optional(), title: z.string().trim().min(2).max(255), description: z.string().max(5000).optional(), ownerId: z.number().int().positive().optional(), dueDate: z.coerce.date().optional(), priority: z.enum(["low", "medium", "high"]).optional() }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`action-item-create:${ctx.user.id}:${input.assessmentId}`, 30, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many action items. Try again later." });
      return createActionItem({ ...input, userId: ctx.user.id });
    }),
    updateActionItem: protectedProcedure.input(z.object({ actionItemId: z.number().int().positive(), title: z.string().trim().min(2).max(255).optional(), description: z.string().max(5000).optional(), ownerId: z.number().int().positive().optional(), dueDate: z.coerce.date().optional(), status: z.enum(["planned", "in_progress", "blocked", "done"]).optional(), priority: z.enum(["low", "medium", "high"]).optional() }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`action-item-update:${ctx.user.id}`, 60, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many action-item updates. Try again later." });
      return updateActionItem({ ...input, userId: ctx.user.id });
    }),
    addAISystem: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive().optional(), organizationId: z.number().int().positive().optional(), name: z.string().min(2).max(255), provider: z.string().max(255).optional(), purpose: z.string().max(5000).optional(), decisionImpact: aiSystemImpactSchema.optional(), humanOversight: z.string().max(80).optional(), riskLevel: z.enum(["low", "moderate", "high", "critical"]).optional() })).mutation(({ ctx, input }) => addAISystem({ ...input, userId: ctx.user.id })),
    aiSystems: router({
      contextOptions: protectedProcedure.query(({ ctx }) => aiSystemContextOptions(ctx.user.id)),
      list: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive().optional(), organizationId: z.number().int().positive().optional(), search: z.string().max(255).optional(), riskLevel: z.enum(["low", "moderate", "high", "critical"]).optional(), lifecycleStatus: aiSystemLifecycleSchema.optional(), decisionImpact: aiSystemImpactSchema.optional() }).optional()).query(({ ctx, input }) => listAISystems(ctx.user.id, input ?? {})),
      detail: protectedProcedure.input(z.object({ systemId: z.number().int().positive() })).query(({ ctx, input }) => getAISystem(ctx.user.id, input.systemId)),
      create: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive().optional(), organizationId: z.number().int().positive().optional(), name: z.string().min(2).max(255), provider: z.string().max(255).optional(), purpose: z.string().max(5000).optional(), decisionImpact: aiSystemImpactSchema.optional(), humanOversight: z.string().max(80).optional(), riskLevel: z.enum(["low", "moderate", "high", "critical"]).optional(), lifecycleStatus: aiSystemLifecycleSchema.optional() })).mutation(({ ctx, input }) => addAISystem({ ...input, userId: ctx.user.id })),
      update: protectedProcedure.input(z.object({ systemId: z.number().int().positive(), name: z.string().min(2).max(255).optional(), provider: z.string().max(255).optional(), purpose: z.string().max(5000).optional(), decisionImpact: aiSystemImpactSchema.optional(), humanOversight: z.string().max(80).optional(), riskLevel: z.enum(["low", "moderate", "high", "critical"]).optional(), lifecycleStatus: aiSystemLifecycleSchema.optional() })).mutation(({ ctx, input }) => updateAISystem({ ...input, userId: ctx.user.id })),
      retire: protectedProcedure.input(z.object({ systemId: z.number().int().positive() })).mutation(({ ctx, input }) => retireAISystem(ctx.user.id, input.systemId)),
    }),
  }),
  review: router({
    domains: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => listAssessmentReviewDomains(input.assessmentId, ctx.user.id)),
    myAssignments: protectedProcedure.query(({ ctx }) => listReviewAssignments(ctx.user.id)),
    dashboard: protectedProcedure.query(({ ctx }) => reviewDashboard(ctx.user.id)),
    assign: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), reviewerId: z.number().int().positive(), scope: z.enum(["full", "evidence", "findings", "domain"]).optional(), domainId: z.number().int().positive().optional(), notes: z.string().max(5000).optional(), professionalRole: z.string().trim().max(120).optional(), expertise: z.string().trim().max(500).optional(), sectorExperience: z.string().trim().max(500).optional(), jurisdictionFamiliarity: z.string().trim().max(120).optional(), languageCapability: z.string().trim().max(120).optional(), conflictDeclared: z.boolean().optional(), independenceStatus: z.string().trim().max(120).optional() })).mutation(({ ctx, input }) => assignReviewer({ ...input, assignedBy: ctx.user.id })),
    respond: protectedProcedure.input(z.object({ assignmentId: z.number().int().positive(), response: z.enum(["accept", "decline"]) })).mutation(({ ctx, input }) => respondToReview({ ...input, userId: ctx.user.id })),
    complete: protectedProcedure.input(z.object({ assignmentId: z.number().int().positive() })).mutation(({ ctx, input }) => completeReview(input.assignmentId, ctx.user.id)),
    control: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), controlId: z.number().int().positive(), evidenceStatus: z.enum(["not_requested", "missing", "submitted", "verified", "rejected"]).optional(), applicabilityDecision: z.enum(["accept", "reject"]).optional(), eventType: z.enum(["comment", "approve", "reject", "request_changes", "status_change"]), message: z.string().max(5000).optional() })).mutation(({ ctx, input }) => reviewControl({ ...input, reviewerId: ctx.user.id })),
    finding: protectedProcedure.input(z.object({assessmentId:z.number().int().positive(),findingId:z.number().int().positive(),eventType:z.enum(["comment","approve","reject","request_changes"]),message:z.string().max(5000).optional()})).mutation(({ctx,input})=>reviewFinding({...input,reviewerId:ctx.user.id})),
    events: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => listReviewEvents(input.assessmentId, ctx.user.id)),
    evidence: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive() })).query(({ ctx, input }) => listReviewEvidence(input.assessmentId, ctx.user.id)),
    createExternalInvite: protectedProcedure.input(z.object({ assessmentId: z.number().int().positive(), email: z.string().email().max(320), scope: z.enum(["full", "evidence", "findings", "domain"]).optional(), domainId: z.number().int().positive().optional(), notes: z.string().max(5000).optional(), language: z.enum(["en", "bn"]).default("en") })).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit(`review-invite:${ctx.user.id}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many reviewer invitations. Try again later." });
      const invite = await createExternalReviewerInvite({ ...input, invitedBy: ctx.user.id });
      const origin = getTrustedAppOrigin(process.env.APP_PUBLIC_ORIGIN);
      const email = origin
        ? await sendReviewerInviteEmail({ to: invite.email, assessmentTitle: `Assessment #${input.assessmentId}`, inviteUrl: `${origin}/review/invite/${invite.token}`, expiresAt: invite.expiresAt, scope: invite.scope, language: input.language })
        : { status: "EMAIL_ORIGIN_NOT_CONFIGURED" as const };
      return { ...invite, emailStatus: email.status } as const;
    }),
    externalInvite: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ input }) => getExternalReviewerInvite(input.token)),
    respondToExternalInvite: protectedProcedure.input(z.object({ token: z.string().min(20).max(200), response: z.enum(["accept", "decline"]) })).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`external-invite-response:${ctx.user.id}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many invitation responses. Try again later." });
      return respondToExternalInvite({ ...input, userId: ctx.user.id });
    }),
  }),
  organization: router({
    permissions: protectedProcedure.input(z.object({ organizationId: z.number().int().positive() })).query(({ ctx, input }) => organizationPermissions({ ...input, userId: ctx.user.id })),
    addMember: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), email: z.string().trim().email().max(320), role: z.enum(["admin", "lead_reviewer", "reviewer", "domain_reviewer", "evidence_reviewer", "auditor", "contributor", "member"]) })).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`organization-member-add:${ctx.user.id}:${input.organizationId}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many membership changes. Try again later." });
      return addOrganizationMember({ ...input, actorId: ctx.user.id });
    }),
    revokeMember: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), targetUserId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeOrganizationMember({ ...input, actorId: ctx.user.id })),
    members: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), search: z.string().max(120).optional() })).query(({ ctx, input }) => listOrganizationMembers({ ...input, userId: ctx.user.id })),
    updateMemberRole: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), targetUserId: z.number().int().positive(), role: z.enum(["owner", "admin", "lead_reviewer", "reviewer", "domain_reviewer", "evidence_reviewer", "auditor", "contributor", "member"]) })).mutation(({ ctx, input }) => updateOrganizationMemberRole({ ...input, actorId: ctx.user.id })),
  }),
  incident: router({
    organizations: protectedProcedure.query(({ ctx }) => incidentOrganizationOptions(ctx.user.id)),
    list: protectedProcedure.input(z.object({ organizationId: z.number().int().positive() })).query(({ ctx, input }) => listIncidents(input.organizationId, ctx.user.id)),
    detail: protectedProcedure.input(z.object({ incidentId: z.number().int().positive() })).query(({ ctx, input }) => getIncident(input.incidentId, ctx.user.id)),
    uploadEvidence: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), base64: z.string().min(1).max(15_000_000) }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`incident-evidence-upload:${ctx.user.id}`, 20, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Incident evidence upload limit reached. Try again later." });
      return uploadIncidentEvidence({ ...input, userId: ctx.user.id });
    }),
    downloadEvidence: protectedProcedure.input(z.object({ evidenceId: z.number().int().positive() }).strict()).mutation(async ({ ctx, input }) => {
      if (!consumeRateLimit(`incident-evidence-download:${ctx.user.id}`, 120, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Incident evidence download-link limit reached. Try again later." });
      const download = await getIncidentEvidenceDownload(input.evidenceId, ctx.user.id);
      ctx.res.setHeader("Cache-Control", "private, no-store");
      return download;
    }),
    members: protectedProcedure.input(z.object({ organizationId: z.number().int().positive() })).query(({ ctx, input }) => incidentMembers(input.organizationId, ctx.user.id)),
    create: protectedProcedure.input(z.object({ organizationId: z.number().int().positive(), title: z.string().trim().min(4).max(255), description: z.string().trim().min(10).max(10000), category: z.enum(["safety", "privacy", "security", "bias", "accuracy", "availability", "misuse", "other"]), severity: z.enum(["low", "moderate", "high", "critical"]).default("moderate"), occurredAt: z.coerce.date().optional(), detectedAt: z.coerce.date().optional(), affectedSystem: z.string().trim().max(255).optional(), impactSummary: z.string().trim().max(5000).optional(), evidenceNotes: z.string().trim().max(5000).optional() }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`incident-create:${ctx.user.id}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Incident submission limit reached. Try again later." });
      return createIncident({ ...input, userId: ctx.user.id });
    }),
    activity: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), message: z.string().trim().min(1).max(5000), evidence: z.boolean().default(false) }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`incident-activity:${ctx.user.id}`, 20, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Incident activity limit reached. Try again later." });
      return addIncidentActivity({ ...input, userId: ctx.user.id });
    }),
    update: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), status: z.enum(["submitted", "triage", "investigating", "response", "monitoring", "closed", "dismissed"]).optional(), severity: z.enum(["low", "moderate", "high", "critical"]).optional(), assignedTo: z.number().int().positive().nullable().optional(), containment: z.string().max(5000).optional(), rootCause: z.string().max(5000).optional(), responseSummary: z.string().max(5000).optional(), remediationPlan: z.string().max(5000).optional(), closureSummary: z.string().max(5000).optional() }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`incident-update:${ctx.user.id}`, 60, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Incident update limit reached. Try again later." });
      return updateIncident({ ...input, userId: ctx.user.id });
    }),
  }),
  observatory: router({
    publicData: publicProcedure.input(z.object({ domain: z.string().trim().min(1).max(120).optional(), sourceId: z.number().int().positive().optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(), page: z.number().int().positive().max(10000).optional(), pageSize: z.number().int().positive().max(100).optional() }).optional()).query(({ input }) => getPublicObservatory(input ?? {})),
    adminData: adminProcedure.query(() => getObservatoryAdminData()),
    createSource: adminProcedure.input(z.object({ name: z.string().min(2).max(255), publisher: z.string().min(2).max(255), url: z.string().url().max(700).refine(value => /^https?:\/\//i.test(value), "Only HTTP or HTTPS source URLs are allowed"), description: z.string().max(5000).optional(), freshnessWindowDays: z.number().int().positive().max(3650).optional(), qualityThreshold: z.string().regex(/^(100|[0-9]{1,2}(\.[0-9]{1,2})?)$/).optional() })).mutation(({ ctx, input }) => createObservatorySource({ ...input, userId: ctx.user.id })),
    createIndicator: adminProcedure.input(z.object({ code: z.string().regex(/^[A-Z0-9][A-Z0-9._-]{1,47}$/), title: z.string().min(2).max(255), domain: z.string().min(2).max(120), sector: z.string().max(120).optional(), geographicCoverage: z.string().max(255).optional(), definition: z.string().min(10).max(5000), unit: z.string().max(80).optional(), dataType: z.enum(["numeric", "percentage", "count", "currency", "text", "binary"]).default("numeric"), baselineValue: z.string().optional(), currentValue: z.string().optional(), targetValue: z.string().optional(), methodologyVersion: z.string().min(1).max(48) })).mutation(({ ctx, input }) => createObservatoryIndicator({ ...input, userId: ctx.user.id })),
    createObservation: adminProcedure.input(z.object({ indicatorId: z.number().int().positive(), sourceId: z.number().int().positive(), value: z.string().regex(/^-?\d+(\.\d{1,6})?$/).refine(value => Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 999999999999.999999, "Numeric value exceeds supported precision").optional(), valueLabel: z.string().trim().min(1).max(255).optional(), observationDate: z.coerce.date(), periodLabel: z.string().max(120).optional(), notes: z.string().max(5000).optional(), methodologyVersion: z.string().trim().min(1).max(48), observationKind: z.enum(["reported", "estimate", "projection"]).default("reported"), collectionMethod: z.string().trim().max(255).optional(), sourceTimestamp: z.coerce.date().optional(), confidence: z.string().regex(/^(100|[0-9]{1,2}(\.\d{1,2})?)$/).optional(), verificationStatus: z.enum(["unverified", "reviewed", "independently_verified"]).default("unverified"), verificationNotes: z.string().max(5000).optional(), publish: z.boolean().default(false) }).refine(input => (input.value !== undefined) !== Boolean(input.valueLabel?.trim()), "Provide exactly one numeric value or text label")).mutation(({ ctx, input }) => createObservatoryObservation({ ...input, userId: ctx.user.id })),
    importObservations: adminProcedure.input(z.object({ sourceId: z.number().int().positive(), rows: z.array(z.object({ indicatorCode: z.string().trim().min(2).max(48), observationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), value: z.string().max(40).optional(), valueLabel: z.string().max(255).optional(), periodLabel: z.string().max(120).optional(), methodologyVersion: z.string().trim().min(1).max(48), notes: z.string().max(5000).optional(), observationKind: z.enum(["reported", "estimate", "projection"]).optional(), collectionMethod: z.string().max(255).optional(), sourceTimestamp: z.string().max(64).optional(), confidence: z.string().regex(/^(100|[0-9]{1,2}(\.\d{1,2})?)$/).optional(), verificationStatus: z.enum(["unverified", "reviewed", "independently_verified"]).optional() }).strict()).min(1).max(200) }).strict()).mutation(({ ctx, input }) => {
      if (!consumeRateLimit(`observatory-import:${ctx.user.id}`, 10, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Import limit reached. Try again later." });
      return importObservatoryObservations({ ...input, userId: ctx.user.id });
    }),
    updateSource: adminProcedure.input(z.object({ sourceId: z.number().int().positive(), name: z.string().trim().min(2).max(255), publisher: z.string().trim().min(2).max(255), url: z.string().url().max(700).refine(value => /^https?:\/\//i.test(value), "Only HTTP or HTTPS source URLs are allowed"), description: z.string().max(5000).optional(), freshnessWindowDays: z.number().int().positive().max(3650).optional(), qualityThreshold: z.string().regex(/^(100|[0-9]{1,2}(\.[0-9]{1,2})?)$/).optional(), active: z.boolean(), reason: z.string().trim().min(5).max(1000) }).strict()).mutation(({ ctx, input }) => updateObservatorySource({ ...input, userId: ctx.user.id })),
    updateIndicator: adminProcedure.input(z.object({ indicatorId: z.number().int().positive(), title: z.string().trim().min(2).max(255), domain: z.string().trim().min(2).max(120), sector: z.string().max(120).optional(), geographicCoverage: z.string().max(255).optional(), definition: z.string().trim().min(10).max(5000), unit: z.string().max(80).optional(), dataType: z.enum(["numeric", "percentage", "count", "currency", "text", "binary"]).default("numeric"), baselineValue: z.string().optional(), currentValue: z.string().optional(), targetValue: z.string().optional(), methodologyVersion: z.string().trim().min(1).max(48), active: z.boolean(), reason: z.string().trim().min(5).max(1000) }).strict()).mutation(({ ctx, input }) => updateObservatoryIndicator({ ...input, userId: ctx.user.id })),
    updateObservation: adminProcedure.input(z.object({ observationId: z.number().int().positive(), indicatorId: z.number().int().positive(), sourceId: z.number().int().positive(), value: z.string().regex(/^-?\d+(\.\d{1,6})?$/).refine(value => Number.isFinite(Number(value)) && Math.abs(Number(value)) <= 999999999999.999999, "Numeric value exceeds supported precision").optional(), valueLabel: z.string().trim().min(1).max(255).optional(), observationDate: z.coerce.date(), periodLabel: z.string().max(120).optional(), notes: z.string().max(5000).optional(), methodologyVersion: z.string().trim().min(1).max(48), observationKind: z.enum(["reported", "estimate", "projection"]).default("reported"), collectionMethod: z.string().trim().max(255).optional(), sourceTimestamp: z.coerce.date().optional(), confidence: z.string().regex(/^(100|[0-9]{1,2}(\.\d{1,2})?)$/).optional(), verificationStatus: z.enum(["unverified", "reviewed", "independently_verified"]).default("unverified"), verificationNotes: z.string().max(5000).optional(), reason: z.string().trim().min(5).max(1000) }).strict().refine(input => (input.value !== undefined) !== Boolean(input.valueLabel?.trim()), "Provide exactly one numeric value or text label")).mutation(({ ctx, input }) => updateObservatoryObservation({ ...input, userId: ctx.user.id })),
    setObservationStatus: adminProcedure.input(z.object({ observationId: z.number().int().positive(), status: z.enum(["draft", "published", "archived"]), reason: z.string().trim().min(5).max(1000) }).strict()).mutation(({ ctx, input }) => setObservatoryObservationStatus({ ...input, userId: ctx.user.id })),
  }),
  admin: router({ overview: adminProcedure.query(() => adminOverview()) }),
});

export type AppRouter = typeof appRouter;
