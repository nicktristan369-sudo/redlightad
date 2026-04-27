"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { Trash2, Eye, EyeOff, Play, Clock, Coins } from "lucide-react"

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

interface Recording {
  id: string
  title: string
  cloudinary_url: string
  thumbnail_url: string | null
  duration_seconds: number
  file_size_bytes: number
  tip_total: number
  visible: boolean
  created_at: string
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatSize(bytes: number) {
  if (bytes > 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  return `${(bytes / 1_000).toFixed(0)} KB`
}

export default function RecordingsPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("/api/cam/recordings?mine=1", {
        headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
      })
      const data = await res.json()
      setRecordings(data.recordings || [])
      setLoading(false)
    })
  }, [router])

  const toggleVisibility = async (id: string, visible: boolean) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/cam/recordings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ""}` },
      body: JSON.stringify({ id, visible }),
    })
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, visible } : r))
  }

  const deleteRecording = async (id: string) => {
    if (!confirm("Delete this recording permanently?")) return
    setDeleting(id)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/cam/recordings?id=${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
    })
    setRecordings(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 4 }}>My Recordings</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {recordings.length} recording{recordings.length !== 1 ? "s" : ""} — viewers can watch and tip even after your stream ends
          </p>
        </div>

        {recordings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#F9FAFB", borderRadius: 16, border: "1px solid #E5E5E5" }}>
            <div style={{ width: 56, height: 56, background: "#F3F4F6", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Play size={24} color="#9CA3AF" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 }}>No recordings yet</h3>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Your streams are recorded automatically. Go live to create your first recording.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recordings.map(rec => (
              <div key={rec.id} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 14, overflow: "hidden" }}>
                {/* Video player (expanded) */}
                {playingId === rec.id && (
                  <video
                    src={rec.cloudinary_url}
                    controls
                    autoPlay
                    style={{ width: "100%", maxHeight: 400, background: "#000", display: "block" }}
                    onEnded={() => setPlayingId(null)}
                  />
                )}

                <div style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
                  {/* Thumbnail / play button */}
                  <button
                    onClick={() => setPlayingId(playingId === rec.id ? null : rec.id)}
                    style={{ width: 64, height: 64, borderRadius: 10, background: "#0A0A0A", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" }}
                  >
                    {rec.thumbnail_url ? (
                      <img src={rec.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : null}
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
                      <Play size={22} color="#fff" fill="#fff" />
                    </div>
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={rec.title}>{escapeHtml(rec.title)}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> {formatDuration(rec.duration_seconds)}
                      </span>
                      {rec.tip_total > 0 && (
                        <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <Coins size={12} /> +{rec.tip_total} RC earned
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                        {new Date(rec.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {rec.file_size_bytes > 0 && (
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{formatSize(rec.file_size_bytes)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleVisibility(rec.id, !rec.visible)}
                      title={rec.visible ? "Hide from viewers" : "Show to viewers"}
                      style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E5E5E5", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      {rec.visible ? <Eye size={15} color="#374151" /> : <EyeOff size={15} color="#9CA3AF" />}
                    </button>
                    <button
                      onClick={() => deleteRecording(rec.id)}
                      disabled={deleting === rec.id}
                      title="Delete permanently"
                      style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: deleting === rec.id ? 0.5 : 1 }}
                    >
                      <Trash2 size={15} color="#DC2626" />
                    </button>
                  </div>
                </div>

                {/* Visibility badge */}
                <div style={{ padding: "6px 16px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: rec.visible ? "#16A34A" : "#9CA3AF", background: rec.visible ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${rec.visible ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 20, padding: "2px 8px" }}>
                    {rec.visible ? "Visible to viewers" : "Hidden"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
