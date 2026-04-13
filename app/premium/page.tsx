"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Crown, MapPin, Mic } from "lucide-react"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import Image from "next/image"
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
  profile_image: string | null
  about: string | null
  age: number | null
  gender: string | null
  category: string | null
  country: string | null
  city: string | null
  location: string | null
  languages: string[] | null
  premium_tier: string | null
  voice_message_url: string | null
  display_name: string | null
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
      .select("id, title, profile_image, about, age, gender, category, country, city, location, languages, premium_tier, voice_message_url, display_name")
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-2 overflow-x-auto flex-nowrap">
            {/* Tier */}
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

            {/* Gender */}
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

            {/* Country */}
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="flex-shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm bg-white focus:outline-none focus:border-red-500 text-gray-600 font-semibold cursor-pointer"
            >
              {countryOptions.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* Clear */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {listings.map((ad) => (
                <Link key={ad.id} href={`/ads/${ad.id}`} className="group block">
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">

                    {/* Photo */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                      {ad.profile_image ? (
                        <Image
                          src={ad.profile_image}
                          alt={ad.title || "Profile"}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-3xl">?</span>
                        </div>
                      )}

                      {/* Tier badge */}
                      <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 text-[10px] font-black tracking-widest ${
                        ad.premium_tier === "vip"
                          ? "bg-yellow-400 text-gray-900"
                          : "bg-black text-white"
                      }`}>
                        {ad.premium_tier === "vip" && <Crown className="w-2.5 h-2.5" />}
                        {ad.premium_tier === "vip" ? "VIP" : "PREMIUM"}
                      </div>

                      {/* Voice */}
                      {ad.voice_message_url && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-black/60 flex items-center justify-center">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 pt-2.5 pb-3">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {ad.display_name || ad.title || "Profile"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">
                          {[ad.city, ad.country].filter(Boolean).join(", ") || ad.location || ""}
                        </span>
                        {ad.age && <span className="text-xs text-gray-400 flex-shrink-0">· {ad.age}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-gray-400 capitalize">{ad.category || ""}</span>
                        <span className="text-[11px] text-gray-400 capitalize">{ad.gender || ""}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
