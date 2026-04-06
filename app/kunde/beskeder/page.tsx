"use client"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

interface Conv {
  id: string
  listing_id: string | null
  provider_id: string
  customer_id: string
  last_message: string | null
  last_message_at: string
  customer_unread: number
  listings?: { id: string; title: string; profile_image: string | null } | null
}

export default function KundeBeskeder() {
  const [convos, setConvos] = useState<Conv[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from("conversations")
        .select("*, listings(id, title, profile_image)")
        .eq("customer_id", user.id)
        .order("last_message_at", { ascending: false })
      setConvos(data || [])
      setLoading(false)
    })
  }, [])

  const fmt = (ts: string) => {
    const d = new Date(ts)
    const diffH = (Date.now() - d.getTime()) / 3600000
    if (diffH < 24) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    if (diffH < 168) return d.toLocaleDateString("en-US", { weekday: "short" })
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }

  return (
    <KundeLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Messages</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Private conversations — only visible to you and the profile</p>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : convos.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <MessageSquare size={36} color="#E5E7EB" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No conversations yet</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Contact a profile to start a private conversation</p>
              <Link href="/" style={{ display: "inline-block", padding: "12px 24px", background: "#000", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Find a profile
              </Link>
            </div>
          ) : (
            convos.map((c, i) => {
              const unread = c.customer_unread || 0
              return (
                <Link key={c.id} href={`/kunde/beskeder/${c.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px", textDecoration: "none", borderBottom: i < convos.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {/* Profile avatar */}
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#E5E7EB", overflow: "hidden", flexShrink: 0, border: "2px solid #F3F4F6" }}>
                    {c.listings?.profile_image
                      ? <img src={c.listings.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{(c.listings?.title || "?").slice(0,2).toUpperCase()}</span>
                        </div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: unread > 0 ? 800 : 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.listings?.title || "Profile"}
                      </p>
                      <span style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0, marginLeft: 8 }}>{fmt(c.last_message_at)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: unread > 0 ? "#374151" : "#9CA3AF", fontWeight: unread > 0 ? 600 : 400, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.last_message || "No messages yet"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span style={{ background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </KundeLayout>
  )
}
