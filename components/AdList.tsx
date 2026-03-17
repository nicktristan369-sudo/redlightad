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
  images?: string[] | null
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

                {/* ── MOBILE layout — overlay style (hidden on md+) ── */}
                <div className="md:hidden">
                  {/* Image with overlaid text */}
                  <div className="relative w-full bg-gray-900 overflow-hidden" style={{ height: 250 }}>
                    {/* Photo / video */}
                    {ad.video_url ? (
                      <video src={ad.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : ad.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.profile_image} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.88) 100%)" }} />

                    {/* Top-left: Verified badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-wider">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Verified
                      </span>
                      {ad.premium_tier && (
                        <span className={`block mt-1 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase ${ad.premium_tier === "vip" ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-200"}`}>
                          {ad.premium_tier.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Top-right: camera + photo count */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white text-[10px] font-semibold">
                        {ad.images?.length ?? 1}
                      </span>
                    </div>

                    {/* Bottom overlay: name, location, time */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6">
                      <p className="text-white font-black uppercase leading-tight truncate" style={{ fontSize: 15, letterSpacing: "0.04em" }}>
                        {ad.title}
                      </p>
                      <p className="text-white font-semibold uppercase leading-tight truncate mt-0.5" style={{ fontSize: 11, opacity: 0.85 }}>
                        {[displayLocation, ad.country].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-white mt-1" style={{ fontSize: 10, opacity: 0.55 }}>
                        Posted {timeAgo(ad.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* CTA below image */}
                  <div className="px-3 py-2.5">
                    <span className="block w-full bg-gray-900 text-white text-[13px] font-semibold py-2 rounded-xl text-center">
                      View Profile →
                    </span>
                  </div>
                </div>

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
