"use client"

import { useState, useRef, useMemo } from "react"
import { Search, Play, Eye, ChevronDown, X, Filter } from "lucide-react"
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
    gender?: string | null
    category?: string | null
  }
}

type Props = { videos: Video[] }

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M"
  if (views >= 1000) return (views / 1000).toFixed(1) + "K"
  return views.toString()
}

// Gender options
const GENDERS = [
  { value: "", label: "All Genders" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "trans", label: "Trans" },
  { value: "couple", label: "Couples" },
]

// Category options
const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "escort", label: "Escort" },
  { value: "massage", label: "Massage" },
  { value: "cam", label: "Cam Model" },
  { value: "content", label: "Content Creator" },
  { value: "domina", label: "Domina" },
  { value: "stripper", label: "Stripper" },
]

function VideoCard({ video }: { video: Video }) {
  const listing = video.listings
  const [isHovering, setIsHovering] = useState(false)
  const previewRef = useRef<HTMLVideoElement>(null)
  
  const uploaderName = listing.display_name || listing.title || "Anonymous"
  const videoTitle = video.title || `Video by ${uploaderName}`
  const viewCount = formatViews(video.views)
  const location = [listing.city, listing.country].filter(Boolean).join(", ")

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
    <Link href={`/watch/${video.id}`} className="group block">
      {/* Thumbnail / Video */}
      <div 
        className="relative bg-gray-900 overflow-hidden cursor-pointer rounded"
        style={{ aspectRatio: "16/9" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Play button on hover */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      {/* Video info */}
      <div className="pt-2.5 pb-3">
        {/* Uploader + Location */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors truncate">
            {uploaderName}
          </span>
          {location && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-[11px] text-gray-500 truncate">{location}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-medium text-white leading-tight line-clamp-2 group-hover:text-gray-300 transition-colors">
          {videoTitle}
        </h3>

        {/* Views */}
        <div className="flex items-center gap-1 text-gray-500 mt-1">
          <Eye className="w-3 h-3" />
          <span className="text-[11px]">{viewCount} views</span>
        </div>
      </div>
    </Link>
  )
}

export default function VideoGrid({ videos }: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "most_viewed">("newest")
  const [gender, setGender] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique countries from videos
  const countries = useMemo(() => {
    const set = new Set<string>()
    videos.forEach(v => {
      if (v.listings.country) set.add(v.listings.country)
    })
    return Array.from(set).sort()
  }, [videos])

  const filtered = videos
    .filter(v => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const name = (v.listings.title + " " + (v.listings.display_name || "")).toLowerCase()
        const title = (v.title || "").toLowerCase()
        if (!name.includes(searchLower) && !title.includes(searchLower)) return false
      }
      // Gender filter
      if (gender && v.listings.gender !== gender) return false
      // Category filter
      if (category && v.listings.category !== category) return false
      // Country filter
      if (country && v.listings.country !== country) return false
      return true
    })
    .sort((a, b) => {
      if (sort === "most_viewed") return b.views - a.views
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const activeFilters = [gender, category, country].filter(Boolean).length
  
  const clearFilters = () => {
    setGender("")
    setCategory("")
    setCountry("")
    setSearch("")
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-5">
        {/* Top row: Search + Sort + Filter button */}
        <div className="flex items-center gap-2 mb-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              placeholder="Search videos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="bg-[#1a1a1a] border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="most_viewed">Most Viewed</option>
          </select>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? "bg-red-600 text-white"
                : "bg-[#1a1a1a] border border-gray-800 text-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 bg-white text-red-600 rounded-full text-xs font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Video count */}
          <span className="text-sm text-gray-500 ml-auto hidden sm:block">{filtered.length} videos</span>
        </div>

        {/* Filter dropdowns (collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#151515] rounded border border-gray-800">
            {/* Gender */}
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              {GENDERS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Country */}
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Clear filters */}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Active filter pills (mobile) */}
        {!showFilters && activeFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {gender && (
              <button
                onClick={() => setGender("")}
                className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
              >
                {GENDERS.find(g => g.value === gender)?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            {category && (
              <button
                onClick={() => setCategory("")}
                className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
              >
                {CATEGORIES.find(c => c.value === category)?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            {country && (
              <button
                onClick={() => setCountry("")}
                className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs"
              >
                {country}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Mobile video count */}
        <div className="text-sm text-gray-500 mt-2 sm:hidden">{filtered.length} videos</div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Play className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No videos found</p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-red-500 text-sm mt-2">
              Clear filters
            </button>
          )}
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
