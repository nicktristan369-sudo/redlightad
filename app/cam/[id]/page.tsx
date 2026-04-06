"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Users, Heart, Send, ArrowLeft, Video } from "lucide-react"
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

// ── Video + participant count inside LiveKitRoom ──────────────────────────────
function LiveViewer({ onViewerCount }: { onViewerCount: (n: number) => void }) {
  const tracks = useTracks([Track.Source.Camera])
  const participants = useParticipants()

  useEffect(() => {
    onViewerCount(participants.length)
  }, [participants.length, onViewerCount])

  const hostTrack = tracks.find(t => t.participant?.permissions?.canPublish === false ? false : true)

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      {hostTrack ? (
        <VideoTrack trackRef={hostTrack} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Video color="#333" size={48} />
          <p style={{ color: "#555", fontSize: 14 }}>Waiting for stream...</p>
        </div>
      )}
      <RoomAudioRenderer />
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
  const [livekitWsUrl, setLivekitWsUrl] = useState("ws://76.13.154.9:7880")
  const [viewerCount, setViewerCount] = useState(0)
  const [messages, setMessages] = useState<CamMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Load listing + get viewer token
  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, display_name, profile_image, age, city, cam_live, cam_title, cam_viewers, cam_category, cam_tokens_per_min")
        .eq("id", id)
        .single()
      setListing(data)
      setLoading(false)

      if (data?.cam_live) {
        // Get viewer token
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        const viewerName = user?.email?.split("@")[0] || `viewer-${Math.random().toString(36).slice(2, 7)}`
        const res = await fetch("/api/cam/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: `listing-${id}`, participantName: viewerName, isHost: false }),
        })
        const tokenData = await res.json()
        if (res.ok) {
          setLivekitToken(tokenData.token)
          setLivekitWsUrl(tokenData.wsUrl)
        }
      }
    }

    load()

    // Subscribe to chat messages
    const channel = supabase
      .channel(`cam-messages-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cam_messages", filter: `room_id=eq.${id}` },
        payload => setMessages(prev => [...prev.slice(-99), payload.new as CamMessage])
      )
      .subscribe()

    // Load recent messages
    supabase.from("cam_messages").select("*").eq("room_id", id).order("created_at").limit(50)
      .then(({ data }) => { if (data) setMessages(data) })

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return
    const supabase = createClient()
    await supabase.from("cam_messages").insert({
      room_id: id,
      user_id: currentUser.id,
      username: currentUser.email?.split("@")[0] || "Anonymous",
      message: newMessage.trim(),
      is_tip: false,
    })
    setNewMessage("")
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!listing) return <div style={{ padding: 40, textAlign: "center" }}>Stream not found</div>

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: "#0A0A0A", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1F1F1F", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Link href="/cam" style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 4, fontSize: 13, textDecoration: "none", flexShrink: 0 }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {listing.profile_image && (
            <img src={listing.profile_image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.display_name}</p>
            {listing.cam_title && <p style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.cam_title}</p>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {listing.cam_live && (
            <span style={{ background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>● LIVE</span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#6B7280" }}>
            <Users size={12} /> {viewerCount}
          </span>
        </div>
      </div>

      {/* Main: video + chat side by side */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Video */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", overflow: "hidden" }}>
          {listing.cam_live && livekitToken ? (
            <LiveKitRoom serverUrl={livekitWsUrl} token={livekitToken} connect={true} audio={true} video={false} style={{ width: "100%", height: "100%" }}>
              <LiveViewer onViewerCount={setViewerCount} />
            </LiveKitRoom>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Video color="#333" size={48} />
              <p style={{ color: "#555", fontSize: 15 }}>
                {listing.cam_live ? "Connecting..." : `${listing.display_name} is offline`}
              </p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ width: 280, borderLeft: "1px solid #1A1A1A", display: "flex", flexDirection: "column", background: "#0F0F0F" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1A1A1A", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em" }}>
            LIVE CHAT
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 12, color: "#333", textAlign: "center", marginTop: 20 }}>No messages yet</p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ fontSize: 13, lineHeight: 1.4 }}>
                {m.is_tip ? (
                  <span style={{ color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: 6, display: "block", fontSize: 12 }}>
                    💰 <b>{m.username}</b> tipped {m.tip_amount} RC
                  </span>
                ) : (
                  <span><b style={{ color: "#DC2626" }}>{m.username}</b>: <span style={{ color: "#D1D5DB" }}>{m.message}</span></span>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid #1A1A1A", display: "flex", gap: 6 }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={currentUser ? "Send a message..." : "Log in to chat"}
              disabled={!currentUser}
              style={{ flex: 1, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, outline: "none" }}
            />
            <button onClick={sendMessage} disabled={!currentUser}
              style={{ background: "#DC2626", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
