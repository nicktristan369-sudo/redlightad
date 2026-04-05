"use client"
import { useLanguage } from "@/lib/i18n/LanguageContext"

import { useState } from "react"
import { Play, Lock, Heart, Eye, X, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface Video {
  id: string
  url: string
  thumbnail_url: string | null
  title: string | null
  is_locked: boolean
  redcoin_price: number
  views: number
  likes: number
  sort_order: number
}

interface VideoSectionProps {
  videos: Video[]
  isLoggedIn: boolean
  listingId: string
  currentUserId?: string | null
}

function fmtNum(n: number) {
  return n.toLocaleString("da-DK")
}

// ── Video Player Modal ──────────────────────────────────────────────
function VideoModal({
  video,
  onClose,
  isLoggedIn,
  currentUserId,
  hasPurchased,
  onPurchase,
}: {
  video: Video
  onClose: () => void
  isLoggedIn: boolean
  currentUserId: string | null
  hasPurchased: boolean
  onPurchase: (videoId: string) => void
}) {
  const { t } = useLanguage()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState("")

  const canWatch = !video.is_locked || hasPurchased

  const handleLike = async () => {
    if (!isLoggedIn) return
    const action = liked ? "unlike" : "like"
    setLiked(!liked)
    setLikeCount(c => c + (liked ? -1 : 1))
    await fetch("/api/videos/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id, action }),
    })
  }

  const handlePurchase = async () => {
    if (!currentUserId) return
    setPurchasing(true)
    setPurchaseError("")
    try {
      const res = await fetch("/api/videos/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, buyerId: currentUserId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "insufficient_coins") setPurchaseError(t.video_insufficient)
        else setPurchaseError(t.video_error)
      } else {
        onPurchase(video.id)
      }
    } catch {
      setPurchaseError(t.video_network_error)
    }
    setPurchasing(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}>
      <div className="w-full max-w-3xl px-4" onClick={e => e.stopPropagation()}>

        {/* Video / locked */}
        <div className="relative rounded overflow-hidden bg-[#0a0a0a]" style={{ aspectRatio: "16/9" }}>
          {canWatch ? (
            <>
              <video
                src={video.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {/* Vandmærke */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span style={{
                  fontSize: "clamp(16px, 4vw, 36px)",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "white",
                  opacity: 0.15,
                  textTransform: "uppercase",
                  fontFamily: "-apple-system, sans-serif",
                }}>
                  REDLIGHTAD.COM
                </span>
              </div>
            </>
          ) : (
            // Locked state
            <div className="w-full h-full relative flex items-center justify-center">
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: "blur(16px)" }} />
              )}
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.65)" }} />
              <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Lock size={24} color="#fff" />
                </div>
                <p className="text-white font-semibold text-lg">{t.video_unlock} {video.redcoin_price} RedCoins</p>
                {!isLoggedIn ? (
                  <Link href="/register"
                    className="px-6 py-2.5 rounded text-sm font-semibold text-white"
                    style={{ background: "#DC2626" }}>
                    {t.video_create_to_buy}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex items-center gap-2 px-6 py-2.5 rounded text-sm font-semibold text-white disabled:opacity-60"
                      style={{ background: "#DC2626" }}>
                      <ShoppingCart size={16} />
                      {purchasing ? t.video_processing : `${t.video_unlock_btn} — ${video.redcoin_price} RedCoins`}
                    </button>
                    {purchaseError && <p className="text-red-400 text-sm">{purchaseError}</p>}
                    <Link href="/dashboard/buy-coins" className="text-white/60 text-xs hover:text-white">
                      {t.video_buy_more}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="mt-3 px-4 py-3 rounded flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
          {video.title && (
            <span className="text-white font-semibold text-sm flex-1 truncate">{video.title}</span>
          )}
          <span className="flex items-center gap-1 text-white/60 text-xs">
            <Eye size={12} /> {fmtNum(video.views)}
          </span>
          <button onClick={handleLike} disabled={!isLoggedIn}
            className="flex items-center gap-1 text-xs transition-colors disabled:opacity-40"
            style={{ color: liked ? "#ef4444" : "rgba(255,255,255,0.6)" }}>
            <Heart size={12} fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "currentColor"} />
            {fmtNum(likeCount)}
          </button>
        </div>
      </div>

      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded"
        style={{ background: "rgba(255,255,255,0.12)" }}>
        <X size={20} color="#fff" />
      </button>
    </div>
  )
}

// ── Video Thumbnail Card ────────────────────────────────────────────
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="relative w-full overflow-hidden rounded group transition-transform duration-200 hover:scale-[1.03]"
      style={{ aspectRatio: "16/9", background: "#111" }}>

      {/* Thumbnail — bruger thumbnail_url hvis sat, ellers første frame fra video */}
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail_url} alt={video.title ?? "Video"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ filter: video.is_locked ? "blur(8px)" : "none" }} />
      ) : (
        <video
          src={`${video.url}#t=1`}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: video.is_locked ? "blur(8px)" : "none", pointerEvents: "none" }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.25)" }}>
        {video.is_locked ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded bg-black/50 flex items-center justify-center">
              <Lock size={18} color="#fff" />
            </div>
            <span className="text-[10px] text-white/90 font-semibold bg-red-600 rounded px-1.5 py-0.5">
              {video.redcoin_price} RC
            </span>
          </div>
        ) : (
          <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
            <Play size={18} color="#fff" fill="#fff" />
          </div>
        )}
      </div>

      {/* Views bottom left */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/80"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        <Eye size={10} /> {fmtNum(video.views)}
      </div>
    </button>
  )
}

// ── Main VideoSection ───────────────────────────────────────────────
export default function VideoSection({ videos, isLoggedIn, listingId, currentUserId }: VideoSectionProps) {
  const { t } = useLanguage();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())

  if (!videos.length) return null

  const handleOpen = (video: Video) => {
    setActiveVideo(video)
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {})
  }

  const handlePurchase = (videoId: string) => {
    setPurchasedIds(prev => new Set([...prev, videoId]))
  }

  return (
    <>
      <div className="mt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            {t.video_my_videos}
          </h2>
          <span className="text-sm text-gray-400">{videos.length} {videos.length !== 1 ? t.video_count_plural : t.video_count}</span>
        </div>

        {/* Grid: 2 cols mobil, 3 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {videos.slice(0, 6).map(v => (
            <VideoCard key={v.id} video={v} onClick={() => handleOpen(v)} />
          ))}
        </div>

        {/* Watch all knap */}
        <button
          onClick={() => videos[0] && handleOpen(videos[0])}
          className="mt-4 w-full py-3 rounded text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
          style={{ background: "#DC2626" }}>
          {t.watch_videos}
        </button>
      </div>

      {/* Modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId ?? null}
          hasPurchased={purchasedIds.has(activeVideo.id)}
          onPurchase={handlePurchase}
        />
      )}
    </>
  )
}
