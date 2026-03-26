export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const { token, listing_id } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = db();
    const { error } = await supabase
      .from("invite_links")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        created_listing_id: listing_id || null,
      })
      .eq("token", token);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to mark invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
