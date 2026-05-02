import { NextRequest, NextResponse } from "next/server";

// Support multiple env var names for Google API key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

/**
 * GET /api/geo/static-map
 * Proxies Google Static Maps API to hide API key from client
 * 
 * Query params:
 * - lat: Latitude
 * - lng: Longitude  
 * - zoom: Zoom level (default 15)
 * - size: Map size (default 400x150)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const zoom = searchParams.get("zoom") || "15";
  const size = searchParams.get("size") || "400x150";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    // Return a placeholder image if no API key
    return NextResponse.redirect("https://via.placeholder.com/400x150?text=Map+unavailable");
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:red%7C${lat},${lng}&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(mapUrl);
    
    if (!res.ok) {
      return NextResponse.redirect("https://via.placeholder.com/400x150?text=Map+unavailable");
    }

    const imageBuffer = await res.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Static Map error:", error);
    return NextResponse.redirect("https://via.placeholder.com/400x150?text=Map+unavailable");
  }
}
