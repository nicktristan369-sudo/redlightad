import { NextRequest, NextResponse } from "next/server";
import { City, State, Country } from "country-state-city";

export const dynamic = "force-dynamic";

// Cache for loaded cities to avoid repeated lookups
const cityCache = new Map<string, { name: string; count: number; region?: string }[]>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = (searchParams.get("country") || "").trim().toUpperCase();
    
    if (!countryCode) {
      return NextResponse.json({ 
        error: "Missing country parameter" 
      }, { status: 400 });
    }

    // Check cache first
    if (cityCache.has(countryCode)) {
      const cached = cityCache.get(countryCode)!;
      return buildResponse(countryCode, cached);
    }

    // Get country info
    const country = Country.getCountryByCode(countryCode);
    if (!country) {
      return NextResponse.json({
        country: countryCode,
        countryCode,
        topCities: [],
        regions: [],
        totalCities: 0,
        totalListings: 0,
        fromGeo: true,
      });
    }

    // Get all states/regions for this country
    const states = State.getStatesOfCountry(countryCode);
    
    // Get all cities for this country
    const allCities = City.getCitiesOfCountry(countryCode) || [];
    
    // Create city list with regions
    const cities: { name: string; count: number; region?: string }[] = [];
    const seenCities = new Set<string>();

    // First add major cities (population-based importance via order in library)
    for (const city of allCities.slice(0, 100)) { // Take top 100 cities
      const key = city.name.toLowerCase();
      if (!seenCities.has(key)) {
        seenCities.add(key);
        
        // Find the state/region for this city
        const state = states.find(s => s.isoCode === city.stateCode);
        
        cities.push({
          name: city.name,
          count: 0, // Will be populated from actual listings
          region: state?.name || undefined,
        });
      }
    }

    // Cache the result
    cityCache.set(countryCode, cities);
    
    return buildResponse(countryCode, cities);
  } catch (err) {
    console.error("[Locations API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

function buildResponse(countryCode: string, cities: { name: string; count: number; region?: string }[]) {
  const country = Country.getCountryByCode(countryCode);
  const countryName = country?.name || countryCode;

  // Group by region
  const regionMap: Record<string, { name: string; cities: typeof cities }> = {};
  for (const city of cities) {
    const regionName = city.region || "Other";
    if (!regionMap[regionName]) {
      regionMap[regionName] = { name: regionName, cities: [] };
    }
    regionMap[regionName].cities.push(city);
  }

  // Sort regions by number of cities
  const regions = Object.values(regionMap)
    .sort((a, b) => b.cities.length - a.cities.length)
    .slice(0, 20); // Limit to 20 regions

  // Top cities (first 15)
  const topCities = cities.slice(0, 15);

  return NextResponse.json({
    country: countryName,
    countryCode,
    topCities,
    regions,
    totalCities: cities.length,
    totalListings: 0,
    fromGeo: true,
  });
}
