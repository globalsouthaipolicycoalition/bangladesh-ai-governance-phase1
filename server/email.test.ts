import { afterEach, describe, expect, it, vi } from "vitest";
import { sendReviewerInviteEmail } from "./email";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("reviewer invitation email localization", () => {
  it("sends Bangla subject and body when Bangla is selected", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM", "noreply@example.org");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const result = await sendReviewerInviteEmail({ to: "reviewer@example.org", assessmentTitle: "মূল্যায়ন", inviteUrl: "https://example.org/invite", expiresAt: new Date("2026-12-31T00:00:00Z"), scope: "full", language: "bn" });
    expect(result.status).toBe("EMAIL_SENT");
    const payload = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string) as { subject: string; html: string };
    expect(payload.subject).toContain("আমন্ত্রণ");
    expect(payload.html).toContain("নিরাপদ পর্যালোচনা আমন্ত্রণ খুলুন");
  });

  it("keeps the English template and escapes HTML in inserted values", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM", "noreply@example.org");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendReviewerInviteEmail({ to: "reviewer@example.org", assessmentTitle: "<script>alert(1)</script>", inviteUrl: "https://example.org/invite?a=1&b=2", expiresAt: new Date("2026-12-31T00:00:00Z"), scope: "full", language: "en" });
    const payload = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string) as { subject: string; html: string };
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).toContain("&lt;script&gt;");
    expect(payload.html).toContain("&amp;b=2");
  });
});
