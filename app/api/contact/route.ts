import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Save to admin_inbox
  await getAdmin().from("admin_inbox").insert({
    from_name: name,
    from_email: email,
    subject: `[Contact] ${subject}`,
    message,
    category: "support",
  })

  // Send email via Resend
  if (process.env.RESEND_API_KEY) {
    const safeMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
        <div style="margin-bottom:24px">
          <span style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:18px;letter-spacing:-0.03em">
            <span style="color:#CC0000">RED</span><span style="color:#000">LIGHTAD</span>
          </span>
        </div>
        <h2 style="color:#111;font-size:18px;margin:0 0 20px">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:13px;width:120px">Name</td><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#111;font-size:13px;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:13px">Email</td><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#111;font-size:13px;font-weight:600">${email}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:13px">Subject</td><td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#111;font-size:13px;font-weight:600">${subject}</td></tr>
        </table>
        <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="color:#111;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${safeMsg}</p>
        </div>
        <p style="color:#9CA3AF;font-size:12px">Sent via redlightad.com contact form · ${new Date().toISOString()}</p>
      </div>
    `
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "RedLightAD Contact <noreply@redlightad.com>",
        to: ["tristan369@protonmail.com", "roxana888g@gmail.com", "contact@redlightad.com"],
        reply_to: email,
        subject: `[Contact] ${subject} — from ${name}`,
        html,
      }),
    })
  }

  return NextResponse.json({ ok: true })
}
