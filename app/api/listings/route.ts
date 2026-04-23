import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCountryVariants } from "@/lib/countries";
import { getLocaleFromDomain, SupportedLocale } from "@/lib/seo";

// Map locale to region code for filtering
const LOCALE_TO_REGION: Partial<Record<SupportedLocale, string>> = {
  nl: 'NL',
  de: 'DE',
  da: 'DK',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  sv: 'SE',
  no: 'NO',
  pl: 'PL',
  cs: 'CZ',
  ru: 'RU',
  th: 'TH',
  ar: 'AE',
  // 'en' = global, no region filter
};

// Map locale to country name for filtering
const LOCALE_TO_COUNTRY: Partial<Record<SupportedLocale, string[]>> = {
  nl: ['Netherlands', 'Nederland', 'NL'],
  de: ['Germany', 'Deutschland', 'DE'],
  da: ['Denmark', 'Danmark', 'DK'],
  fr: ['France', 'FR'],
  es: ['Spain', 'España', 'ES'],
  it: ['Italy', 'Italia', 'IT'],
  pt: ['Portugal', 'PT'],
  sv: ['Sweden', 'Sverige', 'SE'],
  no: ['Norway', 'Norge', 'NO'],
  pl: ['Poland', 'Polska', 'PL'],
  cs: ['Czech Republic', 'Czechia', 'Česko', 'CZ'],
  ru: ['Russia', 'Россия', 'RU'],
  th: ['Thailand', 'TH'],
  ar: ['UAE', 'United Arab Emirates', 'AE'],
};

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
    const nationality  = searchParams.get("nationality");
    const bodyBuild    = searchParams.get("body_build");
    const hairColor    = searchParams.get("hair_color");
    const ethnicity    = searchParams.get("ethnicity");
    const orientation  = searchParams.get("orientation");
    const languagesParam = searchParams.get("languages");
    const heightMin    = searchParams.get("height_min");
    const heightMax    = searchParams.get("height_max");
    const outcall      = searchParams.get("outcall") === "1";
    const hasOwnPlace  = searchParams.get("has_own_place") === "1";
    const verified     = searchParams.get("verified") === "1";
    const availableNow = searchParams.get("available_now") === "1";
    const regionOverride = searchParams.get("region"); // Allow explicit region override
    
    // Get region from domain - check host header directly
    const host = req.headers.get('host') || '';
    const domainLocale = getLocaleFromDomain(host);
    const domainRegion = domainLocale ? LOCALE_TO_REGION[domainLocale] : null;
    const domainCountries = domainLocale ? LOCALE_TO_COUNTRY[domainLocale] : null;

    const supabase = getClient();

    let query = supabase
      .from("listings")
      .select("id, slug, title, profile_image, profile_video_url, video_url, age, gender, category, location, city, country, about, languages, premium_tier, premium_until, boost_score, boost_purchased_at, created_at, voice_message_url, images, opening_hours, timezone, social_links, onlyfans_username, onlyfans_price_usd, onlyfans_bio, onlyfans_cover_url, onlyfans_photos_count, onlyfans_videos_count, onlyfans_likes_count, onlyfans_subscribers")
      .eq("status", "active")
      .limit(limit);

    // Region/country filtering priority:
    // 1. Explicit country param from user
    // 2. Domain-based region (unless user explicitly searches)
    if (country) {
      query = query.in("country", getCountryVariants(country));
    } else if (domainCountries && !q) {
      // Filter by domain's country if no explicit search
      // Use .in() for country names
      query = query.in("country", domainCountries);
    }
    if (city)     query = query.ilike("city", city);
    if (category) {
      if (category.toLowerCase() === "trans") {
        // Trans profiler kan have gender=trans ELLER category=trans
        query = query.or(`gender.ilike.trans,category.ilike.trans`)
      } else if (category.toLowerCase() === "male escort" || category.toLowerCase() === "male_escort") {
        query = query.or(`gender.ilike.male,gender.ilike.man,category.ilike.male_escort`)
      } else if (category.toLowerCase() === "onlyfans") {
        // OnlyFans: filter client-side efter query (social_links JSONB nested filter virker ikke)
        // Vi henter alle aktive og filtrerer nedenfor
      } else {
        query = query.ilike("category", category)
      }
    }
    if (gender)   query = query.ilike("gender", gender);
    if (q)        query = query.or(`title.ilike.%${q}%,about.ilike.%${q}%`);
    if (ageMin)   query = query.gte("age", parseInt(ageMin));
    if (ageMax)   query = query.lte("age", parseInt(ageMax));
    if (premiumOnly) query = query.in("premium_tier", ["vip", "featured", "basic"]);
    if (hasVideo)    query = query.not("video_url", "is", null);
    if (nationality) query = query.eq("nationality", nationality);
    if (bodyBuild)   query = query.eq("body_build", bodyBuild);
    if (hairColor)   query = query.eq("hair_color", hairColor);
    if (ethnicity)   query = query.eq("ethnicity", ethnicity);
    if (orientation) query = query.eq("orientation", orientation);
    if (languagesParam) query = query.contains("languages", languagesParam.split(","));
    if (heightMin)   query = query.gte("height_cm", parseInt(heightMin));
    if (heightMax)   query = query.lte("height_cm", parseInt(heightMax));
    if (outcall)     query = query.eq("outcall", true);
    if (hasOwnPlace) query = query.eq("has_own_place", true);
    if (verified)    query = query.eq("verified", true);
    if (availableNow) query = query.eq("cam_status", "available");

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

      // Boost øverst — højere score vinder, samme score → nyeste push vinder
      if (aBoosted && !bBoosted) return -1
      if (!aBoosted && bBoosted) return 1
      if (aBoosted && bBoosted) {
        if (aScore !== bScore) return bScore - aScore
        const aTime = a.boost_purchased_at ? new Date(a.boost_purchased_at).getTime() : 0
        const bTime = b.boost_purchased_at ? new Date(b.boost_purchased_at).getTime() : 0
        return bTime - aTime
      }

      // Premium næst
      if (aPremium && !bPremium) return -1
      if (!aPremium && bPremium) return 1

      // Gratis → nyeste oprettet
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // OnlyFans category: filter på social_links->onlyfans->url
    const final = category?.toLowerCase() === "onlyfans"
      ? sorted.filter((l: Record<string, unknown>) => {
          const sl = l.social_links as Record<string, { url?: string }> | null
          return sl?.onlyfans?.url
        })
      : sorted

    return NextResponse.json({ listings: final });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
