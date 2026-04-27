import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/**
 * Get major cities for a country (for browse dropdown)
 * 
 * GET /api/geo/major-cities?country=ES
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get("country")?.toUpperCase();

  if (!countryCode) {
    return NextResponse.json({ 
      error: "Country code required",
      example: "/api/geo/major-cities?country=ES"
    }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("geonames_cities")
      .select("geoname_id, name, ascii_name, admin1_name, latitude, longitude, population")
      .eq("country_code", countryCode)
      .eq("is_major_city", true)
      .order("population", { ascending: false });

    if (error) {
      console.error("[Major Cities] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      country: countryCode,
      count: data?.length || 0,
      cities: data || [],
    });
  } catch (err) {
    console.error("[Major Cities] Exception:", err);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
