"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { uploadMedia } from "@/lib/uploadImages"

// HTML entity encoder to prevent XSS
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

interface Listing {
  id: string
  title: string
}

interface LockedItem {
  id: string
  listing_id: string
  title: string
  description: string | null
  coin_price: number
  media_urls: string[]
  media_types: string[]
  created_at: string
  listings?: { title: string }[] | { title: string } | null
}

interface MediaPreview {
  file: File
  preview: string
  type: "image" | "video"
}

export default function LockedContentPage() {
  const router = useRouter()
  const [items, setItems] = useState<LockedItem[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    listing_id: "",
    title: "",
    description: "",
    coin_price: 10,
  })
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const [{ data: myListings }, { data: myItems }] = await Promise.all([
        supabase.from("listings").select("id, title").eq("user_id", user.id).eq("status", "active"),
        supabase.from("locked_content")
          .select("id, listing_id, title, description, coin_price, media_urls, media_types, created_at, listings(title)")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      setListings(myListings || [])
      setItems(myItems || [])
      setLoading(false)
    })
  }, [router])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newPreviews: MediaPreview[] = []
    Array.from(files).slice(0, 10 - mediaPreviews.length).forEach(file => {
      const isVideo = file.type.startsWith("video/")
      const preview = URL.createObjectURL(file)
      newPreviews.push({ file, preview, type: isVideo ? "video" : "image" })
    })
    setMediaPreviews(prev => [...prev, ...newPreviews])
  }

  const removeMedia = (index: number) => {
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!userId || !form.title || !form.listing_id) return
    setSaving(true)

    try {
      // Upload all media
      const uploaded: { url: string; type: "image" | "video" }[] = []
      for (const mp of mediaPreviews) {
        const result = await uploadMedia(mp.file)
        uploaded.push(result)
      }

      const supabase = createClient()
      const { data, error } = await supabase.from("locked_content").insert({
        listing_id: form.listing_id,
        seller_id: userId,
        title: form.title,
        description: form.description || null,
        coin_price: form.coin_price,
        media_urls: uploaded.map(u => u.url),
        media_types: uploaded.map(u => u.type),
      }).select("id, listing_id, title, description, coin_price, media_urls, media_types, created_at, listings(title)").single()

      if (!error && data) {
        setItems(prev => [data, ...prev])
        setShowModal(false)
        setForm({ listing_id: "", title: "", description: "", coin_price: 10 })
        setMediaPreviews([])
      }
    } catch (err) {
      alert("Upload error: " + (err instanceof Error ? err.message : "Unknown error"))
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("locked_content").delete().eq("id", id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Exclusive Content</h1>
            <p className="text-gray-500 text-sm mt-1">Sell locked content to your fans with coins</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + Add new content
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="mb-4"><svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
            <p className="font-semibold text-gray-900 mb-1">No content yet</p>
            <p className="text-gray-500 text-sm mb-5">Upload exclusive content and set a coin price</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Add your first content
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {item.media_urls?.[0] && (
                  <div className="h-40 bg-gray-900 overflow-hidden relative">
                    {item.media_types?.[0] === "video" ? (
                      <video src={item.media_urls[0]} className="w-full h-full object-cover opacity-70" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.media_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.coin_price} coins
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{escapeHtml(item.title)}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {escapeHtml((item.listings as { title: string } | null)?.title || "No listing")} · {new Date(item.created_at).toLocaleDateString("en-US")}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Add exclusive content</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-xl font-light">×</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Listing */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Linked to listing *</label>
                <select
                  value={form.listing_id}
                  onChange={e => setForm(f => ({ ...f, listing_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="">Select listing...</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                {listings.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">You have no active listings. Create a listing first.</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="E.g. Exclusive photo set"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe what the content is..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>

              {/* Coin price */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Price (coins) *</label>
                <input
                  type="number"
                  min={10}
                  value={form.coin_price}
                  onChange={e => setForm(f => ({ ...f, coin_price: parseInt(e.target.value) || 10 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 10 coins · You receive ~${(form.coin_price * 0.065).toFixed(2)} USD per sale</p>
              </div>

              {/* Media upload */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Upload images/video (max 10)
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <p className="text-sm text-gray-500">Click to upload images or video</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP, MP4, MOV</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />

                {mediaPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {mediaPreviews.map((mp, i) => (
                      <div key={i} className="relative">
                        {mp.type === "video" ? (
                          <video src={mp.preview} className="w-full h-20 object-cover rounded-lg" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mp.preview} alt="" className="w-full h-20 object-cover rounded-lg" />
                        )}
                        <button
                          onClick={() => removeMedia(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.listing_id}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving ? "Uploading..." : "Save content"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
