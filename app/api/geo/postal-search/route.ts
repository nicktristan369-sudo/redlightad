import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Search cities by postal code via Nominatim
 * GET /api/geo/postal-search?postal=8600&country=DK
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postal = searchParams.get("postal")?.trim() || ""
  const country = searchParams.get("country")?.toLowerCase() || ""

  if (!postal || postal.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const cc = country ? `&countrycodes=${country}` : ""
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postal)}${cc}&format=json&limit=10&addressdetails=1`

    const res = await fetch(url, {
      headers: { "User-Agent": "RedLightAd/1.0 (contact@redlightad.com)" },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ results: [] })

    const data: any[] = await res.json()

    const results = data
      .filter(d => d.address)
      .map(d => {
        const addr = d.address
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.municipality ||
          addr.county ||
          ""
        const region = addr.state || addr.county || ""
        const countryCode = (addr.country_code || "").toUpperCase()
        const postcode = addr.postcode || postal

        return {
          name: city,
          ascii_name: city,
          admin1_name: region,
          country_code: countryCode,
          latitude: parseFloat(d.lat),
          longitude: parseFloat(d.lon),
          postal_code: postcode,
          is_major_city: false,
          geoname_id: null,
          population: 0,
        }
      })
      .filter(r => r.name) // remove empty names

    // Deduplicate by name
    const seen = new Set<string>()
    const unique = results.filter(r => {
      const key = r.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ results: unique })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
