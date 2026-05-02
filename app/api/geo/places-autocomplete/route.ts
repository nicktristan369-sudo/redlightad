import { NextRequest, NextResponse } from "next/server";

// Support multiple env var names for Google API key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");
  const types = searchParams.get("types") || "geocode";
  const country = searchParams.get("country");

  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Google Places API not configured" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      input,
      key: GOOGLE_API_KEY,
      types,
    });

    // Restrict to specific country if provided
    if (country) {
      params.append("components", `country:${country}`);
    }

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    const data = await res.json();

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      return NextResponse.json({ predictions: data.predictions || [] });
    }

    return NextResponse.json({ error: data.error_message || "Google API error" }, { status: 500 });
  } catch (error) {
    console.error("Places Autocomplete error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
