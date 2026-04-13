"use client"

import { useState, useRef } from "react"
import { Search, Play, Share2, User, Film } from "lucide-react"
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
  video_count?: number
  listings: {
    id: string
    title: string
    display_name?: string | null
    city: string | null
    country: string | null
    profile_image: string | null
    premium_tier: string | null
  }
}

type Props = { videos: Video[] }

function VideoCard({ video, onShare }: { video: Video; onShare: (v: Video) => void }) {
  const listing = video.listings
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVip = listing.premium_tier === "vip"
  const location = [listing.city, listing.country].filter(Boolean).join(", ")
  const name = listing.display_name || listing.title || ""
  const videoCount = video.video_count || 1

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {})
    setPlaying(true)
    setTimeout(() => videoRef.current?.play(), 50)
  }

  return (
    <div className="bg-black overflow-hidden rounded-sm group">
      {/* Video / Thumbnail */}
      <div className="relative" style={{ aspectRatio: "9/16" }}>
        {playing ? (
          <video
            ref={videoRef}
            src={video.url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            {/* Video preview — autoplay muted on hover */}
            {video.url ? (
              <video
                src={`${video.url}#t=0.5`}
                muted
                loop
                playsInline
                preload="metadata"
                poster={video.thumbnail_url || listing.profile_image || undefined}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                style={{ pointerEvents: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
              />
            ) : video.thumbnail_url || listing.profile_image ? (
              <img
                src={video.thumbnail_url || listing.profile_image!}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <Film className="w-8 h-8 text-gray-600" />
              </div>
            )}

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            {/* VIP badge */}
            {isVip && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[9px] font-black tracking-widest px-1.5 py-0.5">
                VIP
              </div>
            )}

            {/* Video count badge */}
            {videoCount > 1 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5">
                <Film className="w-2.5 h-2.5" />
                {videoCount}
              </div>
            )}

            {/* Play button */}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-11 h-11 rounded-full border-2 border-white/80 bg-black/30 flex items-center justify-center group-hover:bg-red-600/80 group-hover:border-red-500 transition-all duration-200">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </button>

            {/* Name + location */}
            <div className="absolute bottom-10 left-0 right-0 px-2.5">
              <p className="text-white text-[11px] font-bold uppercase tracking-wide truncate leading-tight">
                {name}
              </p>
              {location && (
                <p className="text-white/60 text-[10px] uppercase tracking-wide truncate mt-0.5">
                  {location}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center border-t border-white/5" style={{ background: "#111" }}>
        <Link
          href={`/ads/${listing.id}`}
          className="flex-1 flex items-center justify-center py-2.5 text-white/40 hover:text-white transition-colors border-r border-white/5"
          title="View profile"
        >
          <User className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handlePlay}
          className="flex-1 flex items-center justify-center py-2.5 text-white/40 hover:text-red-500 transition-colors border-r border-white/5"
          title="Play video"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onShare(video)}
          className="flex-1 flex items-center justify-center py-2.5 text-white/40 hover:text-white transition-colors"
          title="Share"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function VideoGrid({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "most_viewed">("newest")
  const [toast, setToast] = useState<string | null>(null)

  const filtered = videos
    .filter(v => !search || (v.listings.title + " " + (v.listings.display_name || "")).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "most_viewed") return b.views - a.views
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
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            placeholder="Search profiles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            style={{ borderRadius: 0 }}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none cursor-pointer text-gray-600"
          style={{ borderRadius: 0 }}
        >
          <option value="newest">Newest</option>
          <option value="most_viewed">Most Viewed</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} profiles</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="font-semibold">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filtered.map(v => (
            <VideoCard key={v.id} video={v} onShare={handleShare} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
