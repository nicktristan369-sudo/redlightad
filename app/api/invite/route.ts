export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInviteLink } from "@/lib/invite";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = db();
  const { data, error } = await supabase
    .from("invite_links")
    .select("*")
    .eq("token", token)
    .eq("is_used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Invite not found or expired" },
      { status: 404 }
    );
  }

  // Increment clicks
  await supabase
    .from("invite_links")
    .update({ clicks: (data.clicks || 0) + 1 })
    .eq("id", data.id);

  // Return invite data without sensitive fields
  const { id, is_used, used_at, created_listing_id, ...publicData } = data;
  return NextResponse.json(publicData);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = await createInviteLink(body);
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";
    return NextResponse.json({ token, url: `${baseUrl}/join/${token}` });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
