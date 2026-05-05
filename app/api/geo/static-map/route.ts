import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

/**
 * GET /api/geo/static-map
 * Returns a clean Google Static Map (no markers - we overlay profile image)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const zoom = searchParams.get("zoom") || "14";
  const width = searchParams.get("width") || "600";
  const height = searchParams.get("height") || "200";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.redirect(`https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Map`);
  }

  // Google Static Maps - clean style, no markers
  const mapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
  mapUrl.searchParams.set("center", `${lat},${lng}`);
  mapUrl.searchParams.set("zoom", zoom);
  mapUrl.searchParams.set("size", `${width}x${height}`);
  mapUrl.searchParams.set("scale", "2");
  mapUrl.searchParams.set("maptype", "roadmap");
  mapUrl.searchParams.set("key", GOOGLE_API_KEY);
  
  // Clean style - hide POI icons, transit, keep roads/labels
  mapUrl.searchParams.append("style", "feature:poi|visibility:off");
  mapUrl.searchParams.append("style", "feature:transit|visibility:off");

  try {
    const res = await fetch(mapUrl.toString());
    
    if (!res.ok) {
      console.error("Google Maps error:", res.status);
      return NextResponse.redirect(`https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Map`);
    }

    const imageBuffer = await res.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Static Map error:", error);
    return NextResponse.redirect(`https://via.placeholder.com/${width}x${height}/f0f0f0/999?text=Map`);
  }
}
