import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/**
 * Search cities globally or within a country
 * 
 * GET /api/geo/search?q=malaga
 * GET /api/geo/search?q=ojen&country=ES
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const countryCode = searchParams.get("country")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (query.length < 2) {
    return NextResponse.json({ 
      results: [], 
      message: "Query must be at least 2 characters" 
    });
  }

  try {
    const supabase = createServerClient();
    
    let queryBuilder = supabase
      .from("geonames_cities")
      .select("geoname_id, name, ascii_name, country_code, admin1_name, latitude, longitude, population, is_major_city")
      .or(`ascii_name.ilike.${query}%,name.ilike.${query}%`)
      .order("population", { ascending: false })
      .limit(limit);

    if (countryCode) {
      queryBuilder = queryBuilder.eq("country_code", countryCode);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("[Geo Search] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort: exact matches first, then major cities, then by population
    const sorted = (data || []).sort((a: any, b: any) => {
      const aExact = a.ascii_name?.toLowerCase() === query.toLowerCase() || a.name?.toLowerCase() === query.toLowerCase();
      const bExact = b.ascii_name?.toLowerCase() === query.toLowerCase() || b.name?.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      if (a.is_major_city && !b.is_major_city) return -1;
      if (b.is_major_city && !a.is_major_city) return 1;
      return b.population - a.population;
    });

    return NextResponse.json({
      results: sorted,
      query,
      country: countryCode || null,
    });
  } catch (err) {
    console.error("[Geo Search] Exception:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
