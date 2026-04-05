"use client"

import { useState } from "react"

interface Message {
  id: string
  content: string
  created_at: string
  conversation?: {
    listing_id: string | null
    listing?: { name: string } | null
  } | null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function UserProfileClient({ messages }: { messages: Message[] }) {
  const [tab, setTab] = useState<"messages" | "activity">("messages")

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? "#DC2626" : "#6B7280",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #DC2626" : "2px solid transparent",
    cursor: "pointer",
  })

  const thStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "left",
    borderBottom: "1px solid #E5E7EB",
    whiteSpace: "nowrap",
  }

  const tdStyle = (idx: number): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: 13,
    color: "#374151",
    borderBottom: "1px solid #F3F4F6",
    verticalAlign: "middle",
    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: 16 }}>
        <button style={tabBtn(tab === "messages")} onClick={() => setTab("messages")}>
          Messages ({messages.length})
        </button>
        <button style={tabBtn(tab === "activity")} onClick={() => setTab("activity")}>
          Activity
        </button>
      </div>

      {/* Messages Tab */}
      {tab === "messages" && (
        messages.length === 0 ? (
          <p style={{ color: "#9CA3AF", fontSize: 13 }}>No messages</p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>To</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m, idx) => {
                  const listingName = m.conversation?.listing?.name || "–"
                  const listingId = m.conversation?.listing_id
                  const preview = m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content

                  return (
                    <tr
                      key={m.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    >
                      <td style={tdStyle(idx)}>
                        {listingId ? (
                          <a
                            href={`/ads/${listingId}`}
                            style={{ fontWeight: 600, fontSize: 13, color: "#DC2626", textDecoration: "none", whiteSpace: "nowrap" }}
                          >
                            {listingName}
                          </a>
                        ) : (
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{listingName}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle(idx), maxWidth: 400 }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{preview}</span>
                      </td>
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12, whiteSpace: "nowrap", color: "#6B7280" }}>{formatDate(m.created_at)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          Activity log coming soon
        </div>
      )}
    </div>
  )
}
