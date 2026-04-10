"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Users, ArrowLeft, Video, Heart, Gift, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase"

// LiveKit
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
  useParticipants,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"

interface Listing {
  id: string
  title: string
  display_name: string
  profile_image: string | null
  age: number | null
  city: string | null
  country: string | null
  bio: string | null
  cam_live: boolean
  cam_title: string | null
  cam_viewers: number
  cam_category: string
  cam_tokens_per_min: number
  photos: string[] | null
  services: string[] | null
  languages: string[] | null
  hair_color: string | null
  body_type: string | null
  ethnicity: string | null
  about: string | null
  cam_goal_title: string | null
  cam_goal_target: number
  cam_goal_current: number
  cam_goal_active: boolean
  cam_status?: "offline" | "available" | "scheduled"
  cam_available_until?: string | null
  cam_scheduled_at?: string | null
}

interface CamMessage {
  id: string
  user_id: string
  username: string
  message: string
  is_tip: boolean
  tip_amount: number | null
  created_at: string
}

// ── LiveKit video component ──────────────────────────────────────────────────
function LiveViewer({ onViewerCount }: { onViewerCount: (n: number) => void }) {
  const tracks = useTracks([Track.Source.Camera])
  const participants = useParticipants()

  useEffect(() => { onViewerCount(participants.length) }, [participants.length, onViewerCount])

  const hostTrack = tracks[0]

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      {hostTrack ? (
        <VideoTrack trackRef={hostTrack} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#555", fontSize: 14 }}>Connecting to stream...</p>
        </div>
      )}
      <RoomAudioRenderer />
    </div>
  )
}

