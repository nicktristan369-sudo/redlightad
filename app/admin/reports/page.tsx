"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import AdminLayout from "@/components/AdminLayout"
import { Flag, ExternalLink, CheckCircle, Clock, AlertTriangle, X } from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Report = {
  id: string
  listing_id: string
  reporter_id: string | null
  reason: string
  details: string | null
  status: "pending" | "reviewed" | "dismissed"
  created_at: string
  listing?: {
    title: string | null
    display_name: string | null
    profile_image: string | null
    category: string | null
    city: string | null
  } | null
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF9C3", color: "#854D0E", label: "Pending" },
  reviewed:  { bg: "#DCFCE7", color: "#166534", label: "Reviewed" },
  dismissed: { bg: "#F3F4F6", color: "#6B7280", label: "Dismissed" },
}

const REASON_COLORS: Record<string, string> = {
  "Fake Profile":   "#DC2626",
  "Underage":       "#7C3AED",
  "Scam":           "#EA580C",
  "Spam":           "#D97706",
  "Stolen Photos":  "#0284C7",
  "Other":          "#6B7280",
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "dismissed">("all")
  const [selected, setSelected] = useState<Report | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await adminClient
      .from("reports")
      .select(`
        *,
        listing:listings(title, display_name, profile_image, category, city)
      `)
      .order("created_at", { ascending: false })

    if (!error) setReports(data ?? [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: "reviewed" | "dismissed" | "pending") => {
    setUpdating(true)
    await supabase.from("reports").update({ status }).eq("id", id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
  }

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter)
  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Flag size={20} color="#DC2626" /> Reported Profiles
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
              {counts.pending} pending · {counts.reviewed} reviewed · {counts.dismissed} dismissed
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {(["all", "pending", "reviewed", "dismissed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                background: filter === f ? "#111" : "#F3F4F6",
                color: filter === f ? "#fff" : "#6B7280",
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 28, height: 28, border: "2px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
            <Flag size={40} color="#E5E7EB" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No reports</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(report => {
              const listing = report.listing
              const statusStyle = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending
              const reasonColor = REASON_COLORS[report.reason] ?? "#6B7280"
              return (
                <div key={report.id}
                  onClick={() => setSelected(report)}
                  style={{
                    background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                    borderLeft: `4px solid ${reasonColor}`,
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  {/* Profile image */}
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "#F3F4F6", flexShrink: 0 }}>
                    {listing?.profile_image
                      ? <img src={listing.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Flag size={18} color="#D1D5DB" />
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {listing?.display_name || listing?.title || "Unknown profile"}
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                      {listing?.category} {listing?.city ? `· ${listing.city}` : ""}
                    </p>
                  </div>

                  {/* Reason badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: reasonColor + "18", color: reasonColor, whiteSpace: "nowrap" }}>
                    {report.reason}
                  </span>

                  {/* Status */}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, whiteSpace: "nowrap" }}>
                    {statusStyle.label}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Detail modal */}
        {selected && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} onClick={() => setSelected(null)} />
            <div style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              background: "#fff", borderRadius: 16, width: "min(520px, 95vw)", maxHeight: "85vh",
              overflowY: "auto", zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }} onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Flag size={16} color="#DC2626" /> Report Details
                </h2>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} color="#6B7280" />
                </button>
              </div>

              <div style={{ padding: "20px 24px" }}>

                {/* Profile row */}
                {selected.listing && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                    {selected.listing.profile_image && (
                      <img src={selected.listing.profile_image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>
                        {selected.listing.display_name || selected.listing.title}
                      </p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
                        {selected.listing.category} {selected.listing.city ? `· ${selected.listing.city}` : ""}
                      </p>
                    </div>
                    <a href={`/ads/${selected.listing_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280", textDecoration: "none" }}>
                      <ExternalLink size={13} /> View
                    </a>
                  </div>
                )}

                {/* Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Reason</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: REASON_COLORS[selected.reason] ?? "#111", margin: 0 }}>{selected.reason}</p>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Status</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: STATUS_STYLES[selected.status]?.color ?? "#111", margin: 0 }}>{STATUS_STYLES[selected.status]?.label}</p>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Reported</p>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{new Date(selected.created_at).toLocaleString("en-GB")}</p>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Reporter</p>
                    <p style={{ fontSize: 12, color: "#374151", margin: 0, fontFamily: "monospace" }}>{selected.reporter_id ? selected.reporter_id.slice(0, 8) + "..." : "Anonymous"}</p>
                  </div>
                </div>

                {/* Details text */}
                {selected.details && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Details</p>
                    <p style={{ fontSize: 13, color: "#78350F", margin: 0, lineHeight: 1.6 }}>{selected.details}</p>
                  </div>
                )}

                {/* Actions */}
                {selected.status === "pending" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => updateStatus(selected.id, "reviewed")} disabled={updating}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: "#16A34A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <CheckCircle size={15} /> Mark Reviewed
                    </button>
                    <button onClick={() => updateStatus(selected.id, "dismissed")} disabled={updating}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <X size={15} /> Dismiss
                    </button>
                  </div>
                )}
                {selected.status !== "pending" && (
                  <button onClick={() => updateStatus(selected.id, "pending")} disabled={updating}
                    style={{ width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#6B7280" }}>
                    <Clock size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </AdminLayout>
  )
}
