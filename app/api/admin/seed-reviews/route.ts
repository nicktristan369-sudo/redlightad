import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

// Dummy reviews for testing
const DUMMY_REVIEWS = [
  {
    rating: 5,
    title: "Fantastisk oplevelse!",
    body: "Very professional and welcoming. Everything was exactly as described, and communication was quick and easy. Highly recommended.",
    reviewer_name: "Thomas K.",
  },
  {
    rating: 5,
    title: "Absolut den bedste",
    body: "Incredibly charming and good at making you feel welcome. Schedule was kept and everything went perfectly. 10/10 would book again!",
    reviewer_name: "Michael",
  },
  {
    rating: 4,
    title: "Rigtig god oplevelse",
    body: "Lovely and welcoming. Slight delay, but otherwise a fantastic time. Pictures match reality.",
    reviewer_name: "Anonymous",
  },
  {
    rating: 5,
    title: null,
    body: "Wow! Exceeded all expectations. Very professional approach and fantastic service. Thanks for a memorable evening.",
    reviewer_name: "JakobC",
  },
  {
    rating: 4,
    title: "God service",
    body: "Nem at kommunikere med og meget fleksibel. Alt i alt en fin oplevelse.",
    reviewer_name: null,
  },
  {
    rating: 5,
    title: "Perfekt!",
    body: null,
    reviewer_name: "Martin",
  },
];

// POST: Seed dummy reviews for a listing
export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { listing_id, count = 3 } = await request.json();

  if (!listing_id) {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  // Enable reviews on listing
  await supabase
    .from("listings")
    .update({ show_reviews: true })
    .eq("id", listing_id);

  // Insert random reviews
  const reviewsToInsert = DUMMY_REVIEWS
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, DUMMY_REVIEWS.length))
    .map((r, i) => ({
      listing_id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      reviewer_name: r.reviewer_name,
      is_approved: true,
      is_verified: i === 0, // First one is verified
      helpful_count: Math.floor(Math.random() * 10),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
    }));

  const { data, error } = await supabase
    .from("listing_reviews")
    .insert(reviewsToInsert)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Created ${data.length} dummy reviews`,
    reviews: data 
  });
}
