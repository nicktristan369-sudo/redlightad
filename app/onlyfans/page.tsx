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
  const clean = (s: string) => s.replace(/^https?:\/\/(www\.)?onlyfans\.com\//i, "").split("?")[0].split("/")[0].trim()
  if (username) return clean(username)
  if (!url) return ""
  return clean(url)
}

function OFCard({ l }: { l: Listing }) {
  const ofUrl = l.social_links?.onlyfans?.url || ""
  const handle = extractOFHandle(ofUrl, l.onlyfans_username)
  const price = l.onlyfans_price_usd ? `$${l.onlyfans_price_usd}/mo` : "FREE"
  // Strip emojis from display name
  const cleanName = (l.display_name || l.title || "Creator").replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|❤️|💋|🔴/gu, "").trim()

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 16,
      padding: 20,
      display: "flex",
      gap: 18,
      transition: "box-shadow 0.15s",
      marginBottom: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)" }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none" }}
    >
      {/* Square avatar */}
      <div style={{ flexShrink: 0 }}>
        <img
          src={l.profile_image || "/placeholder.png"}
          alt=""
          loading="lazy"
          style={{ width: 90, height: 90, borderRadius: 12, objectFit: "cover", background: "#F3F4F6", display: "block" }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* OF handle */}
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, fontWeight: 500 }}>
          onlyfans.com/{handle}
        </div>

        {/* Name */}
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 4, lineHeight: 1.2 }}>
          {cleanName}
        </div>

        {/* Bio */}
        <div style={{
          fontSize: 13, color: "#6B7280", marginBottom: 12, lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
        }}>
          {l.onlyfans_bio || l.about || ""}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "3px 10px", borderRadius: 20 }}>
            {price}
          </span>
          {(l.onlyfans_subscribers ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {l.onlyfans_subscribers!.toLocaleString()} subscribers
            </span>
          )}
          {(l.onlyfans_photos_count ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: "#6B7280" }}>{l.onlyfans_photos_count} photos</span>
          )}
          {(l.onlyfans_videos_count ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: "#6B7280" }}>{l.onlyfans_videos_count} videos</span>
          )}
          {l.premium_tier && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#FFF7ED", padding: "2px 8px", borderRadius: 20 }}>
              VIP
            </span>
          )}
        </div>

        {/* See profile button */}
        <Link
          href={`/ads/${l.id}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700, color: "#DC2626",
            textDecoration: "none", border: "1px solid #FECACA",
            padding: "6px 14px", borderRadius: 20, background: "#FEF2F2",
            transition: "all 0.15s",
          }}
        >
          See profile on RedLightAD →
        </Link>
      </div>
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
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* Header */}
        <h1 style={{ color: "#111", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          OnlyFans <span style={{ color: "#00AFF0" }}>Directory</span>
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>
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
              background: "#fff", border: "1px solid #E5E7EB",
              color: "#111", fontSize: 14, outline: "none",
            }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{
              padding: "10px 16px", borderRadius: 24,
              background: "#fff", border: "1px solid #E5E7EB",
              color: "#111", fontSize: 13, outline: "none",
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
              width: 32, height: 32, border: "3px solid #E5E7EB",
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
