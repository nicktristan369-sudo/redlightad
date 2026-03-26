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

/* ── GET — fetch travel schedule for a listing ── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listing_id = searchParams.get("listing_id");
    if (!listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

    const db = getServiceClient();
    const { data, error } = await db
      .from("travel_schedule")
      .select("*")
      .eq("listing_id", listing_id)
      .order("arrival_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── POST — add new travel entry ── */
export async function POST(req: NextRequest) {
  try {
    const authClient = await getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { listing_id, country, city, country_code, arrival_date, departure_date } = await req.json();
    if (!listing_id || !country || !city || !country_code || !arrival_date || !departure_date) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Verify user owns listing
    const { data: listing } = await db
      .from("listings")
      .select("id")
      .eq("id", listing_id)
      .eq("user_id", user.id)
      .single();

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const { data: entry, error } = await db
      .from("travel_schedule")
      .insert({ listing_id, country, city, country_code, arrival_date, departure_date })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── DELETE — remove a travel entry ── */
export async function DELETE(req: NextRequest) {
  try {
    const authClient = await getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const { travel_id } = await req.json();
    if (!travel_id) return NextResponse.json({ error: "travel_id required" }, { status: 400 });

    const db = getServiceClient();

    // Get travel entry to find listing_id
    const { data: travel } = await db
      .from("travel_schedule")
      .select("id, listing_id")
      .eq("id", travel_id)
      .single();

    if (!travel) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    // Verify user owns listing
    const { data: listing } = await db
      .from("listings")
      .select("id")
      .eq("id", travel.listing_id)
      .eq("user_id", user.id)
      .single();

    if (!listing) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { error } = await db
      .from("travel_schedule")
      .delete()
      .eq("id", travel_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
