import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * GET /api/geo/countries
 * 
 * Get list of countries with optional filtering.
 * 
 * Query params:
 * - continent: Filter by continent (EU, NA, SA, AS, AF, OC)
 * - has_listings: Only show countries with active listings
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const continent = searchParams.get("continent")?.toUpperCase();
    const hasListings = searchParams.get("has_listings") === "true";

    const supabase = getClient();

    let query = supabase
      .from("geo_countries")
      .select("*")
      .order("name");

    if (continent) {
      query = query.eq("continent", continent);
    }

    const { data: countries, error } = await query;

    if (error) {
      console.error("[Geo Countries] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch countries" },
        { status: 500 }
      );
    }

    // If filtering by listings, check which countries have active listings
    let countryListingCounts: Record<string, number> = {};
    if (hasListings && countries) {
      const { data: listings } = await supabase
        .from("listings")
        .select("country")
        .eq("status", "active");

      if (listings) {
        for (const listing of listings) {
          if (listing.country) {
            const key = listing.country.toLowerCase();
            countryListingCounts[key] = (countryListingCounts[key] || 0) + 1;
          }
        }
      }
    }

    // Format response
    const formattedCountries = (countries || [])
      .map((country) => ({
        id: country.id,
        name: country.name,
        name_local: country.name_local,
        iso_code: country.iso_code,
        iso3_code: country.iso3_code,
        domain: country.domain,
        continent: country.continent,
        population: country.population,
        listing_count: countryListingCounts[country.name.toLowerCase()] || 0,
      }))
      .filter((c) => !hasListings || c.listing_count > 0);

    // Group by continent
    const byContinent: Record<string, typeof formattedCountries> = {};
    for (const country of formattedCountries) {
      const cont = country.continent || "OTHER";
      if (!byContinent[cont]) byContinent[cont] = [];
      byContinent[cont].push(country);
    }

    return NextResponse.json({
      countries: formattedCountries,
      by_continent: byContinent,
      total: formattedCountries.length,
    });
  } catch (err) {
    console.error("[Geo Countries] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
