"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

interface PremiumListing {
  id: string
  title: string
  profile_image: string | null
  video_url: string | null
  age: number
  city: string | null
  location: string
  premium_tier: string | null
}

const MOCK_LISTINGS: PremiumListing[] = [
  { id: "1", title: "Sofia", profile_image: "https://picsum.photos/300/400?random=10", video_url: null, age: 24, city: "Copenhagen", location: "Copenhagen", premium_tier: "featured" },
  { id: "2", title: "Jessica", profile_image: "https://picsum.photos/300/400?random=50", video_url: null, age: 26, city: "New York", location: "New York", premium_tier: "vip" },
  { id: "3", title: "Charlotte", profile_image: "https://picsum.photos/300/400?random=53", video_url: null, age: 28, city: "London", location: "London", premium_tier: "featured" },
  { id: "4", title: "Emma", profile_image: "https://picsum.photos/300/400?random=59", video_url: null, age: 25, city: "Sydney", location: "Sydney", premium_tier: "basic" },
]

function tierBadge(tier: string | null | undefined) {
  if (!tier) return null
  const map: Record<string, { label: string; cls: string }> = {
    vip: { label: "VIP", cls: "bg-black text-yellow-400 border border-yellow-400/50" },
    featured: { label: "FEATURED", cls: "bg-black text-gray-300 border border-gray-600/50" },
    basic: { label: "PREMIUM", cls: "bg-black/80 text-yellow-500 border border-yellow-500/40" },
  }
  const b = map[tier]
  if (!b) return null
  return (
    <span className={`absolute left-2.5 top-2.5 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${b.cls}`}>
      {b.label}
    </span>
  )
}

export default function PremiumCarousel() {
  const [listings, setListings] = useState<PremiumListing[]>(MOCK_LISTINGS)
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, city, location, premium_tier")
      .eq("status", "active")
      .not("premium_tier", "is", null)
      .limit(12)
      .then(({ data }) => {
        if (data && data.length > 0) setListings(data as PremiumListing[])
      })
  }, [])

  useEffect(() => {
    if (hovered) return
    const t = setInterval(() => setIndex(p => (p + 1) % listings.length), 4000)
    return () => clearInterval(t)
  }, [hovered, listings.length])

  const VISIBLE = 4
  const visible = Array.from({ length: Math.min(VISIBLE, listings.length) }, (_, i) =>
    listings[(index + i) % listings.length]
  )

  const prev = () => setIndex(p => (p - 1 + listings.length) % listings.length)
  const next = () => setIndex(p => (p + 1) % listings.length)

  return (
    <section className="py-8 bg-[#F5F5F7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Premium annoncer</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top verified members</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 text-sm font-bold">←</button>
            <button onClick={next} className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 text-sm font-bold">→</button>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {visible.map((listing, i) => (
            <Link href={`/annoncer/${listing.id}`} key={`${listing.id}-${index}-${i}`}>
              <div className="relative overflow-hidden rounded-xl group cursor-pointer" style={{ height: "200px" }}>
                {listing.video_url ? (
                  <video src={listing.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : listing.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.profile_image} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center"><span className="text-3xl text-gray-400">👤</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                {tierBadge(listing.premium_tier)}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-semibold text-sm leading-tight">{listing.title}{listing.age ? `, ${listing.age}` : ""}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{listing.city || listing.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-4">
          {listings.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${i === index % listings.length ? "w-6 h-1.5 bg-gray-900" : "w-1.5 h-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
