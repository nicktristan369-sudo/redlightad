"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Video, Users, Camera } from "lucide-react"
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

const TABS = ["Featured", "New", "Private", "All"] as const

export default function CamDirectoryPage() {
  const [listings, setListings] = useState<CamListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("All")

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("listings")
      .select("id, title, display_name, profile_image, age, city, cam_live, cam_title, cam_viewers, cam_category, gender, category, premium_tier")
      .eq("status", "active")
      .eq("cam_live", true)
      .order("cam_viewers", { ascending: false })
      .then(({ data }) => {
        setListings((data as CamListing[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = listings.filter(l => {
    if (activeTab === "All") return true
    if (activeTab === "Featured") return l.premium_tier && ["featured", "vip"].includes(l.premium_tier)
    if (activeTab === "Private") return l.cam_category === "private"
    if (activeTab === "New") return true // TODO: sort by cam_started_at
    return true
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#fff" }}>
      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, color: "#9CA3AF", fontSize: 13, fontWeight: 500, textDecoration: "none", padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              redlightad.com
            </Link>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                RedLight<span style={{ color: "#DC2626" }}>Cam</span>
              </h1>
              <div style={{ width: 48, height: 3, background: "#DC2626", borderRadius: 2, marginTop: 6 }} />
            </div>
          </div>
          <Link href="/dashboard/go-live"
            style={{ padding: "10px 20px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <Video size={16} /> Go Live
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: activeTab === tab ? "#DC2626" : "#1A1A1A",
                color: activeTab === tab ? "#fff" : "#9CA3AF",
                transition: "all 0.15s",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: 28, height: 28, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Camera size={36} color="#555" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>No live cams right now</h2>
            <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px" }}>Be the first to go live</p>
            <Link href="/dashboard/go-live"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              <Video size={16} /> Go Live
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}>
            {filtered.map(listing => (
              <Link key={listing.id} href={`/cam/${listing.id}`}
                style={{ textDecoration: "none", color: "#fff" }}>
                <div style={{
                  background: "#1A1A1A", borderRadius: 12, overflow: "hidden",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(220,38,38,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  {/* Thumbnail */}
                  <div style={{ position: "relative", aspectRatio: "16/9", background: "#111", overflow: "hidden" }}>
                    {listing.profile_image ? (
                      <img src={listing.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Video size={32} color="#333" />
                      </div>
                    )}
                    {/* LIVE badge */}
                    <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5, background: "rgba(220,38,38,0.9)", padding: "3px 8px", borderRadius: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>LIVE</span>
                    </div>
                    {/* Viewers */}
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 6 }}>
                      <Users size={10} color="#fff" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{listing.cam_viewers}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {listing.profile_image && (
                        <img src={listing.profile_image} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #333" }} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {listing.display_name || listing.title}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                      {[listing.age, listing.city].filter(Boolean).join(" · ")}
                    </p>
                    {/* Tags */}
                    <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                      {listing.category && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#2A2A2A", color: "#aaa" }}>
                          {listing.category}
                        </span>
                      )}
                      {listing.gender && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#2A2A2A", color: "#aaa" }}>
                          {listing.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 640px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (min-width: 1400px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: repeat(5, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
