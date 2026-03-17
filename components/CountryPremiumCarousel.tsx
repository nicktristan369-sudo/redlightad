"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { getCountryVariants } from "@/lib/countries"
import Link from "next/link"

interface Listing {
  id: string
  title: string
  profile_image: string | null
  age: number | null
  city: string | null
  location: string
  premium_tier: string | null
}

function tierBadge(tier: string | null) {
  if (!tier) return null
  const map: Record<string, { label: string; cls: string }> = {
    vip: { label: "VIP", cls: "bg-black text-yellow-400 border border-yellow-400/50" },
    featured: { label: "FEATURED", cls: "bg-black text-gray-300 border border-gray-600/50" },
    basic: { label: "PREMIUM", cls: "bg-black/80 text-yellow-500 border border-yellow-500/40" },
    premium: { label: "PREMIUM", cls: "bg-black/80 text-yellow-500 border border-yellow-500/40" },
  }
  const b = map[tier]
  if (!b) return null
  return (
    <span className={`absolute left-2.5 top-2.5 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${b.cls}`}>
      {b.label}
    </span>
  )
}

interface Props {
  country: string
  countryName: string
}

export default function CountryPremiumCarousel({ country, countryName }: Props) {
  const [listings, setListings] = useState<Listing[]>([])
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Match all country variants: dk → ["Denmark","denmark","DK","dk"]
    const countryVariants = getCountryVariants(country)

    supabase
      .from("listings")
      .select("id, title, profile_image, age, city, location, premium_tier, in_carousel")
      .eq("status", "active")
      .in("country", countryVariants)
      .or("premium_tier.in.(vip,featured,basic),in_carousel.eq.true")
      .limit(12)
      .then(({ data, error }) => {
        if (error) {
          // Fallback without in_carousel (migration pending)
          supabase
            .from("listings")
            .select("id, title, profile_image, age, city, location, premium_tier")
            .eq("status", "active")
            .in("country", countryVariants)
            .in("premium_tier", ["vip", "featured", "basic"])
            .limit(12)
            .then(({ data: d2 }) => { if (d2 && d2.length > 0) setListings(d2) })
          return
        }
        if (data && data.length > 0) {
          // Sort: in_carousel pinned first, then vip → featured → basic
          const tierOrder: Record<string, number> = { vip: 1, featured: 2, basic: 3 }
          const sorted = [...data].sort((a, b) => {
            const ac = (a as { in_carousel?: boolean }).in_carousel ? 0 : (tierOrder[a.premium_tier ?? ""] ?? 9)
            const bc = (b as { in_carousel?: boolean }).in_carousel ? 0 : (tierOrder[b.premium_tier ?? ""] ?? 9)
            return ac - bc
          })
          setListings(sorted)
        }
      })
  }, [country])

  useEffect(() => {
    if (hovered || listings.length === 0) return
    const t = setInterval(() => setIndex(p => (p + 1) % listings.length), 4000)
    return () => clearInterval(t)
  }, [hovered, listings.length])

  if (listings.length === 0) return null

  const VISIBLE = 4
  const visible = Array.from({ length: Math.min(VISIBLE, listings.length) }, (_, i) =>
    listings[(index + i) % listings.length]
  )

  return (
    <section className="py-8 bg-[#F5F5F7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Premium in {countryName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top verified members</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIndex(p => (p - 1 + listings.length) % listings.length)} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-sm font-bold">←</button>
            <button onClick={() => setIndex(p => (p + 1) % listings.length)} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-sm font-bold">→</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          {visible.map((l, i) => (
            <Link href={`/annoncer/${l.id}`} key={`${l.id}-${index}-${i}`}>
              <div className="relative overflow-hidden rounded-xl group cursor-pointer h-[200px]">
                {l.profile_image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={l.profile_image} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center bg-gray-100"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                {tierBadge(l.premium_tier)}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-semibold text-sm">{l.title}{l.age ? `, ${l.age}` : ""}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{l.city || l.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mt-4">
          {listings.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${i === index % listings.length ? "w-6 h-1.5 bg-gray-900" : "w-1.5 h-1.5 bg-gray-300"}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
