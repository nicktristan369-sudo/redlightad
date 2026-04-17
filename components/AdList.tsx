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

                  {/* ── DESKTOP layout (hidden below md) ── */}
                  <div className="hidden md:flex">
                    {/* Left: thumbnail */}
                    <div className="relative flex-shrink-0 w-[200px] h-[240px] bg-gray-100">
                      {ad.video_url ? (
                        <>
                          <video src={ad.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isAvailableNow(ad.opening_hours, ad.timezone) && (
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, boxShadow: "0 0 0 2px #fff, 0 0 0 3px #22C55E" }} />
                            )}
                            <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{ad.title}</h3>
                          </div>
                          <span style={{
                            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 600, color: "#16A34A",
                            background: "#F0FDF4", border: "1px solid #BBF7D0",
                            padding: "3px 9px", borderRadius: 20,
                          }}>
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Posted {timeAgo(ad.created_at)}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
                      </div>
                      <div className="grid grid-cols-5 gap-x-3 gap-y-1 text-xs border-t border-gray-100 pt-3 mb-3">
                        {[
                          { label: "AGE",      value: ad.age },
                          { label: "GENDER",   value: ad.gender },
                          { label: "CATEGORY", value: ad.category },
                          { label: "LOCATION", value: displayLocation },
                          { label: "LANGUAGE", value: ad.languages?.[0] || "—" },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">{label}</p>
                            <p className="font-semibold text-gray-800 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {((ad as any).social_links?.onlyfans?.url || (ad as any).onlyfans_username) && (
                          <img src="/onlyfans-logo.svg" alt="OnlyFans" style={{ height: 16, width: "auto", objectFit: "contain", flexShrink: 0 }} />
                        )}
                        <span className="flex-1 bg-gray-900 hover:bg-black text-white text-sm font-semibold py-2.5 rounded-none text-center transition-colors">
                          View Profile
                        </span>
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
