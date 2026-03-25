"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface Story {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  views: number
  created_at: string
}

interface StoryGroup {
  listing_id: string
  listing: { id: string; title: string; profile_image: string | null; country: string | null; city: string | null }
  stories: Story[]
}

interface StoryViewerProps {
  groups: StoryGroup[]
  initialGroupIndex: number
  onClose: () => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const router = useRouter()
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())
  const touchStartY = useRef(0)

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  const DURATION = 5000

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const goNext = useCallback(() => {
    if (!group) return
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(storyIdx + 1)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(groupIdx + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }, [group, storyIdx, groupIdx, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1)
    } else if (groupIdx > 0) {
      setGroupIdx(groupIdx - 1)
      const prevGroup = groups[groupIdx - 1]
      setStoryIdx(prevGroup.stories.length - 1)
    }
  }, [storyIdx, groupIdx, groups])

  // Start timer for current story
  useEffect(() => {
    clearTimer()
    setProgress(0)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(elapsed / DURATION, 1)
      setProgress(pct)
      if (pct >= 1) {
        clearTimer()
        goNext()
      }
    }, 50)

    return clearTimer
  }, [groupIdx, storyIdx, clearTimer, goNext])

  // Track view
  useEffect(() => {
    if (story) {
      fetch("/api/stories/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: story.id }),
      }).catch(() => {})

      // Mark listing as viewed in localStorage
      try {
        const key = "rlad_viewed_stories"
        const viewed: string[] = JSON.parse(localStorage.getItem(key) || "[]")
        if (!viewed.includes(group.listing_id)) {
          viewed.push(group.listing_id)
          localStorage.setItem(key, JSON.stringify(viewed))
        }
      } catch {}
    }
  }, [story, group])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, goNext, goPrev])

  if (!group || !story) return null

  const listing = group.listing

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
      onTouchEnd={(e) => {
        const diff = touchStartY.current - e.changedTouches[0].clientY
        if (diff > 100) {
          router.push(`/ads/${group.listing_id}`)
          onClose()
        }
      }}
    >
      {/* Story content */}
      <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: 450, margin: "0 auto" }}>
        {/* Media */}
        {story.media_type === "video" ? (
          <video
            key={story.id}
            src={story.media_url}
            autoPlay
            muted
            loop
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {/* Top gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 120,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
          zIndex: 2,
        }} />

        {/* Progress bars */}
        <div style={{
          position: "absolute", top: 8, left: 8, right: 8, display: "flex", gap: 3, zIndex: 3,
        }}>
          {group.stories.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, height: 2, background: "rgba(255,255,255,0.3)", borderRadius: 1, overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                background: "#fff",
                borderRadius: 1,
                width: i < storyIdx ? "100%" : i === storyIdx ? `${progress * 100}%` : "0%",
                transition: i === storyIdx ? "none" : "width 0.1s",
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{
          position: "absolute", top: 18, left: 12, right: 48, display: "flex", alignItems: "center", gap: 8, zIndex: 3,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
            background: "#333", flexShrink: 0,
          }}>
            {listing.profile_image && (
              <img src={listing.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{listing.title}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{timeAgo(story.created_at)}</div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 12, zIndex: 3,
            background: "none", border: "none", cursor: "pointer", padding: 4,
          }}
        >
          <X size={22} color="#fff" />
        </button>

        {/* Tap zones */}
        <div
          onClick={goPrev}
          style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", zIndex: 2, cursor: "pointer" }}
        />
        <div
          onClick={goNext}
          style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", zIndex: 2, cursor: "pointer" }}
        />

        {/* Bottom gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          zIndex: 2,
        }} />

        {/* Caption + views */}
        <div style={{
          position: "absolute", bottom: 24, left: 16, right: 16, zIndex: 3,
        }}>
          {story.caption && (
            <p style={{ color: "#fff", fontSize: 14, marginBottom: 8, lineHeight: 1.4 }}>{story.caption}</p>
          )}
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <span>👁</span>
            <span>{story.views}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
