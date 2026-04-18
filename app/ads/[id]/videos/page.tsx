"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { ThumbsUp, ThumbsDown, Heart, Share2, Eye, Clock, ChevronLeft, Play, CheckCircle, ChevronRight } from "lucide-react"
import Navbar from "@/components/Navbar"

interface Video {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  views: number
  likes: number
  created_at: string
}

interface Listing {
  id: string
  title: string
  display_name: string | null
  profile_image: string | null
  city: string | null
  country: string
  premium_tier: string | null
}

export default function ProfileVideosPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      // Fetch listing info
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, title, display_name, profile_image, city, country, premium_tier")
        .eq("id", listingId)
        .single()

      if (listingError || !listingData) {
        router.push("/")
        return
      }
      setListing(listingData)

      // Fetch all videos for this listing
      const { data: videosData } = await supabase
        .from("listing_videos")
        .select("id, url, thumbnail_url, title, views, likes, created_at")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })

      if (videosData && videosData.length > 0) {
        setVideos(videosData)
        setCurrentVideo(videosData[0])
        
        // Increment view count for first video
        fetch("/api/videos/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: videosData[0].id }),
        }).catch(() => {})
      }

      setLoading(false)
    }

    load()
  }, [listingId, router])

  const playVideo = (video: Video) => {
    setCurrentVideo(video)
    setLiked(false)
    // Increment view count
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {})
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
    return `${Math.floor(days / 30)} months ago`
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentVideo?.title || "Video",
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

  if (!listing || videos.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar variant="dark" />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Play className="w-16 h-16 text-gray-600 mb-4" />
          <h1 className="text-white text-xl font-bold mb-2">No Videos</h1>
          <p className="text-gray-400 text-center mb-6">This profile hasn't uploaded any videos yet.</p>
          <Link href={`/ads/${listingId}`} className="text-red-500 font-semibold">
            ← Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  const uploaderName = listing.display_name || listing.title
  const isVerified = listing.premium_tier === "vip" || listing.premium_tier === "featured"
  const videoTitle = currentVideo?.title || `Video by ${uploaderName}`

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-5xl mx-auto">
        {/* Back to profile */}
        <div className="px-3 py-2 border-b border-gray-800">
          <Link href={`/ads/${listingId}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to {uploaderName}'s Profile</span>
          </Link>
        </div>

        {/* Video Player */}
        {currentVideo && (
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              key={currentVideo.id}
              src={currentVideo.url}
              controls
              autoPlay
              playsInline
              poster={currentVideo.thumbnail_url || listing.profile_image || undefined}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Video Info */}
        <div className="px-3 py-3">
          {/* Title */}
          <h1 className="text-white text-base md:text-lg font-bold mb-2 leading-tight line-clamp-2">
            {videoTitle}
          </h1>

          {/* Stats Row */}
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatViews(currentVideo?.views || 0)}
            </span>
            <span>•</span>
            <span>{formatDate(currentVideo?.created_at || "")}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            {/* Like */}
            <button 
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${liked ? "bg-white text-black" : "bg-gray-800 text-gray-300"}`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? "fill-black" : ""}`} />
              <span>{(currentVideo?.likes || 0) + (liked ? 1 : 0)}</span>
            </button>

            {/* Save */}
            <button 
              onClick={() => setFavorited(!favorited)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${favorited ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300"}`}
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-white" : ""}`} />
              <span>Save</span>
            </button>

            {/* Share */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-full text-gray-300 text-xs font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="py-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              {/* Profile Image */}
              <Link href={`/ads/${listing.id}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                  {listing.profile_image ? (
                    <img 
                      src={listing.profile_image} 
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

              {/* Name */}
              <Link href={`/ads/${listing.id}`} className="flex-1 min-w-0 hover:opacity-80">
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm truncate">{uploaderName}</span>
                  {isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-400 text-xs">{videos.length} Videos</p>
              </Link>

              {/* See Profile */}
              <Link
                href={`/ads/${listing.id}`}
                className="flex-shrink-0 px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded"
              >
                Profile
              </Link>

              {/* Subscribe */}
              <button
                onClick={() => setSubscribed(!subscribed)}
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

          {/* Video List - Only from this profile */}
          <div className="py-4">
            <h3 className="text-white font-semibold text-sm mb-3">
              {videos.length > 1 ? `More from ${uploaderName}` : `${uploaderName}'s Videos`}
            </h3>
            
            <div className="space-y-3">
              {videos.map(v => (
                <button
                  key={v.id}
                  onClick={() => playVideo(v)}
                  className={`w-full flex gap-3 text-left rounded-lg transition-colors ${
                    currentVideo?.id === v.id ? "bg-gray-800/50" : "hover:bg-gray-800/30"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-32 flex-shrink-0 aspect-video bg-gray-900 overflow-hidden rounded">
                    {v.thumbnail_url || listing.profile_image ? (
                      <img 
                        src={v.thumbnail_url || listing.profile_image!}
                        alt={v.title || "Video"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    {/* Now Playing indicator */}
                    {currentVideo?.id === v.id && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-3 bg-red-500 animate-pulse" />
                          <div className="w-1 h-4 bg-red-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 h-2 bg-red-500 animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <p className={`text-sm font-medium line-clamp-2 ${currentVideo?.id === v.id ? "text-red-500" : "text-white"}`}>
                      {v.title || `Video by ${uploaderName}`}
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />
                      {formatViews(v.views)} views
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {formatDate(v.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Link copied!
        </div>
      )}
    </div>
  )
}
