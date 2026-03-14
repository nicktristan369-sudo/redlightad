"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

interface PremiumListing {
  id: string
  title: string
  profile_image: string | null
  video_url: string | null
  age: number | null
  city: string | null
  location: string
  country: string | null
  premium_tier: string | null
  about: string | null
  images: string[] | null
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone: string | null
  created_at: string
}

const MOCK_LISTINGS: PremiumListing[] = [
  { id: "1", title: "Sofia", profile_image: "https://picsum.photos/200/320?random=10", video_url: null, age: 24, city: "Copenhagen", location: "Copenhagen", country: "Denmark", premium_tier: "vip", about: "Elegant and discreet companion", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: "2", title: "Jessica", profile_image: "https://picsum.photos/200/320?random=50", video_url: null, age: 26, city: "London", location: "London", country: "UK", premium_tier: "vip", about: "Available for private meetings", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 13 * 60 * 1000).toISOString() },
  { id: "3", title: "Charlotte", profile_image: "https://picsum.photos/200/320?random=53", video_url: null, age: 28, city: "Sydney", location: "Sydney", country: "Australia", premium_tier: "featured", about: "Hi! Fresh young companion", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "4", title: "Amanda", profile_image: "https://picsum.photos/200/320?random=59", video_url: null, age: 25, city: "Paris", location: "Paris", country: "France", premium_tier: "vip", about: "International luxury companion", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
  { id: "5", title: "Valentina", profile_image: "https://picsum.photos/200/320?random=62", video_url: null, age: 27, city: "Dubai", location: "Dubai", country: "UAE", premium_tier: "featured", about: "New in town, book now", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: "6", title: "Anastasia", profile_image: "https://picsum.photos/200/320?random=71", video_url: null, age: 23, city: "Berlin", location: "Berlin", country: "Germany", premium_tier: "vip", about: "Visiting from Moscow", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: "7", title: "Mia", profile_image: "https://picsum.photos/200/320?random=80", video_url: null, age: 22, city: "Amsterdam", location: "Amsterdam", country: "Netherlands", premium_tier: "featured", about: "Sweet and adventurous", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: "8", title: "Elena", profile_image: "https://picsum.photos/200/320?random=88", video_url: null, age: 29, city: "Bangkok", location: "Bangkok", country: "Thailand", premium_tier: "vip", about: "Luxury experience guaranteed", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
]

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`
  return `${Math.floor(diff / 86400)} days ago`
}

function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null,
  tz: string | null
): boolean {
  if (!hours || !tz) return false
  try {
    const dayName = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
      .format(new Date()).toLowerCase()
    const day = hours[dayName]
    if (!day || day.closed) return false
    const nowStr = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })
      .format(new Date())
    const [ch, cm] = nowStr.split(":").map(Number)
    const cur = ch * 60 + cm
    const [oh, om] = day.open.split(":").map(Number)
    const [clh, clm] = day.close.split(":").map(Number)
    return cur >= oh * 60 + om && cur < clh * 60 + clm
  } catch { return false }
}

interface PremiumCarouselProps {
  title?: string
  subtitle?: string
  excludeId?: string
  bgClass?: string
}

export default function PremiumCarousel({
  title = "Premium Members",
  subtitle = "Top verified members",
  excludeId,
  bgClass = "bg-[#F8F8F8]",
}: PremiumCarouselProps) {
  const [listings, setListings] = useState<PremiumListing[]>(
    excludeId ? MOCK_LISTINGS.filter(l => l.id !== excludeId) : MOCK_LISTINGS
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let query = supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, city, location, country, premium_tier, about, images, opening_hours, timezone, created_at")
      .eq("status", "active")
      .not("premium_tier", "is", null)
      .limit(20)
    if (excludeId) query = query.neq("id", excludeId)
    query.then(({ data }) => { if (data && data.length > 0) setListings(data as PremiumListing[]) })
  }, [excludeId])

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 210 * 3
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" })
  }

  if (listings.length === 0) return null

  return (
    <section className={`py-0 ${bgClass} relative`}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Carousel wrapper */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors text-white text-2xl font-thin opacity-0 group-hover:opacity-100"
          aria-label="Previous"
        >
          ‹
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth px-0"
          style={{ scrollbarWidth: "none" }}
        >
          {listings.map((l) => {
            const available = isAvailableNow(l.opening_hours, l.timezone)
            const hasPhotos = (l.images && l.images.length > 0) || !!l.profile_image
            const ago = timeAgo(l.created_at)
            const isVip = l.premium_tier === "vip"
            const isFeatured = l.premium_tier === "featured"

            return (
              <Link
                href={`/annoncer/${l.id}`}
                key={l.id}
                className="flex-shrink-0"
                style={{ width: "200px" }}
              >
                <div className="relative overflow-hidden cursor-pointer" style={{ width: "200px", height: "320px" }}>
                  {/* Image */}
                  {l.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.profile_image}
                      alt={l.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl text-gray-600">👤</div>
                  )}

                  {/* Ribbon badge — diagonal VIP/FEATURED */}
                  {(isVip || isFeatured) && (
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "72px", height: "72px" }}>
                      <div
                        className={`absolute text-center text-[9px] font-black tracking-widest py-1 ${
                          isVip
                            ? "bg-yellow-500 text-black"
                            : "bg-gray-700 text-gray-200"
                        }`}
                        style={{
                          width: "96px",
                          top: "18px",
                          left: "-24px",
                          transform: "rotate(-45deg)",
                          transformOrigin: "center",
                        }}
                      >
                        {isVip ? "VIP" : "FEAT"}
                      </div>
                    </div>
                  )}

                  {/* Camera icon */}
                  {hasPhotos && (
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full w-6 h-6 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Available Now green bar */}
                  {available && (
                    <div
                      className="absolute left-0 right-0 flex items-center gap-1.5 px-2 py-1"
                      style={{ bottom: "90px", backgroundColor: "#00C853" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                      <span className="text-white text-[10px] font-bold tracking-wide">Available Now</span>
                    </div>
                  )}

                  {/* Bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 pt-6 pb-2.5">
                    {/* Name + location */}
                    <p className="text-white text-xs font-black tracking-wider uppercase leading-tight truncate">
                      {l.title.toUpperCase()}
                    </p>
                    <p className="text-gray-400 text-[10px] leading-tight truncate mt-0.5">
                      {[l.city, l.country].filter(Boolean).join(", ").toUpperCase()}
                    </p>
                    {/* Time ago */}
                    <p className="text-gray-500 text-[10px] mt-1">{ago}</p>
                    {/* About preview */}
                    {l.about && (
                      <p className="text-gray-400 text-[10px] mt-1 leading-tight line-clamp-1">{l.about}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors text-white text-2xl font-thin opacity-0 group-hover:opacity-100"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* Bottom padding */}
      <div className="pb-6" />
    </section>
  )
}
