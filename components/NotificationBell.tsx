"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Bell } from "lucide-react"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4 }}
      >
        <Bell size={20} color={open ? "#DC2626" : "#666"} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            background: "#DC2626", color: "white",
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, background: "white",
          border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: 8,
          zIndex: 100, maxHeight: 420, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 12, color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <p style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>No notifications</p>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #F9FAFB",
                  background: n.is_read ? "white" : "#FEF2F2",
                  cursor: n.is_read ? "default" : "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: "#111", marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleDateString("en-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