// ── Tip modal ────────────────────────────────────────────────────────────────
function TipModal({ onClose, onSend, balance }: { onClose: () => void; onSend: (amount: number) => void; balance: number }) {
  const [amount, setAmount] = useState(50)
  const presets = [10, 25, 50, 100, 250, 500]
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1A1A1A", borderRadius: 16, padding: 28, width: 340, border: "1px solid #2A2A2A" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Send Tip 💰</h3>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Your balance: <b style={{ color: "#DC2626" }}>{balance.toLocaleString()} RC</b></p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {presets.map(p => (
            <button key={p} onClick={() => setAmount(p)}
              style={{ padding: "10px 0", border: `1px solid ${amount === p ? "#DC2626" : "#2A2A2A"}`, borderRadius: 8, background: amount === p ? "rgba(220,38,38,0.15)" : "transparent", color: amount === p ? "#DC2626" : "#9CA3AF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {p} RC
            </button>
          ))}
        </div>
        <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)}
          style={{ width: "100%", background: "#111", border: "1px solid #2A2A2A", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid #2A2A2A", borderRadius: 8, color: "#9CA3AF", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSend(amount); onClose() }} disabled={amount <= 0 || amount > balance}
            style={{ flex: 2, padding: "11px", background: amount > 0 && amount <= balance ? "#DC2626" : "#333", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: amount > 0 && amount <= balance ? "pointer" : "not-allowed" }}>
            Send {amount} RC
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CamRoomPage() {
  const params = useParams()
  const id = params?.id as string
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [livekitWsUrl, setLivekitWsUrl] = useState("wss://livekit.redlightad.com")
  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState<CamMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [showTip, setShowTip] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "profile" | "tips">("chat")
  const [infoTab, setInfoTab] = useState<"bio" | "media">("bio")
  const [followed, setFollowed] = useState(false)
  const [privateRequest, setPrivateRequest] = useState<{ id: string; status: string; roomName: string; tokensPerMin: number } | null>(null)
  const [privateToken, setPrivateToken] = useState<string | null>(null)
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false)
  const [privateBilling, setPrivateBilling] = useState(false)
  const [privateMinutes, setPrivateMinutes] = useState(0)
  const [privateRcSpent, setPrivateRcSpent] = useState(0)
  const [privateSeconds, setPrivateSeconds] = useState(0)
  const [tipError, setTipError] = useState<string | null>(null)
  const [tipMenu, setTipMenu] = useState<{id: string; action: string; rc_amount: number}[]>([])
  const [isNotifying, setIsNotifying] = useState(false)
  const [goalProgress, setGoalProgress] = useState(0)
  const [countdown, setCountdown] = useState("")
  const [recordings, setRecordings] = useState<{ id: string; title: string; cloudinary_url: string; duration_seconds: number; created_at: string }[]>([])
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const audioUnlocked = useRef(false)
  const seenMsgIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single()
      setListing(data)
      setLoading(false)

      if (data) {
        setGoalProgress(data.cam_goal_current || 0)
      }

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Use wallets table (source of truth — same as navbar)
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
        setUserBalance(wallet?.balance || 0)
      }

      if (data?.cam_live) {
        const viewerName = user?.email?.split("@")[0] || `guest_${Math.random().toString(36).slice(2, 6)}`
        const res = await fetch("/api/cam/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: `listing-${id}`, participantName: viewerName, isHost: false }),
        })
        const tokenData = await res.json()
        if (res.ok) { setLivekitToken(tokenData.token); setLivekitWsUrl(tokenData.wsUrl) }
      }
    }

    load()

    // Load tip menu
    fetch(`/api/cam/tip-menu?listingId=${id}`).then(r => r.json()).then(d => setTipMenu(d.items || []))

    // Realtime chat
    // Load initial messages from current session
    let since = new Date(Date.now() - 3600000).toISOString()
    let lastTimestamp = since
    seenMsgIds.current.clear()

    supabase.from("listings").select("cam_started_at").eq("id", id).single()
      .then(({ data: l }) => {
        since = l?.cam_started_at || since
        lastTimestamp = since
        supabase.from("cam_messages").select("*").eq("room_id", id)
          .gte("created_at", since).order("created_at").limit(80)
          .then(({ data }) => {
            if (data) {
              data.forEach(m => seenMsgIds.current.add(m.id))
              setMessages(data)
            }
          })
      })

    // Realtime channel (primary — fast)
    const channel = supabase.channel(`cam-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cam_messages", filter: `room_id=eq.${id}` },
        payload => {
          const m = payload.new as CamMessage
          if (seenMsgIds.current.has(m.id)) return
          seenMsgIds.current.add(m.id)
          lastTimestamp = m.created_at
          setMessages(prev => [...prev.slice(-149), m])
        })
      .subscribe()

    // Polling fallback (every 3s) — catches messages if WebSocket drops on desktop
    const pollInterval = setInterval(async () => {
      const { data } = await supabase.from("cam_messages")
        .select("*").eq("room_id", id)
        .gt("created_at", lastTimestamp)
        .order("created_at").limit(20)
      if (data && data.length > 0) {
        const newMsgs = data.filter(m => !seenMsgIds.current.has(m.id))
        if (newMsgs.length > 0) {
          newMsgs.forEach(m => seenMsgIds.current.add(m.id))
          lastTimestamp = data[data.length - 1].created_at
          setMessages(prev => [...prev.slice(-149), ...newMsgs])
        }
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [id])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || newMessage.trim()
    if (!msg || !currentUser) return
    if (!text) setNewMessage("")

    const supabase = createClient()
    const { data: inserted } = await supabase.from("cam_messages").insert({
      room_id: id,
      user_id: currentUser.id,
      username: currentUser.email?.split("@")[0] || "Anonymous",
      message: msg,
      is_tip: false,
    }).select().single()

    if (inserted) {
      // Mark as seen BEFORE realtime/polling can pick it up → no duplicate
      seenMsgIds.current.add(inserted.id)
      setMessages(prev => [...prev.slice(-149), inserted as CamMessage])
    }
  }

  const playTipSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const notes = [880, 1100, 1320]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = "sine"; osc.frequency.value = freq
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25)
        osc.start(ctx.currentTime + i * 0.12); osc.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
    } catch { /* ignore */ }
  }

  const requestPrivateShow = async () => {
    if (!currentUser || !listing) return
    setShowPrivateConfirm(false)
    const res = await fetch("/api/cam/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request",
        listingId: listing.id,
        viewerId: currentUser.id,
        viewerUsername: currentUser.email?.split("@")[0] || "viewer",
        tokensPerMin: listing.cam_tokens_per_min || 20,
      }),
    })
    const data = await res.json()
    if (res.ok) setPrivateRequest({ id: data.request.id, status: "pending", roomName: data.request.room_name, tokensPerMin: listing.cam_tokens_per_min || 20 })
  }

  // Poll for private request status
  useEffect(() => {
    if (!privateRequest || privateRequest.status === "ended" || privateRequest.status === "declined") return
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data } = await supabase.from("cam_private_requests").select("*").eq("id", privateRequest.id).single()
      if (!data) return
      if (data.status === "accepted" && privateRequest.status !== "accepted") {
        setPrivateRequest(prev => prev ? { ...prev, status: "accepted" } : null)
        // Get LiveKit token for private room
        const res = await fetch("/api/cam/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: privateRequest.roomName, participantName: currentUser?.email?.split("@")[0] || "viewer", isHost: false }),
        })
        const tokenData = await res.json()
        if (res.ok) setPrivateToken(tokenData.token)
      } else if (data.status === "ended" || data.status === "declined") {
        setPrivateToken(null)
        clearInterval(interval)
        // Show message briefly then reset so "Private Show" button reappears
        setPrivateRequest(prev => prev ? { ...prev, status: data.status } : null)
        setTimeout(() => setPrivateRequest(null), 3000)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [privateRequest?.id, privateRequest?.status, currentUser])

  // Per-minute billing + second counter for private show
  useEffect(() => {
    if (!privateRequest || privateRequest.status !== "accepted" || !currentUser) return

    // Reset counters
    setPrivateMinutes(0)
    setPrivateRcSpent(0)
    setPrivateSeconds(0)

    // Second-by-second timer (for display)
    const secInterval = setInterval(() => {
      setPrivateSeconds(s => s + 1)
    }, 1000)

    // Per-minute billing
    const billInterval = setInterval(async () => {
      const res = await fetch("/api/cam/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bill", requestId: privateRequest.id }),
      })
      const data = await res.json()
      if (data.ended) {
        setPrivateToken(null)
        clearInterval(billInterval)
        clearInterval(secInterval)
        setPrivateRequest(prev => prev ? { ...prev, status: "ended" } : null)
        setTimeout(() => setPrivateRequest(null), 3000)
      } else if (data.remaining !== undefined) {
        setUserBalance(data.remaining)
        setPrivateMinutes(m => m + 1)
        setPrivateRcSpent(s => s + (data.deducted || privateRequest.tokensPerMin))
      }
    }, 60000)

    return () => { clearInterval(billInterval); clearInterval(secInterval) }
  }, [privateRequest?.id, privateRequest?.status])

  const endPrivateShow = async () => {
    if (!privateRequest) return
    await fetch("/api/cam/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", requestId: privateRequest.id }),
    })
    setPrivateRequest(prev => prev ? { ...prev, status: "ended" } : null)
    setPrivateToken(null)
  }

  // Unlock AudioContext on first user interaction (browser requirement)
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        ctx.resume()
        audioUnlocked.current = true
      } catch { /* ignore */ }
    }
    document.addEventListener("click", unlock, { once: true })
    return () => document.removeEventListener("click", unlock)
  }, [])

  // Fetch recordings for this listing
  useEffect(() => {
    fetch(`/api/cam/recordings?listingId=${id}`)
      .then(r => r.json())
      .then(d => setRecordings(d.recordings || []))
      .catch(() => {})
  }, [id])

  // Viewer count — poll from DB every 10s (fallback for when LiveKit participants count fails on mobile)
  useEffect(() => {
    if (!listing?.cam_live) return
    const supabase = createClient()
    const poll = async () => {
      const { data } = await supabase.from("listings").select("cam_viewers").eq("id", id).single()
      if (data?.cam_viewers !== undefined) setViewerCount(v => Math.max(v, data.cam_viewers || 0))
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [id, listing?.cam_live])

  // Goal progress — poll every 5s so all viewers see live updates
  useEffect(() => {
    if (!listing?.cam_goal_active || !listing?.cam_goal_target) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/cam/goal?listingId=${id}`)
      if (res.ok) {
        const data = await res.json()
        if (typeof data.cam_goal_current === "number") {
          setGoalProgress(data.cam_goal_current)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [id, listing?.cam_goal_active, listing?.cam_goal_target])

  // Countdown timer for scheduled cam
  useEffect(() => {
    if (listing?.cam_status === "scheduled" && listing?.cam_scheduled_at) {
      const interval = setInterval(() => {
        const diff = new Date(listing.cam_scheduled_at!).getTime() - Date.now()
        if (diff <= 0) { setCountdown("Starting now!"); clearInterval(interval); return }
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setCountdown(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [listing?.cam_status, listing?.cam_scheduled_at])

  const sendTip = async (amount: number) => {
    if (!currentUser || amount <= 0 || amount > userBalance) return
    const username = currentUser.email?.split("@")[0] || "Anonymous"

    // Optimistic UI update
    const prevBalance = userBalance
    setUserBalance(prev => prev - amount)
    const optimisticId = `opt-tip-${Date.now()}`
    const optimistic: CamMessage = {
      id: optimisticId,
      user_id: currentUser.id,
      username,
      message: `tipped ${amount} RedCoins`,
      is_tip: true,
      tip_amount: amount,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev.slice(-149), optimistic])
    setTipError(null)

    try {
      // Get auth token for API call
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ""

      // Single server-side call: deduct viewer + credit streamer + insert chat message
      const res = await fetch("/api/cam/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: id, amount, viewerUsername: username }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Rollback optimistic updates
        setUserBalance(prevBalance)
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setTipError(data.error || "Tip fejlede. Prøv igen.")
        setTimeout(() => setTipError(null), 4000)
        return
      }

      // Confirm with server balance
      setUserBalance(data.new_balance)
      setGoalProgress(prev => prev + amount)
      playTipSound()

      // Update goal on server
      fetch("/api/cam/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, amount }),
      })

    } catch {
      // Network error — rollback
      setUserBalance(prevBalance)
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setTipError("Netværksfejl. Prøv igen.")
      setTimeout(() => setTipError(null), 4000)
    }
  }

  if (loading) return (
    <div style={{ height: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!listing) return <div style={{ padding: 40, textAlign: "center", color: "#fff", background: "#0A0A0A", minHeight: "100vh" }}>Stream not found</div>

  // Knights — top 3 tippers
  const knights = [...messages].filter(m => m.is_tip && m.tip_amount).reduce<{username: string; total: number}[]>((acc, m) => {
    const ex = acc.find(k => k.username === m.username)
    if (ex) ex.total += m.tip_amount || 0
    else acc.push({ username: m.username, total: m.tip_amount || 0 })
    return acc
  }, []).sort((a, b) => b.total - a.total).slice(0, 3)

  const knightColors = ["#FFD700", "#C0C0C0", "#CD7F32"]

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#0D0D0D", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      {showTip && <TipModal onClose={() => setShowTip(false)} onSend={sendTip} balance={userBalance} />}

      {/* Tip error toast */}
      {tipError && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", background: "#7F1D1D", border: "1px solid #DC2626", color: "#FCA5A5", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          ❌ {tipError}
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ height: 48, borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0, background: "#111" }}>
        <Link href="/cam" style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 4, fontSize: 13, textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <div style={{ width: 1, height: 20, background: "#2A2A2A" }} />
        {listing.profile_image && <img src={listing.profile_image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
        <span style={{ fontSize: 14, fontWeight: 700 }}>{listing.display_name}</span>
        {listing.cam_live && <span style={{ background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 3, letterSpacing: "0.05em" }}>● LIVE</span>}
        <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /> {viewerCount}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {currentUser && <span style={{ fontSize: 12, color: "#9CA3AF" }}>🔴 <b style={{ color: "#fff" }}>{userBalance.toLocaleString()}</b> RC</span>}
          <button onClick={() => setFollowed(!followed)}
            style={{ padding: "5px 14px", border: `1px solid ${followed ? "#DC2626" : "#2A2A2A"}`, borderRadius: 6, background: followed ? "rgba(220,38,38,0.15)" : "transparent", color: followed ? "#DC2626" : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Heart size={12} fill={followed ? "#DC2626" : "none"} /> {followed ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: video + info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Room title */}
          <div style={{ padding: "8px 16px", background: "#111", borderBottom: "1px solid #1E1E1E", fontSize: 13, color: "#D1D5DB" }}>
            {listing.cam_title || `${listing.display_name}'s Live Show`}
          </div>

          {/* Video */}
          <div style={{ flex: "0 0 auto", height: "55vh", background: "#000", position: "relative" }}>
            {listing.cam_live && livekitToken ? (
              <LiveKitRoom serverUrl={livekitWsUrl} token={livekitToken} connect={true} audio={true} video={false} style={{ width: "100%", height: "100%" }}>
                <LiveViewer onViewerCount={setViewerCount} />
              </LiveKitRoom>
            ) : playingRecordingId ? (
              /* ── Replay player — replaces offline state ── */
              <div style={{ width: "100%", height: "100%", background: "#000", position: "relative" }}>
                <video
                  key={playingRecordingId}
                  src={(() => {
                    const url = recordings.find(r => r.id === playingRecordingId)?.cloudinary_url || ""
                    // Convert to mp4 for cross-browser compatibility (Safari/iOS)
                    return url.replace("/upload/", "/upload/f_mp4,vc_h264/").replace(/\.(webm|ogg)$/, ".mp4")
                  })()}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
                <button onClick={() => setPlayingRecordingId(null)}
                  style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  ✕ Close
                </button>
              </div>
            ) : !listing.cam_live ? (
              /* Offline / Available / Scheduled state */
              listing.cam_status === "available" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 32, textAlign: "center", background: "#0A0A0A", width: "100%", height: "100%" }}>
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
                  <div style={{ position: "relative", marginBottom: 20 }}>
                    {listing.profile_image ? (
                      <img src={listing.profile_image} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #22C55E" }} />
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#1E1E1E", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #22C55E" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      </div>
                    )}
                    <span style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, background: "#22C55E", borderRadius: "50%", border: "2px solid #111", boxShadow: "0 0 8px #22C55E" }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{listing.display_name}</h3>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1A2E1A", border: "1px solid #22C55E44", borderRadius: 20, padding: "6px 14px", marginBottom: 20 }}>
                    <span style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%", animation: "pulse 2s infinite" }} />
                    <span style={{ color: "#22C55E", fontSize: 13, fontWeight: 700 }}>Ready to chat</span>
                  </div>
                  <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 24, maxWidth: 260 }}>
                    {listing.display_name} is available now. Send a message to connect.
                  </p>
                  <Link href="/dashboard/beskeder" style={{
                    padding: "13px 32px", background: "#22C55E", color: "#fff", borderRadius: 12,
                    fontSize: 15, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Chat now
                  </Link>
                </div>
              ) : listing.cam_status === "scheduled" && listing.cam_scheduled_at ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 32, textAlign: "center", background: "#0A0A0A", width: "100%", height: "100%" }}>
                  <div style={{ position: "relative", marginBottom: 20 }}>
                    {listing.profile_image ? (
                      <img src={listing.profile_image} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #F59E0B", filter: "grayscale(30%)" }} />
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#1E1E1E", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #F59E0B" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      </div>
                    )}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{listing.display_name}</h3>
                  <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 16 }}>Going live in</p>
                  <div style={{ fontFamily: "monospace", fontSize: 40, fontWeight: 900, color: "#F59E0B", letterSpacing: "0.05em", marginBottom: 20, textShadow: "0 0 20px #F59E0B44" }}>
                    {countdown || "00:00:00"}
                  </div>
                  <p style={{ color: "#6B7280", fontSize: 12, marginBottom: 24 }}>
                    {listing.cam_scheduled_at ? new Date(listing.cam_scheduled_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                  <button onClick={async () => {
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    const res = await fetch("/api/cam/notify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ""}` },
                      body: JSON.stringify({ listingId: id }),
                    })
                    const d = await res.json()
                    if (d.notifying !== undefined) setIsNotifying(d.notifying)
                  }} style={{
                    padding: "11px 28px", background: isNotifying ? "#1A1A1A" : "transparent", color: isNotifying ? "#F59E0B" : "#F59E0B",
                    border: "1px solid #F59E0B44", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer"
                  }}>
                    {isNotifying ? "Notification active" : "Notify me when live"}
                  </button>
                </div>
              ) : (
                /* Default offline state */
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#0A0A0A", position: "relative", padding: "24px 16px" }}>
                  {(listing.profile_image || listing.photos?.[0]) && (
                    <img src={listing.profile_image || listing.photos![0]} alt="" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #2A2A2A" }} />
                  )}
                  <span style={{ background: "#1A1A1A", color: "#6B7280", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 4, letterSpacing: "0.05em" }}>OFFLINE</span>
                  <p style={{ color: "#4B5563", fontSize: 13, textAlign: "center" }}>{listing.display_name} is not streaming right now</p>

                  {/* Offline tip */}
                  {currentUser && (
                    <button onClick={() => setShowTip(true)}
                      style={{ padding: "11px 28px", background: "#DC2626", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <Gift size={15} /> Send a Tip
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: "#374151", textAlign: "center" }}>Tips are delivered even when {listing.display_name} is offline</p>

                  {/* Replay recordings */}
                  {recordings.length > 0 && (
                    <div style={{ width: "100%", maxWidth: 340 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "center", marginBottom: 8, letterSpacing: "0.05em" }}>PAST STREAMS</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {recordings.slice(0, 3).map(rec => (
                          <button key={rec.id}
                            onClick={() => setPlayingRecordingId(playingRecordingId === rec.id ? null : rec.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}>
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#E5E7EB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.title}</p>
                              <p style={{ fontSize: 11, color: "#6B7280" }}>
                                {rec.duration_seconds > 0 ? `${Math.floor(rec.duration_seconds / 60)}m` : ""}{" "}
                                {new Date(rec.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}



                  {currentUser && (
                    <button onClick={async () => {
                      const supabase = createClient()
                      const { data: { session } } = await supabase.auth.getSession()
                      const res = await fetch("/api/cam/notify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ""}` },
                        body: JSON.stringify({ listingId: id }),
                      })
                      const d = await res.json()
                      if (d.notifying !== undefined) setIsNotifying(d.notifying)
                    }} style={{ padding: "9px 20px", background: "transparent", border: `1px solid ${isNotifying ? "#DC2626" : "#2A2A2A"}`, borderRadius: 8, color: isNotifying ? "#DC2626" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                      {isNotifying ? "✓ Notify when live (active)" : "Notify me when live"}
                    </button>
                  )}
                </div>
              )
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Video color="#333" size={48} />
                <p style={{ color: "#555", fontSize: 14 }}>Connecting...</p>
              </div>
            )}
          </div>

          {/* Tip Goal progress bar */}
          {listing.cam_goal_active && listing.cam_goal_target > 0 && (
            <div style={{ padding: "10px 16px", background: "#111", borderTop: "1px solid #1E1E1E" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: "#fff", fontWeight: 700 }}>🎯 {listing.cam_goal_title || "Session Goal"}</span>
                <span style={{ color: "#6B7280" }}>{goalProgress} / {listing.cam_goal_target} RC ({Math.round(goalProgress / listing.cam_goal_target * 100)}%)</span>
              </div>
              <div style={{ height: 6, background: "#1E1E1E", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#DC2626", width: `${Math.min(100, Math.round(goalProgress / listing.cam_goal_target * 100))}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          )}

          {/* Tip bar */}
          <div style={{ padding: "10px 16px", background: "#111", borderTop: "1px solid #1E1E1E", borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#6B7280", flex: 1 }}>
              {listing.cam_category === "private" ? `Private: ${listing.cam_tokens_per_min} RC/min` : "Free public show"}
            </span>
            {/* Private show button */}
            {currentUser && listing.cam_live && !privateRequest && (
              <button onClick={() => setShowPrivateConfirm(true)}
                style={{ padding: "7px 16px", background: "transparent", border: "1px solid #DC2626", borderRadius: 8, color: "#DC2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🔒 Private Show
              </button>
            )}
            {privateRequest && privateRequest.status === "pending" && (
              <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>⏳ Waiting for response...</span>
            )}
            {privateRequest && privateRequest.status === "declined" && (
              <span style={{ fontSize: 12, color: "#EF4444" }}>❌ Request declined</span>
            )}
            {privateRequest && privateRequest.status === "accepted" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* RC/time counter */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                  <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, fontFamily: "monospace" }}>
                    {String(Math.floor(privateSeconds / 60)).padStart(2,"0")}:{String(privateSeconds % 60).padStart(2,"0")}
                    {" · "}
                    <span style={{ color: "#DC2626" }}>{privateRcSpent} RC</span>
                  </span>
                  <span style={{ fontSize: 10, color: "#6B7280" }}>{privateRequest.tokensPerMin} RC/min</span>
                </div>
                <button onClick={endPrivateShow}
                  style={{ padding: "7px 14px", background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  🔒 End Private
                </button>
              </div>
            )}
            <button onClick={() => currentUser ? setShowTip(true) : null}
              style={{ padding: "7px 20px", background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Gift size={14} /> Send Tip
            </button>
          </div>

          {/* Private show confirm modal */}
          {showPrivateConfirm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 16, padding: 28, width: 320 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>🔒 Request Private Show</h3>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>
                  Cost: <b style={{ color: "#DC2626" }}>{listing.cam_tokens_per_min || 20} RC/min</b>
                </p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
                  Your balance: <b style={{ color: "#fff" }}>{userBalance.toLocaleString()} RC</b>
                </p>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>
                  The model must accept your request. Coins are deducted every minute automatically.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowPrivateConfirm(false)}
                    style={{ flex: 1, padding: 11, background: "transparent", border: "1px solid #2A2A2A", borderRadius: 8, color: "#9CA3AF", fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={requestPrivateShow}
                    style={{ flex: 2, padding: 11, background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bio tabs */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#0D0D0D" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #1E1E1E", background: "#111" }}>
              {[["bio", "Bio"], ["media", "Pics & Videos"]].map(([key, label]) => (
                <button key={key} onClick={() => setInfoTab(key as "bio" | "media")}
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", borderBottom: infoTab === key ? "2px solid #DC2626" : "2px solid transparent", background: "transparent", color: infoTab === key ? "#fff" : "#6B7280", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {infoTab === "bio" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Name", listing.display_name],
                    ["Age", listing.age ? `${listing.age}` : null],
                    ["Location", [listing.city, listing.country].filter(Boolean).join(", ") || null],
                  ].filter(([,v]) => v).map(([label, value]) => (
                    <div key={label as string} style={{ display: "flex", gap: 12, fontSize: 13 }}>
                      <span style={{ color: "#6B7280", width: 80, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: "#D1D5DB" }}>{value}</span>
                    </div>
                  ))}
                  {listing.bio && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{listing.bio}</div>
                  )}
                </div>
              ) : (
                /* Pics & Videos + Recordings */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Past stream recordings */}
                  {recordings.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", letterSpacing: "0.06em", marginBottom: 8 }}>PAST STREAMS</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {recordings.slice(0, 3).map(rec => (
                          <div key={rec.id}>
                            <button
                              onClick={() => setPlayingRecordingId(playingRecordingId === rec.id ? null : rec.id)}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                              <div style={{ width: 44, height: 44, borderRadius: 8, background: "#0A0A0A", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2A2A2A" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#DC2626"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#E5E7EB", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.title}</p>
                                <p style={{ fontSize: 11, color: "#4B5563", margin: "2px 0 0" }}>
                                  {rec.duration_seconds > 0 ? `${Math.floor(rec.duration_seconds / 60)}m · ` : ""}
                                  {new Date(rec.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </p>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                            {playingRecordingId === rec.id && (
                              <video src={rec.cloudinary_url.replace("/upload/", "/upload/f_mp4,vc_h264/").replace(/\.(webm|ogg)$/, ".mp4")} controls autoPlay
                                style={{ width: "100%", borderRadius: 8, marginTop: 6, background: "#000", display: "block", maxHeight: 220 }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recordings.length === 0 && (
                    <p style={{ fontSize: 13, color: "#555" }}>No media available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: chat panel */}
        <div style={{ width: 320, borderLeft: "1px solid #1E1E1E", display: "flex", flexDirection: "column", background: "#111", flexShrink: 0 }}>
          {/* Chat/Profile/Tips tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1E1E1E" }}>
            {[["chat", "CHAT"], ["profile", "PROFILE"], ["tips", "TIPS"]].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key as "chat" | "profile" | "tips")}
                style={{ flex: 1, padding: "10px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", border: "none", borderBottom: activeTab === key ? "2px solid #DC2626" : "2px solid transparent", background: "transparent", color: activeTab === key ? "#fff" : "#6B7280", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <>
              {/* Messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                {messages.length === 0 && (
                  <p style={{ fontSize: 12, color: "#333", textAlign: "center", marginTop: 24 }}>No messages yet. Say hello! 👋</p>
                )}
                {messages.map(m => (
                  <div key={m.id} style={{ fontSize: 13, lineHeight: 1.5, padding: "2px 0" }}>
                    {m.is_tip ? (
                      <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "5px 10px", margin: "3px 0" }}>
                        <span style={{ color: "#DC2626", fontWeight: 700 }}>💰 {m.username}</span>
                        <span style={{ color: "#FCA5A5" }}> tipped {m.tip_amount} RC</span>
                      </div>
                    ) : (
                      <span>
                        <b style={{ color: "#DC2626" }}>{m.username}</b>
                        <span style={{ color: "#6B7280" }}>: </span>
                        <span style={{ color: "#D1D5DB" }}>{m.message}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Message input */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #1E1E1E" }}>
                {!currentUser ? (
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <Link href="/login" style={{ fontSize: 13, color: "#DC2626", textDecoration: "none", fontWeight: 600 }}>Log in to chat</Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Send a message..."
                      style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, outline: "none" }}
                    />
                    <button onClick={() => sendMessage()}
                      style={{ padding: "8px 12px", background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      SEND
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "profile" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Profile header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {(listing.profile_image || listing.photos?.[0]) && (
                  <img src={listing.profile_image || listing.photos![0]} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #2A2A2A" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{listing.display_name}</p>
                </div>
                <button onClick={() => setFollowed(!followed)}
                  style={{ padding: "5px 12px", background: followed ? "rgba(220,38,38,0.15)" : "#DC2626", border: followed ? "1px solid #DC2626" : "none", borderRadius: 6, color: followed ? "#DC2626" : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {followed ? "Following" : "Follow"}
                </button>
              </div>

              {/* Info grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Age", listing.age ? `${listing.age}` : null],
                  ["City", listing.city],
                  ["Country", listing.country],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#6B7280" }}>{label}</span>
                    <span style={{ color: "#D1D5DB" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "#1E1E1E" }} />

              {/* Languages */}
              {listing.languages && listing.languages.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>LANGUAGES</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {listing.languages.map(l => (
                      <span key={l} style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#D1D5DB" }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio / About */}
              {(listing.bio || listing.about) && (
                <div>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>ABOUT</p>
                  <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{listing.about || listing.bio}</p>
                </div>
              )}

              {/* Physical info */}
              {(listing.hair_color || listing.body_type || listing.ethnicity) && (
                <div>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>PHYSICAL</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      ["Hair", listing.hair_color],
                      ["Body", listing.body_type],
                      ["Ethnicity", listing.ethnicity],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#6B7280" }}>{label}</span>
                        <span style={{ color: "#D1D5DB" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {listing.services && listing.services.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>SERVICES</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {listing.services.map(s => (
                      <span key={s} style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#FCA5A5" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Private show info */}
              <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Private Show</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>{listing.cam_tokens_per_min} RC/min</span>
                </div>
              </div>

              {/* Knights — top 3 tippers */}
              {knights.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>👑 TOP TIPPERS</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {knights.map((k, i) => (
                      <div key={k.username} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: knightColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#000" }}>
                          {k.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, color: "#D1D5DB" }}>{k.username}</span>
                        <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>{k.total} RC</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tips" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {tipMenu.length === 0 ? (
                <p style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 24 }}>Ingen tip menu endnu</p>
              ) : (
                tipMenu.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid #1E1E1E" }}>
                    <span style={{ color: "#D1D5DB", fontSize: 14 }}>{item.action}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 14 }}>{item.rc_amount} RC</span>
                      <button onClick={() => sendTip(item.rc_amount)} disabled={!currentUser || item.rc_amount > userBalance}
                        style={{ padding: "5px 12px", background: currentUser && item.rc_amount <= userBalance ? "#DC2626" : "#333", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Tip
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
