export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — list all inbox messages (admin only — called server-side)
export async function GET() {
  const { data, error } = await getClient()
    .from("admin_inbox")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — mark read / replied
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, is_read, reply_body } = body;
  const updates: Record<string, unknown> = {};
  if (is_read !== undefined) updates.is_read = is_read;
  if (reply_body !== undefined) {
    updates.replied = true;
    updates.reply_body = reply_body;
    updates.replied_at = new Date().toISOString();
    // Send reply via Resend
    const { data: msg } = await getClient().from("admin_inbox").select("from_email,from_name,subject").eq("id", id).single();
    if (msg?.from_email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "RedLightAD Support <noreply@redlightad.com>",
          to: [msg.from_email],
          subject: `Re: ${msg.subject ?? "Your message to RedLightAD"}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <div style="margin-bottom:24px"><span style="font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:18px;letter-spacing:-0.03em"><span style="color:#CC0000">RED</span><span style="color:#000">LIGHTAD</span></span></div>
            <p style="color:#111;font-size:15px;line-height:1.6">${reply_body.replace(/\n/g, "<br>")}</p>
            <hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0">
            <p style="color:#9CA3AF;font-size:12px">RedLightAD Support · contact@redlightad.com</p>
          </div>`,
        }),
      });
    }
  }
  const { error } = await getClient().from("admin_inbox").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
