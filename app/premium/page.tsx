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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Premium Profiles</h1>
                <p className="text-sm text-gray-400 mt-0.5">Verified premium members worldwide</p>
              </div>
              {!loading && (
                <span className="text-sm text-gray-400 font-medium">{listings.length} profiles</span>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
              {/* Tier filters */}
              {TIERS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTier(t.value)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    tier === t.value
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {t.value === "vip" && <Crown className="w-3 h-3" />}
                  {t.label}
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 flex-shrink-0 mx-3" />

              {/* Gender filters */}
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
                {/* Country */}
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="text-sm text-gray-600 font-medium bg-transparent border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  {countryOptions.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>

                {(gender !== "All" || country || tier) && (
                  <button
                    onClick={() => { setGender("All"); setCountry(""); setTier("") }}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
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
