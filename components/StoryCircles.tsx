"use client"

import { useState, useEffect } from "react"
import StoryViewer from "./StoryViewer"

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

interface StoryCirclesProps {
  country?: string
}

export default function StoryCircles({ country }: StoryCirclesProps) {
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [viewed, setViewed] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("rlad_viewed_stories") || "[]")
      setViewed(stored)
    } catch {}
  }, [])

  useEffect(() => {
    const url = country ? `/api/stories?country=${encodeURIComponent(country)}` : "/api/stories"
    fetch(url)
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [country])

  if (!loading && groups.length === 0) return null

  const openViewer = (idx: number) => {
    setActiveIdx(idx)
    setViewerOpen(true)
    // Update viewed state
    const lid = groups[idx]?.listing_id
    if (lid && !viewed.includes(lid)) {
      const next = [...viewed, lid]
      setViewed(next)
      try { localStorage.setItem("rlad_viewed_stories", JSON.stringify(next)) } catch {}
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4" style={{ background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 12,
          padding: "12px 0",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="story-circles-scroll"
      >
        <style jsx>{`
          .story-circles-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        {loading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 56 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "#E5E7EB", animation: "rlad-pulse 1.5s ease-in-out infinite",
                }} />
                <div style={{ width: 40, height: 8, borderRadius: 4, background: "#E5E7EB" }} />
              </div>
            ))}
            <style dangerouslySetInnerHTML={{ __html: `@keyframes rlad-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }` }} />
          </>
        ) : (
          groups.map((g, i) => {
            const isViewed = viewed.includes(g.listing_id)
            return (
              <button
                key={g.listing_id}
                onClick={() => openViewer(i)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                  width: 56,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  padding: 2,
                  background: isViewed
                    ? "#D1D5DB"
                    : "linear-gradient(135deg, #DC2626, #F59E0B)",
                }}>
                  <div style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    overflow: "hidden",
                    background: "#E5E7EB",
                  }}>
                    {g.listing.profile_image && (
                      <img
                        src={g.listing.profile_image}
                        alt={g.listing.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  color: "#374151",
                  maxWidth: 52,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  display: "block",
                }}>
                  {g.listing.title}
                </span>
              </button>
            )
          })
        )}
      </div>
      </div>

      {viewerOpen && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={activeIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}
