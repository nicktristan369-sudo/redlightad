"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { getCountryVariants } from "@/lib/countries"
import { getLocaleFromDomain } from "@/lib/seo"
import Link from "next/link"

// Map locale to country name for filtering
const LOCALE_TO_COUNTRY_NAME: Record<string, string> = {
  nl: 'Netherlands',
  de: 'Germany',
  da: 'Denmark',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  pt: 'Portugal',
  sv: 'Sweden',
  no: 'Norway',
  pl: 'Poland',
  cs: 'Czech Republic',
  ru: 'Russia',
  th: 'Thailand',
  ar: 'UAE',
}

// ── Random cycling image with cross-fade ─────────────────────────────────────
function CyclingImage({
  profileImage,
  images,
  alt,
  hasVideo,
  profileVideoUrl,
  staggerDelay = 0,
}: {
  profileImage: string | null
  images: string[] | null
  alt: string
  hasVideo: boolean
  profileVideoUrl?: string | null
  staggerDelay?: number
}) {
  // ── Levende profilbillede (video) ─────────────────────────────────────────
  if (profileVideoUrl) {
    return (
      <div className="absolute inset-0">
        <video
          src={profileVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  const pool = [
    ...(profileImage ? [profileImage] : []),
    ...(images ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Randomise starting image once on mount
  useEffect(() => {
    if (pool.length > 1) {
      setCurrent(Math.floor(Math.random() * pool.length))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pool.length <= 1) return
    // Stagger: delay start so cards don't all switch simultaneously
    const startTimer = setTimeout(() => {
      const t = setInterval(() => {
        setCurrent(cur => {
          let next: number
          do { next = Math.floor(Math.random() * pool.length) } while (next === cur)
          setPrev(cur)
          setTransitioning(true)
          setTimeout(() => { setPrev(null); setTransitioning(false) }, 700)
          return next
        })
      }, 6000)
      return () => clearInterval(t)
    }, staggerDelay)
    return () => clearTimeout(startTimer)
  }, [pool.length, staggerDelay])

  if (pool.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {/* Previous image fading out */}
      {prev !== null && (
        <img
          src={pool[prev]}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: transitioning ? 0 : 1, transition: "opacity 0.7s ease" }}
        />
      )}
      {/* Current image fading in */}
      <img
        src={pool[current]}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: transitioning ? 1 : 1, transition: "opacity 0.7s ease" }}
      />
      {/* Video icon */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)",
            border: "1.5px solid rgba(255,255,255,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.90)">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

interface PremiumListing {
  id: string
  slug?: string | null
  title: string
  profile_image: string | null
  profile_video_url: string | null
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
  social_links?: Record<string, { url?: string }> | null
  onlyfans_username?: string | null
}

const VISIBLE_COUNT = 6

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

import { isAvailableNow } from "@/lib/isAvailableNow"

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

  // Priority: 1) prop, 2) domain-based country, 3) localStorage
  useEffect(() => {
    if (countryProp) return // prop takes priority
    
    // Check domain first - extract TLD
    const hostname = window.location.hostname
    const tld = hostname.split('.').pop()?.toLowerCase() || ''
    
    // Direct TLD to country mapping
    const TLD_TO_COUNTRY: Record<string, string> = {
      'nl': 'Netherlands',
      'de': 'Germany',
      'dk': 'Denmark',
      'fr': 'France',
      'es': 'Spain',
      'it': 'Italy',
      'pt': 'Portugal',
      'se': 'Sweden',
      'no': 'Norway',
      'pl': 'Poland',
      'cz': 'Czech Republic',
      'ch': 'Switzerland',
      'co': 'Colombia',
      'ca': 'Canada',
    }
    
    const domainCountry = TLD_TO_COUNTRY[tld]
    
    if (domainCountry) {
      setLocalCountry(domainCountry)
      return // Domain country takes priority over localStorage
    }
    
    // Fall back to localStorage for global domains (.com, .eu)
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

  // Resolved country: prop wins, then domain/localStorage
  const selectedCountry = countryProp ?? localCountry

  // Fetch from Supabase on mount + when country changes
  useEffect(() => {
    // Get country from TLD directly here too (in case state hasn't updated yet)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    const tld = hostname.split('.').pop()?.toLowerCase() || ''
    const TLD_TO_COUNTRY: Record<string, string> = {
      'nl': 'Netherlands',
      'de': 'Germany',
      'dk': 'Denmark',
      'fr': 'France',
      'es': 'Spain',
      'it': 'Italy',
      'pt': 'Portugal',
      'se': 'Sweden',
      'no': 'Norway',
      'pl': 'Poland',
      'cz': 'Czech Republic',
      'ch': 'Switzerland',
      'co': 'Colombia',
      'ca': 'Canada',
    }
    const countryFromTLD = TLD_TO_COUNTRY[tld]
    const effectiveCountry = countryProp ?? selectedCountry ?? countryFromTLD
    
    const supabase = createClient()
    setLoaded(false)

    let query = supabase
      .from("listings")
      .select("id, title, profile_image, profile_video_url, video_url, age, city, location, country, premium_tier, about, images, opening_hours, timezone, created_at, in_carousel, social_links, onlyfans_username")
      .eq("status", "active")
      .or("premium_tier.in.(vip,featured,basic),in_carousel.eq.true")
      .limit(100)

    if (excludeId) query = query.neq("id", excludeId)

    query.then(({ data, error }) => {
      if (error) {
        // Column doesn't exist yet (migration pending) → fall back without in_carousel filter
        const fallbackQuery = supabase
          .from("listings")
          .select("id, title, profile_image, profile_video_url, video_url, age, city, location, country, premium_tier, about, images, opening_hours, timezone, created_at, social_links, onlyfans_username")
          .eq("status", "active")
          .in("premium_tier", ["vip", "featured", "basic"])
          .limit(100)

        const base = excludeId ? fallbackQuery.neq("id", excludeId) : fallbackQuery

        base.then(({ data: d2 }: { data: PremiumListing[] | null }) => {
          let filtered = d2 ?? []
          // Client-side country filter - strict matching for regional domains
          if (effectiveCountry) {
            const countryLower = effectiveCountry.toLowerCase()
            filtered = filtered.filter(l => {
              const listingCountry = (l.country || '').toLowerCase()
              return listingCountry.includes(countryLower) || 
                     countryLower.includes(listingCountry) ||
                     listingCountry === countryLower
            })
          }
          const sorted = sortListings(filtered)
          setListings(sorted.slice(0, 40))
          setOffset(0)
          setLoaded(true)
        })
        return
      }

      let filtered = data ?? []
      // Client-side country filter - strict matching for regional domains
      if (effectiveCountry) {
        const countryLower = effectiveCountry.toLowerCase()
        filtered = filtered.filter(l => {
          const listingCountry = (l.country || '').toLowerCase()
          // Must contain the country name (e.g. "netherlands" in country field)
          return listingCountry.includes(countryLower) || 
                 countryLower.includes(listingCountry) ||
                 listingCountry === countryLower
        })
      }
      const sorted = sortListings(filtered)
      setListings(sorted.slice(0, 40))
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
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
          className={`flex gap-2 transition-opacity duration-300 overflow-x-auto ${fading ? "opacity-0" : "opacity-100"}`}
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {visible.map((l, cardIdx) => {
            const available = isAvailableNow(l.opening_hours, l.timezone)
            const hasPhotos = (l.images && l.images.length > 0) || !!l.profile_image
            const ago = timeAgo(l.created_at)
            const isVip = l.premium_tier === "vip"
            const isFeatured = l.premium_tier === "featured"

            return (
              <Link
                href={`/ads/${l.slug || l.id}`}
                key={l.id}
                className="flex-shrink-0"
                style={{ width: "calc((100% - 40px) / 6)", minWidth: 120, maxWidth: 200 }}
              >
                <div className="relative overflow-hidden cursor-pointer w-full rounded-lg" style={{ aspectRatio: "173/260" }}>
                  {/* Cycling gallery image — staggered per card */}
                  <CyclingImage
                    profileImage={l.profile_image}
                    images={l.images}
                    alt={l.title}
                    hasVideo={!!l.video_url}
                    profileVideoUrl={l.profile_video_url}
                    staggerDelay={cardIdx * 800}
                  />

                  {/* OnlyFans badge */}
                  {(l.social_links?.onlyfans?.url || l.onlyfans_username) && (
                    <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1 py-0.5 flex items-center">
                      <img src="/onlyfans-logo.svg" alt="OnlyFans" style={{ height: 12, width: "auto" }} />
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
