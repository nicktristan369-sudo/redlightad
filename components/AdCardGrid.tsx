"use client"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { isAvailableNow } from "@/lib/isAvailableNow"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AdCardGridProps {
  id: string | number
  title: string
  display_name?: string | null
  image: string
  images?: string[] | null
  profileVideoUrl?: string | null
  verified: boolean
  age?: number | null
  city?: string | null
  country?: string | null
  location?: string
  category?: string
  created_at?: string
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone?: string | null
  premium_tier?: string | null
  hasStory?: boolean
  onStoryClick?: () => void
  staggerDelay?: number
  social_links?: Record<string, { url?: string }> | null
  onlyfans_username?: string | null
}

export default function AdCardGrid({
  id, title, display_name, image, images, profileVideoUrl, verified, age, city, country, location,
  category, created_at, opening_hours, timezone, premium_tier,
  hasStory = false, onStoryClick, staggerDelay = 0, social_links, onlyfans_username,
}: AdCardGridProps) {
  const displayTitle = display_name
    ? `${display_name}${age ? `, ${age}` : ""}`
    : title
  const locationDisplay = [city, country].filter(Boolean).join(", ") || location || ""
  const available = isAvailableNow(opening_hours, timezone)
  const ago = created_at ? timeAgo(created_at) : ""

  // ── Cycling images ────────────────────────────────────────────────────────
  const pool = [image, ...(images ?? [])].filter((v, i, a) => v && a.indexOf(v) === i)
  const [currentImg, setCurrentImg] = useState(image)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (pool.length <= 1) return
    // Stagger: wait staggerDelay before starting the cycle
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setFading(true)
        setTimeout(() => {
          setCurrentImg(prev => {
            const idx = pool.indexOf(prev)
            let next: number
            do { next = Math.floor(Math.random() * pool.length) } while (next === idx)
            return pool[next]
          })
          setFading(false)
        }, 500)
      }, 6000)
      return () => clearInterval(interval)
    }, staggerDelay)
    return () => clearTimeout(startTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, staggerDelay])
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Link href={`/ads/${id}`} style={{ display: "block", textDecoration: "none" }}>
      {/* YDRE container — position: relative, overflow: visible */}
      <div
        className="group"
        style={{
          position: "relative",
          border: (premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic")
            ? "1px solid rgba(220,38,38,0.3)"
            : "1px solid #E5E7EB",
          background: "#fff",
          borderRadius: 0,
          overflow: "visible",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
        }}
      >
        {/* BILLEDE — overflow: hidden */}
        <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "#D1D5DB" }}>
          {profileVideoUrl ? (
            <video
              src={profileVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentImg}
            alt={title}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "opacity 0.5s ease, transform 0.3s ease",
              opacity: fading ? 0 : 1,
            }}
            className="group-hover:scale-105"
          />
          )}

          {/* OnlyFans badge - keep this one */}
          {(social_links?.onlyfans?.url || onlyfans_username) && (
            <div style={{
              position: "absolute", bottom: 8, right: 8,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              borderRadius: 20, padding: "4px 6px",
              display: "flex", alignItems: "center",
            }}>
              <img src="/onlyfans-logo.svg" alt="OnlyFans" style={{ width: 52, height: 16, objectFit: "contain" }} />
            </div>
          )}
        </div>

        {/* CIRKEL — absolut relativt til YDRE container */}
        {/* Premium = tynd grå kant, Story = gradient, Normal = hvid */}
        <div
          onClick={hasStory ? (e) => { e.preventDefault(); e.stopPropagation(); onStoryClick?.() } : undefined}
          style={{
            position: "absolute",
            bottom: 98,
            left: "50%",
            transform: "translateX(-50%)",
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: hasStory
              ? "3px solid transparent"
              : (premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic")
                ? "2px solid #374151"
                : "3px solid white",
            backgroundImage: hasStory
              ? "linear-gradient(white, white), linear-gradient(135deg, #DC2626, #F59E0B)"
              : "none",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            overflow: "hidden",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            cursor: hasStory ? "pointer" : "default",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
          />
        </div>

        {/* TEKST sektion */}
        <div style={{ paddingTop: 40, paddingBottom: 12, paddingLeft: 12, paddingRight: 12, background: "white" }}>

          {/* Navn */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <p style={{
              fontSize: 14, fontWeight: 700, color: "#111111",
              margin: 0, lineHeight: 1.3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: "100%",
            }}>{displayTitle}</p>
          </div>

          {/* By + land */}
          {locationDisplay && (
            <p style={{
              fontSize: 11, color: "#999999", textAlign: "center", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{locationDisplay}</p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "#F3F4F6", margin: "10px 0" }} />

          {/* Kategori + posted */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, overflow: "hidden" }}>
            {category ? (
              <span style={{
                fontSize: 11, color: "#888888",
                background: "#F5F5F7", padding: "2px 8px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                minWidth: 0,
              }}>{category}</span>
            ) : <span />}
            {ago && (
              <span style={{ fontSize: 11, color: "#BBBBBB", whiteSpace: "nowrap", flexShrink: 0 }}>{ago}</span>
            )}
          </div>

        </div>
      </div>
    </Link>
  )
}
