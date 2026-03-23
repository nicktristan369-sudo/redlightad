"use client"

import { useState } from "react"
import { Play, Lock, Eye, Heart, Share2, Search } from "lucide-react"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"

type Video = {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  is_locked: boolean
  redcoin_price: number
  views: number
  likes: number
  duration: number | null
  created_at: string
  listings: {
    name: string
    city: string | null
    country: string | null
    slug: string
  }
}

type Props = { videos: Video[] }

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function getCountryCode(countryName: string | null): string | null {
  if (!countryName) return null
  const c = SUPPORTED_COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  )
  return c?.code || null
}

export default function VideoGrid({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "most_viewed" | "most_liked">("newest")
  const [toast, setToast] = useState<string | null>(null)

  const filteredVideos = videos
    .filter((v) => !search || v.listings.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "most_viewed") return b.views - a.views
      if (sort === "most_liked") return b.likes - a.likes
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleCardClick = (video: Video) => {
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id }),
    })
    window.location.href = `/ads/${video.listings.slug}#videos`
  }

  const handleShare = (video: Video) => {
    navigator.clipboard.writeText(`https://redlightad.com/ads/${video.listings.slug}#videos`)
    setToast("Link copied!")
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:outline-none transition-all"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-gray-300 focus:outline-none transition-all"
        >
          <option value="newest">Newest</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>

      {/* Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h2>
          <p className="text-gray-500">Check back soon for new content</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredVideos.map((video) => {
            const countryCode = getCountryCode(video.listings.country)
            return (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => handleCardClick(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Play className="w-10 h-10 text-gray-600" />
                    </div>
                  )}

                  {/* Lock overlay */}
                  {video.is_locked && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                      <Lock className="w-6 h-6 text-white" />
                      <span className="text-white text-xs font-medium">
                        {video.redcoin_price} RedCoins
                      </span>
                    </div>
                  )}

                  {/* Duration badge */}
                  {video.duration != null && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* Info row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {video.listings.name}
                      {countryCode && (
                        <span
                          className={`ml-1.5 fi fi-${countryCode}`}
                          style={{ width: 16, height: 11, display: "inline-block", verticalAlign: "middle" }}
                        />
                      )}
                    </p>
                    {(video.listings.city || video.listings.country) && (
                      <p className="text-xs text-gray-500 truncate">
                        {[video.listings.city, video.listings.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatCount(video.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatCount(video.likes)}
                      </span>
                    </div>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(video)
                    }}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
