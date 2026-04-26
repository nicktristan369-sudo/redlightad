import { NextRequest, NextResponse } from "next/server";
import { City, State, Country } from "country-state-city";

export const dynamic = "force-dynamic";

// Cache for ALL cities per country
const cityCache = new Map<string, { name: string; region?: string; stateCode?: string }[]>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = (searchParams.get("country") || "").trim().toUpperCase();
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    
    if (!countryCode) {
      return NextResponse.json({ 
        error: "Missing country parameter" 
      }, { status: 400 });
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
        fromGeo: true,
      });
    }

    // Get or cache ALL cities for this country
    let allCities: { name: string; region?: string; stateCode?: string }[];
    
    if (cityCache.has(countryCode)) {
      allCities = cityCache.get(countryCode)!;
    } else {
      const states = State.getStatesOfCountry(countryCode);
      const rawCities = City.getCitiesOfCountry(countryCode) || [];
      
      // Build city list with regions
      const seenCities = new Set<string>();
      allCities = [];
      
      for (const city of rawCities) {
        const key = city.name.toLowerCase();
        if (!seenCities.has(key)) {
          seenCities.add(key);
          const state = states.find(s => s.isoCode === city.stateCode);
          allCities.push({
            name: city.name,
            region: state?.name || undefined,
            stateCode: city.stateCode,
          });
        }
      }
      
      // Sort alphabetically
      allCities.sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache it
      cityCache.set(countryCode, allCities);
    }

    // If searching, filter cities
    let filteredCities = allCities;
    if (query) {
      filteredCities = allCities.filter(city => 
        city.name.toLowerCase().includes(query) ||
        (city.region && city.region.toLowerCase().includes(query))
      );
      
      // Sort: exact match first, then starts with, then contains
      filteredCities.sort((a, b) => {
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
        
        // Then alphabetical
        return aLower.localeCompare(bLower);
      });
    }

    // Build response
    const countryName = country.name;
    
    // For display: limit to 50 results when searching, 15 for initial display
    const displayLimit = query ? 50 : 15;
    const topCities = filteredCities.slice(0, displayLimit).map(c => ({
      name: c.name,
      count: 0,
      region: c.region,
    }));

    // Group by region (only for non-search)
    let regions: { name: string; cities: { name: string; count: number; region?: string }[] }[] = [];
    
    if (!query) {
      const regionMap: Record<string, { name: string; cities: { name: string; count: number; region?: string }[] }> = {};
      
      // Use ALL cities for regions, not just first 100
      for (const city of allCities.slice(0, 500)) { // Reasonable limit for regions view
        const regionName = city.region || "Other";
        if (!regionMap[regionName]) {
          regionMap[regionName] = { name: regionName, cities: [] };
        }
        if (regionMap[regionName].cities.length < 50) { // Max 50 per region
          regionMap[regionName].cities.push({
            name: city.name,
            count: 0,
            region: city.region,
          });
        }
      }
      
      // Sort regions by number of cities
      regions = Object.values(regionMap)
        .sort((a, b) => b.cities.length - a.cities.length)
        .slice(0, 20);
    }

    return NextResponse.json({
      country: countryName,
      countryCode,
      topCities,
      regions,
      totalCities: allCities.length,
      matchedCities: query ? filteredCities.length : undefined,
      fromGeo: true,
    });
  } catch (err) {
    console.error("[Locations API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}
