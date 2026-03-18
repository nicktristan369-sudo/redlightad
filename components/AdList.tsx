"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"

interface Listing {
  id: string
  title: string
  profile_image: string | null
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

function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null | undefined,
  tz: string | null | undefined
): boolean {
  if (!hours || !tz) return false
  try {
    const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(new Date()).toLowerCase()
    const h = hours[day]
    if (!h || h.closed) return false
    const now = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
    const [ch, cm] = now.split(":").map(Number)
    const [oh, om] = h.open.split(":").map(Number)
    const [clh, clm] = h.close.split(":").map(Number)
    return (ch * 60 + cm) >= (oh * 60 + om) && (ch * 60 + cm) < (clh * 60 + clm)
  } catch { return false }
}

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
  const labels: Record<string, { label: string; style: string }> = {
    vip:      { label: "VIP",      style: "bg-black text-yellow-400 border border-yellow-400/50" },
    featured: { label: "FEATURED", style: "bg-black text-gray-300 border border-gray-500/50" },
    basic:    { label: "PREMIUM",  style: "bg-black/80 text-yellow-500 border border-yellow-500/40" },
  }
  const b = labels[tier]
  if (!b) return null
  return (
    <span className={`absolute top-2 left-2 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${b.style}`}>
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
  limit?: number
}

export default function AdList({ country, category, limit = 50 }: Props) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (country)  params.set("country",  country)
    if (category) params.set("category", category)
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(d => { setListings(d.listings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [country, category, limit])

  if (loading) {
    return (
      <section className="py-8 max-w-5xl mx-auto px-4">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  if (listings.length === 0) {
    return (
      <section className="py-8 max-w-5xl mx-auto px-4">
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} color="#D1D5DB" className="mx-auto mb-4" />
          <p className="text-lg">Ingen aktive annoncer endnu</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 max-w-5xl mx-auto px-4">
      <div className="space-y-4">
        {listings.map((ad) => {
          const displayLocation = ad.city || ad.location || ""
          const description = ad.about || ""
          return (
            <Link key={ad.id} href={`/ads/${ad.id}`} className="block">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                {/* ── MOBILE layout — reference card style (hidden on md+) ── */}
                {(() => {
                  const allImgs: string[] = [
                    ...(ad.images ?? []),
                    ...(ad.profile_image ? [ad.profile_image] : []),
                  ]
                  const imgLeft   = allImgs[0] ?? null
                  const imgCenter = allImgs[1] ?? allImgs[0] ?? null
                  const imgRight  = allImgs[2] ?? allImgs[0] ?? null
                  const photoCount = allImgs.length
                  const videoCount = ad.video_url ? 1 : 0
                  const hasAudio   = !!ad.voice_message_url
                  const available  = isAvailableNow(ad.opening_hours, ad.timezone)
                  const postTime   = new Date(ad.created_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                  return (
                    <div className="md:hidden bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                      {/* ── Row 1: Title + Verified ── */}
                      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
                        <h3 className="font-black text-[14px] text-gray-900 uppercase leading-snug line-clamp-2 flex-1"
                          style={{ letterSpacing: "0.02em" }}>
                          {ad.title}
                        </h3>
                        <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider"
                          style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                          VERIFIED
                        </span>
                      </div>

                      {/* ── Row 2: 3-panel image ── */}
                      <div className="flex gap-0.5 h-[200px] mx-0">
                        {/* Left panel */}
                        <div className="w-[22%] relative overflow-hidden bg-gray-200">
                          {imgLeft
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={imgLeft} alt="" className="w-full h-full object-cover opacity-80" />
                            : <div className="w-full h-full bg-gray-200" />}
                        </div>
                        {/* Center panel — largest */}
                        <div className="flex-1 relative overflow-hidden bg-gray-300">
                          {imgCenter
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={imgCenter} alt={ad.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gray-300" />}
                          {ad.premium_tier && (
                            <div className="absolute top-2 left-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${ad.premium_tier === "vip" ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-200"}`}>
                                {ad.premium_tier.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Right panel */}
                        <div className="w-[22%] relative overflow-hidden bg-gray-200">
                          {imgRight
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={imgRight} alt="" className="w-full h-full object-cover opacity-80" />
                            : <div className="w-full h-full bg-gray-200" />}
                        </div>
                      </div>

                      {/* ── Row 3: Stats bar ── */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-y border-gray-100">
                        {/* Photo count */}
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {photoCount}
                        </div>
                        {/* Video count */}
                        {videoCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                            </svg>
                            {videoCount}
                          </div>
                        )}
                        {/* Audio waveform */}
                        {hasAudio && (
                          <div className="flex items-center gap-1.5 flex-1">
                            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                            </svg>
                            <Waveform />
                          </div>
                        )}
                        {/* Time */}
                        <span className="ml-auto text-[11px] text-gray-400 font-medium whitespace-nowrap">
                          {postTime}
                        </span>
                      </div>

                      {/* ── Row 4: Description ── */}
                      {description && (
                        <div className="px-3 pt-2 pb-1">
                          <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-3">{description}</p>
                          <button className="text-[11px] font-bold mt-1" style={{ color: "#DC2626" }}>
                            READ MORE →
                          </button>
                        </div>
                      )}

                      {/* ── Row 5: Available ── */}
                      {available && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[12px] font-bold text-green-600">Available</span>
                        </div>
                      )}

                      {/* ── Row 6: Bottom action bar ── */}
                      <div className="flex border-t border-gray-100 divide-x divide-gray-100 mt-1">
                        {/* RING */}
                        <a href={`tel:${ad.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-black text-gray-900 uppercase tracking-wide">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                          </svg>
                          RING
                        </a>
                        {/* Location */}
                        <div className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] text-gray-500 font-semibold">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          <span className="truncate">{[displayLocation, ad.country].filter(Boolean).join(", ")}</span>
                        </div>
                        {/* See profile */}
                        <div className="flex-1 flex items-center justify-center py-2.5 text-[11px] font-black uppercase tracking-wide"
                          style={{ color: "#DC2626" }}>
                          SE PROFIL
                        </div>
                      </div>

                    </div>
                  )
                })()}

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
                    ) : ad.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.profile_image} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    {tierBadge(ad.premium_tier)}
                  </div>

                  {/* Right: details */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{ad.title}</h3>
                        <span className="flex-shrink-0 inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
                      <span className="flex-1 bg-gray-900 hover:bg-black text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors">
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
    </section>
  )
}
