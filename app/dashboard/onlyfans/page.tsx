"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { Star, ExternalLink } from "lucide-react"
import { uploadMedia } from "@/lib/uploadImages"

interface ListingData {
  id: string
  premium_tier: string | null
  display_name: string | null
  title: string | null
  profile_image: string | null
  about: string | null
  onlyfans_username: string | null
  onlyfans_bio: string | null
  onlyfans_cover_url: string | null
  onlyfans_price_usd: number | null
  onlyfans_subscribers: number | null
  onlyfans_photos_count: number | null
  onlyfans_videos_count: number | null
  onlyfans_likes_count: number | null
  onlyfans_teaser_url: string | null
  profile_video_url: string | null
}

export default function OnlyFansDashboard() {
  const router = useRouter()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  // Form state
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [teaserUrl, setTeaserUrl] = useState("")
  const [subscribers, setSubscribers] = useState(0)
  const [photos, setPhotos] = useState(0)
  const [videos, setVideos] = useState(0)
  const [likes, setLikes] = useState(0)
  const [price, setPrice] = useState(0)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase
        .from("listings")
        .select("id, premium_tier, display_name, title, profile_image, about, onlyfans_username, onlyfans_bio, onlyfans_cover_url, onlyfans_price_usd, onlyfans_subscribers, onlyfans_photos_count, onlyfans_videos_count, onlyfans_likes_count, onlyfans_teaser_url, profile_video_url")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single()
      if (data) {
        setListing(data)
        setUsername(data.onlyfans_username || "")
        setBio(data.onlyfans_bio || "")
        setCoverUrl(data.onlyfans_cover_url || "")
        setTeaserUrl(data.onlyfans_teaser_url || data.profile_video_url || "")
        setSubscribers(data.onlyfans_subscribers || 0)
        setPhotos(data.onlyfans_photos_count || 0)
        setVideos(data.onlyfans_videos_count || 0)
        setLikes(data.onlyfans_likes_count || 0)
        setPrice(data.onlyfans_price_usd || 0)
      }
      setLoading(false)
    })
  }, [router])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const result = await uploadMedia(file)
      setCoverUrl(result.url)
    } catch {
      setToast("Upload failed")
    }
    setUploadingCover(false)
  }

  const handleSave = async () => {
    if (!listing) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("listings")
      .update({
        onlyfans_username: username || null,
        onlyfans_bio: bio || null,
        onlyfans_cover_url: coverUrl || null,
        onlyfans_teaser_url: teaserUrl || null,
        onlyfans_price_usd: price || null,
        onlyfans_subscribers: subscribers || 0,
        onlyfans_photos_count: photos || 0,
        onlyfans_videos_count: videos || 0,
        onlyfans_likes_count: likes || 0,
      })
      .eq("id", listing.id)
    setSaving(false)
    if (error) { setToast("Error saving: " + error.message); return }
    setToast("Saved!")
    setTimeout(() => setToast(""), 3000)
  }

  const isPremium = listing?.premium_tier && ["basic", "featured", "vip"].includes(listing.premium_tier)
  const handle = username || "username"
  const displayPrice = price ? `$${price}/mo` : "FREE"

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
              background: "#000",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Upgrade Now →
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>OnlyFans Profile</h1>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#FEF3C7", padding: "2px 8px", borderRadius: 6 }}>PREMIUM</span>
          </div>
          <p style={{ color: "#888", fontSize: 13 }}>Manage your OnlyFans presence on RedLightAD</p>
        </div>

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

        {/* 1. Profile Link */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Profile Link</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#888", fontSize: 14 }}>@</span>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: "1px solid #E5E7EB", fontSize: 14, outline: "none",
              }}
            />
          </div>
          {username && (
            <a
              href={`https://onlyfans.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#00AFF0", marginTop: 8, textDecoration: "none" }}
            >
              onlyfans.com/{username} <ExternalLink size={12} />
            </a>
          )}
        </section>

        {/* 2. Cover & Teaser */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Cover & Teaser</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Cover Image (1280×720)</label>
            {coverUrl && (
              <img src={coverUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
            )}
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} />
            {uploadingCover && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>Uploading...</span>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Teaser Video URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={teaserUrl}
              onChange={e => setTeaserUrl(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #E5E7EB", fontSize: 14, outline: "none",
              }}
            />
          </div>
        </section>

        {/* 3. OF Bio */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>OnlyFans Bio</h3>
          <textarea
            placeholder="Write your OnlyFans bio..."
            value={bio}
            onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value) }}
            rows={4}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid #E5E7EB", fontSize: 14, outline: "none",
              resize: "vertical",
            }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: bio.length > 450 ? "#DC2626" : "#aaa", marginTop: 4 }}>
            {bio.length}/500
          </div>
        </section>

        {/* 4. Stats */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Subscribers", value: subscribers, set: setSubscribers },
              { label: "Photos", value: photos, set: setPhotos },
              { label: "Videos", value: videos, set: setVideos },
              { label: "Likes", value: likes, set: setLikes },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={f.value}
                  onChange={e => f.set(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    border: "1px solid #E5E7EB", fontSize: 14, outline: "none",
                  }}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>
                Monthly Price (USD) — {price === 0 ? '"Free"' : `$${price}/mo`}
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={e => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #E5E7EB", fontSize: 14, outline: "none",
                }}
              />
            </div>
          </div>
        </section>

        {/* 5. Preview */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Preview</h3>
          <div style={{ background: "#0F0F0F", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <img
                src={listing?.profile_image || "/placeholder.png"}
                alt=""
                style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0, background: "#333" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>onlyfans.com/{handle}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                  {listing?.display_name || listing?.title || "Your Name"}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                  {(bio || listing?.about || "Your bio will appear here...").slice(0, 120)}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
                  {subscribers > 0 && <span>👤 {subscribers.toLocaleString()}</span>}
                  <span style={{ color: "#00AFF0", fontWeight: 700 }}>Price: {displayPrice}</span>
                  {photos > 0 && <span>📸 {photos.toLocaleString()}</span>}
                  {videos > 0 && <span>🎬 {videos.toLocaleString()}</span>}
                  {likes > 0 && <span>❤️ {likes.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12,
            background: "#000", color: "#fff", fontSize: 14, fontWeight: 700,
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
