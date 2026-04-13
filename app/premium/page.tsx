"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Crown } from "lucide-react"
import Navbar from "@/components/Navbar"
import AdCardGrid from "@/components/AdCardGrid"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"

const GENDERS = ["All", "Woman", "Man", "Trans", "Couple"]
const TIERS = [
  { value: "",      label: "All Premium" },
  { value: "vip",   label: "VIP" },
  { value: "basic", label: "Basic" },
]

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

export default function PremiumProfilesPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [gender, setGender] = useState("All")
  const [country, setCountry] = useState("")
  const [tier, setTier] = useState("")

  useEffect(() => { fetchListings() }, [gender, country, tier])

  const fetchListings = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("listings")
      .select("id, title, display_name, profile_image, images, profile_video_url, age, gender, category, country, city, location, premium_tier, opening_hours, timezone, created_at, social_links, onlyfans_username")
      .not("premium_tier", "is", null)
      .eq("status", "active")

    if (gender !== "All") query = query.ilike("gender", gender)
    if (country) query = query.eq("country", country)
    if (tier) query = query.eq("premium_tier", tier)

    const { data } = await query.limit(200)

    const sorted = (data || []).sort((a, b) => {
      const order: Record<string, number> = { vip: 0, basic: 1 }
      return (order[a.premium_tier ?? ""] ?? 2) - (order[b.premium_tier ?? ""] ?? 2)
    })
    setListings(sorted as Listing[])
    setLoading(false)
  }

  const countryOptions = [
    { code: "", name: "All Countries" },
    ...SUPPORTED_COUNTRIES.map(c => ({ code: c.code, name: c.name }))
  ]

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Premium Profiles</h1>
                <p className="text-sm text-gray-500">Verified premium members worldwide</p>
              </div>
            </div>
            {!loading && (
              <span className="text-sm text-gray-500">{listings.length} profiles</span>
            )}
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-5 flex items-center gap-2 overflow-x-auto flex-nowrap">
            {TIERS.map(t => (
              <button
                key={t.value}
                onClick={() => setTier(t.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  tier === t.value
                    ? t.value === "vip"
                      ? "bg-yellow-400 text-gray-900 border-yellow-400"
                      : t.value === "basic"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t.value === "vip" && <Crown className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            ))}

            <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />

            {GENDERS.map(g => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  gender === g
                    ? "bg-gray-100 text-gray-900 border-gray-400"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {g}
              </button>
            ))}

            <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />

            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="flex-shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm bg-white focus:outline-none focus:border-red-500 text-gray-600 font-semibold cursor-pointer"
            >
              {countryOptions.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {(gender !== "All" || country || tier) && (
              <button
                onClick={() => { setGender("All"); setCountry(""); setTier("") }}
                className="flex-shrink-0 text-xs text-red-600 font-bold hover:underline px-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">No premium profiles found</h2>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
              {(gender !== "All" || country || tier) && (
                <button onClick={() => { setGender("All"); setCountry(""); setTier("") }} className="mt-4 text-sm text-red-600 font-semibold hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8">
              {listings.map((ad, i) => (
                <AdCardGrid
                  key={ad.id}
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
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
