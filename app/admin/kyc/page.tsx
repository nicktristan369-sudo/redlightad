"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

interface KycSubmission {
  id: string
  user_id: string
  listing_id: string
  full_name: string
  date_of_birth: string
  country: string
  id_front_url: string | null
  id_back_url: string | null
  selfie_url: string | null
  status: string
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  listings?: { title: string } | null
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#D1FAE5", color: "#065F46" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  }
  const c = colors[status] || { bg: "#F3F4F6", color: "#374151" }
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", textTransform: "uppercase" }}>
      {status}
    </span>
  )
}

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/kyc")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSubmissions(d) })
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: "approve" | "reject") {
    setActing(id)
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: id,
          action,
          rejection_reason: action === "reject" ? (rejectReasons[id] || null) : null,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() } : s
          )
        )
        setShowRejectInput(null)
      } else {
        alert(json.error || "Failed")
      }
    } finally {
      setActing(null)
    }
  }

  const thStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase",
    padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #E5E5E5",
  }
  const tdStyle: React.CSSProperties = {
    fontSize: 13, color: "#374151", padding: "10px 12px", borderBottom: "1px solid #F3F4F6",
  }

  return (
    <AdminLayout>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 20 }}>KYC Verification</h1>

        {loading ? (
          <p style={{ color: "#999", fontSize: 13 }}>Loading...</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13 }}>No KYC submissions</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>DOB</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={tdStyle}>{s.full_name}</td>
                      <td style={tdStyle}>{s.country}</td>
                      <td style={tdStyle}>{s.date_of_birth}</td>
                      <td style={tdStyle}>{new Date(s.submitted_at).toLocaleDateString()}</td>
                      <td style={tdStyle}>{statusBadge(s.status)}</td>
                      <td style={tdStyle}>
                        {s.status === "pending" ? (
                          <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleAction(s.id, "approve")}
                              disabled={acting === s.id}
                              style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setShowRejectInput(showRejectInput === s.id ? null : s.id)}
                              disabled={acting === s.id}
                              style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "#999" }}>—</span>
                        )}
                      </td>
                    </tr>
                    {/* Reject reason input */}
                    {showRejectInput === s.id && (
                      <tr key={`${s.id}-reject`}>
                        <td colSpan={6} style={{ padding: "8px 12px", background: "#FEF2F2" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                            <textarea
                              placeholder="Rejection reason..."
                              value={rejectReasons[s.id] || ""}
                              onChange={(e) => setRejectReasons((prev) => ({ ...prev, [s.id]: e.target.value }))}
                              style={{ flex: 1, fontSize: 12, border: "1px solid #FCA5A5", borderRadius: 0, padding: 8, resize: "vertical", minHeight: 40 }}
                            />
                            <button
                              onClick={() => handleAction(s.id, "reject")}
                              disabled={acting === s.id}
                              style={{ fontSize: 11, fontWeight: 600, padding: "8px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {/* Expanded details */}
                    {expanded === s.id && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={6} style={{ padding: "12px", background: "#F9FAFB", borderBottom: "1px solid #E5E5E5" }}>
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                            {s.id_front_url && (
                              <div>
                                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>ID Front</p>
                                <a href={s.id_front_url} target="_blank" rel="noopener noreferrer">
                                  <img src={s.id_front_url} alt="ID Front" style={{ width: 160, height: 100, objectFit: "cover", border: "1px solid #E5E5E5" }} />
                                </a>
                              </div>
                            )}
                            {s.id_back_url && (
                              <div>
                                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>ID Back</p>
                                <a href={s.id_back_url} target="_blank" rel="noopener noreferrer">
                                  <img src={s.id_back_url} alt="ID Back" style={{ width: 160, height: 100, objectFit: "cover", border: "1px solid #E5E5E5" }} />
                                </a>
                              </div>
                            )}
                            {s.selfie_url && (
                              <div>
                                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Selfie with ID</p>
                                <a href={s.selfie_url} target="_blank" rel="noopener noreferrer">
                                  <img src={s.selfie_url} alt="Selfie" style={{ width: 160, height: 100, objectFit: "cover", border: "1px solid #E5E5E5" }} />
                                </a>
                              </div>
                            )}
                          </div>
                          {s.listings && (
                            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
                              Listing: <strong>{typeof s.listings === "object" && "title" in s.listings ? s.listings.title : "—"}</strong>
                            </p>
                          )}
                          {s.rejection_reason && (
                            <p style={{ fontSize: 12, color: "#991B1B", marginTop: 8 }}>
                              Rejection reason: {s.rejection_reason}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
