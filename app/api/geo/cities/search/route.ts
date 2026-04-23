import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * GET /api/geo/cities/search
 * 
 * Search for cities with autocomplete functionality.
 * Uses fuzzy matching and ranks by relevance + population.
 * 
 * Query params:
 * - q: Search query (required, min 2 chars)
 * - country: Country ISO code (optional, e.g., "DE")
 * - limit: Max results (default 15)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const countryCode = searchParams.get("country")?.toUpperCase() || null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30);

    if (query.length < 2) {
      return NextResponse.json({ cities: [], message: "Query too short" });
    }

    const supabase = getClient();

    // Build the search query
    let dbQuery = supabase
      .from("geo_cities")
      .select(`
        id,
        geoname_id,
        name,
        ascii_name,
        latitude,
        longitude,
        population,
        feature_code,
        is_major_city,
        is_capital,
        region:geo_regions!region_id (
          id,
          name,
          ascii_name
        ),
        country:geo_countries!country_id (
          id,
          name,
          iso_code,
          name_local
        )
      `)
      .or(`ascii_name.ilike.%${query}%,name.ilike.%${query}%`)
      .order("population", { ascending: false })
      .limit(limit);

    // Filter by country if specified
    if (countryCode) {
      // First get country ID
      const { data: country } = await supabase
        .from("geo_countries")
        .select("id")
        .eq("iso_code", countryCode)
        .single();

      if (country) {
        dbQuery = dbQuery.eq("country_id", country.id);
      }
    }

    const { data: cities, error } = await dbQuery;

    if (error) {
      console.error("[Geo Cities Search] Error:", error);
      return NextResponse.json(
        { error: "Failed to search cities" },
        { status: 500 }
      );
    }

    // Sort results by relevance
    const sortedCities = (cities || []).sort((a, b) => {
      const aName = (a.ascii_name || a.name).toLowerCase();
      const bName = (b.ascii_name || b.name).toLowerCase();
      const q = query.toLowerCase();

      // Exact match first
      if (aName === q && bName !== q) return -1;
      if (bName === q && aName !== q) return 1;

      // Starts with query
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;

      // By population
      return (b.population || 0) - (a.population || 0);
    });

    // Format response
    const formattedCities = sortedCities.map((city: any) => {
      // Supabase returns relations as arrays for singular relations
      const region = Array.isArray(city.region) ? city.region[0] : city.region;
      const country = Array.isArray(city.country) ? city.country[0] : city.country;
      
      return {
        id: city.id,
        geoname_id: city.geoname_id,
        name: city.name,
        ascii_name: city.ascii_name,
        latitude: city.latitude,
        longitude: city.longitude,
        population: city.population,
        is_major_city: city.is_major_city,
        is_capital: city.is_capital,
        region: region
          ? {
              id: region.id,
              name: region.name,
            }
          : null,
        country: country
          ? {
              id: country.id,
              name: country.name,
              name_local: country.name_local,
              iso_code: country.iso_code,
            }
          : null,
        display_name: formatCityDisplayFromParts(city.name, region?.name, country?.name),
      };
    });

    return NextResponse.json({
      cities: formattedCities,
      count: formattedCities.length,
      query,
      country: countryCode,
    });
  } catch (err) {
    console.error("[Geo Cities Search] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatCityDisplayFromParts(cityName: string, regionName?: string, countryName?: string): string {
  const parts = [cityName];

  if (regionName) {
    parts.push(regionName);
  }

  if (countryName) {
    parts.push(countryName);
  }

  return parts.join(", ");
}
