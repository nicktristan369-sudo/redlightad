import { NextRequest, NextResponse } from "next/server";
import { City, State, Country } from "country-state-city";
import { MAJOR_CITIES } from "@/lib/majorCities";

export const dynamic = "force-dynamic";

// Type for city entry
type CityEntry = {
  name: string;
  region: string;
  country: string;
  countryCode: string;
  isMajor: boolean;
};

// Cache for all cities globally (loaded once)
let globalCityCache: CityEntry[] | null = null;

// Build global city index
function buildGlobalCityIndex(): CityEntry[] {
  if (globalCityCache) return globalCityCache;
  
  const majorCitySet = new Set(MAJOR_CITIES.map(c => `${c.name.toLowerCase()}-${c.countryCode.toLowerCase()}`));
  const cities: CityEntry[] = [];
  
  // Get all countries
  const countries = Country.getAllCountries();
  
  for (const country of countries) {
    const states = State.getStatesOfCountry(country.isoCode);
    const countryCities = City.getCitiesOfCountry(country.isoCode) || [];
    
    for (const city of countryCities) {
      const state = states.find(s => s.isoCode === city.stateCode);
      const key = `${city.name.toLowerCase()}-${country.isoCode.toLowerCase()}`;
      
      cities.push({
        name: city.name,
        region: state?.name || "",
        country: country.name,
        countryCode: country.isoCode,
        isMajor: majorCitySet.has(key),
      });
    }
  }
  
  globalCityCache = cities;
  return cities;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        message: "Enter at least 2 characters to search"
      });
    }

    // Build index if not cached
    const allCities = buildGlobalCityIndex();
    
    // Search cities
    const matches = allCities.filter(city => 
      city.name.toLowerCase().includes(query) ||
      city.region.toLowerCase().includes(query) ||
      city.country.toLowerCase().includes(query)
    );
    
    // Sort: exact match first, starts with second, major cities prioritized
    matches.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      
      // Exact match first
      if (aLower === query && bLower !== query) return -1;
      if (bLower === query && aLower !== query) return 1;
      
      // Starts with second
      const aStarts = aLower.startsWith(query);
      const bStarts = bLower.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Major cities third
      if (a.isMajor && !b.isMajor) return -1;
      if (b.isMajor && !a.isMajor) return 1;
      
      // Alphabetical
      return aLower.localeCompare(bLower);
    });

    // Return limited results
    const results = matches.slice(0, limit).map(city => ({
      name: city.name,
      region: city.region,
      country: city.country,
      countryCode: city.countryCode,
      isMajor: city.isMajor,
      display: city.region 
        ? `${city.name}, ${city.region}, ${city.country}`
        : `${city.name}, ${city.country}`
    }));

    return NextResponse.json({
      results,
      total: matches.length,
      query
    });
  } catch (err) {
    console.error("[Global City Search] Error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
