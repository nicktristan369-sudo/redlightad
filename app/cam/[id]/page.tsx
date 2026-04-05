"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Video, Users, Heart, Send, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Listing {
  id: string
  title: string
  display_name: string
  profile_image: string | null
  age: number | null
  city: string | null
  bio: string | null
  cam_live: boolean
  cam_title: string | null
  cam_viewers: number
  cam_category: string
  cam_tokens_per_min: number
  user_id: string
}

interface CamMessage {
  id: string
  room_id: string
  user_id: string
  username: string
  message: string
  is_tip: boolean
  tip_amount: number | null
  created_at: string
}

export default function CamRoomPage() {
  const params = useParams()
  const id = params?.id as string
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<CamMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [sending, setSending] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    // Load listing
    supabase
      .from("listings")
      .select("id, title, display_name, profile_image, age, city, bio, cam_live, cam_title, cam_viewers, cam_category, cam_tokens_per_min, user_id")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setListing(data as Listing | null)
        setLoading(false)
      })

    // Load current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser({ id: user.id, email: user.email || "" })
    })

    // Load existing messages
    supabase
      .from("cam_messages")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as CamMessage[])
      })

    // Realtime subscription
    const channel = supabase
      .channel(`cam:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cam_messages", filter: `room_id=eq.${id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as CamMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser) return
    setSending(true)
    const supabase = createClient()
    await supabase.from("cam_messages").insert({
      room_id: id,
      user_id: currentUser.id,
      username: currentUser.email.split("@")[0],
      message: newMessage.trim(),
    })
    setNewMessage("")
    setSending(false)
  }

  const handleTip = async (amount: number) => {
    if (!currentUser || !listing) return
    const supabase = createClient()
    const username = currentUser.email.split("@")[0]

    // Send tip via API
    const res = await fetch("/api/tips/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        toUserId: listing.user_id,
        amount,
        message: `Tipped ${amount} RC in cam room`,
      }),
    })

    if (res.ok) {
      // Post tip message to chat
      await supabase.from("cam_messages").insert({
        room_id: id,
        user_id: currentUser.id,
        username,
        message: `tipped ${amount} Red Coins!`,
        is_tip: true,
        tip_amount: amount,
      })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <p style={{ fontSize: 16, color: "#888" }}>Room not found</p>
        <Link href="/cam" style={{ color: "#DC2626", fontSize: 14, marginTop: 12 }}>Back to directory</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", color: "#fff" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1A1A1A" }}>
        <Link href="/cam" style={{ color: "#888", display: "flex" }}><ArrowLeft size={20} /></Link>
        <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, flex: 1 }}>
          RedLight<span style={{ color: "#DC2626" }}>Cam</span>
        </h1>
        {listing.cam_live && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.15)", padding: "4px 10px", borderRadius: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {/* Video + Chat container */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Video Player */}
          <div style={{
            width: "100%", aspectRatio: "16/9", background: "#0A0A0A",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#1A1A1A",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Video size={28} color="#555" />
            </div>
            <p style={{ color: "#555", fontSize: 14, margin: 0 }}>
              {listing.cam_live ? "Connecting to stream..." : "Stream is offline"}
            </p>
            {listing.cam_live && (
              <p style={{ color: "#DC2626", fontSize: 12, marginTop: 8 }}>Server connecting soon</p>
            )}
          </div>

          {/* Below video: Info + Chat side by side on desktop */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Model Info */}
            <div style={{ padding: "16px", borderBottom: "1px solid #1A1A1A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                {listing.profile_image ? (
                  <img src={listing.profile_image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "2px solid #333" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={20} color="#555" />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{listing.display_name || listing.title}</h2>
                  <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>
                    {[listing.age, listing.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#888" }}>
                  <Users size={14} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{listing.cam_viewers}</span>
                </div>
              </div>

              {listing.cam_title && (
                <p style={{ fontSize: 14, color: "#ccc", margin: "0 0 12px", lineHeight: 1.4 }}>{listing.cam_title}</p>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Heart size={14} /> Follow
                </button>
                {listing.cam_category === "private" && (
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Private Show · {listing.cam_tokens_per_min} RC/min
                  </button>
                )}
              </div>
            </div>

            {/* Chat Section */}
            <div style={{ display: "flex", flexDirection: "column", height: 400, background: "#111" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1A1A1A", fontSize: 13, fontWeight: 700, color: "#888" }}>
                Chat
              </div>

              {/* Messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "8px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                {messages.length === 0 && (
                  <p style={{ color: "#444", fontSize: 12, textAlign: "center", marginTop: 40 }}>No messages yet. Say hello!</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    padding: "4px 0", fontSize: 13, lineHeight: 1.4,
                    color: msg.is_tip ? "#FFD700" : "#ccc",
                  }}>
                    {msg.is_tip && <span>&#x1FA99; </span>}
                    <span style={{ fontWeight: 700, color: msg.is_tip ? "#FFD700" : "#DC2626" }}>{msg.username}</span>
                    {" "}
                    <span>{msg.is_tip ? `tipped ${msg.tip_amount} Red Coins!` : msg.message}</span>
                  </div>
                ))}
              </div>

              {/* Tip buttons */}
              {currentUser && (
                <div style={{ display: "flex", gap: 4, padding: "8px 16px", borderTop: "1px solid #1A1A1A" }}>
                  {[10, 50, 100, 200].map(amount => (
                    <button key={amount} onClick={() => handleTip(amount)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 6,
                        border: "1px solid #333", background: "transparent",
                        color: "#FFD700", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#1A1A1A" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                      {amount} RC
                    </button>
                  ))}
                </div>
              )}

              {/* Send message */}
              <div style={{ display: "flex", gap: 8, padding: "8px 16px 12px", borderTop: "1px solid #1A1A1A" }}>
                {currentUser ? (
                  <>
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSend() }}
                      placeholder="Send a message..."
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8,
                        border: "1px solid #333", background: "#1A1A1A",
                        color: "#fff", fontSize: 13, outline: "none",
                      }}
                    />
                    <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: newMessage.trim() ? "#DC2626" : "#333",
                        color: "#fff", cursor: newMessage.trim() ? "pointer" : "default",
                        display: "flex", alignItems: "center",
                      }}>
                      <Send size={16} />
                    </button>
                  </>
                ) : (
                  <Link href="/login" style={{
                    flex: 1, padding: "10px", borderRadius: 8, background: "#1A1A1A",
                    color: "#888", fontSize: 13, textAlign: "center", textDecoration: "none",
                  }}>
                    Log in to chat
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 768px) {
          div[style*="max-width: 1400"] > div > div:last-child {
            flex-direction: row !important;
          }
          div[style*="max-width: 1400"] > div > div:last-child > div:first-child {
            flex: 1;
            border-bottom: none !important;
            border-right: 1px solid #1A1A1A;
          }
          div[style*="max-width: 1400"] > div > div:last-child > div:last-child {
            width: 340px;
            height: auto !important;
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  )
}
