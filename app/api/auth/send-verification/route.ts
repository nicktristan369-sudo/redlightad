export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sms";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
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

  // Send SMS via GatewayAPI
  const smsMessage = `Your RedLightAD verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;
  const result = await sendSMS({ to: phone, message: smsMessage, sender: 'REDLIGHTAD' });

  // Log in sms_log
  await getClient().from("sms_log").insert({
    phone_number: phone,
    message: `Verification code: [hidden]`,
    status: result.success ? "sent" : "failed",
    direction: "outbound",
    recipients: 1,
    error_msg: result.success ? null : result.error,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Failed to send SMS" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone });
}
