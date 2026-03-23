export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { phone, code, user_id } = await req.json();

  if (!phone || !code) {
    return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Find valid unused unexpired code
  const { data: record } = await getClient()
    .from("phone_verification_codes")
    .select("id, code, expires_at, used")
    .eq("phone", phone)
    .eq("used", false)
    .gte("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!record) {
    return NextResponse.json({ error: "Code expired or not found. Please request a new code." }, { status: 400 });
  }

  if (record.code !== code.trim()) {
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  // Mark code as used
  await getClient()
    .from("phone_verification_codes")
    .update({ used: true })
    .eq("id", record.id);

  // If user_id provided — mark profile as phone_verified
  if (user_id) {
    await getClient()
      .from("profiles")
      .update({ phone, phone_verified: true })
      .eq("id", user_id);
  }

  return NextResponse.json({ ok: true, verified: true });
}
