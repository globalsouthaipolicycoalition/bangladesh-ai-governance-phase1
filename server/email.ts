type InviteEmailInput = { to: string; assessmentTitle: string; inviteUrl: string; expiresAt: Date; scope: string; language?: "en" | "bn" };

export async function sendReviewerInviteEmail(input: InviteEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { status: "EMAIL_NOT_CONFIGURED" as const };
  const isBangla = input.language === "bn";
  const safeTitle = input.assessmentTitle.replace(/[\r\n]+/g, " ").slice(0, 255);
  const subject = isBangla ? `বাংলাদেশ AI প্রস্তুতি মূল্যায়ন পর্যালোচনার আমন্ত্রণ — ${safeTitle}` : `Bangladesh AI Readiness Assessment reviewer invitation — ${safeTitle}`;
  const expiry = new Intl.DateTimeFormat(isBangla ? "bn-BD" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(input.expiresAt);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html: isBangla
        ? `<p>আপনাকে বাংলাদেশ AI প্রস্তুতি মূল্যায়নে <strong>${escapeHtml(safeTitle)}</strong> পর্যালোচনার জন্য আমন্ত্রণ জানানো হয়েছে।</p><p>পরিধি: ${escapeHtml(input.scope)}</p><p><a href="${escapeHtml(input.inviteUrl)}">নিরাপদ পর্যালোচনা আমন্ত্রণ খুলুন</a></p><p>এই একবার-ব্যবহারযোগ্য আমন্ত্রণের মেয়াদ ${escapeHtml(expiry)} তারিখে শেষ হবে।</p>`
        : `<p>You have been invited to review <strong>${escapeHtml(safeTitle)}</strong> in Bangladesh AI Readiness Assessment.</p><p>Scope: ${escapeHtml(input.scope)}</p><p><a href="${escapeHtml(input.inviteUrl)}">Open secure review invitation</a></p><p>This one-time invitation expires on ${escapeHtml(expiry)}.</p>`,
    }),
  });
  if (!response.ok) return { status: "EMAIL_FAILED" as const, detail: await response.text() };
  return { status: "EMAIL_SENT" as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
}
