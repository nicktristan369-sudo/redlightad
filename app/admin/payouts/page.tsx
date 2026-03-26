"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

interface PayoutRequest {
  id: string
  user_id: string
  amount_redcoins: number
  amount_dkk: number
  status: string
  requested_at: string
  processed_at: string | null
  admin_note: string | null
  payout_details: {
    full_name: string
    bank_name: string | null
    account_number: string
    reg_number: string | null
    iban: string | null
    country: string
    is_verified: boolean
  } | null
}

interface PayoutDetail {
  id: string
  user_id: string
  full_name: string
  bank_name: string | null
  account_number: string
  reg_number: string | null
  iban: string | null
  swift: string | null
  country: string
  is_verified: boolean
  id_verified: boolean
  id_document_url: string | null
  created_at: string
}

function maskValue(val: string | null) {
  if (!val || val.length <= 4) return val || "—"
  return "***" + val.slice(-4)
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#D1FAE5", color: "#065F46" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
    processing: { bg: "#DBEAFE", color: "#1E40AF" },
  }
  const c = colors[status] || { bg: "#F3F4F6", color: "#374151" }
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", textTransform: "uppercase" }}>
      {status}
    </span>
  )
}

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<"requests" | "details">("requests")
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [details, setDetails] = useState<PayoutDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    if (tab === "requests") {
      fetch("/api/admin/payouts")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setRequests(d) })
        .finally(() => setLoading(false))
    } else {
      fetch("/api/admin/payout-details")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setDetails(d) })
        .finally(() => setLoading(false))
    }
  }, [tab])

  async function handleAction(requestId: string, action: "approve" | "reject") {
    setActing(requestId)
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action, admin_note: notes[requestId] || null }),
      })
      const json = await res.json()
      if (json.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: action === "approve" ? "approved" : "rejected", processed_at: new Date().toISOString() } : r
          )
        )
      } else {
        alert(json.error || "Failed")
      }
    } finally {
      setActing(null)
    }
  }

  async function handleVerify(detailId: string) {
    setActing(detailId)
    try {
      const res = await fetch("/api/admin/payout-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_detail_id: detailId }),
      })
      const json = await res.json()
      if (json.ok) {
        setDetails((prev) =>
          prev.map((d) => (d.id === detailId ? { ...d, is_verified: true, id_verified: true } : d))
        )
      } else {
        alert(json.error || "Failed")
      }
    } finally {
      setActing(null)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    borderBottom: active ? "2px solid #DC2626" : "2px solid transparent",
    background: "none",
    color: active ? "#111" : "#6B7280",
    cursor: "pointer",
  })

  const thStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#6B7280",
    textTransform: "uppercase",
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "1px solid #E5E5E5",
  }

  const tdStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#374151",
    padding: "10px 12px",
    borderBottom: "1px solid #F3F4F6",
  }

  return (
    <AdminLayout>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 20 }}>Payouts</h1>

        <div style={{ borderBottom: "1px solid #E5E5E5", marginBottom: 20 }}>
          <button style={tabStyle(tab === "requests")} onClick={() => setTab("requests")}>
            Pending Requests
          </button>
          <button style={tabStyle(tab === "details")} onClick={() => setTab("details")}>
            Payout Details
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#999", fontSize: 13 }}>Loading...</p>
        ) : tab === "requests" ? (
          <div style={{ overflowX: "auto" }}>
            {requests.length === 0 ? (
              <p style={{ color: "#999", fontSize: 13 }}>No payout requests</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Bank</th>
                    <th style={thStyle}>Amount RC</th>
                    <th style={thStyle}>Amount DKK</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const pd = Array.isArray(r.payout_details) ? r.payout_details[0] : r.payout_details
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>{pd?.full_name || "—"}</td>
                        <td style={tdStyle}>{pd?.bank_name || "—"}</td>
                        <td style={tdStyle}>{r.amount_redcoins}</td>
                        <td style={tdStyle}>{Number(r.amount_dkk).toFixed(2)}</td>
                        <td style={tdStyle}>{new Date(r.requested_at).toLocaleDateString()}</td>
                        <td style={tdStyle}>{statusBadge(r.status)}</td>
                        <td style={tdStyle}>
                          {r.status === "pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <textarea
                                placeholder="Admin note..."
                                value={notes[r.id] || ""}
                                onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                style={{ fontSize: 11, border: "1px solid #D1D5DB", borderRadius: 0, padding: 4, resize: "vertical", minHeight: 30 }}
                              />
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  onClick={() => handleAction(r.id, "approve")}
                                  disabled={acting === r.id}
                                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAction(r.id, "reject")}
                                  disabled={acting === r.id}
                                  style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#999" }}>
                              {r.admin_note || "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {details.length === 0 ? (
              <p style={{ color: "#999", fontSize: 13 }}>No payout details</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Bank</th>
                    <th style={thStyle}>Account</th>
                    <th style={thStyle}>Country</th>
                    <th style={thStyle}>ID Verified</th>
                    <th style={thStyle}>ID Document</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.id}>
                      <td style={tdStyle}>{d.full_name}</td>
                      <td style={tdStyle}>{d.bank_name || "—"}</td>
                      <td style={tdStyle}>{maskValue(d.account_number)}</td>
                      <td style={tdStyle}>{d.country}</td>
                      <td style={tdStyle}>
                        {d.is_verified ? (
                          <span style={{ color: "#16A34A", fontWeight: 600, fontSize: 12 }}>Verified</span>
                        ) : (
                          <span style={{ color: "#F59E0B", fontWeight: 600, fontSize: 12 }}>Pending</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {d.id_document_url ? (
                          <a href={d.id_document_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", fontSize: 12 }}>
                            View ID
                          </a>
                        ) : (
                          <span style={{ color: "#999", fontSize: 12 }}>Not uploaded</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {!d.is_verified ? (
                          <button
                            onClick={() => handleVerify(d.id)}
                            disabled={acting === d.id}
                            style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 0, cursor: "pointer" }}
                          >
                            {acting === d.id ? "..." : "Verify"}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#999" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
