"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { Star, ExternalLink } from "lucide-react"

interface ListingData {
  id: string
  premium_tier: string | null
  display_name: string | null
  title: string | null
  profile_image: string | null
  images: string[] | null
  about: string | null
  social_links: Record<string, { url?: string; locked?: boolean; price_coins?: number }> | null
  onlyfans_username: string | null
  onlyfans_bio: string | null
  onlyfans_cover_url: string | null
  onlyfans_price_usd: number | null
  onlyfans_subscribers: number | null
  onlyfans_photos_count: number | null
  onlyfans_videos_count: number | null
  onlyfans_likes_count: number | null
  onlyfans_teaser_url: string | null
}

function extractOFHandle(url: string, username?: string | null): string {
  if (username) return username
  if (!url) return ""
  return url.replace(/^https?:\/\/(www\.)?onlyfans\.com\//i, "").split("?")[0].split("/")[0]
}

export default function OnlyFansDashboard() {
  const router = useRouter()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  // Form state
  const [ofUsername, setOfUsername] = useState("")
  const [ofBio, setOfBio] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [teaserUrl, setTeaserUrl] = useState("")
  const [price, setPrice] = useState(0)
  const [subscribers, setSubscribers] = useState(0)
  const [photos, setPhotos] = useState(0)
  const [videos, setVideos] = useState(0)
  const [likes, setLikes] = useState(0)

  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingTeaser, setUploadingTeaser] = useState(false)
  const [teaserError, setTeaserError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase
        .from("listings")
        .select("id, premium_tier, display_name, title, profile_image, images, about, social_links, onlyfans_username, onlyfans_bio, onlyfans_cover_url, onlyfans_price_usd, onlyfans_subscribers, onlyfans_photos_count, onlyfans_videos_count, onlyfans_likes_count, onlyfans_teaser_url")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single()
      if (data) {
        setListing(data)
        const handle = extractOFHandle(data.social_links?.onlyfans?.url || "", data.onlyfans_username)
        setOfUsername(handle)
        setOfBio(data.onlyfans_bio || "")
        setCoverUrl(data.onlyfans_cover_url || "")
        setTeaserUrl(data.onlyfans_teaser_url || "")
        setSubscribers(data.onlyfans_subscribers || 0)
        setPhotos(data.onlyfans_photos_count || 0)
        setVideos(data.onlyfans_videos_count || 0)
        setLikes(data.onlyfans_likes_count || 0)
        setPrice(data.onlyfans_price_usd || 0)
      }
      setLoading(false)
    })
  }, [router])

  const handleUpload = async (file: File, type: "cover" | "teaser") => {
    if (!listing) return
    if (type === "cover") setUploadingCover(true)
    else setUploadingTeaser(true)
    setTeaserError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("listingId", listing.id)
      formData.append("type", type)

      const res = await fetch("/api/onlyfans/upload-teaser", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")

      if (type === "cover") setCoverUrl(json.url)
      else setTeaserUrl(json.url)
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : "Upload failed")
    }

    if (type === "cover") setUploadingCover(false)
    else setUploadingTeaser(false)
  }

  const handleTeaserSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      setTeaserError("File must be under 50MB")
      return
    }

    // Check duration
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      if (video.duration > 20) {
        setTeaserError("Video must be max 20 seconds")
        return
      }
      setTeaserError("")
      handleUpload(file, "teaser")
    }
    video.src = URL.createObjectURL(file)
  }

  const handleSave = async () => {
    if (!listing) return
    setSaving(true)
    const supabase = createClient()

    const existingSocialLinks = listing.social_links || {}

    const { error } = await supabase
      .from("listings")
      .update({
        onlyfans_username: ofUsername || null,
        onlyfans_bio: ofBio || null,
        onlyfans_cover_url: coverUrl || null,
        onlyfans_teaser_url: teaserUrl || null,
        onlyfans_price_usd: price || null,
        onlyfans_subscribers: subscribers || 0,
        onlyfans_photos_count: photos || 0,
        onlyfans_videos_count: videos || 0,
        onlyfans_likes_count: likes || 0,
        social_links: { ...existingSocialLinks, onlyfans: { url: `https://onlyfans.com/${ofUsername}` } },
      })
      .eq("id", listing.id)
    setSaving(false)
    if (error) { setToast("Error: " + error.message); return }
    setToast("Saved!")
    setTimeout(() => setToast(""), 3000)
  }

  const isPremium = listing?.premium_tier && ["basic", "featured", "vip"].includes(listing.premium_tier)
  const coverImage = coverUrl || (listing?.images?.[0]) || ""

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // Premium wall
  if (!isPremium) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: 60 }}>
          <Star size={48} color="#DC2626" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Premium Feature</h2>
          <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
            Upgrade to Premium to get featured in the OnlyFans directory
          </p>
          <Link
            href="/dashboard/boost"
            style={{
              display: "inline-block",
              background: "#DC2626",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Upgrade Now
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    padding: 24,
    marginBottom: 16,
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    fontSize: 14,
    outline: "none",
    background: "#FAFAFA",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#666",
    display: "block",
    marginBottom: 6,
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720 }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 50,
            background: toast.startsWith("Error") ? "#FEE2E2" : "#D1FAE5",
            color: toast.startsWith("Error") ? "#991B1B" : "#065F46",
            padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          }}>
            {toast}
          </div>
        )}

        {/* ── Sektion 1: Profile Preview ── */}
        <div style={{ ...sectionStyle, padding: 0, overflow: "hidden" }}>
          {/* Cover */}
          <div style={{
            height: 200,
            background: coverImage ? `url(${coverImage}) center/cover no-repeat` : "#E5E7EB",
          }} />

          {/* Profile info */}
          <div style={{ padding: "0 24px 24px", marginTop: -50 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <img
                src={listing?.profile_image || "/placeholder.png"}
                alt=""
                style={{
                  width: 100, height: 100, borderRadius: 8,
                  objectFit: "cover", border: "4px solid #fff",
                  background: "#E5E7EB", flexShrink: 0,
                }}
              />
              <div style={{ paddingBottom: 4, flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                  {listing?.display_name || listing?.title || "Your Name"}
                </h1>
                <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>
                  @{ofUsername || "username"} &middot; onlyfans.com/{ofUsername || "username"}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link
                href={`/ads/${listing?.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#DC2626", color: "#fff",
                  padding: "8px 18px", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}
              >
                See my profile on RedLightAD <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Sektion 2: OnlyFans Username ── */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>OnlyFans Username</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#888", fontSize: 14, fontWeight: 600 }}>@</span>
            <input
              type="text"
              placeholder="your_username"
              value={ofUsername}
              onChange={e => setOfUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))}
              style={inputStyle}
            />
          </div>
          {ofUsername && (
            <a
              href={`https://onlyfans.com/${ofUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#00AFF0", marginTop: 8, textDecoration: "none" }}
            >
              onlyfans.com/{ofUsername} <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* ── Sektion 3: Cover & Teaser Video ── */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Cover & Teaser Video</h3>

          {/* Cover image */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Cover Image</label>
            {coverUrl && (
              <img src={coverUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 5 * 1024 * 1024) { setToast("Image must be under 5MB"); return }
                handleUpload(file, "cover")
              }}
              disabled={uploadingCover}
              style={{ fontSize: 13 }}
            />
            {uploadingCover && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>Uploading...</span>}
          </div>

          {/* Teaser video */}
          <div>
            <label style={labelStyle}>Teaser Video (max 20 seconds, 50MB)</label>
            {teaserUrl && (
              <video
                ref={videoRef}
                src={teaserUrl}
                muted
                loop
                controls
                style={{ width: "100%", maxHeight: 300, borderRadius: 10, marginBottom: 8, background: "#000" }}
              />
            )}
            <input
              type="file"
              accept="video/mp4,video/mov,video/quicktime"
              onChange={handleTeaserSelect}
              disabled={uploadingTeaser}
              style={{ fontSize: 13 }}
            />
            {uploadingTeaser && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>Uploading video...</span>}
            {teaserError && <p style={{ color: "#DC2626", fontSize: 12, marginTop: 6, fontWeight: 600 }}>{teaserError}</p>}
          </div>
        </div>

        {/* ── Sektion 4: OnlyFans Bio ── */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>OnlyFans Bio</h3>
          <textarea
            placeholder="Write a bio that will appear in the OnlyFans directory..."
            value={ofBio}
            onChange={e => { if (e.target.value.length <= 500) setOfBio(e.target.value) }}
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: ofBio.length > 450 ? "#DC2626" : "#aaa", marginTop: 4 }}>
            {ofBio.length}/500
          </div>
        </div>

        {/* ── Sektion 5: Stats ── */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: "Subscribers", value: subscribers, set: setSubscribers },
              { label: "Photos", value: photos, set: setPhotos },
              { label: "Videos", value: videos, set: setVideos },
              { label: "Likes", value: likes, set: setLikes },
            ] as const).map(f => (
              <div key={f.label}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={f.value}
                  onChange={e => f.set(Math.max(0, parseInt(e.target.value) || 0))}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Monthly Price (USD) {price === 0 ? '— "FREE"' : `— $${price}/mo`}
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={e => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Sektion 6: Save ── */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12,
            background: "#DC2626", color: "#fff", fontSize: 15, fontWeight: 700,
            border: "none", cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save OnlyFans Profile"}
        </button>
      </div>
    </DashboardLayout>
  )
}
