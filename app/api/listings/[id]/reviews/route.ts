import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET reviews for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const listingId = params.id;

  // Check if listing exists and has reviews enabled
  const { data: listing } = await supabase
    .from("listings")
    .select("id, show_reviews, status")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!listing.show_reviews) {
    return NextResponse.json({ error: "Reviews disabled for this listing" }, { status: 403 });
  }

  // Fetch approved reviews
  const { data: reviews, error } = await supabase
    .from("listing_reviews")
    .select("id, rating, title, body, images, reviewer_name, is_verified, helpful_count, created_at")
    .eq("listing_id", listingId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate stats
  const count = reviews?.length ?? 0;
  const avgRating = count > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews?.forEach(r => {
    ratingDistribution[r.rating - 1]++;
  });

  return NextResponse.json({
    reviews: reviews ?? [],
    stats: {
      count,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution: ratingDistribution,
    },
  });
}

// POST a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const listingId = params.id;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Must be logged in to review" }, { status: 401 });
  }

  // Check listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, show_reviews, status, user_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!listing.show_reviews) {
    return NextResponse.json({ error: "Reviews disabled for this listing" }, { status: 403 });
  }

  // Can't review own listing
  if (listing.user_id === user.id) {
    return NextResponse.json({ error: "Cannot review your own listing" }, { status: 400 });
  }

  // Check if user already reviewed this listing
  const { data: existing } = await supabase
    .from("listing_reviews")
    .select("id")
    .eq("listing_id", listingId)
    .eq("reviewer_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this listing" }, { status: 400 });
  }

  const body = await request.json();
  const { rating, title, review_body, reviewer_name, images } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("listing_reviews")
    .insert({
      listing_id: listingId,
      reviewer_id: user.id,
      reviewer_name: reviewer_name || null,
      rating,
      title: title || null,
      body: review_body || null,
      images: images || [],
      is_approved: true, // Auto-approve for now, can add moderation later
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review });
}
