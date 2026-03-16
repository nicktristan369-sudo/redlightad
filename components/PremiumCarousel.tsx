"use client"
import { useState, useEffect, useRef, useCallback } from "react"
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
  { id: "9", title: "Nina", profile_image: "https://picsum.photos/200/320?random=91", video_url: null, age: 24, city: "Stockholm", location: "Stockholm", country: "Sweden", premium_tier: "vip", about: "Sophisticated and elegant", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
  { id: "10", title: "Isabella", profile_image: "https://picsum.photos/200/320?random=94", video_url: null, age: 26, city: "Singapore", location: "Singapore", country: "Singapore", premium_tier: "featured", about: "Top rated companion", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: "11", title: "Camille", profile_image: "https://picsum.photos/200/320?random=97", video_url: null, age: 25, city: "Zurich", location: "Zurich", country: "Switzerland", premium_tier: "vip", about: "Discreet and refined", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: "12", title: "Ariana", profile_image: "https://picsum.photos/200/320?random=99", video_url: null, age: 23, city: "Tokyo", location: "Tokyo", country: "Japan", premium_tier: "featured", about: "Exotic and enchanting", images: ["x"], opening_hours: null, timezone: null, created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
]

const VISIBLE_COUNT = 6

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null,
  tz: string | null
): boolean {
  if (!hours || !tz) return false
  try {
    const dayName = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(new Date()).toLowerCase()
    const day = hours[dayName]
    if (!day || day.closed) return false
    const nowStr = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
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
  const [offset, setOffset] = useState(0)
  const [fading, setFading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const rotate = useCallback(() => {
    if (listings.length <= VISIBLE_COUNT) return
    setFading(true)
    setTimeout(() => {
      setOffset(prev => {
        const next = prev + VISIBLE_COUNT
        // wrap cleanly to a multiple of VISIBLE_COUNT so first card is always fully visible
        return next >= listings.length ? 0 : next
      })
      setFading(false)
    }, 300)
  }, [listings.length])

  useEffect(() => {
    if (hovered || listings.length <= VISIBLE_COUNT) return
    timerRef.current = setInterval(rotate, 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hovered, rotate, listings.length])

  const manualNav = (dir: "prev" | "next") => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFading(true)
    setTimeout(() => {
      setOffset(prev => {
        const step = VISIBLE_COUNT
        if (dir === "next") {
          const next = prev + step
          return next >= listings.length ? 0 : next
        } else {
          const prev2 = prev - step
          // snap back to last clean page
          const pages = Math.ceil(listings.length / VISIBLE_COUNT)
          return prev2 < 0 ? (pages - 1) * VISIBLE_COUNT : prev2
        }
      })
      setFading(false)
    }, 200)
  }

  const visible = Array.from({ length: Math.min(VISIBLE_COUNT, listings.length) }, (_, i) =>
    listings[(offset + i) % listings.length]
  )

  if (listings.length === 0) return null

  return (
    <section className={`${bgClass} pt-5 pb-5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => manualNav("prev")}
            className="w-9 h-9 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center text-white transition-colors shadow-sm"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => manualNav("next")}
            className="w-9 h-9 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center text-white transition-colors shadow-sm"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        className={`flex gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
        style={{ scrollbarWidth: "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {visible.map((l) => {
          const available = isAvailableNow(l.opening_hours, l.timezone)
          const hasPhotos = (l.images && l.images.length > 0) || !!l.profile_image
          const ago = timeAgo(l.created_at)
          const isVip = l.premium_tier === "vip"
          const isFeatured = l.premium_tier === "featured"

          return (
            <Link href={`/annoncer/${l.id}`} key={l.id} className="flex-shrink-0" style={{ width: "200px" }}>
              <div className="relative overflow-hidden cursor-pointer" style={{ width: "200px", height: "300px" }}>
                {/* Image */}
                {l.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.profile_image} alt={l.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
                )}

                {/* Ribbon badge */}
                {(isVip || isFeatured) && (
                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "72px", height: "72px" }}>
                    <div
                      className={`absolute text-center text-[9px] font-black tracking-widest py-1 ${isVip ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-200"}`}
                      style={{ width: "96px", top: "18px", left: "-24px", transform: "rotate(-45deg)" }}
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

                {/* Available Now */}
                {available && (
                  <div className="absolute left-0 right-0 flex items-center gap-1.5 px-2 py-1" style={{ bottom: "86px", backgroundColor: "#00C853" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                    <span className="text-white text-[10px] font-bold tracking-wide">Available Now</span>
                  </div>
                )}

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 pt-6 pb-2.5">
                  <p className="text-white text-xs font-black tracking-wider uppercase leading-tight truncate">
                    {l.title.toUpperCase()}
                  </p>
                  <p className="text-gray-400 text-[10px] leading-tight truncate mt-0.5">
                    {[l.city, l.country].filter(Boolean).join(", ").toUpperCase()}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-1">{ago}</p>
                  {l.about && (
                    <p className="text-gray-400 text-[10px] mt-0.5 leading-tight line-clamp-1">{l.about}</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      </div>
    </section>
  )
}
