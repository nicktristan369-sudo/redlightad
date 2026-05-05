import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get("city") || ""
  const country = searchParams.get("country") || "" // ISO 2-letter
  const lat = searchParams.get("lat") || ""
  const lng = searchParams.get("lng") || ""

  if (!city && (!lat || !lng)) {
    return NextResponse.json({ postal_code: null })
  }

  try {
    let url: string

    // If we have coordinates, use reverse geocoding (more accurate)
    if (lat && lng) {
      url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    } else {
      const q = country ? `${city}&countrycodes=${country.toLowerCase()}` : city
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "RedLightAd/1.0 (contact@redlightad.com)" },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ postal_code: null })

    const data = await res.json()

    // Handle both search (array) and reverse (object)
    const result = Array.isArray(data) ? data[0] : data
    const address = result?.address || {}
    const postal = address.postcode || address.postal_code || null

    return NextResponse.json({ postal_code: postal })
  } catch {
    return NextResponse.json({ postal_code: null })
  }
}
