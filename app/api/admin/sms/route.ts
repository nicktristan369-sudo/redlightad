export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sms";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { to_phone, message, to_user_id, is_broadcast, recipient_count } = await req.json();

  const phones: string[] = Array.isArray(to_phone) ? to_phone : [to_phone];
  const results: { phone: string; ok: boolean; messageId?: string; error?: string }[] = [];

  for (const phone of phones) {
    const result = await sendSMS({ to: phone, message, sender: 'REDLIGHTAD' });
    results.push({ phone, ok: result.success, messageId: result.messageId, error: result.error });
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
