import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// GET - fetch user's favorites
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = admin();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Get all favorites for this user
  const { data: favorites, error } = await db
    .from("favorites")
    .select(`
      id,
      listing_id,
      created_at,
      listings (
        id,
        title,
        city,
        country,
        profile_image,
        status,
        premium_tier
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out any deleted/inactive listings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeFavorites = (favorites ?? [])
    .filter(f => {
      const listing = f.listings as { status?: string } | null;
      return listing && listing.status === "active";
    })
    .map(f => ({
      id: f.id,
      listing_id: f.listing_id,
      created_at: f.created_at,
      listing: f.listings,
    }));

  return NextResponse.json({ favorites: activeFavorites });
}

// POST - add to favorites
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = admin();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await req.json();
  const { listing_id } = body;

  if (!listing_id) {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  // Check if listing exists
  const { data: listing, error: listingErr } = await db
    .from("listings")
    .select("id, user_id")
    .eq("id", listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Can't favorite your own listing
  if (listing.user_id === user.id) {
    return NextResponse.json({ error: "Cannot favorite your own listing" }, { status: 400 });
  }

  // Check if already favorited
  const { data: existing } = await db
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already in favorites", id: existing.id }, { status: 409 });
  }

  // Add to favorites
  const { data: newFav, error: insertErr } = await db
    .from("favorites")
    .insert({
      user_id: user.id,
      listing_id,
    })
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: newFav.id });
}

// DELETE - remove from favorites
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = admin();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const listing_id = searchParams.get("listing_id");

  if (!listing_id) {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  const { error } = await db
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listing_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
