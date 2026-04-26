import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Hardcoded city data per country (fallback when listings don't have country field)
const COUNTRY_CITIES: Record<string, { name: string; count: number; region?: string }[]> = {
  "BY": [ // Belarus
    { name: "Minsk", count: 8, region: "Minsk" },
    { name: "Brest", count: 2, region: "Brest" },
    { name: "Vitebsk", count: 1, region: "Vitebsk" },
    { name: "Mogilev", count: 1, region: "Mogilev" },
    { name: "Gomel", count: 1, region: "Gomel" },
    { name: "Grodno", count: 1, region: "Grodno" },
  ],
  "DK": [
    { name: "Copenhagen", count: 15, region: "Capital Region" },
    { name: "Aarhus", count: 3, region: "Central Jutland" },
    { name: "Odense", count: 2, region: "Southern Denmark" },
    { name: "Aalborg", count: 1, region: "North Jutland" },
  ],
  "DE": [
    { name: "Berlin", count: 12, region: "Berlin" },
    { name: "Munich", count: 8, region: "Bavaria" },
    { name: "Hamburg", count: 6, region: "Hamburg" },
    { name: "Cologne", count: 5, region: "North Rhine-Westphalia" },
    { name: "Frankfurt", count: 4, region: "Hesse" },
  ],
  "NL": [
    { name: "Amsterdam", count: 10, region: "North Holland" },
    { name: "Rotterdam", count: 5, region: "South Holland" },
    { name: "Utrecht", count: 3, region: "Utrecht" },
    { name: "The Hague", count: 3, region: "South Holland" },
  ],
  "SE": [
    { name: "Stockholm", count: 9, region: "Stockholm" },
    { name: "Gothenburg", count: 4, region: "Västra Götaland" },
    { name: "Malmö", count: 3, region: "Scania" },
  ],
  "NO": [
    { name: "Oslo", count: 8, region: "Oslo" },
    { name: "Bergen", count: 2, region: "Hordaland" },
    { name: "Trondheim", count: 1, region: "Trøndelag" },
  ],
  "US": [
    { name: "New York", count: 20, region: "New York" },
    { name: "Los Angeles", count: 15, region: "California" },
    { name: "Las Vegas", count: 12, region: "Nevada" },
    { name: "Miami", count: 8, region: "Florida" },
    { name: "Houston", count: 5, region: "Texas" },
  ],
  "TH": [
    { name: "Bangkok", count: 25, region: "Bangkok" },
    { name: "Phuket", count: 8, region: "Phuket" },
    { name: "Pattaya", count: 5, region: "Chonburi" },
    { name: "Chiang Mai", count: 2, region: "Chiang Mai" },
  ],
};

const COUNTRY_NAMES: Record<string, string> = {
  "BY": "Belarus",
  "DK": "Denmark",
  "DE": "Germany",
  "NL": "Netherlands",
  "SE": "Sweden",
  "NO": "Norway",
  "US": "United States",
  "FR": "France",
  "ES": "Spain",
  "IT": "Italy",
  "GB": "United Kingdom",
  "TH": "Thailand",
  "AE": "United Arab Emirates",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryParam = (searchParams.get("country") || "").trim().toUpperCase();
    
    // Debug log
    console.log(`[Locations API] country param=${countryParam}, available keys=${Object.keys(COUNTRY_CITIES).join(',')}`);

    // Return cities for the requested country
    const cities = COUNTRY_CITIES[countryParam] || [];
    const countryName = COUNTRY_NAMES[countryParam] || countryParam;

    if (cities.length === 0) {
      return NextResponse.json({
        country: countryParam,
        countryCode: countryParam,
        topCities: [],
        regions: [],
        totalCities: 0,
        totalListings: 0,
        fromGeo: false,
      });
    }

    // Group by region
    const regionMap: Record<string, { name: string; cities: typeof cities }> = {};
    for (const city of cities) {
      const regionName = city.region || "Other";
      if (!regionMap[regionName]) {
        regionMap[regionName] = { name: regionName, cities: [] };
      }
      regionMap[regionName].cities.push(city);
    }

    const regions = Object.values(regionMap)
      .map(r => ({
        ...r,
        totalCount: r.cities.reduce((sum, c) => sum + c.count, 0),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .map(({ totalCount, ...r }) => r);

    const topCities = [...cities].sort((a, b) => b.count - a.count).slice(0, 10);
    const totalListings = cities.reduce((sum, c) => sum + c.count, 0);

    return NextResponse.json({
      country: countryName,
      countryCode: countryParam,
      topCities: topCities.length > 0 ? topCities : cities.slice(0, 10),
      regions: regions.length > 0 ? regions : [],
      totalCities: cities.length,
      totalListings,
      fromGeo: false,
    });
  } catch (err) {
    console.error("[Locations API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}
