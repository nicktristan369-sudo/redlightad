import { createClient } from "@supabase/supabase-js"

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function createNotification(
  user_id: string,
  type: string,
  title: string,
  message: string
) {
  const supabase = db()
  await supabase.from("notifications").insert({ user_id, type, title, message })
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RedLightAD <noreply@redlightad.com>",
        to,
        subject,
        html,
      }),
    })
  } catch { /* silent */ }
}

export function emailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; padding: 40px; border-top: 3px solid #DC2626;">
    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 32px; color: #111;">
      RED<span style="color: #DC2626;">LIGHT</span>AD
    </div>
    <h2 style="font-size: 18px; font-weight: 700; color: #111; margin: 0 0 16px;">${title}</h2>
    <p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0 0 24px;">${body}</p>
    <div style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; margin-top: 32px;">
      © 2026 RedLightAD · <a href="https://redlightad.com" style="color: #DC2626;">redlightad.com</a>
    </div>
  </div>
</body>
</html>`
}
