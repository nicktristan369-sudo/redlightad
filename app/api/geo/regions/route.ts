import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * GET /api/geo/regions
 * 
 * Get regions for a country.
 * 
 * Query params:
 * - country: Country ISO code (required)
 * - with_cities: Include top cities per region
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get("country")?.toUpperCase();
    const withCities = searchParams.get("with_cities") === "true";

    if (!countryCode) {
      return NextResponse.json(
        { error: "Country code required" },
        { status: 400 }
      );
    }

    const supabase = getClient();

    // Get country
    const { data: country } = await supabase
      .from("geo_countries")
      .select("id, name, iso_code")
      .eq("iso_code", countryCode)
      .single();

    if (!country) {
      return NextResponse.json(
        { error: "Country not found" },
        { status: 404 }
      );
    }

    // Get regions
    const { data: regions, error } = await supabase
      .from("geo_regions")
      .select("*")
      .eq("country_id", country.id)
      .order("name");

    if (error) {
      console.error("[Geo Regions] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch regions" },
        { status: 500 }
      );
    }

    // Optionally get top cities for each region
    let citiesByRegion: Record<number, any[]> = {};
    if (withCities && regions) {
      for (const region of regions) {
        const { data: cities } = await supabase
          .from("geo_cities")
          .select("id, name, ascii_name, population, is_major_city")
          .eq("region_id", region.id)
          .order("population", { ascending: false })
          .limit(10);

        citiesByRegion[region.id] = cities || [];
      }
    }

    // Format response
    const formattedRegions = (regions || []).map((region) => ({
      id: region.id,
      name: region.name,
      ascii_name: region.ascii_name,
      admin1_code: region.admin1_code,
      population: region.population,
      cities: withCities ? citiesByRegion[region.id] || [] : undefined,
    }));

    return NextResponse.json({
      country: {
        id: country.id,
        name: country.name,
        iso_code: country.iso_code,
      },
      regions: formattedRegions,
      total: formattedRegions.length,
    });
  } catch (err) {
    console.error("[Geo Regions] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
