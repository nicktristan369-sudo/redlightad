export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "SMS service not configured" }, { status: 503 });
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // +10 min

  // Invalidate old codes for this phone
  await getClient()
    .from("phone_verification_codes")
    .update({ used: true })
    .eq("phone", phone)
    .eq("used", false);

  // Insert new code
  const { error: dbErr } = await getClient()
    .from("phone_verification_codes")
    .insert({ phone, code, expires_at: expiresAt });

  if (dbErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Send SMS via Twilio
  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: `Your RedLightAD verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      }),
    }
  );

  const twilioData = await twilioRes.json();

  // Log in sms_log
  await getClient().from("sms_log").insert({
    phone_number: phone,
    message: `Verification code: [hidden]`,
    status: twilioData.error_code ? "failed" : "sent",
    direction: "outbound",
    recipients: 1,
    error_msg: twilioData.error_code ? twilioData.message : null,
  });

  if (twilioData.error_code) {
    return NextResponse.json({ error: twilioData.message ?? "Failed to send SMS" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone });
}
