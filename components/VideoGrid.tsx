"use client"

import { useState } from "react"
import { Search, Play, Share2, Bookmark, User } from "lucide-react"
import Link from "next/link"

type Video = {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  is_locked: boolean
  redcoin_price: number
  views: number
  likes: number
  created_at: string
  listing_id: string
  listings: {
    id: string
    title: string
    city: string | null
    country: string | null
    profile_image: string | null
    premium_tier: string | null
  }
}

type Props = { videos: Video[] }

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function VideoCard({ video, onShare, mobile = false }: { video: Video; onShare: (v: Video) => void; mobile?: boolean }) {
  const listing = video.listings
  const isVip = listing.premium_tier === "vip"
  const isFeatured = listing.premium_tier === "featured"
  const location = [listing.city, listing.country].filter(Boolean).join(", ").toUpperCase()

  const handlePlay = () => {
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {})
    window.location.href = `/ads/${listing.id}#videos`
  }

  return (
    <div style={{ background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer group"
        style={{ aspectRatio: "3/4", overflow: "hidden", background: "#0a0a0a" }}
        onClick={handlePlay}
      >
        {/* Image / video frame */}
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <video
            src={`${video.url}#t=1`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Dark gradient overlay at bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
        }} />

        {/* VIP badge */}
        {(isVip || isFeatured) && (
          <div style={{
            position: "absolute", top: mobile ? 6 : 10, left: mobile ? 6 : 10,
            background: isVip ? "#F59E0B" : "#6B7280",
            color: isVip ? "#000" : "#fff",
            fontSize: mobile ? 8 : 9, fontWeight: 800, letterSpacing: "0.15em",
            padding: mobile ? "2px 6px" : "3px 8px", textTransform: "uppercase",
          }}>
            {isVip ? "VIP" : "FEAT"}
          </div>
        )}

        {/* Play button — center */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: mobile ? 36 : 52, height: mobile ? 36 : 52, borderRadius: "50%",
            border: `${mobile ? 1.5 : 2}px solid rgba(255,255,255,0.85)`,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s, background 0.2s",
          }}
            className="group-hover:scale-110 group-hover:bg-red-600/70"
          >
            <Play size={mobile ? 13 : 20} fill="white" color="white" style={{ marginLeft: mobile ? 2 : 3 }} />
          </div>
        </div>

        {/* Name + location bottom-left */}
        <div style={{ position: "absolute", bottom: mobile ? 6 : 10, left: mobile ? 8 : 12, right: mobile ? 8 : 12 }}>
          <p style={{
            fontSize: mobile ? 10 : 13, fontWeight: 800, color: "#fff",
            letterSpacing: "0.04em", textTransform: "uppercase",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            lineHeight: 1.2, marginBottom: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {listing.title}
          </p>
          {location && (
            <p style={{
              fontSize: mobile ? 8 : 10, color: "rgba(255,255,255,0.70)",
              letterSpacing: "0.04em", textTransform: "uppercase",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        display: "flex", alignItems: "center",
        background: "#1a1a1a", borderTop: "1px solid #2a2a2a",
      }}>
        <Link
          href={`/ads/${listing.id}`}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: mobile ? "9px 0" : "12px 0", borderRight: "1px solid #2a2a2a",
            color: "rgba(255,255,255,0.55)", textDecoration: "none",
          }}
        >
          <User size={mobile ? 13 : 16} />
        </Link>
        <button onClick={handlePlay} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: mobile ? "9px 0" : "12px 0", borderRight: "1px solid #2a2a2a",
          color: "rgba(255,255,255,0.55)", background: "none", cursor: "pointer",
        }}>
          <Play size={mobile ? 13 : 16} />
        </button>
        <button onClick={() => onShare(video)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: mobile ? "9px 0" : "12px 0", borderRight: "1px solid #2a2a2a",
          color: "rgba(255,255,255,0.55)", background: "none", cursor: "pointer",
        }}>
          <Share2 size={mobile ? 13 : 16} />
        </button>
        <button style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: mobile ? "9px 0" : "12px 0",
          color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer",
        }}>
          <Bookmark size={mobile ? 13 : 16} />
        </button>
      </div>
    </div>
  )
}

export default function VideoGrid({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "most_viewed" | "most_liked">("newest")
  const [toast, setToast] = useState<string | null>(null)

  const filtered = videos
    .filter(v => !search || v.listings.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "most_viewed") return b.views - a.views
      if (sort === "most_liked") return b.likes - a.likes
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleShare = (video: Video) => {
    navigator.clipboard.writeText(`https://redlightad.com/ads/${video.listings.id}#videos`)
    setToast("Link copied!")
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#555" }} />
          <input
            placeholder="Search profiles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#fff", border: "1px solid #E5E7EB",
              color: "#111", padding: "10px 12px 10px 36px", fontSize: 14,
              outline: "none",
            }}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          style={{
            background: "#fff", border: "1px solid #E5E7EB", color: "#374151",
            padding: "10px 16px", fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          <option value="newest">Newest</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#555" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#777" }}>No videos found</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Check back soon for new content</p>
        </div>
      ) : (
        <>
          {/* Mobile: 2 cols */}
          <div className="grid md:hidden gap-[2px]" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {filtered.map(v => (
              <VideoCard key={v.id} video={v} onShare={handleShare} mobile />
            ))}
          </div>
          {/* Desktop: 3 cols */}
          <div className="hidden md:grid gap-[2px]" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {filtered.map(v => (
              <VideoCard key={v.id} video={v} onShare={handleShare} />
            ))}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-4 py-2 shadow-lg"
          style={{ background: "#DC2626" }}>
          {toast}
        </div>
      )}
    </>
  )
}
