import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Sends through Resend's HTTP API. Failures are returned, never thrown, so callers can continue safely. */
export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "Email is not configured (RESEND_API_KEY missing)." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        reply_to: msg.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("email provider rejected message", res.status);
      return { sent: false, reason: `Provider returned ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("email send failed", e);
    return { sent: false, reason: "Network error" };
  }
}
