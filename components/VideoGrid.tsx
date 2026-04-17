"use client"

import { useState, useRef } from "react"
import { Search, Play, Eye } from "lucide-react"
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

// Duration will be added later when we add that field to the database

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M"
  if (views >= 1000) return (views / 1000).toFixed(1) + "K"
  return views.toString()
}

function VideoCard({ video }: { video: Video }) {
  const listing = video.listings
  const [playing, setPlaying] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  
  const uploaderName = listing.display_name || listing.title || "Anonymous"
  const videoTitle = video.title || `Video by ${uploaderName}`
  const viewCount = formatViews(video.views)

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

  const handleMouseEnter = () => {
    setIsHovering(true)
    previewRef.current?.play()
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (previewRef.current) {
      previewRef.current.pause()
      previewRef.current.currentTime = 0
    }
  }

  return (
    <div className="group">
      {/* Thumbnail / Video */}
      <div 
        className="relative bg-gray-900 overflow-hidden cursor-pointer"
        style={{ aspectRatio: "16/9" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handlePlay}
      >
        {playing ? (
          <video
            ref={videoRef}
            src={video.url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            {/* Video preview on hover */}
            {video.url && isHovering ? (
              <video
                ref={previewRef}
                src={`${video.url}#t=0.5`}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={video.thumbnail_url || listing.profile_image || "/placeholder-video.jpg"}
                alt={videoTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}



            {/* Play button on hover */}
            <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Video info */}
      <div className="pt-2.5 pb-3">
        {/* Uploader + Views row */}
        <div className="flex items-center gap-2 mb-1">
          <Link 
            href={`/ads/${listing.id}`}
            className="text-[12px] font-medium text-gray-300 hover:text-white transition-colors truncate"
          >
            {uploaderName}
          </Link>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1 text-gray-500">
            <Eye className="w-3 h-3" />
            <span className="text-[11px]">{viewCount}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/ads/${listing.id}#videos`}>
          <h3 className="text-[13px] font-medium text-white leading-tight line-clamp-2 hover:text-gray-300 transition-colors">
            {videoTitle}
          </h3>
        </Link>
      </div>
    </div>
  )
}

export default function VideoGrid({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "most_viewed">("newest")

  const filtered = videos
    .filter(v => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      const name = (v.listings.title + " " + (v.listings.display_name || "")).toLowerCase()
      const title = (v.title || "").toLowerCase()
      return name.includes(searchLower) || title.includes(searchLower)
    })
    .sort((a, b) => {
      if (sort === "most_viewed") return b.views - a.views
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <input
            placeholder="Search videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-800 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="bg-[#1a1a1a] border border-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="most_viewed">Most Viewed</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} videos</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Play className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(v => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </>
  )
}
