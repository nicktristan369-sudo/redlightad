import { NextRequest, NextResponse } from "next/server";
import { City, State, Country } from "country-state-city";

export const dynamic = "force-dynamic";

// Cache for performance
const cache = new Map<string, string>();

function getRegionForCity(cityName: string, countryName: string): string {
  if (!cityName || !countryName) return "";
  const key = `${cityName.toLowerCase()}::${countryName.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key)!;

  const allCountries = Country.getAllCountries();
  const country = allCountries.find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (!country) {
    cache.set(key, "");
    return "";
  }

  const cities = City.getCitiesOfCountry(country.isoCode) || [];
  const match = cities.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  if (!match) {
    cache.set(key, "");
    return "";
  }

  const state = State.getStateByCodeAndCountry(match.stateCode, country.isoCode);
  const regionName = state?.name || "";
  cache.set(key, regionName);
  return regionName;
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") || "";
  const country = req.nextUrl.searchParams.get("country") || "";

  if (!city && !country) {
    return NextResponse.json({ formatted: "" });
  }
  if (!city) {
    return NextResponse.json({ formatted: country });
  }
  if (!country) {
    return NextResponse.json({ formatted: city });
  }

  const region = getRegionForCity(city, country);
  
  let formatted: string;
  if (region && region !== city && region !== country) {
    if (region.toLowerCase().includes(country.toLowerCase())) {
      formatted = `${city}, ${region}`;
    } else {
      formatted = `${city}, ${region}, ${country}`;
    }
  } else {
    formatted = `${city}, ${country}`;
  }

  return NextResponse.json({ formatted, region });
}
