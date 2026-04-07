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
  const [camReady, setCamReady] = useState(false)
  const [camError, setCamError] = useState(false)
  const retryRef = useRef(0)

  const startCamera = useCallback(async () => {
    if (!localParticipant) return
    setCamError(false)
    try {
      await localParticipant.setCameraEnabled(true)
      await localParticipant.setMicrophoneEnabled(true)
      setCamReady(true)
    } catch {
      setCamError(true)
    }
  }, [localParticipant])

  useEffect(() => {
    if (!localParticipant) return
    // Auto-start with retries (mobile needs user gesture sometimes)
    const tryStart = async () => {
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 800 + i * 600))
        try {
          await localParticipant.setCameraEnabled(true)
          await localParticipant.setMicrophoneEnabled(true)
          setCamReady(true)
          return
        } catch { /* retry */ }
      }
      setCamError(true) // show manual button after 3 fails
    }
    tryStart()
  }, [localParticipant])

  const camTrack = tracks.find(t => t.source === Track.Source.Camera)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#000" }}>
      {camTrack ? (
        <VideoTrack trackRef={camTrack} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          {camError ? (
            <>
              <VideoOff color="#DC2626" size={48} />
              <p style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center", padding: "0 20px" }}>
                Kamera kunne ikke startes automatisk
              </p>
              <button onClick={startCamera}
                style={{ padding: "12px 28px", background: "#DC2626", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Video size={16} /> Start kamera
              </button>
            </>
          ) : (
            <>
              <div style={{ width: 32, height: 32, border: "3px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "#555", fontSize: 13 }}>Starter kamera...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </>
          )}
        </div>
      )}
      {/* Camera/Mic toggle buttons — only when camera is active */}
      {camTrack && (
        <div style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
          <TrackToggle source={Track.Source.Camera} style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Video size={15} /> Kamera
          </TrackToggle>
          <TrackToggle source={Track.Source.Microphone} style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Mic size={15} /> Mikrofon
          </TrackToggle>
        </div>
      )}
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
  const [privateRequests, setPrivateRequests] = useState<{ id: string; viewer_username: string; tokens_per_min: number; room_name: string }[]>([])
  const [activePrivate, setActivePrivate] = useState<{ id: string; viewer_username: string; tokens_per_min: number } | null>(null)
  const [messages, setMessages] = useState<{ id: string; username: string; message: string; is_tip: boolean; tip_amount: number | null }[]>([])
  const [showChat, setShowChat] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)

  const playTipSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const notes = [880, 1100, 1320]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25)
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
    } catch { /* ignore AudioContext errors */ }
  }, [])

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

  // Poll for private show requests
  useEffect(() => {
    if (!isLive || !listing?.id) return
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data } = await supabase.from("cam_private_requests")
        .select("*").eq("listing_id", listing.id).eq("status", "pending")
      if (data && data.length > 0) {
        setPrivateRequests(data.map(r => ({ id: r.id, viewer_username: r.viewer_username, tokens_per_min: r.tokens_per_min, room_name: r.room_name })))
        playTipSound()
      } else {
        setPrivateRequests([])
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isLive, listing?.id])

  const acceptPrivate = async (requestId: string, roomName: string) => {
    const req = privateRequests.find(r => r.id === requestId)
    await fetch("/api/cam/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", requestId }),
    })
    setPrivateRequests(prev => prev.filter(r => r.id !== requestId))
    if (req) setActivePrivate({ id: requestId, viewer_username: req.viewer_username, tokens_per_min: req.tokens_per_min })
  }

  const endActivePrivate = async () => {
    if (!activePrivate) return
    await fetch("/api/cam/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", requestId: activePrivate.id }),
    })
    setActivePrivate(null)
  }

  const declinePrivate = async (requestId: string) => {
    await fetch("/api/cam/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline", requestId }),
    })
    setPrivateRequests(prev => prev.filter(r => r.id !== requestId))
  }

  // Chat — polling every 3s (most reliable across devices)
  useEffect(() => {
    if (!isLive || !listing?.id) return
    const supabase = createClient()
    const listingId = listing.id

    // Only show messages from THIS stream session
    const streamBegin = new Date(Date.now() - 5000).toISOString()
    let lastTimestamp = streamBegin
    setMessages([]) // clear old messages

    // Poll for new messages every 2.5s — only from current session
    const interval = setInterval(async () => {
      const { data } = await supabase.from("cam_messages")
        .select("*").eq("room_id", listingId)
        .gt("created_at", lastTimestamp)
        .order("created_at")
      if (data && data.length > 0) {
        lastTimestamp = data[data.length - 1].created_at
        const hasTip = data.some((m: { is_tip: boolean }) => m.is_tip)
        if (hasTip) playTipSound()
        setMessages(prev => [...prev.slice(-99), ...(data as typeof prev)])
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [isLive, listing?.id])

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
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "48px 16px 12px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {activePrivate ? (
                <span style={{ background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 4 }}>🔒 PRIVATE</span>
              ) : (
                <span style={{ background: "#DC2626", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 4 }}>● LIVE</span>
              )}
              <span style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {viewerCount}
              </span>
              <span style={{ color: "#fff", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={13} /> {elapsed}
              </span>
              {activePrivate && (
                <span style={{ color: "#C4B5FD", fontSize: 12, fontWeight: 600 }}>
                  {activePrivate.viewer_username} · {activePrivate.tokens_per_min} RC/min
                </span>
              )}
              <button onClick={() => setShowChat(!showChat)}
                style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                {showChat ? "Hide chat" : "Show chat"}
              </button>
            </div>

            {/* Private show requests */}
            {privateRequests.map(req => (
              <div key={req.id} style={{ position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)", background: "rgba(220,38,38,0.95)", borderRadius: 12, padding: "14px 20px", zIndex: 60, minWidth: 280, textAlign: "center", backdropFilter: "blur(8px)" }}>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 4 }}>🔒 Private Show Request</p>
                <p style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 12 }}>
                  <b>{req.viewer_username}</b> wants a private show · {req.tokens_per_min} RC/min
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => declinePrivate(req.id)}
                    style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                    Decline
                  </button>
                  <button onClick={() => acceptPrivate(req.id, req.room_name)}
                    style={{ flex: 2, padding: "8px", background: "#fff", border: "none", borderRadius: 8, color: "#DC2626", fontSize: 13, cursor: "pointer", fontWeight: 800 }}>
                    ✓ Accept
                  </button>
                </div>
              </div>
            ))}

            {/* Bottom section: chat + buttons (no overlap) */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)" }}>
              {/* Chat messages */}
              {showChat && (
                <div ref={chatRef} style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "hidden", justifyContent: "flex-end" }}>
                  {messages.slice(-6).map(m => (
                    <div key={m.id} style={{ fontSize: 13, lineHeight: 1.4 }}>
                      {m.is_tip ? (
                        <span style={{ background: "rgba(220,38,38,0.85)", padding: "3px 8px", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          💰 {m.username} tipped {m.tip_amount} RC
                        </span>
                      ) : (
                        <span>
                          <b style={{ color: "#DC2626" }}>{m.username}</b>
                          <span style={{ color: "#E5E7EB" }}>: {m.message}</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div style={{ padding: "8px 16px 32px", display: "flex", gap: 8 }}>
                {activePrivate && (
                  <button onClick={endActivePrivate}
                    style={{ flex: 1, padding: "13px 8px", background: "#7C3AED", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    End Private
                  </button>
                )}
                <button onClick={handleEndStream}
                  style={{ flex: activePrivate ? 1 : undefined, width: activePrivate ? undefined : "100%", padding: "13px 0", background: "rgba(220,38,38,0.9)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Square size={16} /> End stream
                </button>
              </div>
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
