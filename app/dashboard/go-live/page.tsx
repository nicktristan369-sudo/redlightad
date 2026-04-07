"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Video, Radio, Square, Users, Clock, Mic, MicOff, VideoOff } from "lucide-react"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"

// LiveKit
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  TrackToggle,
  RoomAudioRenderer,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"

// ── Inner broadcaster component (inside LiveKitRoom) ─────────────────────────
function BroadcastControls({ onViewerCount }: { onViewerCount: (n: number) => void }) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone])

  useEffect(() => {
    localParticipant?.setCameraEnabled(true)
    localParticipant?.setMicrophoneEnabled(true)
  }, [localParticipant])

  const camTrack = tracks.find(t => t.source === Track.Source.Camera)

  return (
    <div style={{ position: "relative" }}>
      {camTrack ? (
        <VideoTrack trackRef={camTrack} style={{ width: "100%", borderRadius: 12, background: "#000" }} />
      ) : (
        <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <VideoOff color="#666" size={40} />
        </div>
      )}
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12 }}>
        <TrackToggle source={Track.Source.Camera} style={{ background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Video size={16} /> Camera
        </TrackToggle>
        <TrackToggle source={Track.Source.Microphone} style={{ background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Mic size={16} /> Mic
        </TrackToggle>
      </div>
      <RoomAudioRenderer />
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GoLivePage() {
  const router = useRouter()
  const [listing, setListing] = useState<{ id: string; display_name?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [camTitle, setCamTitle] = useState("")
  const [camCategory, setCamCategory] = useState("public")
  const [tokensPerMin, setTokensPerMin] = useState(20)
  const [viewerCount, setViewerCount] = useState(0)
  const [streamStart, setStreamStart] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState("00:00")
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitWsUrl, setLivekitWsUrl] = useState<string>("ws://76.13.154.9:7880")
  const [goingLive, setGoingLive] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<{ id: string; username: string; message: string; is_tip: boolean; tip_amount: number | null }[]>([])
  const [showChat, setShowChat] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase
        .from("listings")
        .select("id, display_name, cam_live, cam_title, cam_category, cam_tokens_per_min, cam_viewers, cam_started_at")
        .eq("user_id", user.id)
        .single()
      if (!data) { router.replace("/dashboard"); return }
      setListing(data)
      if (data.cam_live) {
        setIsLive(true)
        setCamTitle(data.cam_title || "")
        setCamCategory(data.cam_category || "public")
        setTokensPerMin(data.cam_tokens_per_min || 20)
        setViewerCount(data.cam_viewers || 0)
        if (data.cam_started_at) setStreamStart(new Date(data.cam_started_at))
      }
      setLoading(false)
    })
  }, [router])

  // Live timer
  useEffect(() => {
    if (!isLive || !streamStart) return
    const t = setInterval(() => {
      const diff = Math.floor((Date.now() - streamStart.getTime()) / 1000)
      const m = Math.floor(diff / 60).toString().padStart(2, "0")
      const s = (diff % 60).toString().padStart(2, "0")
      setElapsed(`${m}:${s}`)
    }, 1000)
    return () => clearInterval(t)
  }, [isLive, streamStart])

  const handleGoLive = async () => {
    if (!listing) return
    setGoingLive(true)
    setError("")
    try {
      // Get LiveKit token
      const res = await fetch("/api/cam/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: `listing-${listing.id}`,
          participantName: listing.display_name || listing.id,
          isHost: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Mark as live in DB
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

      setLivekitToken(data.token)
      setLivekitWsUrl(data.wsUrl)
      setIsLive(true)
      setStreamStart(new Date(now))
      setViewerCount(0)

      // Subscribe to chat messages (reuse supabase from above)
      const listingId = listing.id
      supabase.from("cam_messages").select("*").eq("room_id", listingId).order("created_at").limit(50)
        .then(({ data: msgs }) => { if (msgs) setMessages(msgs as typeof messages) })
      supabase.channel(`golive-chat-${listingId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "cam_messages", filter: `room_id=eq.${listingId}` },
          payload => setMessages(prev => [...prev.slice(-99), payload.new as typeof prev[0]]))
        .subscribe()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to go live")
    } finally {
      setGoingLive(false)
    }
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
    setLivekitToken(null)
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

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {isLive ? "🔴 You are live" : "Go Live"}
        </h1>

        {/* Live stream */}
        {isLive && livekitToken ? (
          <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 50, display: "flex", flexDirection: "column" }}>
            <LiveKitRoom
              serverUrl={livekitWsUrl}
              token={livekitToken}
              connect={true}
              video={true}
              audio={true}
              style={{ flex: 1, position: "relative" }}
            >
              <BroadcastControls onViewerCount={setViewerCount} />
            </LiveKitRoom>

            {/* Top bar: stats */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "48px 16px 12px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 4 }}>● LIVE</span>
              <span style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {viewerCount}
              </span>
              <span style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={13} /> {elapsed}
              </span>
              <button onClick={() => setShowChat(!showChat)}
                style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                {showChat ? "Hide chat" : "Show chat"}
              </button>
            </div>

            {/* Chat overlay (bottom left) */}
            {showChat && (
              <div style={{ position: "absolute", bottom: 80, left: 12, width: "65%", maxWidth: 320, pointerEvents: "none" }}>
                <div ref={chatRef} style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "hidden", justifyContent: "flex-end" }}>
                  {messages.slice(-8).map(m => (
                    <div key={m.id} style={{ fontSize: 13, lineHeight: 1.4, pointerEvents: "none" }}>
                      {m.is_tip ? (
                        <span style={{ background: "rgba(220,38,38,0.85)", padding: "3px 8px", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          💰 {m.username} tipped {m.tip_amount} RC
                        </span>
                      ) : (
                        <span style={{ background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
                          <b style={{ color: "#DC2626" }}>{m.username}</b>
                          <span style={{ color: "#fff" }}>: {m.message}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom: end button */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px 32px", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
              <button onClick={handleEndStream}
                style={{ width: "100%", padding: "14px", background: "rgba(220,38,38,0.9)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Square size={16} /> End stream
              </button>
            </div>
          </div>
        ) : (
          /* Pre-live setup */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>STREAM TITLE</label>
              <input value={camTitle} onChange={e => setCamTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 14 }}
                placeholder="What are you doing today?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>TYPE</label>
                <select value={camCategory} onChange={e => setCamCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 14 }}>
                  <option value="public">Public (free)</option>
                  <option value="private">Private (tokens/min)</option>
                </select>
              </div>
              {camCategory === "private" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>TOKENS / MIN</label>
                  <input type="number" value={tokensPerMin} onChange={e => setTokensPerMin(parseInt(e.target.value))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 14 }}
                    min={5} max={500} />
                </div>
              )}
            </div>

            {error && <p style={{ color: "#DC2626", fontSize: 13 }}>{error}</p>}

            <button onClick={handleGoLive} disabled={goingLive}
              style={{ padding: "14px", background: goingLive ? "#9CA3AF" : "#DC2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: goingLive ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Radio size={18} /> {goingLive ? "Starting..." : "Go Live"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
