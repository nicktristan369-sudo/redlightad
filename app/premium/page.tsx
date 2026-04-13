"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Crown, Filter } from "lucide-react"
import Navbar from "@/components/Navbar"
import AdCard from "@/components/AdCard"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"

const GENDERS = ["All", "Woman", "Man", "Trans", "Couple"]
const TIERS = [
  { value: "", label: "All Premium" },
  { value: "vip", label: "VIP" },
  { value: "basic", label: "Basic" },
]

export default function PremiumProfilesPage() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [gender, setGender] = useState("All")
  const [country, setCountry] = useState("")
  const [tier, setTier] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [gender, country, tier])

  const fetchListings = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("listings")
      .select("id, title, profile_image, about, age, gender, category, country, city, location, languages, premium_tier, voice_message_url, status")
      .not("premium_tier", "is", null)
      .eq("status", "active")
      .order("premium_tier", { ascending: false }) // vip before basic

    if (gender !== "All") query = query.ilike("gender", gender)
    if (country) query = query.eq("country", country)
    if (tier) query = query.eq("premium_tier", tier)

    const { data } = await query.limit(100)
    // Sort: VIP first, then basic
    const sorted = (data || []).sort((a, b) => {
      const order: Record<string, number> = { vip: 0, basic: 1 }
      return (order[a.premium_tier as string] ?? 2) - (order[b.premium_tier as string] ?? 2)
    })
    setListings(sorted)
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
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Premium Profiles</h1>
                </div>
                <p className="text-gray-500">Verified premium members worldwide</p>
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(gender !== "All" || country || tier) && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {[gender !== "All", country, tier].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Gender */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Gender</label>
                    <div className="flex flex-wrap gap-2">
                      {GENDERS.map(g => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            gender === g
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tier */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tier</label>
                    <div className="flex gap-2">
                      {TIERS.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setTier(t.value)}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            tier === t.value
                              ? t.value === "vip"
                                ? "bg-yellow-400 text-gray-900"
                                : t.value === "basic"
                                ? "bg-red-600 text-white"
                                : "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Country</label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-500"
                    >
                      {countryOptions.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset */}
                {(gender !== "All" || country || tier) && (
                  <button
                    onClick={() => { setGender("All"); setCountry(""); setTier("") }}
                    className="mt-4 text-xs text-red-600 font-semibold hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Tier tabs — quick filter */}
            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
              <button onClick={() => setTier("")} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${!tier ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                All Premium
              </button>
              <button onClick={() => setTier("vip")} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${tier === "vip" ? "bg-yellow-400 text-gray-900 border-yellow-400" : "bg-white text-gray-600 border-gray-200 hover:border-yellow-300"}`}>
                <Crown className="w-3.5 h-3.5" /> VIP
              </button>
              <button onClick={() => setTier("basic")} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${tier === "basic" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-600 border-gray-200 hover:border-red-300"}`}>
                Basic
              </button>
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
              {GENDERS.map(g => (
                <button key={g} onClick={() => setGender(g)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${gender === g ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                  {g}
                </button>
              ))}
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-sm text-gray-500 mb-4">
                {listings.length} premium {listings.length === 1 ? "profile" : "profiles"} found
                {country && ` in ${countryOptions.find(c => c.code === country)?.name}`}
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No premium profiles found</h2>
                <p className="text-gray-500">Try adjusting your filters</p>
                {(gender !== "All" || country || tier) && (
                  <button
                    onClick={() => { setGender("All"); setCountry(""); setTier("") }}
                    className="mt-4 text-sm text-red-600 font-semibold hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((ad) => (
                  <div key={ad.id as string} className="relative">
                    {/* Badge */}
                    <div className={`absolute top-3 left-3 z-20 flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                      ad.premium_tier === "vip"
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-red-600 text-white"
                    }`}>
                      <Crown className="w-3 h-3" />
                      {ad.premium_tier === "vip" ? "VIP" : "Basic"}
                    </div>
                    <AdCard
                      id={ad.id as number}
                      title={ad.title as string}
                      image={ad.profile_image as string || "/placeholder.jpg"}
                      verified={true}
                      description={ad.about as string || ""}
                      hasVoice={!!(ad.voice_message_url)}
                      age={ad.age as number || 0}
                      gender={ad.gender as string || ""}
                      category={ad.category as string || ""}
                      country={ad.country as string}
                      city={ad.city as string}
                      location={ad.location as string}
                      language={(ad.languages as string[])?.[0] || ""}
                      premium_tier={ad.premium_tier as string}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
