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
    const country  = searchParams.get("country");  // optional: filter by country (ISO2 or slug)
    const city     = searchParams.get("city");     // optional: filter by city
    const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const category = searchParams.get("category");
    const gender   = searchParams.get("gender");

    const supabase = getClient();

    let query = supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, gender, category, location, city, country, about, languages, premium_tier, created_at, voice_message_url, images, opening_hours, timezone")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (country) {
      // Use .in() with all variants: dk → ["Denmark","denmark","DK","dk"]
      query = query.in("country", getCountryVariants(country));
    }

    if (city) {
      query = query.ilike("city", city);
    }

    if (category) {
      query = query.ilike("category", category);
    }

    if (gender) {
      query = query.ilike("gender", gender);
    }

    const { data: listings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort: VIP → Featured → Standard
    const tierOrder = (t: string | null) => t === "vip" ? 0 : t === "featured" ? 1 : t === "basic" ? 2 : 3;
    const sorted = (listings ?? []).sort((a, b) => tierOrder(a.premium_tier) - tierOrder(b.premium_tier));

    return NextResponse.json({ listings: sorted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
