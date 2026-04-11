export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sms";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Normalize phone to E.164 (with +)
function toE164(phone: string): string {
  let p = phone.replace(/[\s\-\.\(\)]/g, '')
  if (!p.startsWith('+')) p = '+' + p.replace(/^00/, '')
  return p
}

export async function POST(req: NextRequest) {
  const { phone, channel = "sms" } = await req.json();
  // channel: "sms" | "whatsapp"

  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalidate old codes
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

  const message = `Your RedLightAD verification code is: ${code}\n\nValid for 10 minutes. Do not share this code.`;
  let result: { success: boolean; error?: string };

  if (channel === "whatsapp") {
    // Send via GatewayAPI WhatsApp
    result = await sendWhatsApp(phone, code);
  } else {
    // Send via SMS
    result = await sendSMS({ to: phone, message });
  }

  // Log attempt
  await getClient().from("sms_log").insert({
    phone_number: phone,
    message: `Verification code [${channel}]: [hidden]`,
    status: result.success ? "sent" : "failed",
    direction: "outbound",
    recipients: 1,
    error_msg: result.success ? null : result.error,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Failed to send code" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, channel });
}

async function sendWhatsApp(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.GATEWAYAPI_TOKEN;
  if (!token) return { success: false, error: "No GatewayAPI token" };

  // Normalize to numeric MSISDN
  let p = phone.replace(/[\s\-\.\(\)\+]/g, '').replace(/^00/, '')
  if (p.length === 8 && /^[2-9]/.test(p)) p = '45' + p

  const message = `Your RedLightAD verification code is: *${code}*\n\nValid for 10 minutes. Do not share this code.`;

  try {
    const res = await fetch("https://gatewayapi.com/rest/mtsms", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: "RedLightAD",
        message,
        recipients: [{ msisdn: parseInt(p, 10) }],
        // GatewayAPI: use class=0 for WhatsApp if available, otherwise fallback to SMS
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("WhatsApp send error:", JSON.stringify(data));
      // Fallback to SMS
      return sendSMSFallback(phone, code);
    }
    return { success: true };
  } catch (err: unknown) {
    return sendSMSFallback(phone, code);
  }
}

async function sendSMSFallback(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  const { sendSMS } = await import("@/lib/sms");
  const message = `Your RedLightAD verification code is: ${code}\n\nValid for 10 minutes.`;
  return sendSMS({ to: phone, message });
}
