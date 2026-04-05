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
      .select("id, title, profile_image, profile_video_url, video_url, age, gender, category, location, city, country, about, languages, premium_tier, premium_until, boost_score, boost_purchased_at, created_at, voice_message_url, images, opening_hours, timezone")
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

    // Sort: Boost (score-baseret) → Premium → Gratis
    // Boost: jo højere boost_score, jo højere placering
    //        samme score → nyeste boost_purchased_at vinder (tiebreaker)
    // Premium: aktiv premium_until > now
    // Gratis: alle andre
    const now = new Date()
    const sorted = [...(listings ?? [])].sort((a, b) => {
      const aScore = (a.boost_score ?? 0) as number
      const bScore = (b.boost_score ?? 0) as number
      const aBoosted = aScore > 0
      const bBoosted = bScore > 0
      const aPremium = a.premium_until && new Date(a.premium_until) > now && a.premium_tier
      const bPremium = b.premium_until && new Date(b.premium_until) > now && b.premium_tier

      // Boost kommer altid øverst
      if (aBoosted && !bBoosted) return -1
      if (!aBoosted && bBoosted) return 1
      if (aBoosted && bBoosted) {
        // Højere score → øverst
        if (aScore !== bScore) return bScore - aScore
        // Samme score → nyeste push vinder
        const aTime = a.boost_purchased_at ? new Date(a.boost_purchased_at).getTime() : 0
        const bTime = b.boost_purchased_at ? new Date(b.boost_purchased_at).getTime() : 0
        return bTime - aTime
      }

      // Premium næst
      if (aPremium && !bPremium) return -1
      if (!aPremium && bPremium) return 1

      // Fallback: nyeste oprettet
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ listings: sorted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
