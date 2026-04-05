"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Video, Radio, Square, Users, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"

export default function GoLivePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [listing, setListing] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [camTitle, setCamTitle] = useState("")
  const [camCategory, setCamCategory] = useState("public")
  const [tokensPerMin, setTokensPerMin] = useState(20)
  const [viewerCount, setViewerCount] = useState(0)
  const [cameraError, setCameraError] = useState(false)
  const [streamStart, setStreamStart] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState("00:00")
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase
        .from("listings")
        .select("id, cam_live, cam_title, cam_category, cam_tokens_per_min, cam_viewers, cam_started_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single()
      if (data) {
        setListing({ id: data.id })
        if (data.cam_live) {
          setIsLive(true)
          setCamTitle(data.cam_title || "")
          setCamCategory(data.cam_category || "public")
          setTokensPerMin(data.cam_tokens_per_min || 20)
          setViewerCount(data.cam_viewers || 0)
          if (data.cam_started_at) setStreamStart(new Date(data.cam_started_at))
        }
      }
      setLoading(false)
    })
  }, [router])

  // Camera preview
  useEffect(() => {
    if (videoRef.current && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch(() => setCameraError(true))
    }
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [loading])

  // Live timer
  useEffect(() => {
    if (!isLive || !streamStart) return
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - streamStart.getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [isLive, streamStart])

  const handleGoLive = async () => {
    if (!listing) return
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from("listings").update({
      cam_live: true,
      cam_title: camTitle || null,
      cam_category: camCategory,
      cam_tokens_per_min: tokensPerMin,
      cam_started_at: now,
      cam_viewers: 0,
    }).eq("id", listing.id)
    setIsLive(true)
    setStreamStart(new Date(now))
    setViewerCount(0)
  }

  const handleEndStream = async () => {
    if (!listing) return
    const supabase = createClient()
    await supabase.from("listings").update({
      cam_live: false,
      cam_viewers: 0,
      cam_started_at: null,
    }).eq("id", listing.id)
    setIsLive(false)
    setStreamStart(null)
    setElapsed("00:00")
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: 28, height: 28, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    )
  }

  if (!listing) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <Radio size={40} color="#ccc" style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No active profile</h2>
          <p style={{ fontSize: 14, color: "#888" }}>You need an active profile to go live.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
            RedLight<span style={{ color: "#DC2626" }}>Cam</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: "#888", marginLeft: 8 }}>— Go Live</span>
          </h1>
        </div>

        {/* Camera preview */}
        <div style={{
          width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden",
          background: "#0A0A0A", marginBottom: 24, position: "relative",
        }}>
          {cameraError ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Video size={36} color="#555" />
              <p style={{ color: "#555", fontSize: 14, marginTop: 12 }}>Camera not available</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          )}
          {isLive && (
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.9)", padding: "4px 10px", borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Stream title</label>
            <input
              value={camTitle}
              onChange={e => setCamTitle(e.target.value)}
              placeholder="What's your stream about?"
              disabled={isLive}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #E5E5E5", fontSize: 14, outline: "none",
                background: isLive ? "#F5F5F5" : "#fff", color: "#111",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
              <select
                value={camCategory}
                onChange={e => setCamCategory(e.target.value)}
                disabled={isLive}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1px solid #E5E5E5", fontSize: 14, outline: "none",
                  background: isLive ? "#F5F5F5" : "#fff", color: "#111",
                  cursor: isLive ? "default" : "pointer",
                }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tokens/min (private)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  value={tokensPerMin}
                  onChange={e => setTokensPerMin(Number(e.target.value))}
                  disabled={isLive}
                  min={1}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid #E5E5E5", fontSize: 14, outline: "none",
                    background: isLive ? "#F5F5F5" : "#fff", color: "#111",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#888", whiteSpace: "nowrap" }}>RC</span>
              </div>
            </div>
          </div>
        </div>

        {/* GO LIVE / END buttons */}
        {!isLive ? (
          <button onClick={handleGoLive}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: "#DC2626", color: "#fff", fontSize: 18, fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#B91C1C" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#DC2626" }}>
            <Radio size={20} /> GO LIVE
          </button>
        ) : (
          <button onClick={handleEndStream}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: "#333", color: "#fff", fontSize: 18, fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#444" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#333" }}>
            <Square size={18} /> END STREAM
          </button>
        )}

        {/* Stats */}
        {isLive && (
          <div style={{
            display: "flex", gap: 24, justifyContent: "center", marginTop: 20,
            padding: "16px", background: "#F8F8F8", borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#555" }}>
              <Users size={16} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{viewerCount} viewers</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#555" }}>
              <Clock size={16} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{elapsed} live</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  )
}
