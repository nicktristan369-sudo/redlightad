"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { createBrowserClient } from "@supabase/ssr"
import { uploadMedia } from "@/lib/uploadImages"
import { Trash2, Upload, Clock } from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ActiveStory {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  created_at: string
  expires_at: string
}

function timeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hrs}h ${mins}m remaining`
}

export default function StoriesPage() {
  const [listingId, setListingId] = useState<string | null>(null)
  const [stories, setStories] = useState<ActiveStory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: listing } = await supabase
        .from("listings")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (listing) {
        setListingId(listing.id)
        await loadStories(listing.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  async function loadStories(lid: string) {
    const { data } = await supabase
      .from("stories")
      .select("id, media_url, media_type, caption, created_at, expires_at")
      .eq("listing_id", lid)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
    setStories(data ?? [])
  }

  async function handleUpload() {
    if (!file || !listingId) return
    setUploading(true)
    setMessage(null)
    try {
      const { url, type } = await uploadMedia(file)
      const res = await fetch("/api/stories/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          media_url: url,
          media_type: type,
          caption: caption || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage({ text: "Story uploaded successfully!", type: "success" })
      setFile(null)
      setCaption("")
      await loadStories(listingId)
    } catch (err: any) {
      setMessage({ text: err.message || "Upload failed", type: "error" })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(storyId: string) {
    await supabase.from("stories").delete().eq("id", storyId)
    if (listingId) await loadStories(listingId)
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-gray-900">Stories</h1>
          <p className="text-[14px] text-gray-400 mt-0.5">Upload stories that disappear after 24 hours</p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : !listingId ? (
          <div className="bg-white p-6" style={{ border: "1px solid #E5E5E5", borderRadius: 12 }}>
            <p className="text-gray-500 text-sm">You need an active listing to post stories.</p>
          </div>
        ) : (
          <>
            {/* Upload section */}
            <div className="bg-white p-6 mb-6" style={{ border: "1px solid #E5E5E5", borderRadius: 12 }}>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Add Story</h2>

              {message && (
                <div
                  className="mb-4 px-4 py-2 rounded-lg text-sm"
                  style={{
                    background: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
                    color: message.type === "success" ? "#166534" : "#991B1B",
                    border: `1px solid ${message.type === "success" ? "#BBF7D0" : "#FECACA"}`,
                  }}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Image or Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Caption (optional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Write a caption..."
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors"
                  style={{
                    background: !file || uploading ? "#9CA3AF" : "#000",
                    cursor: !file || uploading ? "not-allowed" : "pointer",
                  }}
                >
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Upload Story"}
                </button>
              </div>
            </div>

            {/* Active stories */}
            <div className="bg-white p-6" style={{ border: "1px solid #E5E5E5", borderRadius: 12 }}>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Active Stories</h2>
              {stories.length === 0 ? (
                <p className="text-gray-400 text-sm">No active stories</p>
              ) : (
                <div className="space-y-3">
                  {stories.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ border: "1px solid #E5E5E5" }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 8, overflow: "hidden",
                        background: "#F3F4F6", flexShrink: 0,
                      }}>
                        {s.media_type === "video" ? (
                          <video src={s.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={s.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{s.caption || "No caption"}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock size={12} />
                          <span>{timeRemaining(s.expires_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "#DC2626" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
