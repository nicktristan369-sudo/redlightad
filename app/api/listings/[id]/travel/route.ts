import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/* ── GET — public, returns entries for a listing ── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getServiceClient();
    const { data, error } = await db
      .from("listing_travel")
      .select("id, from_date, to_date, city, country")
      .eq("listing_id", id)
      .order("from_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── POST — add entry OR toggle show_travel_schedule ── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authClient = await getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

    const db = getServiceClient();

    // Verify ownership + premium
    const { data: listing } = await db
      .from("listings")
      .select("id, user_id, premium_tier")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!listing) return NextResponse.json({ error: "Annonce ikke fundet" }, { status: 404 });

    const { data: profile } = await db
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier || listing.premium_tier;
    if (!["basic", "featured", "vip"].includes(tier ?? "")) {
      return NextResponse.json({ error: "Premium required" }, { status: 403 });
    }

    const body = await req.json() as {
      action?: "toggle_visibility";
      show?: boolean;
      from_date?: string;
      to_date?: string;
      city?: string;
      country?: string;
    };

    // Toggle visibility
    if (body.action === "toggle_visibility") {
      const { error } = await db
        .from("listings")
        .update({ show_travel_schedule: body.show ?? false })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // Add travel entry
    const { from_date, to_date, city, country } = body;
    if (!from_date || !to_date || !city || !country) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const { data: entry, error } = await db
      .from("listing_travel")
      .insert({ listing_id: id, from_date, to_date, city, country })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── DELETE — remove entry ── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authClient = await getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

    const { travel_id } = await req.json() as { travel_id: string };
    if (!travel_id) return NextResponse.json({ error: "travel_id required" }, { status: 400 });

    const db = getServiceClient();

    // Verify ownership via join
    const { error } = await db
      .from("listing_travel")
      .delete()
      .eq("id", travel_id)
      .eq("listing_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
