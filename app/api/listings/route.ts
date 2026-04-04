import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCountryVariants } from "@/lib/countries";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // bypasses RLS, always fresh data
  );

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country      = searchParams.get("country");
    const city         = searchParams.get("city");
    const limit        = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const category     = searchParams.get("category");
    const gender       = searchParams.get("gender");
    const q            = searchParams.get("q");
    const ageMin       = searchParams.get("age_min");
    const ageMax       = searchParams.get("age_max");
    const premiumOnly  = searchParams.get("premium_only") === "1";
    const hasVideo     = searchParams.get("has_video") === "1";
    const sortBy       = searchParams.get("sort") ?? "premium"; // premium | newest | oldest

    const supabase = getClient();

    let query = supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, gender, category, location, city, country, about, languages, premium_tier, created_at, voice_message_url, images, opening_hours, timezone")
      .eq("status", "active")
      .limit(limit);

    if (country) query = query.in("country", getCountryVariants(country));
    if (city)     query = query.ilike("city", city);
    if (category) query = query.ilike("category", category);
    if (gender)   query = query.ilike("gender", gender);
    if (q)        query = query.or(`title.ilike.%${q}%,about.ilike.%${q}%`);
    if (ageMin)   query = query.gte("age", parseInt(ageMin));
    if (ageMax)   query = query.lte("age", parseInt(ageMax));
    if (premiumOnly) query = query.in("premium_tier", ["vip", "featured", "basic"]);
    if (hasVideo)    query = query.not("video_url", "is", null);

    // Sort
    if (sortBy === "newest")  query = query.order("created_at", { ascending: false });
    else if (sortBy === "oldest") query = query.order("created_at", { ascending: true });
    else query = query.order("created_at", { ascending: false }); // default, re-sort client-side by tier

    const { data: listings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort: VIP → Featured → Standard (unless explicit sort)
    const tierOrder = (t: string | null) => t === "vip" ? 0 : t === "featured" ? 1 : t === "basic" ? 2 : 3;
    const sorted = sortBy === "premium" || sortBy === "newest"
      ? [...(listings ?? [])].sort((a, b) => tierOrder(a.premium_tier) - tierOrder(b.premium_tier))
      : (listings ?? []);

    return NextResponse.json({ listings: sorted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
