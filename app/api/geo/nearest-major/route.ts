import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/**
 * Find nearest major city based on coordinates
 * Uses Haversine formula in the database function
 * 
 * GET /api/geo/nearest-major?lat=36.56&lng=-4.85&country=ES
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const countryCode = searchParams.get("country")?.toUpperCase();

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ 
      error: "Valid lat and lng required",
      example: "/api/geo/nearest-major?lat=36.56&lng=-4.85&country=ES"
    }, { status: 400 });
  }

  if (!countryCode) {
    return NextResponse.json({ 
      error: "Country code required",
    }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    
    // Try to use the database function first
    const { data: funcResult, error: funcError } = await supabase
      .rpc("find_nearest_major_city", {
        p_country_code: countryCode,
        p_lat: lat,
        p_lon: lng,
      });

    if (!funcError && funcResult && funcResult.length > 0) {
      // Get full city details
      const { data: cityData } = await supabase
        .from("geonames_cities")
        .select("*")
        .eq("geoname_id", funcResult[0].geoname_id)
        .single();

      return NextResponse.json({
        major_city: cityData,
        distance_km: Math.round(funcResult[0].distance_km * 10) / 10,
        source: "database_function",
      });
    }

    // Fallback: Calculate in JavaScript if function fails
    const { data: majorCities, error } = await supabase
      .from("geonames_cities")
      .select("geoname_id, name, ascii_name, admin1_name, latitude, longitude, population")
      .eq("country_code", countryCode)
      .eq("is_major_city", true);

    if (error || !majorCities || majorCities.length === 0) {
      return NextResponse.json({ 
        error: "No major cities found for country",
        country: countryCode,
      }, { status: 404 });
    }

    // Haversine formula
    const toRad = (deg: number) => deg * Math.PI / 180;
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + 
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Find nearest
    let nearest = majorCities[0];
    let minDist = haversine(lat, lng, nearest.latitude, nearest.longitude);

    for (const city of majorCities.slice(1)) {
      const dist = haversine(lat, lng, city.latitude, city.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }

    return NextResponse.json({
      major_city: nearest,
      distance_km: Math.round(minDist * 10) / 10,
      source: "javascript_fallback",
    });
  } catch (err) {
    console.error("[Nearest Major] Exception:", err);
    return NextResponse.json({ error: "Failed to find nearest major city" }, { status: 500 });
  }
}
