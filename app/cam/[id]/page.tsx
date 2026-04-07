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
  const [activeTab, setActiveTab] = useState<"chat" | "users">("chat")
  const [infoTab, setInfoTab] = useState<"bio" | "media">("bio")
  const [followed, setFollowed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

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

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: cp } = await supabase.from("customer_profiles").select("redcoins").eq("user_id", user.id).maybeSingle()
        setUserBalance(cp?.redcoins || 0)
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

    // Realtime chat
    const channel = supabase.channel(`cam-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cam_messages", filter: `room_id=eq.${id}` },
        payload => setMessages(prev => [...prev.slice(-149), payload.new as CamMessage]))
      .subscribe()

    supabase.from("cam_messages").select("*").eq("room_id", id).order("created_at").limit(80)
      .then(({ data }) => { if (data) setMessages(data) })

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || newMessage.trim()
    if (!msg || !currentUser) return
    if (!text) setNewMessage("")

    // Optimistic update — show instantly
    const optimistic: CamMessage = {
      id: `opt-${Date.now()}`,
      user_id: currentUser.id,
      username: currentUser.email?.split("@")[0] || "Anonymous",
      message: msg,
      is_tip: false,
      tip_amount: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev.slice(-149), optimistic])

    const supabase = createClient()
    await supabase.from("cam_messages").insert({
      room_id: id,
      user_id: currentUser.id,
      username: currentUser.email?.split("@")[0] || "Anonymous",
      message: msg,
      is_tip: false,
    })
  }

  const sendTip = async (amount: number) => {
    if (!currentUser || amount > userBalance) return
    const supabase = createClient()
    const username = currentUser.email?.split("@")[0] || "Anonymous"

    // Optimistic update
    setUserBalance(prev => prev - amount)
    const optimistic: CamMessage = {
      id: `opt-tip-${Date.now()}`,
      user_id: currentUser.id,
      username,
      message: `tipped ${amount} RedCoins`,
      is_tip: true,
      tip_amount: amount,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev.slice(-149), optimistic])

    // Persist
    await supabase.from("customer_profiles").update({ redcoins: userBalance - amount }).eq("user_id", currentUser.id)
    await supabase.from("cam_messages").insert({
      room_id: id, user_id: currentUser.id, username,
      message: `tipped ${amount} RedCoins`, is_tip: true, tip_amount: amount,
    })
  }

  if (loading) return (
    <div style={{ height: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!listing) return <div style={{ padding: 40, textAlign: "center", color: "#fff", background: "#0A0A0A", minHeight: "100vh" }}>Stream not found</div>

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#0D0D0D", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      {showTip && <TipModal onClose={() => setShowTip(false)} onSend={sendTip} balance={userBalance} />}

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
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Video color="#333" size={48} />
                <p style={{ color: "#555", fontSize: 14 }}>{listing.cam_live ? "Connecting..." : `${listing.display_name} is offline`}</p>
              </div>
            )}
          </div>

          {/* Tip bar */}
          <div style={{ padding: "10px 16px", background: "#111", borderTop: "1px solid #1E1E1E", borderBottom: "1px solid #1E1E1E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {listing.cam_category === "private" ? `Private: ${listing.cam_tokens_per_min} RC/min` : "Free public show"}
            </span>
            <button onClick={() => currentUser ? setShowTip(true) : null}
              style={{ padding: "7px 20px", background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Gift size={14} /> Send Tip
            </button>
          </div>

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
                <p style={{ fontSize: 13, color: "#555" }}>No media available</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: chat */}
        <div style={{ width: 320, borderLeft: "1px solid #1E1E1E", display: "flex", flexDirection: "column", background: "#111", flexShrink: 0 }}>
          {/* Chat/Users tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1E1E1E" }}>
            {[["chat", "CHAT"], ["users", `USERS (${viewerCount})`]].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key as "chat" | "users")}
                style={{ flex: 1, padding: "10px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", border: "none", borderBottom: activeTab === key ? "2px solid #DC2626" : "2px solid transparent", background: "transparent", color: activeTab === key ? "#fff" : "#6B7280", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

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
        </div>
      </div>
    </div>
  )
}
