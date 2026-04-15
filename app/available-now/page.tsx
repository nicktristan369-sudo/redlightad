"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import AdCardGrid from "@/components/AdCardGrid"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"

const GENDERS = ["All", "Woman", "Man", "Trans", "Couple"]

type Listing = {
  id: string
  title: string
  display_name: string | null
  profile_image: string | null
  images: string[] | null
  profile_video_url: string | null
  age: number | null
  gender: string | null
  category: string | null
  country: string | null
  city: string | null
  location: string | null
  premium_tier: string | null
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone: string | null
  created_at: string
  social_links: Record<string, { url?: string }> | null
  onlyfans_username: string | null
}

function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null | undefined,
  tz: string | null | undefined
): boolean {
  if (!hours || !tz) return false
  try {
    const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(new Date()).toLowerCase()
    const h = hours[day]
    if (!h || h.closed) return false
    const now = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
    const [ch, cm] = now.split(":").map(Number)
    const [oh, om] = h.open.split(":").map(Number)
    const [clh, clm] = h.close.split(":").map(Number)
    return (ch * 60 + cm) >= (oh * 60 + om) && (ch * 60 + cm) < (clh * 60 + clm)
  } catch { return false }
}

export default function AvailableNowPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [gender, setGender] = useState("All")
  const [country, setCountry] = useState("")
  const [now, setNow] = useState(new Date())

  // Refresh time every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { fetchListings() }, [gender, country])

  const fetchListings = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("listings")
      .select("id, title, display_name, profile_image, images, profile_video_url, age, gender, category, country, city, location, premium_tier, opening_hours, timezone, created_at, social_links, onlyfans_username")
      .eq("status", "active")
      .not("opening_hours", "is", null)

    if (gender !== "All") query = query.ilike("gender", gender)
    if (country) query = query.eq("country", country)

    const { data } = await query.limit(200)

    // Filter to only those available now
    const available = (data || []).filter(l =>
      isAvailableNow(l.opening_hours, l.timezone)
    )

    // VIP first
    available.sort((a, b) => {
      const order: Record<string, number> = { vip: 0, basic: 1 }
      return (order[a.premium_tier ?? ""] ?? 2) - (order[b.premium_tier ?? ""] ?? 2)
    })

    setListings(available as Listing[])
    setLoading(false)
  }

  const countryOptions = [
    { code: "", name: "All Countries" },
    ...SUPPORTED_COUNTRIES.map(c => ({ code: c.code, name: c.name }))
  ]

  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="relative flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-widest">Live</span>
                  </div>
                  <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Available Now</h1>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Profiles available at this moment · {timeStr}</p>
              </div>
              {!loading && (
                <span className="text-sm text-gray-400 font-medium">{listings.length} profiles</span>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
              {GENDERS.map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    gender === g
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {g}
                </button>
              ))}

              <div className="ml-auto flex-shrink-0 flex items-center gap-3 pb-1">
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="text-sm text-gray-600 font-medium bg-transparent border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  {countryOptions.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                {(gender !== "All" || country) && (
                  <button onClick={() => { setGender("All"); setCountry("") }} className="text-xs text-red-600 font-semibold hover:underline">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-300"></span>
                </span>
                <span className="text-sm text-gray-400">No profiles available right now</span>
              </div>
              <p className="text-xs text-gray-400">Check back soon — profiles update in real time</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8">
              {listings.map((ad, i) => (
                <div key={ad.id} className="relative">
                  {/* Available now dot on card */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                    </span>
                    <span className="text-[10px] font-bold text-white tracking-wide">NOW</span>
                  </div>
                  <AdCardGrid
                    id={ad.id}
                    title={ad.title}
                    display_name={ad.display_name}
                    image={ad.profile_image || "/placeholder.jpg"}
                    images={ad.images}
                    profileVideoUrl={ad.profile_video_url}
                    verified={true}
                    age={ad.age}
                    city={ad.city}
                    country={ad.country}
                    location={ad.location || ""}
                    category={ad.category || ""}
                    created_at={ad.created_at}
                    opening_hours={ad.opening_hours}
                    timezone={ad.timezone}
                    premium_tier={ad.premium_tier}
                    social_links={ad.social_links}
                    onlyfans_username={ad.onlyfans_username}
                    staggerDelay={i * 30}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
