import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * GET /api/cities
 * 
 * Simple city autocomplete endpoint.
 * Queries geo_cities table in Supabase.
 * 
 * Query params:
 * - country: Country ISO code (e.g., "DK", "DE")
 * - search: Search query (min 2 chars for autocomplete)
 * - limit: Max results (default 20)
 * 
 * Example: /api/cities?country=DK&search=køb
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country")?.toUpperCase() || null;
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const supabase = getClient();

    // If no search, return top cities for the country
    if (search.length < 2) {
      if (!country) {
        return NextResponse.json({ cities: [], message: "Provide country or search query" });
      }

      // Get country ID
      const { data: countryData } = await supabase
        .from("geo_countries")
        .select("id")
        .eq("iso_code", country)
        .single();

      if (!countryData) {
        return NextResponse.json({ cities: [], message: "Country not found" });
      }

      // Return top cities by population
      const { data: cities } = await supabase
        .from("geo_cities")
        .select(`
          id,
          name,
          ascii_name,
          latitude,
          longitude,
          population,
          is_major_city,
          region:geo_regions!region_id (name),
          country:geo_countries!country_id (name, iso_code)
        `)
        .eq("country_id", countryData.id)
        .order("population", { ascending: false })
        .limit(limit);

      return NextResponse.json({
        cities: formatCities(cities || []),
        country,
      });
    }

    // Search cities
    let query = supabase
      .from("geo_cities")
      .select(`
        id,
        name,
        ascii_name,
        latitude,
        longitude,
        population,
        is_major_city,
        region:geo_regions!region_id (name),
        country:geo_countries!country_id (name, iso_code)
      `)
      .or(`ascii_name.ilike.%${search}%,name.ilike.%${search}%`)
      .order("population", { ascending: false })
      .limit(limit);

    // Filter by country if provided
    if (country) {
      const { data: countryData } = await supabase
        .from("geo_countries")
        .select("id")
        .eq("iso_code", country)
        .single();

      if (countryData) {
        query = query.eq("country_id", countryData.id);
      }
    }

    const { data: cities, error } = await query;

    if (error) {
      console.error("[Cities API] Error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Sort by relevance
    const sorted = (cities || []).sort((a, b) => {
      const aName = (a.ascii_name || a.name).toLowerCase();
      const bName = (b.ascii_name || b.name).toLowerCase();
      const q = search.toLowerCase();

      // Exact match first
      if (aName === q) return -1;
      if (bName === q) return 1;

      // Starts with query
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;

      // By population
      return (b.population || 0) - (a.population || 0);
    });

    return NextResponse.json({
      cities: formatCities(sorted),
      search,
      country,
    });
  } catch (err) {
    console.error("[Cities API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatCities(cities: any[]): any[] {
  return cities.map((city) => {
    const region = Array.isArray(city.region) ? city.region[0] : city.region;
    const country = Array.isArray(city.country) ? city.country[0] : city.country;

    return {
      id: city.id,
      name: city.name,
      ascii_name: city.ascii_name,
      latitude: city.latitude,
      longitude: city.longitude,
      population: city.population,
      is_major_city: city.is_major_city,
      region: region?.name || null,
      country: country?.name || null,
      country_code: country?.iso_code || null,
      display: [city.name, region?.name, country?.name].filter(Boolean).join(", "),
    };
  });
}
