import { NextRequest, NextResponse } from "next/server";

// Support multiple env var names for Google API key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json({ error: "place_id required" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Google Places API not configured" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_API_KEY,
      fields: "geometry,formatted_address,address_components,name",
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    const data = await res.json();

    if (data.status === "OK") {
      return NextResponse.json({ result: data.result });
    }

    return NextResponse.json({ error: data.error_message || "Google API error" }, { status: 500 });
  } catch (error) {
    console.error("Place Details error:", error);
    return NextResponse.json({ error: "Failed to fetch place details" }, { status: 500 });
  }
}
