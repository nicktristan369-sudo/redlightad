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
  listingId?: string
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `for ${diff} sek. siden`
  const m = Math.floor(diff / 60)
  if (m < 60) return `for ${m} min. siden`
  const h = Math.floor(m / 60)
  if (h < 24) return `for ${h} t. siden`
  const d = Math.floor(h / 24)
  return `for ${d} d. siden`
}

export default function StoryCircles({ country, listingId }: StoryCirclesProps) {
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
    const params = new URLSearchParams()
    if (country) params.set("country", country)
    if (listingId) params.set("listing_id", listingId)
    const url = params.toString() ? `/api/stories?${params.toString()}` : "/api/stories"
    fetch(url)
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [country, listingId])

  if (!loading && groups.length === 0) return null

  const openViewer = (idx: number) => {
    setActiveIdx(idx)
    setViewerOpen(true)
    const lid = groups[idx]?.listing_id
    if (lid && !viewed.includes(lid)) {
      const next = [...viewed, lid]
      setViewed(next)
      try { localStorage.setItem("rlad_viewed_stories", JSON.stringify(next)) } catch {}
    }
  }

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
        >
          <div
            className="story-scroll"
            style={{
              display: "flex",
              overflowX: "auto",
              gap: 20,
              padding: "16px 0",
              scrollbarWidth: "none",
            }}
          >
            <style>{`.story-scroll::-webkit-scrollbar{display:none}`}</style>

            {/* Skeleton loading */}
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0, width: 80 }}>
                  <div style={{
                    width: 74, height: 74, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f3e0f7,#fcd6d6)",
                    opacity: 0.5, animation: "spulse 1.4s ease-in-out infinite",
                  }} />
                  <div style={{ width: 52, height: 8, borderRadius: 4, background: "#E5E7EB" }} />
                  <div style={{ width: 38, height: 7, borderRadius: 4, background: "#F3F4F6" }} />
                  <style dangerouslySetInnerHTML={{ __html: `@keyframes spulse{0%,100%{opacity:.5}50%{opacity:1}}` }} />
                </div>
              ))}

            {/* Story circles */}
            {!loading &&
              groups.map((g, i) => {
                const isViewed = viewed.includes(g.listing_id)
                const count = g.stories.length
                // Most recent story's timestamp
                const latestTime = g.stories
                  .map((s) => new Date(s.created_at).getTime())
                  .sort((a, b) => b - a)[0]
                const ago = latestTime ? timeAgo(new Date(latestTime).toISOString()) : ""
                // Short name — max 12 chars
                const name = g.listing.title.length > 12 ? g.listing.title.slice(0, 12) + "…" : g.listing.title

                return (
                  <button
                    key={g.listing_id}
                    onClick={() => openViewer(i)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0,
                      flexShrink: 0,
                      width: 80,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {/* Circle with gradient ring */}
                    <div style={{ position: "relative", marginBottom: 7 }}>
                      {/* Gradient ring */}
                      <div style={{
                        width: 74,
                        height: 74,
                        borderRadius: "50%",
                        padding: 3,
                        background: isViewed
                          ? "linear-gradient(135deg, #D1D5DB, #9CA3AF)"
                          : "linear-gradient(135deg, #e91e8c, #f43f5e, #dc2626)",
                        boxShadow: isViewed ? "none" : "0 0 0 0 transparent",
                      }}>
                        {/* White gap ring */}
                        <div style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          border: "2.5px solid #fff",
                          overflow: "hidden",
                          background: "#F3F4F6",
                        }}>
                          {g.listing.profile_image ? (
                            <img
                              src={g.listing.profile_image}
                              alt={name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <div style={{
                              width: "100%", height: "100%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "#E5E7EB", fontSize: 22, color: "#9CA3AF",
                            }}>👤</div>
                          )}
                        </div>
                      </div>

                      {/* Count badge — top-right */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        right: -2,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        background: isViewed ? "#9CA3AF" : "#e91e8c",
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingLeft: 3,
                        paddingRight: 3,
                        zIndex: 10,
                      }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#fff",
                          lineHeight: 1,
                          letterSpacing: "-0.3px",
                        }}>
                          {count > 99 ? "99+" : count}
                        </span>
                      </div>
                    </div>

                    {/* Name */}
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111827",
                      maxWidth: 78,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      display: "block",
                      lineHeight: 1.3,
                      marginBottom: 2,
                    }}>
                      {name}
                    </span>

                    {/* Time */}
                    {ago && (
                      <span style={{
                        fontSize: 10,
                        color: "#9CA3AF",
                        textAlign: "center",
                        display: "block",
                        lineHeight: 1.2,
                        maxWidth: 78,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {ago}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
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
