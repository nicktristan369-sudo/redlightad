"use client"
import { useLanguage } from "@/lib/i18n/LanguageContext"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FileText, LayoutList, LayoutGrid } from "lucide-react"
import AdCardGrid from "./AdCardGrid"

interface Listing {
  id: string
  title: string
  profile_image: string | null
  profile_video_url?: string | null
  video_url: string | null
  age: number
  gender: string
  category: string
  location: string
  city: string | null
  country: string | null
  about: string | null
  languages: string[]
  premium_tier: string | null
  created_at: string
  voice_message_url?: string | null
  images?: string[] | null
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone?: string | null
  social_links?: {
    whatsapp?: { url?: string }
    onlyfans?: { url?: string }
    telegram?: { url?: string }
    instagram?: { url?: string }
  } | null
  onlyfans_username?: string | null
  average_rating?: number | null
  review_count?: number | null
  marketplace_count?: number | null
}

import { isAvailableNow } from "@/lib/isAvailableNow"

// ── Mobile listing card with auto-cycling images ──────────────────────────
function MobileAdCard({ ad, displayLocation, description, ago, staggerDelay = 0 }: { // i18n-ready
  ad: Listing
  displayLocation: string
  description: string
  ago: string
  staggerDelay?: number
}) {
  const { t } = useLanguage()
  const allImgs: string[] = [
    ...(ad.images ?? []),
    ...(ad.profile_image ? [ad.profile_image] : []),
  ]
  // Pad to at least 3
  while (allImgs.length > 0 && allImgs.length < 3) allImgs.push(allImgs[0])

  const [offset, setOffset] = useState(0)
  useEffect(() => {
    if (allImgs.length <= 3) return
    const startTimer = setTimeout(() => {
      const t = setInterval(() => setOffset(p => (p + 1) % (allImgs.length - 2)), 5000)
      return () => clearInterval(t)
    }, staggerDelay)
    return () => clearTimeout(startTimer)
  }, [allImgs.length, staggerDelay])

  const panels = allImgs.length >= 3
    ? [allImgs[offset], allImgs[offset + 1], allImgs[offset + 2]]
    : [null, null, null]

  const photoCount = allImgs.length
  const videoCount = ad.video_url ? 1 : 0

  return (
    <div className="md:hidden bg-white overflow-hidden rounded-none"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.10)", border: "1px solid #E5E7EB" }}>

      {/* ── Title (max 2 lines, bold, NOT uppercase) ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {isAvailableNow(ad.opening_hours, ad.timezone) && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, display: "inline-block", boxShadow: "0 0 0 2px #fff, 0 0 0 3px #22C55E" }} />
          )}
          <h3 className="font-bold text-[15px] text-gray-900 leading-snug line-clamp-2">
            {ad.title}
          </h3>
        </div>
      </div>

      {/* ── 3-panel layout (with live video in center if available) ── */}
      <div className="flex h-[190px]" style={{ gap: 1 }}>
        {/* Left panel - static image */}
        <div className="relative overflow-hidden bg-gray-200 flex-1">
          {panels[0]
            ? <img src={panels[0]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gray-200" />}
        </div>

        {/* Center panel - LIVE video or static image */}
        <div className="relative overflow-hidden bg-gray-200 flex-1">
          {ad.profile_video_url ? (
            <>
              <video
                src={ad.profile_video_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 right-1.5">
                <span className="inline-flex items-center gap-[3px] text-[8.5px] font-semibold px-1.5 py-[3px] rounded"
                  style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(3px)" }}>
                  🎬 LIVE
                </span>
              </div>
            </>
          ) : panels[1] ? (
            <img src={panels[1]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>

        {/* Right panel - static image + VERIFIED badge */}
        <div className="relative overflow-hidden bg-gray-200 flex-1">
          {ad.profile_video_url ? (
            // When live video, show panel[1] on right (panel[0] is left)
            panels[1] ? <img src={panels[1]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />
          ) : (
            panels[2] ? <img src={panels[2]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />
          )}
          <div className="absolute top-1.5 right-1.5">
            <span className="inline-flex items-center gap-[3px] text-[8.5px] font-semibold px-1.5 py-[3px] rounded"
              style={{
                background: "rgba(0,0,0,0.30)",
                color: "rgba(255,255,255,0.80)",
                backdropFilter: "blur(3px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-t border-gray-100">
        {/* Camera + count */}
        <div className="flex items-center gap-1 text-[12px] text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">{photoCount}</span>
        </div>
        {/* Video play icon */}
        {videoCount > 0 && (
          <div className="flex items-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth={1.8}/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 9l5 3-5 3V9z"/>
            </svg>
          </div>
        )}
        {/* Posted time — right */}
        <span className="ml-auto text-[12px] text-gray-500">posted {ago}</span>
      </div>

      {/* ── Description + READ MORE ── */}
      <div className="px-3 pt-1 pb-2.5">
        <p className="text-[13px] text-gray-700 leading-relaxed line-clamp-3">
          {description || "Ingen beskrivelse."}
        </p>
        <span className="text-[13px] font-bold mt-1.5 block" style={{ color: "#DC2626" }}>
          READ MORE →
        </span>
      </div>

      {/* ── Action bar ── */}
      <div className="flex" style={{ background: "#111" }}>
        {/* RING */}
        <a href={`tel:${ad.id}`} onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 py-3.5 text-[11px] sm:text-[12px] font-bold text-white min-w-0"
          style={{ flex: 1, borderRight: "1px solid #333" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <span className="truncate">{t.contact_call}</span>
        </a>
        {/* Location */}
        <div className="flex items-center justify-center gap-1 py-3.5 text-[10px] sm:text-[11px] font-medium min-w-0"
          style={{ flex: 1.4, color: "#9CA3AF", borderRight: "1px solid #333" }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span className="truncate">{[displayLocation, ad.country].filter(Boolean).join(", ")}</span>
        </div>
        {/* SE PROFIL */}
        <div className="flex items-center justify-center py-3.5 text-[11px] sm:text-[12px] font-black min-w-0"
          style={{ flex: 1, color: "#EF4444" }}>
          <span className="truncate">{t.view_profile}</span>
        </div>
      </div>

    </div>
  )
}

// ── Desktop thumbnail cycling ─────────────────────────────────────────────
function DesktopThumb({ ad, staggerDelay = 0 }: { ad: Listing; staggerDelay?: number }) {
  // Levende profilbillede — vis video direkte
  if (ad.profile_video_url) {
    return (
      <video
        src={ad.profile_video_url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    )
  }

  const pool = [ad.profile_image, ...(ad.images ?? [])].filter((v): v is string => !!v).filter((v, i, a) => a.indexOf(v) === i)
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (pool.length <= 1) return
    const start = setTimeout(() => {
      const t = setInterval(() => {
        setFading(true)
        setTimeout(() => {
          setCurrent(cur => {
            let next: number
            do { next = Math.floor(Math.random() * pool.length) } while (next === cur)
            return next
          })
          setFading(false)
        }, 500)
      }, 6000)
      return () => clearInterval(t)
    }, staggerDelay)
    return () => clearTimeout(start)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, staggerDelay])

  if (pool.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pool[current]}
      alt={ad.title}
      className="w-full h-full object-cover"
      style={{ transition: "opacity 0.5s ease", opacity: fading ? 0 : 1 }}
    />
  )
}
// ─────────────────────────────────────────────────────────────────────────────

// Decorative audio waveform bars
function Waveform() {
  const bars = [3,5,8,6,10,7,4,9,6,5,8,4,7,9,5,6,8,4,6,7,5,9,6,4,8,5,7,4,6,9]
  return (
    <div className="flex items-center gap-[1.5px] h-4">
      {bars.map((h, i) => (
        <div key={i} className="w-[2px] rounded-full bg-gray-400" style={{ height: `${h}px` }} />
      ))}
    </div>
  )
}

function tierBadge(tier: string | null | undefined) {
  if (!tier) return null
  const labels: Record<string, { label: string; gold: boolean }> = {
    vip:      { label: "VIP",     gold: true  },
    featured: { label: "TOP",     gold: false },
    basic:    { label: "PREMIUM", gold: true  },
  }
  const b = labels[tier]
  if (!b) return null
  return b.gold ? (
    <span style={{
      position: "absolute", top: 10, left: 10,
      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "3px 7px",
      background: "linear-gradient(135deg, #C9A84C, #F0D080, #C9A84C)",
      color: "#1a0f00",
      borderRadius: 4,
      boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
    }}>
      {b.label}
    </span>
  ) : (
    <span style={{
      position: "absolute", top: 10, left: 10,
      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "3px 7px",
      background: "rgba(0,0,0,0.75)",
      color: "#E5E7EB",
      borderRadius: 4,
      border: "1px solid rgba(255,255,255,0.15)",
      backdropFilter: "blur(4px)",
    }}>
      {b.label}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

interface Props {
  country?: string
  category?: string
  city?: string
  limit?: number
}

function AdListInner({ country: propCountry, category: propCategory, city: propCity, limit = 50 }: Props) {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "grid">("list")
  const [storyIds, setStoryIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    const saved = localStorage.getItem("viewMode")
    if (saved === "list" || saved === "grid") setView(saved)
  }, [])
  const handleViewChange = (v: "list" | "grid") => {
    setView(v)
    localStorage.setItem("viewMode", v)
    if (v === "grid" && storyIds.size === 0) {
      fetch("/api/stories")
        .then(r => r.json())
        .then(d => {
          const ids = new Set<string>((d.groups ?? []).map((g: any) => g.listing_id as string))
          setStoryIds(ids)
        })
        .catch(() => {})
    }
  }
  // Also fetch stories on mount if grid is default
  useEffect(() => {
    const saved = localStorage.getItem("viewMode")
    if (saved === "grid") {
      fetch("/api/stories")
        .then(r => r.json())
        .then(d => {
          const ids = new Set<string>((d.groups ?? []).map((g: any) => g.listing_id as string))
          setStoryIds(ids)
        })
        .catch(() => {})
    }
  }, [])

  // URL params take priority, props as fallback
  const country = searchParams.get("country") ?? propCountry ?? ""
  const city = searchParams.get("city") ?? propCity ?? ""
  const category = searchParams.get("category") ?? propCategory ?? ""
  const gender = searchParams.get("gender") ?? ""
  const q = searchParams.get("q") ?? ""

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(limit) })
    if (country)  params.set("country",  country)
    if (city)     params.set("city",     city)
    if (category) params.set("category", category)
    if (gender)   params.set("gender",   gender)
    if (q)        params.set("q",        q)
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(d => { setListings(d.listings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [country, city, category, gender, q, limit])

  if (loading) {
    return (
      <section className="py-8 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  if (listings.length === 0) {
    return (
      <section className="py-8 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} color="#D1D5DB" className="mx-auto mb-4" />
          <p className="text-lg">No active listings yet</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* ── View toggle bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>{listings.length} profiles</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#fff", border: "1px solid #E5E7EB", padding: "4px", borderRadius: "2px" }}>
          <button
            onClick={() => handleViewChange("list")}
            aria-label="List view"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", border: "none", borderRadius: "2px", cursor: "pointer",
              background: view === "list" ? "#FEE2E2" : "transparent",
              color: view === "list" ? "#DC2626" : "#9CA3AF",
              transition: "all 0.15s",
            }}
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => handleViewChange("grid")}
            aria-label="Grid view"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", border: "none", borderRadius: "2px", cursor: "pointer",
              background: view === "grid" ? "#FEE2E2" : "transparent",
              color: view === "grid" ? "#DC2626" : "#9CA3AF",
              transition: "all 0.15s",
            }}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8">
          {listings.map((ad, idx) => (
            <AdCardGrid
              key={ad.id}
              id={ad.id}
              title={ad.title}
              image={ad.profile_image || "/placeholder.jpg"}
              images={ad.images}
              profileVideoUrl={ad.profile_video_url}
              verified={(ad as any).verified ?? false}
              age={ad.age}
              city={ad.city}
              country={ad.country}
              location={ad.location}
              opening_hours={ad.opening_hours}
              timezone={ad.timezone}
              premium_tier={ad.premium_tier}
              hasStory={storyIds.has(ad.id)}
              display_name={(ad as any).display_name ?? null}
              category={ad.category}
              created_at={ad.created_at}
              staggerDelay={idx * 700}
              social_links={(ad as any).social_links ?? null}
              onlyfans_username={(ad as any).onlyfans_username ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((ad, idx) => {
            const displayLocation = ad.city || ad.location || ""
            const description = ad.about || ""
            return (
              <Link key={ad.id} href={`/ads/${ad.id}`} className="block">
                <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                  {/* ── MOBILE layout — MobileAdCard component ── */}
                  <MobileAdCard
                    ad={ad}
                    displayLocation={displayLocation}
                    description={description}
                    ago={timeAgo(ad.created_at)}
                    staggerDelay={idx * 600}
                  />

                  {/* ── DESKTOP layout (hidden below md) — Professional + info-rich ── */}
                  <div className="hidden md:flex">
                    {/* Left: thumbnail */}
                    <div className="relative flex-shrink-0 w-[180px] bg-gray-100 self-stretch">
                      {ad.video_url ? (
                        <>
                          <video src={ad.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <DesktopThumb ad={ad} staggerDelay={idx * 600} />
                      )}
                      {tierBadge(ad.premium_tier)}
                    </div>

                    {/* Right: details */}
                    <div className="flex-1 p-4 flex flex-col min-w-0">
                      {/* Row 1: Title + Verified */}
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {isAvailableNow(ad.opening_hours, ad.timezone) && (
                            <span className="flex-shrink-0" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E" }} />
                          )}
                          <h3 className="font-semibold text-[15px] text-gray-900 leading-tight truncate">{ad.title}</h3>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border" style={{ color: "#059669", borderColor: "#A7F3D0" }}>
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified
                        </span>
                      </div>

                      {/* Row 2: Location */}
                      <p className="text-[12px] text-gray-500 mb-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        {displayLocation}{ad.country ? `, ${ad.country}` : ""}
                      </p>

                      {/* Row 3: Inline stats */}
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2">
                        <span className="font-medium text-gray-700">{ad.age} years</span>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{ad.gender}</span>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{ad.category}</span>
                      </div>

                      {/* Row 4: Description */}
                      <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2 mb-3">{description || "No description available."}</p>

                      {/* Row 5: Info badges */}
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        {/* Photo count */}
                        {(ad.images?.length || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                              <circle cx="12" cy="13" r="3"/>
                            </svg>
                            <span className="font-medium">{(ad.images?.length || 0) + (ad.profile_image ? 1 : 0)}</span>
                          </span>
                        )}
                        {/* Video count */}
                        {ad.video_url && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                            </svg>
                            <span className="font-medium">1</span>
                          </span>
                        )}
                        {/* Reviews/Rating */}
                        {(ad as any).average_rating && (ad as any).review_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span className="font-medium">{(ad as any).average_rating.toFixed(1)}</span>
                            <span className="text-gray-400">({(ad as any).review_count})</span>
                          </span>
                        )}
                        {/* Marketplace */}
                        {(ad as any).marketplace_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>
                            </svg>
                            <span className="font-medium">Shop</span>
                          </span>
                        )}
                      </div>

                      {/* Row 6: Bottom - Social icons + View Profile */}
                      <div className="flex items-center mt-auto pt-2 border-t border-gray-100">
                        {/* Social icons */}
                        <div className="flex items-center gap-2">
                          {((ad as any).social_links?.whatsapp?.url) && (
                            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          )}
                          {((ad as any).social_links?.telegram?.url) && (
                            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          )}
                          {((ad as any).social_links?.onlyfans?.url || (ad as any).onlyfans_username) && (
                            <img src="/onlyfans-logo.svg" alt="OnlyFans" className="h-3.5 w-auto opacity-70" />
                          )}
                          {((ad as any).social_links?.instagram?.url) && (
                            <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          )}
                        </div>
                        
                        {/* Spacer + action buttons */}
                        <div className="ml-auto flex items-center gap-2">
                          {/* Phone */}
                          <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                          </div>
                          {/* Heart */}
                          <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function AdList(props: Props) {
  return (
    <Suspense fallback={
      <section className="py-8 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </section>
    }>
      <AdListInner {...props} />
    </Suspense>
  )
}
