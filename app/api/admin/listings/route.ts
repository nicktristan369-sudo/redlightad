import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // bypasses RLS
  );

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending | active | rejected | all

    const supabase = getClient();

    let query = supabase
      .from("listings")
      .select("id, title, category, gender, age, country, city, status, created_at, profile_image, user_id, premium_tier")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: listings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    // Manual join — seller emails from auth.users not accessible via anon
    // Get profile info (full_name, email from profiles table)
    const userIds = [...new Set(listings.map((l: Record<string, unknown>) => l.user_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p: { id: string; full_name?: string; email?: string }) => [
        p.id,
        { full_name: p.full_name ?? null, email: p.email ?? null },
      ])
    );

    const enriched = listings.map((l: Record<string, unknown>) => ({
      ...l,
      user_name:  profileMap[l.user_id as string]?.full_name ?? null,
      user_email: profileMap[l.user_id as string]?.email ?? null,
    }));

    return NextResponse.json({ listings: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { listingId, action } = await req.json() as {
      listingId: string;
      action: "approve" | "reject" | "delete";
    };

    if (!listingId || !["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = getClient();

    if (action === "delete") {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const newStatus = action === "approve" ? "active" : "rejected";
    const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
