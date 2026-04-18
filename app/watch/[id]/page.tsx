"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { ThumbsUp, ThumbsDown, Heart, Plus, Share2, Flag, Eye, Clock, ChevronRight, Play, CheckCircle, ArrowLeft } from "lucide-react"

interface VideoData {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  views: number
  likes: number
  created_at: string
  listing_id: string
  listing: {
    id: string
    title: string
    display_name: string | null
    profile_image: string | null
    city: string | null
    country: string
    premium_tier: string | null
  }
}

interface RelatedVideo {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  views: number
  listing: {
    id: string
    title: string
    display_name: string | null
    profile_image: string | null
  }
}

export default function WatchVideoPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string
  
  const [video, setVideo] = useState<VideoData | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [profileVideos, setProfileVideos] = useState<RelatedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [showShareToast, setShowShareToast] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const loadVideo = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)

      // Fetch video with listing info
      const { data: videoData, error } = await supabase
        .from("listing_videos")
        .select(`
          id, url, thumbnail_url, title, views, likes, created_at, listing_id,
          listings!inner(id, title, display_name, profile_image, city, country, premium_tier)
        `)
        .eq("id", videoId)
        .single()

      if (error || !videoData) {
        router.push("/videos")
        return
      }

      // Transform data
      const transformed: VideoData = {
        ...videoData,
        listing: videoData.listings as any
      }
      setVideo(transformed)

      // Increment view count
      await fetch("/api/videos/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })

      // Fetch more videos from same profile
      const { data: profileVids } = await supabase
        .from("listing_videos")
        .select(`
          id, url, thumbnail_url, title, views,
          listings!inner(id, title, display_name, profile_image)
        `)
        .eq("listing_id", videoData.listing_id)
        .neq("id", videoId)
        .limit(4)

      if (profileVids) {
        setProfileVideos(profileVids.map((v: any) => ({ ...v, listing: v.listings })))
      }

      // Fetch related videos from other profiles
      const { data: related } = await supabase
        .from("listing_videos")
        .select(`
          id, url, thumbnail_url, title, views,
          listings!inner(id, title, display_name, profile_image)
        `)
        .neq("listing_id", videoData.listing_id)
        .order("views", { ascending: false })
        .limit(8)

      if (related) {
        setRelatedVideos(related.map((v: any) => ({ ...v, listing: v.listings })))
      }

      setLoading(false)
    }

    loadVideo()
  }, [videoId, router])

  const formatViews = (views: number): string => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M"
    if (views >= 1000) return (views / 1000).toFixed(1) + "K"
    return views.toString()
  }

  const formatDate = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  const handleLike = async () => {
    if (!currentUser) return
    setLiked(!liked)
    if (disliked) setDisliked(false)
  }

  const handleDislike = async () => {
    if (!currentUser) return
    setDisliked(!disliked)
    if (liked) setLiked(false)
  }

  const handleFavorite = async () => {
    if (!currentUser) return
    setFavorited(!favorited)
  }

  const handleSubscribe = async () => {
    if (!currentUser) return
    setSubscribed(!subscribed)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title || "Video",
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!video) return null

  const uploaderName = video.listing.display_name || video.listing.title
  const videoTitle = video.title || `Video by ${uploaderName}`
  const location = [video.listing.city, video.listing.country].filter(Boolean).join(", ")
  const isVerified = video.listing.premium_tier === "vip" || video.listing.premium_tier === "featured"

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Desktop only */}
      <header className="hidden md:block sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#DC2626" }}>RED</span>
              <span style={{ color: "#fff" }}>LIGHTAD</span>
            </span>
          </Link>
          <Link href="/videos" className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-1">
            ← Back to Videos
          </Link>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Main content */}
          <div className="flex-1 lg:max-w-[calc(100%-380px)]">
            {/* Video Player */}
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                src={video.url}
                controls
                autoPlay
                playsInline
                poster={video.thumbnail_url || video.listing.profile_image || undefined}
                className="w-full h-full"
                style={{ WebkitMediaControls: 'default' } as any}
              />
            </div>

            {/* Mobile: Back button below video */}
            <div className="md:hidden px-3 pt-2">
              <Link href="/videos" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Videos</span>
              </Link>
            </div>

            {/* Video Info */}
            <div className="px-3 md:px-4 py-3 md:py-4">
              {/* Title */}
              <h1 className="text-white text-base md:text-xl font-bold mb-2 md:mb-3 leading-tight line-clamp-2">
                {videoTitle}
              </h1>

              {/* Stats Row - Mobile */}
              <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm mb-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {formatViews(video.views)}
                </span>
                <span>•</span>
                <span>{formatDate(video.created_at)}</span>
              </div>

              {/* Action Buttons - Scrollable on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-3 px-3 md:mx-0 md:px-0 md:overflow-visible md:flex-wrap border-b border-gray-800 scrollbar-hide">
                {/* Like/Dislike */}
                <div className="flex items-center bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
                  <button 
                    onClick={handleLike}
                    className={`flex items-center gap-1 px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors ${liked ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700"}`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
                    <span>{video.likes + (liked ? 1 : 0)}</span>
                  </button>
                  <div className="w-px h-5 bg-gray-700" />
                  <button 
                    onClick={handleDislike}
                    className={`flex items-center px-3 md:px-4 py-2 transition-colors ${disliked ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700"}`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${disliked ? "fill-white" : ""}`} />
                  </button>
                </div>

                {/* Favorite */}
                <button 
                  onClick={handleFavorite}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${favorited ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  <Heart className={`w-4 h-4 ${favorited ? "fill-white" : ""}`} />
                  <span>Save</span>
                </button>

                {/* Share */}
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-gray-800 rounded-full text-gray-300 hover:bg-gray-700 text-xs md:text-sm font-medium transition-colors flex-shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                {/* Add to - Desktop only */}
                <button className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gray-800 rounded-full text-gray-300 hover:bg-gray-700 text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add to</span>
                </button>

                {/* Report */}
                <button className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-gray-800 rounded-full text-gray-300 hover:bg-gray-700 text-xs md:text-sm font-medium transition-colors flex-shrink-0">
                  <Flag className="w-4 h-4" />
                  <span className="hidden md:inline">Report</span>
                </button>
              </div>

              {/* Uploader Info */}
              <div className="py-3 md:py-4">
                {/* Mobile Layout */}
                <div className="lg:hidden">
                  {/* Profile row - horizontal layout */}
                  <div className="flex items-center gap-2.5">
                    {/* Profile Image */}
                    <Link href={`/ads/${video.listing.id}`} className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                        {video.listing.profile_image ? (
                          <img 
                            src={video.listing.profile_image} 
                            alt={uploaderName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
                            {uploaderName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Name - single line truncated */}
                    <Link href={`/ads/${video.listing.id}`} className="flex-1 min-w-0 hover:opacity-80">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm truncate">{uploaderName}</span>
                        {isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-400 text-[11px]">
                        {profileVideos.length + 1} Videos
                      </p>
                    </Link>

                    {/* See Profile Button */}
                    <Link
                      href={`/ads/${video.listing.id}`}
                      className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded"
                    >
                      Profile
                    </Link>

                    {/* Subscribe Button */}
                    <button
                      onClick={handleSubscribe}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded ${
                        subscribed 
                          ? "bg-gray-700 text-white" 
                          : "bg-white/10 border border-white/30 text-white"
                      }`}
                    >
                      {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Profile Image */}
                      <Link href={`/ads/${video.listing.id}`} className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                          {video.listing.profile_image ? (
                            <img 
                              src={video.listing.profile_image} 
                              alt={uploaderName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                              {uploaderName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Name & Stats */}
                      <div>
                        <Link href={`/ads/${video.listing.id}`} className="flex items-center gap-1.5 hover:opacity-80">
                          <span className="text-white font-semibold text-[15px]">{uploaderName}</span>
                          {isVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                          )}
                        </Link>
                        <p className="text-gray-400 text-sm">
                          {profileVideos.length + 1} Videos{location ? ` • ${location}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/ads/${video.listing.id}`}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded transition-colors"
                      >
                        See My Profile
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={handleSubscribe}
                        className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded transition-colors ${
                          subscribed 
                            ? "bg-gray-700 text-white" 
                            : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                        }`}
                      >
                        {subscribed ? "Subscribed ✓" : "Subscribe"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* More from this profile */}
              {profileVideos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-white font-semibold text-sm md:text-base mb-3">More from {uploaderName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {profileVideos.map(v => (
                      <Link key={v.id} href={`/watch/${v.id}`} className="group">
                        <div className="relative aspect-video bg-gray-900 overflow-hidden rounded">
                          {v.thumbnail_url || v.listing.profile_image ? (
                            <img 
                              src={v.thumbnail_url || v.listing.profile_image!}
                              alt={v.title || "Video"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 md:w-8 h-6 md:h-8 text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Play className="w-8 md:w-10 h-8 md:h-10 text-white fill-white" />
                          </div>
                        </div>
                        <p className="text-gray-300 text-[11px] md:text-xs mt-1.5 line-clamp-1">{v.title || "Video"}</p>
                        <p className="text-gray-500 text-[10px] md:text-xs">{formatViews(v.views)} views</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Videos - Mobile only (shows below main content) */}
              {relatedVideos.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-800 lg:hidden">
                  <h3 className="text-white font-semibold text-sm mb-3">Related Videos</h3>
                  <div className="space-y-3">
                    {relatedVideos.slice(0, 6).map(v => (
                      <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-3 group">
                        <div className="relative w-36 flex-shrink-0 aspect-video bg-gray-900 overflow-hidden rounded">
                          {v.thumbnail_url || v.listing.profile_image ? (
                            <img 
                              src={v.thumbnail_url || v.listing.profile_image!}
                              alt={v.title || "Video"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium line-clamp-2">
                            {v.title || `Video by ${v.listing.display_name || v.listing.title}`}
                          </p>
                          <p className="text-gray-400 text-[11px] mt-1">
                            {v.listing.display_name || v.listing.title}
                          </p>
                          <p className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">
                            <Eye className="w-3 h-3" />
                            {formatViews(v.views)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related Videos (Desktop only) */}
          <div className="hidden lg:block lg:w-[380px] lg:border-l border-gray-800 p-4">
            <h3 className="text-white font-semibold mb-4">Related Videos</h3>
            <div className="space-y-3">
              {relatedVideos.map(v => (
                <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-3 group">
                  <div className="relative w-40 flex-shrink-0 aspect-video bg-gray-900 overflow-hidden rounded">
                    {v.thumbnail_url || v.listing.profile_image ? (
                      <img 
                        src={v.thumbnail_url || v.listing.profile_image!}
                        alt={v.title || "Video"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-gray-300 transition-colors">
                      {v.title || `Video by ${v.listing.display_name || v.listing.title}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {v.listing.display_name || v.listing.title}
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3" />
                      {formatViews(v.views)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Link copied!
        </div>
      )}
    </div>
  )
}
