"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

interface Listing {
  id: string
  title: string | null
  display_name: string | null
  profile_image: string | null
  about: string | null
  social_links: Record<string, { url?: string; locked?: boolean; price_coins?: number }> | null
  onlyfans_username: string | null
  onlyfans_price_usd: number | null
  onlyfans_bio: string | null
  onlyfans_subscribers: number | null
  onlyfans_photos_count: number | null
  onlyfans_videos_count: number | null
  onlyfans_likes_count: number | null
  premium_tier: string | null
  created_at: string
  boost_score: number | null
}

type SortOption = "subscribers" | "newest" | "price"

function extractOFHandle(url: string, username?: string | null): string {
  if (username) return username
  if (!url) return ""
  return url.replace(/^https?:\/\/(www\.)?onlyfans\.com\//i, "").split("?")[0].split("/")[0]
}

function OFCard({ l }: { l: Listing }) {
  const ofUrl = l.social_links?.onlyfans?.url || ""
  const handle = extractOFHandle(ofUrl, l.onlyfans_username)
  const price = l.onlyfans_price_usd ? `$${l.onlyfans_price_usd}/mo` : "FREE"

  return (
    <div
      style={{
        display: "flex", gap: 20, padding: "20px 0",
        borderBottom: "1px solid #1f1f1f",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
    >
      {/* Avatar */}
      <img
        src={l.profile_image || "/placeholder.png"}
        alt=""
        loading="lazy"
        style={{
          width: 80, height: 80, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0, background: "#333",
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: "#888" }}>onlyfans.com/{handle}</span>
          {/* Social icons */}
          {l.social_links?.tiktok?.url && (
            <a href={l.social_links.tiktok.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#666", textDecoration: "none" }} title="TikTok">🎵</a>
          )}
          {l.social_links?.instagram?.url && (
            <a href={l.social_links.instagram.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#666", textDecoration: "none" }} title="Instagram">📷</a>
          )}
        </div>
        <Link href={`/ads/${l.id}`} style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            {l.display_name || l.title || "Creator"}
          </div>
        </Link>
        <div style={{
          fontSize: 13, color: "#aaa", marginBottom: 10,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
        }}>
          {(l.onlyfans_bio || l.about || "").slice(0, 200)}
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#888" }}>
          {(l.onlyfans_subscribers ?? 0) > 0 && <span>👤 {l.onlyfans_subscribers!.toLocaleString()}</span>}
          <span style={{ color: "#00AFF0", fontWeight: 700 }}>Price: {price}</span>
          {(l.onlyfans_photos_count ?? 0) > 0 && <span>📸 {l.onlyfans_photos_count!.toLocaleString()}</span>}
          {(l.onlyfans_videos_count ?? 0) > 0 && <span>🎬 {l.onlyfans_videos_count!.toLocaleString()}</span>}
          {(l.onlyfans_likes_count ?? 0) > 0 && <span>❤️ {l.onlyfans_likes_count!.toLocaleString()}</span>}
        </div>
      </div>

      {/* VIP badge */}
      {l.premium_tier && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#F59E0B",
          background: "#1a1200", padding: "3px 8px", borderRadius: 6,
          height: "fit-content",
        }}>
          VIP
        </div>
      )}
    </div>
  )
}

export default function OnlyFansDirectoryPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("subscribers")

  const fetchListings = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("listings")
      .select("id, title, display_name, profile_image, about, social_links, onlyfans_username, onlyfans_price_usd, onlyfans_bio, onlyfans_subscribers, onlyfans_photos_count, onlyfans_videos_count, onlyfans_likes_count, premium_tier, created_at, boost_score")
      .eq("status", "active")
      .order("boost_score", { ascending: false })
      .order("created_at", { ascending: false })

    const filtered = (data ?? []).filter((l: Listing) =>
      l.social_links?.onlyfans?.url || l.onlyfans_username
    )
    setListings(filtered)
    setLoading(false)
  }, [])

  useEffect(() => { fetchListings() }, [fetchListings])

  // Filter by search
  const searched = search.trim()
    ? listings.filter(l => {
        const q = search.toLowerCase()
        return (
          (l.display_name || "").toLowerCase().includes(q) ||
          (l.title || "").toLowerCase().includes(q) ||
          (l.onlyfans_username || "").toLowerCase().includes(q)
        )
      })
    : listings

  // Sort
  const sorted = [...searched].sort((a, b) => {
    if (sort === "subscribers") return (b.onlyfans_subscribers ?? 0) - (a.onlyfans_subscribers ?? 0)
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    // price: free first, then asc
    const aP = a.onlyfans_price_usd ?? 0
    const bP = b.onlyfans_price_usd ?? 0
    if (aP === 0 && bP > 0) return -1
    if (bP === 0 && aP > 0) return 1
    return aP - bP
  })

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* Header */}
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          OnlyFans <span style={{ color: "#00AFF0" }}>Directory</span>
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
          {sorted.length} creators
        </p>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, maxWidth: 400,
              padding: "10px 16px", borderRadius: 24,
              background: "#272727", border: "1px solid #3f3f3f",
              color: "#fff", fontSize: 14, outline: "none",
            }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{
              padding: "10px 16px", borderRadius: 24,
              background: "#272727", border: "1px solid #3f3f3f",
              color: "#fff", fontSize: 13, outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="subscribers">Most subscribers</option>
            <option value="newest">Newest</option>
            <option value="price">Price</option>
          </select>
        </div>

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

        {/* Empty */}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#666", fontSize: 15 }}>
              {search ? "No creators found." : "No OnlyFans creators yet."}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && sorted.length > 0 && (
          <div>
            {sorted.map(l => <OFCard key={l.id} l={l} />)}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
