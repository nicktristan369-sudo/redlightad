import { NextRequest, NextResponse } from "next/server"
import { City, State } from "country-state-city"

export const dynamic = "force-dynamic"

/**
 * Search cities worldwide using Nominatim (OpenStreetMap) + country-state-city fallback
 * No API key required
 *
 * GET /api/geo/cities?q=silkeborg&country=DK
 * GET /api/geo/cities?q=malaga (global search)
 * GET /api/geo/cities?country=DK (list popular cities in country)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("q") || "").trim()
  const countryCode = (searchParams.get("country") || "").toUpperCase()
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50)

  try {
    // ── If no query, return popular cities for country ─────────────────
    if (!query && countryCode) {
      const cities = City.getCitiesOfCountry(countryCode) || []
      const states = State.getStatesOfCountry(countryCode)
      
      // Sort by name, dedupe
      const seen = new Set<string>()
      const results = cities
        .filter(c => {
          const key = c.name.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, limit)
        .map(c => {
          const state = states.find(s => s.isoCode === c.stateCode)
          return {
            name: c.name,
            admin1_name: state?.name || "",
            country_code: c.countryCode,
            latitude: parseFloat(c.latitude || "0"),
            longitude: parseFloat(c.longitude || "0"),
            is_major_city: false,
          }
        })

      return NextResponse.json({ results, source: "csc" })
    }

    if (query.length < 2) {
      return NextResponse.json({ results: [], message: "Query must be at least 2 characters" })
    }

    // ── 1. Search via Nominatim (OpenStreetMap) ────────────────────────
    const cc = countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : ""
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&featuretype=city${cc}`

    const nominatimRes = await fetch(nominatimUrl, {
      headers: { "User-Agent": "RedLightAd/1.0 (contact@redlightad.com)" },
      next: { revalidate: 3600 },
    })

    let nominatimResults: any[] = []
    if (nominatimRes.ok) {
      const data = await nominatimRes.json()
      nominatimResults = (data || [])
        .filter((d: any) => d.address && (d.address.city || d.address.town || d.address.village || d.address.municipality))
        .map((d: any) => {
          const addr = d.address
          const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || ""
          return {
            name: cityName,
            admin1_name: addr.state || addr.county || "",
            country_code: (addr.country_code || "").toUpperCase(),
            latitude: parseFloat(d.lat),
            longitude: parseFloat(d.lon),
            postal_code: addr.postcode || null,
            is_major_city: false,
            source: "nominatim",
          }
        })
        .filter((r: any) => r.name)
    }

    // ── 2. Fallback: country-state-city package ────────────────────────
    let cscResults: any[] = []
    const q = query.toLowerCase()

    if (countryCode) {
      const cities = City.getCitiesOfCountry(countryCode) || []
      const states = State.getStatesOfCountry(countryCode)
      cscResults = cities
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, limit)
        .map(c => {
          const state = states.find(s => s.isoCode === c.stateCode)
          return {
            name: c.name,
            admin1_name: state?.name || "",
            country_code: c.countryCode,
            latitude: parseFloat(c.latitude || "0"),
            longitude: parseFloat(c.longitude || "0"),
            is_major_city: false,
            source: "csc",
          }
        })
    } else {
      // Global search across popular countries
      const popularCountries = ["DK","SE","NO","DE","GB","FR","ES","IT","NL","PL","PT","CZ","RO","HU","AT","BE","CH","GR","TR","UA","RU","US","CA","AU","NZ","BR","MX","AR","CO","TH","JP","KR","CN","IN","PH","ID","MY","SG","VN","AE","SA","EG","MA","ZA","NG"]
      for (const cc of popularCountries) {
        if (cscResults.length >= 20) break
        const cities = City.getCitiesOfCountry(cc) || []
        const matches = cities
          .filter(c => c.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map(c => ({
            name: c.name,
            admin1_name: "",
            country_code: c.countryCode,
            latitude: parseFloat(c.latitude || "0"),
            longitude: parseFloat(c.longitude || "0"),
            is_major_city: false,
            source: "csc",
          }))
        cscResults.push(...matches)
      }
    }

    // ── 3. Merge & dedupe ──────────────────────────────────────────────
    const seen = new Set<string>()
    const merged: any[] = []

    // Nominatim first (more accurate coordinates)
    for (const r of nominatimResults) {
      const key = `${r.name.toLowerCase()}-${r.country_code}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(r)
      }
    }

    // Then CSC fallback
    for (const r of cscResults) {
      const key = `${r.name.toLowerCase()}-${r.country_code}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(r)
      }
    }

    // Sort: exact match first, then alphabetical
    merged.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q
      const bExact = b.name.toLowerCase() === q
      if (aExact && !bExact) return -1
      if (bExact && !aExact) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      results: merged.slice(0, limit),
      query,
      country: countryCode || null,
    })
  } catch (err) {
    console.error("[Geo Cities] Error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
