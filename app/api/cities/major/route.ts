import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * GET /api/cities/major
 * 
 * Get major cities for a country (for browse dropdown)
 * Major cities = population > 100,000
 * 
 * Query params:
 * - country: ISO country code (e.g., "ES", "DK", "DE")
 * - limit: Max results (default 50)
 * 
 * Example: /api/cities/major?country=ES
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get("country")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  if (!countryCode) {
    return NextResponse.json({ 
      error: "Country code required",
      example: "/api/cities/major?country=ES"
    }, { status: 400 });
  }

  try {
    const supabase = getClient();
    
    // First get country ID
    const { data: countryData } = await supabase
      .from("geo_countries")
      .select("id, name")
      .eq("iso_code", countryCode)
      .single();

    if (!countryData) {
      return NextResponse.json({ 
        error: "Country not found",
        country: countryCode
      }, { status: 404 });
    }

    // Get major cities (population > 100,000 or is_major_city = true)
    const { data: cities, error } = await supabase
      .from("geo_cities")
      .select(`
        id,
        name,
        ascii_name,
        latitude,
        longitude,
        population,
        is_major_city,
        region:geo_regions!region_id (name)
      `)
      .eq("country_id", countryData.id)
      .or("is_major_city.eq.true,population.gte.100000")
      .order("population", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Major Cities API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format response
    const formattedCities = (cities || []).map((city: any) => {
      const region = Array.isArray(city.region) ? city.region[0] : city.region;
      return {
        id: city.id,
        name: city.name,
        ascii_name: city.ascii_name,
        latitude: city.latitude,
        longitude: city.longitude,
        population: city.population,
        is_major_city: city.is_major_city,
        region: region?.name || null,
      };
    });

    return NextResponse.json({
      country: countryCode,
      country_name: countryData.name,
      count: formattedCities.length,
      cities: formattedCities,
    });
  } catch (err) {
    console.error("[Major Cities API] Exception:", err);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
