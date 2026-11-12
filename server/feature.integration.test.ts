import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { sendReviewerInviteEmail } from "./email";
import type { TrpcContext } from "./_core/context";

const unauthenticatedContext = {
  user: null,
  req: { protocol: "https", headers: {}, get: () => "aagra.test" },
  res: { clearCookie() {} },
} as unknown as TrpcContext;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Bangladesh AI Readiness Assessment backend feature integration", () => {
  it("keeps the public catalog available and exposes the expanded control baseline", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext);
    const catalog = await caller.agaras.catalog();
    expect(catalog.domains).toHaveLength(20);
    expect(catalog.controlCount).toBeGreaterThanOrEqual(1000);
    expect(catalog.profiles.map(profile => profile.id)).toEqual(expect.arrayContaining(["individual", "organization", "enterprise", "government", "national"]));
    expect(catalog.bangladesh.divisions).toHaveLength(8);
    expect(catalog.bangladesh.districts.Dhaka).toContain("Dhaka");
    expect(catalog.bangladesh.employeeBands).toContain("1–10");
    expect(catalog.bangladesh.notice).toBe("Self-reported assessment — not independently verified.");
    const registry = catalog.bangladesh.controlRegistry;
    expect(registry.controls.every(control => control.lifecycle === "approved" || control.lifecycle === "published")).toBe(true);
    expect(registry.controls.every(control => !("reviewerNotes" in control) && !("changeOwner" in control) && !("reviewDueDate" in control))).toBe(true);
    expect(registry.sources.every(source => !("verificationHistory" in source) && !("legalReview" in source))).toBe(true);
  });

  it("blocks every private assessment/report path without a session", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext);
    await expect(caller.agaras.myAssessments()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.agaras.reportPdf({ assessmentId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.review.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.organization.members({ organizationId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.agaras.actionItems({ assessmentId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.agaras.createActionItem({ assessmentId: 1, title: "Test action" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects invalid assessment input before reaching the database", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext);
    await expect(caller.agaras.createAssessment({ profileType: "individual", title: "x" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an invalid Bangladesh division before persistence", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const context = { ...unauthenticatedContext, user: { id: 7, role: "user" } } as unknown as TrpcContext;
    const caller = appRouter.createCaller(context);
    await expect(caller.agaras.createAssessment({ profileType: "organization", title: "Assessment A", division: "Not a division" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects caller-supplied identity on assessment creation before persistence", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const context = { ...unauthenticatedContext, user: { id: 7, role: "user" } } as unknown as TrpcContext;
    const caller = appRouter.createCaller(context);
    await expect(caller.agaras.createAssessment({ profileType: "individual", title: "Assessment A", userId: 99 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("surfaces database unavailability instead of reporting private registries as empty", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const context = { ...unauthenticatedContext, user: { id: 7, role: "user" } } as unknown as TrpcContext;
    const caller = appRouter.createCaller(context);
    await expect(caller.agaras.myAssessments()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(caller.agaras.aiSystems.list({})).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("rejects unsupported AI-system categories and lifecycle values before persistence", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const context = { ...unauthenticatedContext, user: { id: 7, role: "user" } } as unknown as TrpcContext;
    const caller = appRouter.createCaller(context);
    await expect(caller.agaras.aiSystems.create({ assessmentId: 1, name: "System A", decisionImpact: "unclassified", lifecycleStatus: "unknown" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps Observatory published data public while restricting curation to admins", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const publicCaller = appRouter.createCaller(unauthenticatedContext);
    await expect(publicCaller.observatory.publicData()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(publicCaller.observatory.adminData()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(publicCaller.observatory.createSource({ name: "Sample source", publisher: "Publisher", url: "https://example.org/data" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const userContext = { ...unauthenticatedContext, user: { id: 7, role: "user" } } as unknown as TrpcContext;
    const regularUserCaller = appRouter.createCaller(userContext);
    await expect(regularUserCaller.observatory.createIndicator({ code: "TEST.1", title: "Test", domain: "Test", definition: "A sufficiently long definition", methodologyVersion: "1.0" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regularUserCaller.observatory.updateSource({ sourceId: 1, name: "Source", publisher: "Publisher", url: "https://example.org", active: true, reason: "correction reason" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(regularUserCaller.observatory.updateObservation({ observationId: 1, indicatorId: 1, sourceId: 1, value: "1", observationDate: new Date(), methodologyVersion: "1.0", reason: "correction reason" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const adminContext = { ...unauthenticatedContext, user: { id: 9, role: "admin" } } as unknown as TrpcContext;
    const adminCaller = appRouter.createCaller(adminContext);
    await expect(adminCaller.observatory.createSource({ name: "Unsafe", publisher: "Publisher", url: "javascript:alert(1)" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(adminCaller.observatory.updateSource({ sourceId: 1, name: "Source", publisher: "Publisher", url: "https://example.org", active: true, reason: "no" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(adminCaller.observatory.createObservation({ indicatorId: 1, sourceId: 1, value: "7", valueLabel: "also text", observationDate: new Date(), methodologyVersion: "1.0", publish: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(adminCaller.observatory.createObservation({ indicatorId: 1, sourceId: 1, value: "999999999999999999999", observationDate: new Date(), methodologyVersion: "1.0", publish: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("reports a safe email fallback when transactional email is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const result = await sendReviewerInviteEmail({ to: "reviewer@example.com", assessmentTitle: "Test assessment", inviteUrl: "https://aagra.test/review/invite/token", expiresAt: new Date(), scope: "full" });
    expect(result).toEqual({ status: "EMAIL_NOT_CONFIGURED" });
  });
});
