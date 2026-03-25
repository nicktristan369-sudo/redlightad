"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { getCountryVariants } from "@/lib/countries"
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
  in_carousel?: boolean
}

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
  /** If set, overrides localStorage country — pass ISO code ("dk") or full name ("Denmark") */
  country?: string
}

export default function PremiumCarousel({
  title = "Premium Members",
  subtitle = "Top verified members",
  excludeId,
  bgClass = "bg-[#F8F8F8]",
  country: countryProp,
}: PremiumCarouselProps) {
  const [listings, setListings] = useState<PremiumListing[]>([])
  const [loaded, setLoaded] = useState(false)
  const [localCountry, setLocalCountry] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [fading, setFading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // If country prop is set, use it directly — skip localStorage
  // Otherwise read from localStorage (forside with CountrySelector)
  useEffect(() => {
    if (countryProp) return // prop takes priority, no localStorage needed
    const read = () => {
      try {
        const name = localStorage.getItem("selected_country_name")
        setLocalCountry(name ?? null)
      } catch { /* ignore */ }
    }
    read()
    const onStorage = (e: StorageEvent) => {
      if (e.key === "selected_country_name") read()
    }
    const onCountryChange = () => read()
    window.addEventListener("storage", onStorage)
    window.addEventListener("countryChanged", onCountryChange)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("countryChanged", onCountryChange)
    }
  }, [countryProp])

  // Resolved country: prop wins, then localStorage, then null (= all countries)
  const selectedCountry = countryProp ?? localCountry

  // Fetch from Supabase on mount + when country changes
  useEffect(() => {
    const supabase = createClient()
    setLoaded(false)

    let query = supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, city, location, country, premium_tier, about, images, opening_hours, timezone, created_at, in_carousel")
      .eq("status", "active")
      .or("premium_tier.in.(vip,featured,basic),in_carousel.eq.true")
      .limit(40)

    if (excludeId) query = query.neq("id", excludeId)
    if (selectedCountry) query = query.in("country", getCountryVariants(selectedCountry))

    query.then(({ data, error }) => {
      if (error) {
        // Column doesn't exist yet (migration pending) → fall back without in_carousel filter
        const fallbackQuery = supabase
          .from("listings")
          .select("id, title, profile_image, video_url, age, city, location, country, premium_tier, about, images, opening_hours, timezone, created_at")
          .eq("status", "active")
          .in("premium_tier", ["vip", "featured", "basic"])
          .limit(40)

        const fb = selectedCountry ? fallbackQuery.in("country", getCountryVariants(selectedCountry)) : fallbackQuery
        const base = excludeId ? fb.neq("id", excludeId) : fb

        base.then(({ data: d2 }: { data: PremiumListing[] | null }) => {
          const sorted = sortListings(d2 ?? [])
          setListings(sorted)
          setOffset(0)
          setLoaded(true)
        })
        return
      }

      const sorted = sortListings(data ?? [])
      setListings(sorted)
      setOffset(0)
      setLoaded(true)
    })
  }, [excludeId, selectedCountry])

  function sortListings(data: PremiumListing[]): PremiumListing[] {
    const tierOrder: Record<string, number> = { vip: 1, featured: 2, basic: 3 }
    return [...data].sort((a, b) => {
      const ac = a.in_carousel ? 0 : (tierOrder[a.premium_tier ?? ""] ?? 9)
      const bc = b.in_carousel ? 0 : (tierOrder[b.premium_tier ?? ""] ?? 9)
      return ac - bc
    })
  }

  const rotate = useCallback(() => {
    if (listings.length <= VISIBLE_COUNT) return
    setFading(true)
    setTimeout(() => {
      setOffset(prev => {
        const next = prev + VISIBLE_COUNT
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

  // Don't render until data is loaded + has real results
  if (!loaded || listings.length === 0) return null

  return (
    <section className={`${bgClass} pt-5 pb-5`}>
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          {listings.length > VISIBLE_COUNT && (
            <div className="flex gap-2">
              <button
                onClick={() => manualNav("prev")}
                className="w-9 h-9 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center text-white transition-colors shadow-sm"
                aria-label="Previous">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => manualNav("next")}
                className="w-9 h-9 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center text-white transition-colors shadow-sm"
                aria-label="Next">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
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
              <Link href={`/ads/${l.id}`} key={l.id} className="flex-shrink-0" style={{ width: "200px" }}>
                <div className="relative overflow-hidden cursor-pointer" style={{ width: "200px", height: "300px" }}>
                  {/* Image */}
                  {l.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.profile_image} alt={l.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
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
