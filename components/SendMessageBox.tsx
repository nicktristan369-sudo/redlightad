"use client"

import { useState } from "react"
import Link from "next/link"
import { Send, MessageSquare, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface Props {
  listingId: string
  listingTitle: string
  profileImage?: string | null
  isLoggedIn: boolean
  isOwnListing?: boolean
}

export default function SendMessageBox({ listingId, listingTitle, profileImage, isLoggedIn, isOwnListing }: Props) {
  // Don't show message box on own listing
  if (isOwnListing) return null

  const { t } = useLanguage()
  const [msg, setMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const send = async () => {
    if (!msg.trim()) return
    setSending(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Ingen session")

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ listing_id: listingId, content: msg.trim() }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const data = JSON.parse(errorText)
          throw new Error(data.error || `Error: ${res.status}`)
        } catch {
          throw new Error(`Error: ${res.status} - ${errorText || "Unknown error"}`)
        }
      }

      const data = await res.json()
      setSent(true)
      setMsg("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.common_error)
    }
    setSending(false)
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
        {profileImage && (
          <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img src={profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MessageSquare size={14} color="#DC2626" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{t.msg_send_title}</span>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listingTitle}</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px" }}>
        {!isLoggedIn ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Lock size={18} color="#DC2626" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4 }}>{t.msg_login_required}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14, lineHeight: 1.5 }}>{t.msg_login_sub}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/register" style={{ flex: 1, display: "block", padding: "9px 0", background: "#DC2626", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                {t.msg_create_free}
              </Link>
              <Link href="/login" style={{ flex: 1, display: "block", padding: "9px 0", background: "#F3F4F6", color: "#374151", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                {t.msg_login_link}
              </Link>
            </div>
          </div>
        ) : sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Send size={18} color="#16A34A" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", marginBottom: 4 }}>{t.msg_sent}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>{t.msg_sent_sub}</p>
            <button onClick={() => setSent(false)}
              style={{ width: "100%", padding: "9px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#374151", background: "#F9FAFB", cursor: "pointer" }}>
              {t.msg_send_new}
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden",
              background: "#FAFAFA", transition: "border-color 0.15s",
            }}
              onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#111"; }}
              onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB"; }}>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder={t.msg_placeholder}
                rows={3}
                maxLength={500}
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "none", outline: "none", resize: "none", background: "transparent", boxSizing: "border-box", color: "#111", lineHeight: 1.5 }}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderTop: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{msg.length}/500 · {t.msg_cmd_enter}</span>
                <button
                  onClick={send}
                  disabled={!msg.trim() || sending}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", fontSize: 12, fontWeight: 700,
                    background: msg.trim() ? "#DC2626" : "#E5E7EB",
                    color: msg.trim() ? "#fff" : "#9CA3AF",
                    border: "none", borderRadius: 6, cursor: msg.trim() ? "pointer" : "not-allowed",
                    transition: "background 0.15s",
                  }}>
                  {sending
                    ? <div style={{ width: 12, height: 12, border: "1.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    : <Send size={12} />}
                  {t.common_send}
                </button>
              </div>
            </div>
            {error && <p style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>{error}</p>}
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.5 }}>
              {t.msg_anonymous}
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
