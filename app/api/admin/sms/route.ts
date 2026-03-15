export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { to_phone, message, to_user_id, is_broadcast, recipient_count } = await req.json();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to environment variables." }, { status: 503 });
  }

  const phones: string[] = Array.isArray(to_phone) ? to_phone : [to_phone];
  const results: { phone: string; ok: boolean; sid?: string; error?: string }[] = [];

  for (const phone of phones) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: "REDLIGHTAD", Body: message }),
      });
      const data = await res.json();
      results.push({ phone, ok: !data.error_code, sid: data.sid, error: data.message });
    } catch (e) {
      results.push({ phone, ok: false, error: String(e) });
    }
  }

  const allOk = results.every(r => r.ok);

  // Log to DB
  await getClient().from("sms_log").insert({
    to_user_id: to_user_id ?? null,
    phone_number: phones.join(", "),
    message,
    status: allOk ? "sent" : "failed",
    direction: is_broadcast ? "broadcast" : "outbound",
    recipients: recipient_count ?? phones.length,
    error_msg: allOk ? null : results.filter(r => !r.ok).map(r => r.error).join("; "),
  });

  return NextResponse.json({ ok: allOk, results });
}

export async function GET() {
  const { data, error } = await getClient()
    .from("sms_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
