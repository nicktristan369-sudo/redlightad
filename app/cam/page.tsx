"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Video, Users, Camera, Play, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface CamListing {
  id: string
  title: string
  display_name: string
  profile_image: string | null
  age: number | null
  city: string | null
  cam_live: boolean
  cam_title: string | null
  cam_viewers: number
  cam_category: string
  gender: string | null
  category: string | null
  premium_tier: string | null
}

interface ReplayListing {
  listing_id: string
  display_name: string
  profile_image: string | null
  age: number | null
  city: string | null
  premium_tier: string | null
  recording_title: string
  duration_seconds: number
  created_at: string
  cloudinary_url: string
}

const TABS = ["Live Now", "Replays", "Private", "All"] as const

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export default function CamDirectoryPage() {
  const [listings, setListings] = useState<CamListing[]>([])
  const [replays, setReplays] = useState<ReplayListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("Live Now")

  useEffect(() => {
    const supabase = createClient()

    // Fetch live streams
    supabase
      .from("listings")
      .select("id, title, display_name, profile_image, age, city, cam_live, cam_title, cam_viewers, cam_category, gender, category, premium_tier")
      .eq("status", "active")
      .eq("cam_live", true)
      .order("cam_viewers", { ascending: false })
      .then(({ data }) => setListings((data as CamListing[]) || []))

    // Fetch recent replays (VIP/premium only, visible, max 1 per profile, last 7 days)
    supabase
      .from("cam_recordings")
      .select(`
        listing_id,
        title,
        duration_seconds,
        created_at,
        cloudinary_url,
        listings!inner(display_name, profile_image, age, city, premium_tier, status)
      `)
      .eq("visible", true)
      .eq("listings.status", "active")
      .in("listings.premium_tier", ["vip", "featured", "standard"])
      .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return
        // De-duplicate: max 1 replay per profile
        const seen = new Set<string>()
        const deduped: ReplayListing[] = []
        for (const r of data as never[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = r as any
          if (seen.has(row.listing_id)) continue
          seen.add(row.listing_id)
          deduped.push({
            listing_id: row.listing_id,
            display_name: row.listings?.display_name || "",
            profile_image: row.listings?.profile_image || null,
            age: row.listings?.age || null,
            city: row.listings?.city || null,
            premium_tier: row.listings?.premium_tier || null,
            recording_title: row.title || "Live Stream",
            duration_seconds: row.duration_seconds || 0,
            created_at: row.created_at,
            cloudinary_url: row.cloudinary_url,
          })
        }
        setReplays(deduped)
        setLoading(false)
      })

    setLoading(false)
  }, [])

  const liveCams = listings.filter(l => {
    if (activeTab === "Private") return l.cam_category === "private"
    if (activeTab === "All") return true
    return true // Live Now shows all live
  })

  const showLive = activeTab === "Live Now" || activeTab === "All" || activeTab === "Private"
  const showReplays = activeTab === "Replays" || activeTab === "All"

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#fff" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, color: "#9CA3AF", fontSize: 12, fontWeight: 500, textDecoration: "none", padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.05)", whiteSpace: "nowrap", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              redlightad.com
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                <span style={{ color: "#DC2626" }}>RED</span>LIGHT<span style={{ color: "#DC2626" }}>CAM</span>
              </h1>
              <div style={{ width: 40, height: 3, background: "#DC2626", borderRadius: 2, marginTop: 3 }} />
            </div>
          </div>
          <Link href="/dashboard/go-live"
            style={{ padding: "9px 16px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
            <Video size={14} /> Go Live
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab === tab ? "#DC2626" : "#1A1A1A", color: activeTab === tab ? "#fff" : "#9CA3AF", transition: "all 0.15s" }}>
              {tab}
              {tab === "Live Now" && listings.length > 0 && (
                <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{listings.length}</span>
              )}
              {tab === "Replays" && replays.length > 0 && (
                <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{replays.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 28, height: 28, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* ── LIVE NOW ── */}
        {showLive && (
          <>
            {(activeTab === "All") && liveCams.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>LIVE NOW</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{liveCams.length} streaming</span>
              </div>
            )}

            {!loading && liveCams.length === 0 && activeTab === "Live Now" && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Camera size={30} color="#555" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>No live cams right now</h2>
                <p style={{ fontSize: 13, color: "#666", margin: "0 0 20px" }}>Check out recent replays below, or be the first to go live</p>
                <Link href="/dashboard/go-live" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  <Video size={14} /> Go Live
                </Link>
              </div>
            )}

            {liveCams.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 36 }} className="cam-grid">
                {liveCams.map(listing => (
                  <Link key={listing.id} href={`/cam/${listing.id}`} style={{ textDecoration: "none", color: "#fff" }}>
                    <div style={{ background: "#1A1A1A", borderRadius: 12, overflow: "hidden", transition: "transform 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "" }}>
                      <div style={{ position: "relative", aspectRatio: "16/9", background: "#111", overflow: "hidden" }}>
                        {listing.profile_image ? (
                          <img src={listing.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Video size={28} color="#333" />
                          </div>
                        )}
                        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5, background: "rgba(220,38,38,0.9)", padding: "3px 8px", borderRadius: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>LIVE</span>
                        </div>
                        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.65)", padding: "3px 8px", borderRadius: 6 }}>
                          <Users size={10} color="#fff" />
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{listing.cam_viewers}</span>
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          {listing.profile_image && <img src={listing.profile_image} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #333" }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.display_name || listing.title}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{[listing.age, listing.city].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REPLAYS ── */}
        {showReplays && replays.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Play size={14} color="#9CA3AF" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>RECENT REPLAYS</span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Watch past streams · tip anytime</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="cam-grid">
              {replays.map(r => (
                <Link key={r.listing_id} href={`/cam/${r.listing_id}`} style={{ textDecoration: "none", color: "#fff" }}>
                  <div style={{ background: "#1A1A1A", borderRadius: 12, overflow: "hidden", transition: "transform 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)" }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "" }}>
                    <div style={{ position: "relative", aspectRatio: "16/9", background: "#0D0D0D", overflow: "hidden" }}>
                      {r.profile_image ? (
                        <img src={r.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={28} color="#333" />
                        </div>
                      )}
                      {/* Play icon overlay */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(220,38,38,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={18} color="#fff" fill="#fff" />
                        </div>
                      </div>
                      {/* REPLAY badge */}
                      <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#D1D5DB", letterSpacing: "0.05em" }}>REPLAY</span>
                      </div>
                      {/* Duration */}
                      {r.duration_seconds > 0 && (
                        <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", padding: "3px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={9} color="#9CA3AF" />
                          <span style={{ fontSize: 10, color: "#D1D5DB", fontWeight: 600 }}>{formatDuration(r.duration_seconds)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        {r.profile_image && <img src={r.profile_image} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #333" }} />}
                        <span style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.display_name}</span>
                        {r.premium_tier === "vip" && (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "linear-gradient(135deg, #C9A84C, #F0D080)", color: "#4A3200" }}>VIP</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#666", margin: 0 }}>
                        {[r.age, r.city].filter(Boolean).join(" · ")}
                        {" · "}
                        <span style={{ color: "#4B5563" }}>{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {showReplays && !loading && replays.length === 0 && activeTab === "Replays" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Play size={28} color="#555" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>No replays yet</h2>
            <p style={{ fontSize: 13, color: "#666" }}>Past streams from models will appear here after they go live</p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .cam-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .cam-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 1400px) { .cam-grid { grid-template-columns: repeat(5, 1fr) !important; } }
      `}</style>
    </div>
  )
}
