import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { City } from "country-state-city";

export const dynamic = "force-dynamic";

/**
 * Search cities globally or within a country
 * Uses geonames_cities DB first, falls back to country-state-city package
 *
 * GET /api/geo/search?q=silkeborg
 * GET /api/geo/search?q=silke&country=DK
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const countryCode = searchParams.get("country")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (query.length < 2) {
    return NextResponse.json({ results: [], message: "Query must be at least 2 characters" });
  }

  try {
    const supabase = createServerClient();

    // ── 1. Search geonames_cities (DB) ─────────────────────────────────
    let queryBuilder = supabase
      .from("geonames_cities")
      .select("geoname_id, name, ascii_name, country_code, admin1_name, latitude, longitude, population, is_major_city")
      .or(`ascii_name.ilike.${query}%,name.ilike.${query}%`)
      .order("population", { ascending: false })
      .limit(limit);

    if (countryCode) {
      queryBuilder = queryBuilder.eq("country_code", countryCode);
    }

    const { data: geoData, error } = await queryBuilder;

    if (error) {
      console.error("[Geo Search] DB Error:", error);
    }

    const dbResults: any[] = geoData || [];

    // ── 2. Fallback: country-state-city package ────────────────────────
    // Use when DB has no results OR when fewer than 5 results
    let cscResults: any[] = [];

    if (dbResults.length < 5) {
      const q = query.toLowerCase();
      const countryCodes = countryCode ? [countryCode] : null;

      // If country specified, search only that country
      if (countryCodes) {
        const cities = City.getCitiesOfCountry(countryCode!) || [];
        cscResults = cities
          .filter(c => c.name.toLowerCase().startsWith(q))
          .slice(0, limit - dbResults.length)
          .map(c => ({
            geoname_id: null,
            name: c.name,
            ascii_name: c.name,
            country_code: c.countryCode,
            admin1_name: "",
            latitude: parseFloat(c.latitude || "0"),
            longitude: parseFloat(c.longitude || "0"),
            population: 0,
            is_major_city: false,
            source: "csc",
          }));
      } else {
        // Global search: try all countries (expensive, limit results)
        // Use country-state-city global search
        const allCountryCodes = ["DK","SE","NO","DE","GB","FR","ES","IT","NL","PL","PT","CZ","RO","HU","AT","BE","CH","GR","TR","UA","RU","US","CA","AU","NZ","BR","MX","AR","CO","TH","JP","KR","CN","IN","PH","ID","MY","SG","VN","AE","SA","EG","MA","ZA","NG"];
        for (const cc of allCountryCodes) {
          if (cscResults.length >= 15) break;
          const cities = City.getCitiesOfCountry(cc) || [];
          const matches = cities
            .filter(c => c.name.toLowerCase().startsWith(q))
            .slice(0, 3)
            .map(c => ({
              geoname_id: null,
              name: c.name,
              ascii_name: c.name,
              country_code: c.countryCode,
              admin1_name: "",
              latitude: parseFloat(c.latitude || "0"),
              longitude: parseFloat(c.longitude || "0"),
              population: 0,
              is_major_city: false,
              source: "csc",
            }));
          cscResults.push(...matches);
        }
      }
    }

    // ── 3. Merge, deduplicate, sort ────────────────────────────────────
    const seen = new Set<string>();
    const merged: any[] = [];

    for (const r of [...dbResults, ...cscResults]) {
      const key = `${r.name.toLowerCase()}-${r.country_code}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(r);
      }
    }

    // Sort: exact match → population → alphabetical
    merged.sort((a, b) => {
      const aExact = a.ascii_name?.toLowerCase() === query.toLowerCase() || a.name?.toLowerCase() === query.toLowerCase();
      const bExact = b.ascii_name?.toLowerCase() === query.toLowerCase() || b.name?.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      if (a.is_major_city && !b.is_major_city) return -1;
      if (b.is_major_city && !a.is_major_city) return 1;
      if (b.population !== a.population) return b.population - a.population;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      results: merged.slice(0, limit),
      query,
      country: countryCode || null,
    });
  } catch (err) {
    console.error("[Geo Search] Exception:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
