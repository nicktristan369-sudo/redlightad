import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo/static-map
 * Returns a static map image using OpenStreetMap (no branding/logo)
 * 
 * Query params:
 * - lat: Latitude
 * - lng: Longitude  
 * - zoom: Zoom level (default 14)
 * - size: Map size (default 600x280)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const zoom = searchParams.get("zoom") || "14";
  const width = searchParams.get("width") || "600";
  const height = searchParams.get("height") || "280";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Use OpenStreetMap static tiles via staticmap.openstreetmap.de (no logo)
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=osmarenderer`;

  try {
    const res = await fetch(mapUrl, {
      headers: {
        "User-Agent": "RedLightAD/1.0 (contact@redlightad.com)",
      },
    });
    
    if (!res.ok) {
      // Fallback: try alternative OSM static map service
      const fallbackUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${lng},${lat}&zoom=${zoom}&apiKey=demo`;
      const fallbackRes = await fetch(fallbackUrl);
      
      if (!fallbackRes.ok) {
        return NextResponse.redirect(`https://via.placeholder.com/${width}x${height}/f5f5f5/666?text=Map`);
      }
      
      const imageBuffer = await fallbackRes.arrayBuffer();
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
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
    return NextResponse.redirect(`https://via.placeholder.com/${width}x${height}/f5f5f5/666?text=Map`);
  }
}
