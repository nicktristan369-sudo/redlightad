"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { ArrowLeft, Send, X } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface Conv {
  id: string
  provider_id: string
  customer_id: string
  listing_id: string | null
  listings?: { title: string; profile_image: string | null } | null
}

interface CustomerProfile {
  user_id: string
  username: string | null
  avatar_url: string | null
  age?: number | null
  gender?: string | null
  nationality?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  languages?: string[] | null
  kinks?: string[] | null
  kink_bio?: string | null
  phone_verified?: boolean
  created_at?: string
}

export default function ChatPage() {
  const params = useParams()
  const convId = params.id as string
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conv, setConv] = useState<Conv | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const { data: c } = await supabase
        .from("conversations")
        .select("*, listings(title, profile_image)")
        .eq("id", convId)
        .single()
      if (!c || (c.provider_id !== user.id && c.customer_id !== user.id)) {
        router.replace("/dashboard/beskeder"); return
      }
      setConv(c)

      // Hent kundeprofil via API (omgår RLS)
      const customerId = c.provider_id === user.id ? c.customer_id : c.provider_id
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (token) {
        const cpRes = await fetch(`/api/customer-profile/${customerId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (cpRes.ok) {
          const cp = await cpRes.json()
          setCustomer(cp)
        } else {
          setCustomer({ user_id: customerId, username: null, avatar_url: null })
        }
      }

      // Hent beskeder
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
      setMessages(msgs || [])
      setLoading(false)

      // Mark læst
      const unreadField = user.id === c.provider_id ? "provider_unread" : "customer_unread"
      await supabase.from("conversations").update({ [unreadField]: 0 }).eq("id", convId)

      // Realtime
      const channel = supabase
        .channel(`chat:${convId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `conversation_id=eq.${convId}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [convId, router])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !userId || !conv) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage("")
    const supabase = createClient()
    await supabase.from("messages").insert({ conversation_id: convId, sender_id: userId, content })
    const otherField = userId === conv.provider_id ? "customer_unread" : "provider_unread"
    await supabase.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", convId)
    // increment other_unread (best effort)
    await supabase.rpc("increment_provider_unread", { conv_id: convId }).then(() => {})
    setSending(false)
    inputRef.current?.focus()
  }

  const fmt = (ts: string) => new Date(ts).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const fmtDate = (ts: string) => new Date(ts).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })

  const grouped: { date: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const d = fmtDate(m.created_at)
    if (!grouped.length || grouped[grouped.length - 1].date !== d) grouped.push({ date: d, msgs: [m] })
    else grouped[grouped.length - 1].msgs.push(m)
  }

  const customerName = customer?.username || "Kunde"
  const customerAvatar = customer?.avatar_url || null
  const customerInitials = customerName.slice(0, 2).toUpperCase()

  const AvatarBubble = ({ size = 28 }: { size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#E5E7EB", border: "2px solid #F3F4F6" }}>
      {customerAvatar
        ? <img src={customerAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: size * 0.35, fontWeight: 800, color: "#fff" }}>{customerInitials}</span>
          </div>}
    </div>
  )

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button onClick={() => router.push("/dashboard/beskeder")}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
            <ArrowLeft size={16} /> Tilbage
          </button>

          {/* Kunde-avatar (klikbar → profil popup) */}
          <button onClick={() => setShowProfile(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <AvatarBubble size={38} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>{customerName}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Se kundeprofil →</p>
            </div>
          </button>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Ingen beskeder endnu</p>
              </div>
            ) : (
              grouped.map(({ date, msgs }) => (
                <div key={date}>
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
                          <div style={{ visibility: showAvatar ? "visible" : "hidden" }}>
                            <AvatarBubble size={28} />
                          </div>
                        )}
                        <div style={{ maxWidth: "72%" }}>
                          <div style={{
                            padding: "9px 13px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "#DC2626" : "#F3F4F6",
                            color: isMe ? "#fff" : "#111",
                            fontSize: 14, lineHeight: 1.45,
                          }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, textAlign: isMe ? "right" : "left" }}>
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

          {/* ── Input ── */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage() }}
              placeholder="Skriv en besked..."
              style={{ flex: 1, padding: "10px 16px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 24, outline: "none", background: "#F9FAFB" }}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
              style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: newMessage.trim() ? "#DC2626" : "#E5E7EB", cursor: newMessage.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {sending
                ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : <Send size={16} color={newMessage.trim() ? "#fff" : "#9CA3AF"} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Kundeprofil popup ── */}
      {showProfile && customer && (
        <div onClick={() => setShowProfile(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ background: "#111", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Kundeprofil</span>
              <button onClick={() => setShowProfile(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #F3F4F6" }}>
                  {customerAvatar
                    ? <img src={customerAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{customerInitials}</span>
                      </div>}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>{customerName}</span>
                    {customer.phone_verified && <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 7px", borderRadius: 20 }}>✓ Verificeret</span>}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                    {customer.gender && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{customer.gender === "male" ? "Mand" : customer.gender === "female" ? "Dame" : customer.gender === "trans" ? "Trans" : customer.gender}</span>}
                    {customer.age && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{customer.age} år</span>}
                    {customer.nationality && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{customer.nationality}</span>}
                  </div>
                  {customer.created_at && <p style={{ fontSize: 10, color: "#9CA3AF", margin: "4px 0 0" }}>Profil oprettet {new Date(customer.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}</p>}
                </div>
              </div>
              {(customer.height_cm || customer.weight_kg) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {customer.height_cm && <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{customer.height_cm}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>cm høj</div>
                  </div>}
                  {customer.weight_kg && <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{customer.weight_kg} kg</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>vægt</div>
                  </div>}
                </div>
              )}
              {customer.languages && customer.languages.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Taler</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {customer.languages.map(l => <span key={l} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 9px", borderRadius: 12 }}>{l}</span>)}
                  </div>
                </div>
              )}
              {customer.kinks && customer.kinks.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Interesser</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {customer.kinks.map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, background: "#FFF1F2", color: "#DC2626", padding: "3px 9px", borderRadius: 12 }}>{k}</span>)}
                  </div>
                </div>
              )}
              {customer.kink_bio && (
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{customer.kink_bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  )
}
