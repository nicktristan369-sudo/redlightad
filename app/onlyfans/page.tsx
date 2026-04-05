"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

interface Listing {
  id: string
  title: string | null
  display_name: string | null
  profile_image: string | null
  profile_video_url: string | null
  social_links: Record<string, { url?: string; locked?: boolean; price_coins?: number }> | null
  onlyfans_username: string | null
  onlyfans_price_usd: number | null
  age: number | null
  city: string | null
  country: string | null
  boost_score: number | null
}

function VideoCard({ listing }: { listing: Listing }) {
  const [hovered, setHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (hovered && videoRef.current) {
      videoRef.current.play().catch(() => {})
    } else if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [hovered])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail / Video — 16:9 */}
      <div style={{
        position: "relative",
        paddingBottom: "56.25%",
        background: "#1a1a1a",
        overflow: "hidden",
        borderRadius: 8,
      }}>
        {listing.profile_image && (
          <img
            src={listing.profile_image}
            alt=""
            loading="lazy"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
            }}
          />
        )}

        {listing.profile_video_url && hovered && (
          <video
            ref={videoRef}
            src={listing.profile_video_url}
            muted
            playsInline
            loop
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%", objectFit: "cover",
            }}
          />
        )}

        {/* Price badge */}
        {listing.onlyfans_price_usd && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,0.85)", color: "#00AFF0",
            fontSize: 11, fontWeight: 700,
            padding: "3px 8px", borderRadius: 6,
          }}>
            from ${listing.onlyfans_price_usd}/mo
          </div>
        )}

        {/* Avatar overlay */}
        {listing.profile_image && (
          <div style={{
            position: "absolute", bottom: 8, left: 8,
            width: 36, height: 36, borderRadius: "50%",
            overflow: "hidden", border: "2px solid #0F0F0F",
            background: "#333",
          }}>
            <img
              src={listing.profile_image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>

      {/* Info under thumbnail */}
      <div style={{ display: "flex", gap: 10, padding: "10px 2px" }}>
        <img
          src={listing.profile_image || "/placeholder.png"}
          alt=""
          style={{
            width: 36, height: 36, borderRadius: "50%",
            objectFit: "cover", flexShrink: 0, background: "#333",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {listing.display_name || listing.title || "Creator"}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {listing.onlyfans_username ? `@${listing.onlyfans_username}` : listing.city || ""}
            {listing.age ? ` · ${listing.age}` : ""}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnlyFansDirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchListings = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("listings")
      .select("id, title, display_name, profile_image, profile_video_url, social_links, onlyfans_username, onlyfans_price_usd, age, city, country, boost_score")
      .eq("status", "active")
      .order("boost_score", { ascending: false })
      .order("created_at", { ascending: false })

    // Filter client-side: must have social_links->onlyfans->url
    const filtered = (data ?? []).filter((l: Listing) =>
      l.social_links?.onlyfans?.url
    )
    setListings(filtered)
    setLoading(false)
  }, [])

  useEffect(() => { fetchListings() }, [fetchListings])

  const filtered = search.trim()
    ? listings.filter(l => {
        const q = search.toLowerCase()
        return (
          (l.display_name || "").toLowerCase().includes(q) ||
          (l.title || "").toLowerCase().includes(q) ||
          (l.onlyfans_username || "").toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q)
        )
      })
    : listings

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F" }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* Header */}
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          OnlyFans{" "}
          <span style={{ color: "#00AFF0" }}>Directory</span>
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
          {filtered.length} creators · Browse and discover
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search creators..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 400,
            padding: "10px 16px", borderRadius: 24,
            background: "#272727", border: "1px solid #3f3f3f",
            color: "#fff", fontSize: 14, marginBottom: 28,
            outline: "none",
          }}
        />

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #333",
              borderTop: "3px solid #00AFF0", borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#666", fontSize: 13 }}>Loading creators...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#666", fontSize: 15 }}>
              {search ? "No creators found matching your search." : "No OnlyFans creators yet."}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}>
            {filtered.map(listing => (
              <Link
                href={`/ads/${listing.id}`}
                key={listing.id}
                style={{ textDecoration: "none" }}
              >
                <VideoCard listing={listing} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
