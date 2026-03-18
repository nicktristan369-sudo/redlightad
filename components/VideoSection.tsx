"use client"

import { useState } from "react"
import { Play, Lock, X } from "lucide-react"

interface Video {
  id: string
  url: string
  thumbnail_url: string | null
  is_locked: boolean
}

interface VideoSectionProps {
  videos: Video[]
  isLoggedIn: boolean
  listingId: string
}

export default function VideoSection({ videos, isLoggedIn }: VideoSectionProps) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)

  if (!videos.length) return null

  const displayVideos = videos.slice(0, 3)

  return (
    <>
      <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: "12px", padding: "24px" }}>
        <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">My Videos</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {displayVideos.map(video => (
            <div key={video.id} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {video.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play size={24} color="#fff" />
                </div>
              )}

              {video.is_locked && !isLoggedIn ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                  style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
                >
                  <Lock size={20} color="#fff" />
                  <span className="text-[11px] text-white/80">Log ind for at se</span>
                </div>
              ) : (
                <button
                  onClick={() => setActiveVideo(video)}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Play size={18} color="#fff" fill="#fff" />
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#DC2626" }}
        >
          WATCH MY VIDEOS &rarr;
        </button>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setActiveVideo(null)}
        >
          <video
            src={activeVideo.url}
            controls
            autoPlay
            className="max-w-[95vw] max-h-[90vh] rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  )
}
