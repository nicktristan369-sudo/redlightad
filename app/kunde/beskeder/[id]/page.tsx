"use client"
import { useEffect, useState, useRef, use } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface Conv {
  id: string
  listing_id: string | null
  provider_id: string
  listings?: { title: string; profile_image: string | null } | null
}

export default function KundeChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: convId } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [conv, setConv] = useState<Conv | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [msg, setMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Get conversation info
      const { data: c } = await supabase
        .from("conversations")
        .select("*, listings(title, profile_image)")
        .eq("id", convId)
        .single()
      setConv(c)

      // Get all messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
      setMessages(msgs || [])
      setLoading(false)

      // Mark as read
      await supabase.from("conversations")
        .update({ customer_unread: 0 })
        .eq("id", convId)
        .eq("customer_id", user.id)
    })
  }, [convId])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${convId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!msg.trim() || !conv || !userId) return
    setSending(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setSending(false); return }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ listing_id: conv.listing_id, content: msg.trim() }),
    })
    if (res.ok) {
      setMsg("")
      inputRef.current?.focus()
    }
    setSending(false)
  }

  const fmt = (ts: string) => new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  const fmtDate = (ts: string) => new Date(ts).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })

  // Group messages per day
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const d = fmtDate(m.created_at)
    if (!grouped.length || grouped[grouped.length - 1].date !== d) {
      grouped.push({ date: d, msgs: [m] })
    } else {
      grouped[grouped.length - 1].msgs.push(m)
    }
  }

  const profileImg = conv?.listings?.profile_image || null
  const profileTitle = conv?.listings?.title || "Profile"
  const profileHref = conv?.listing_id ? `/ads/${conv.listing_id}` : null

  return (
    <KundeLayout>
      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", minHeight: 400 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <Link href="/kunde/beskeder" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#9CA3AF", textDecoration: "none", fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back
          </Link>
          {profileHref ? (
            <Link href={profileHref} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "#E5E7EB", flexShrink: 0 }}>
                {profileImg
                  ? <img src={profileImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{profileTitle.slice(0,2).toUpperCase()}</span>
                    </div>}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{profileTitle}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>View profile</p>
              </div>
            </Link>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{profileTitle.slice(0,2).toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{profileTitle}</p>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Start the conversation — your first message has already been sent</p>
              </div>
            ) : (
              grouped.map(({ date, msgs }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "capitalize" }}>{date}</span>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                  </div>
                  {msgs.map((m, i) => {
                    const isMe = m.sender_id === userId
                    const showAvatar = !isMe && (i === 0 || msgs[i-1]?.sender_id !== m.sender_id)
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 4, alignItems: "flex-end", gap: 6 }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#E5E7EB", flexShrink: 0, visibility: showAvatar ? "visible" : "hidden" }}>
                            {profileImg
                              ? <img src={profileImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{profileTitle.slice(0,2).toUpperCase()}</span>
                                </div>}
                          </div>
                        )}
                        <div style={{ maxWidth: "72%" }}>
                          <div style={{
                            padding: "9px 13px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "#111" : "#F3F4F6",
                            color: isMe ? "#fff" : "#111",
                            fontSize: 14, lineHeight: 1.45,
                          }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                            {fmt(m.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Write a message..."
              rows={1}
              style={{ flex: 1, padding: "10px 14px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 24, outline: "none", resize: "none", background: "#F9FAFB", lineHeight: 1.4, maxHeight: 120, overflowY: "auto", boxSizing: "border-box" }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, 120) + "px"
              }}
            />
            <button
              onClick={send}
              disabled={!msg.trim() || sending}
              style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: msg.trim() ? "#DC2626" : "#E5E7EB", cursor: msg.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
              {sending
                ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <Send size={16} color={msg.trim() ? "#fff" : "#9CA3AF"} />}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </KundeLayout>
  )
}
