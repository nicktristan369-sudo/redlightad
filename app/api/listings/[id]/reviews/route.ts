import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

// GET reviews for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = createServerClient();

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

  // Check settings
  const { data: settings } = await supabase
    .from("review_settings")
    .select("key, value");

  const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
  const requireLoginToRead = settingsMap["require_login_to_read"] === "true";

  // Fetch approved reviews with extended fields
  const { data: reviews, error } = await supabase
    .from("listing_reviews")
    .select(`
      id, rating, title, body, images, reviewer_name, reviewer_avatar, reviewer_location,
      is_verified, is_anonymous, helpful_count, created_at,
      time_spent, ambience, photos_accurate, would_recommend, meeting_country, meeting_date
    `)
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
    requireLoginToRead,
  });
}

// POST a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = createServerClient();

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
  const { 
    rating, 
    review_body, 
    time_spent,
    ambience,
    photos_accurate,
    would_recommend,
    meeting_country,
    meeting_date,
    is_anonymous,
  } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // Get settings
  const { data: settings } = await supabase
    .from("review_settings")
    .select("key, value");

  const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
  const minLength = parseInt(settingsMap["min_review_length"] || "20");
  const maxLength = parseInt(settingsMap["max_review_length"] || "2000");
  const autoApprove = settingsMap["auto_approve"] === "true";

  if (!review_body || review_body.length < minLength) {
    return NextResponse.json({ error: `Review must be at least ${minLength} characters` }, { status: 400 });
  }

  if (review_body.length > maxLength) {
    return NextResponse.json({ error: `Review must be at most ${maxLength} characters` }, { status: 400 });
  }

  // Check banned words
  const { data: bannedWords } = await supabase
    .from("review_banned_words")
    .select("word, is_regex");

  const textToCheck = review_body.toLowerCase();
  for (const banned of bannedWords || []) {
    if (banned.is_regex) {
      try {
        const regex = new RegExp(banned.word, "i");
        if (regex.test(textToCheck)) {
          return NextResponse.json({ 
            error: "Your review contains content that is not allowed. Please remove any links or prohibited words." 
          }, { status: 400 });
        }
      } catch {}
    } else {
      if (textToCheck.includes(banned.word.toLowerCase())) {
        return NextResponse.json({ 
          error: "Your review contains content that is not allowed. Please remove any links or prohibited words." 
        }, { status: 400 });
      }
    }
  }

  // Get user profile for avatar/name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, city, country")
    .eq("id", user.id)
    .single();

  const { data: review, error } = await supabase
    .from("listing_reviews")
    .insert({
      listing_id: listingId,
      reviewer_id: user.id,
      reviewer_name: is_anonymous ? null : (profile?.full_name || user.email?.split("@")[0]),
      reviewer_avatar: is_anonymous ? null : (profile?.avatar_url || null),
      reviewer_location: is_anonymous ? null : ([profile?.city, profile?.country].filter(Boolean).join(", ") || null),
      rating,
      body: review_body,
      time_spent: time_spent || null,
      ambience: ambience || null,
      photos_accurate: photos_accurate || null,
      would_recommend: would_recommend || null,
      meeting_country: meeting_country || null,
      meeting_date: meeting_date || null,
      is_anonymous: is_anonymous ?? true,
      is_approved: autoApprove,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    review,
    message: autoApprove ? "Review published!" : "Review submitted for approval"
  });
}
