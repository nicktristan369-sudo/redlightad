export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const BATCH_SIZE = 50; // Resend batch limit

interface Profile { email: string | null; account_type: string | null; country: string | null; tier?: string | null; }

export async function POST(req: NextRequest) {
  const { subject, body, recipients_type, recipients_filter } = await req.json();

  if (!RESEND_KEY) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });

  // Fetch target emails
  let query = getClient().from("profiles").select("email, account_type, country").not("email", "is", null);
  if (recipients_type === "providers") query = query.eq("account_type", "provider");
  if (recipients_type === "customers") query = query.eq("account_type", "customer");
  if (recipients_type === "country" && recipients_filter?.country) query = query.eq("country", recipients_filter.country);

  const { data: profiles, error: pErr } = await query;
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const emails = (profiles as Profile[]).map(p => p.email).filter(Boolean) as string[];
  if (!emails.length) return NextResponse.json({ error: "No recipients found" }, { status: 400 });

  const resendIds: string[] = [];
  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #E5E5E5">
        <span style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:-0.03em">
          <span style="color:#CC0000">RED</span><span style="color:#000">LIGHTAD</span>
        </span>
      </div>
      <h2 style="color:#111;font-size:20px;margin:0 0 16px">${subject}</h2>
      <div style="color:#374151;font-size:15px;line-height:1.7">${body.replace(/\n/g, "<br>")}</div>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E5E5">
        <p style="color:#9CA3AF;font-size:12px;margin:0">
          You received this email as a registered RedLightAD user.<br>
          <a href="https://redlightad.com" style="color:#9CA3AF">redlightad.com</a>
        </p>
      </div>
    </div>`;

  // Send in batches
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch.map(email => ({
        from: "RedLightAD <noreply@redlightad.com>",
        to: [email],
        subject,
        html: htmlBody,
      }))),
    });
    const result = await res.json();
    if (Array.isArray(result)) resendIds.push(...result.map((r: { id?: string }) => r.id ?? "").filter(Boolean));
  }

  // Store in broadcast_history
  await getClient().from("broadcast_history").insert({
    subject,
    body,
    recipients_type,
    recipients_filter: recipients_filter ?? null,
    recipients_count: emails.length,
    status: "sent",
    resend_ids: resendIds,
  });

  return NextResponse.json({ ok: true, sent: emails.length, resendIds });
}

export async function GET() {
  const { data, error } = await getClient()
    .from("broadcast_history")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
