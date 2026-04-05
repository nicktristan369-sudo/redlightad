"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import AdminLayout from "@/components/AdminLayout"

/* ─── Types ─── */

interface CustomerKyc {
  id: string
  user_id: string
  full_name: string
  birthdate: string
  id_image_url: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  email?: string
}

interface EscortKyc {
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
}

type Tab = "customer" | "escort"
type StatusFilter = "all" | "pending" | "approved" | "rejected"

const PAGE_SIZE = 25

/* ─── Helpers ─── */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getInitial(name: string) {
  return (name[0] || "?").toUpperCase()
}

/* ─── ID Thumbnail ─── */

function IDThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    fetch(`/api/admin/kyc-signed-url?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setUrl(d.url) })
      .catch(() => {})
  }, [path])

  if (!url) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 28, background: "#F3F4F6", borderRadius: 3,
        fontSize: 9, color: "#9CA3AF", border: "1px solid #E5E7EB",
      }}>
        ID
      </span>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="View full ID">
      <img
        src={url}
        alt="ID"
        style={{
          width: 40, height: 28, objectFit: "cover",
          borderRadius: 3, border: "1px solid #E5E7EB", cursor: "pointer",
        }}
      />
    </a>
  )
}

/* ─── Status Badge ─── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#D1FAE5", color: "#065F46" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  }
  const c = map[status] || { bg: "#F3F4F6", color: "#374151" }
  return (
    <span style={{
      display: "inline-block", background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
      textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  )
}

/* ─── Main Page ─── */

export default function AdminKycPage() {
  const [tab, setTab] = useState<Tab>("customer")
  const [customerKyc, setCustomerKyc] = useState<CustomerKyc[]>([])
  const [escortKyc, setEscortKyc] = useState<EscortKyc[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, escRes] = await Promise.all([
        fetch("/api/admin/customer-kyc"),
        fetch("/api/admin/kyc"),
      ])
      const custData = await custRes.json()
      const escData = await escRes.json()
      if (Array.isArray(custData)) setCustomerKyc(custData)
      if (Array.isArray(escData)) setEscortKyc(escData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [tab, statusFilter, search])

  /* ─── Customer actions ─── */
  async function handleCustomerAction(id: string, userId: string, action: "approve" | "reject") {
    setActing(id)
    try {
      const res = await fetch("/api/admin/customer-kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: userId, action }),
      })
      const json = await res.json()
      if (json.ok) {
        setCustomerKyc((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() }
              : s
          )
        )
      } else {
        alert(json.error || "Action failed")
      }
    } finally {
      setActing(null)
    }
  }

  /* ─── Escort actions ─── */
  async function handleEscortAction(id: string, action: "approve" | "reject") {
    setActing(id)
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id, action, rejection_reason: null }),
      })
      const json = await res.json()
      if (json.ok) {
        setEscortKyc((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() }
              : s
          )
        )
      } else {
        alert(json.error || "Action failed")
      }
    } finally {
      setActing(null)
    }
  }

  /* ─── Filtered + paginated data ─── */
  const activeList = tab === "customer" ? customerKyc : escortKyc
  const totalPending = activeList.filter((s) => s.status === "pending").length
  const totalApproved = activeList.filter((s) => s.status === "approved").length
  const totalRejected = activeList.filter((s) => s.status === "rejected").length

  const filteredCustomer = useMemo(() => {
    let list: CustomerKyc[] = customerKyc
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.full_name.toLowerCase().includes(q))
    }
    return list
  }, [customerKyc, statusFilter, search])

  const filteredEscort = useMemo(() => {
    let list: EscortKyc[] = escortKyc
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.full_name.toLowerCase().includes(q))
    }
    return list
  }, [escortKyc, statusFilter, search])

  const filtered = tab === "customer" ? filteredCustomer : filteredEscort

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedCustomer = filteredCustomer.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pagedEscort = filteredEscort.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const showFrom = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const showTo = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  /* ─── Styles ─── */
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px", fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? "#DC2626" : "#6B7280", background: "none", border: "none",
    borderBottom: active ? "2px solid #DC2626" : "2px solid transparent",
    cursor: "pointer",
  })

  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#6B7280",
    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left",
    borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap",
  }

  const tdStyle = (idx: number): React.CSSProperties => ({
    padding: "8px 12px", fontSize: 13, color: "#374151",
    borderBottom: "1px solid #F3F4F6", verticalAlign: "middle",
    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
  })

  const actionBtn = (color: string, disabled: boolean): React.CSSProperties => ({
    width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, fontSize: 14, fontWeight: 700, color: "#fff", background: color,
  })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 16 }}>
          KYC Verification
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: 16 }}>
          <button style={tabBtn(tab === "customer")} onClick={() => setTab("customer")}>
            Customer KYC ({customerKyc.length})
          </button>
          <button style={tabBtn(tab === "escort")} onClick={() => setTab("escort")}>
            Escort KYC ({escortKyc.length})
          </button>
        </div>

        {/* Stats line */}
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
          {activeList.length} total
          {" \u00B7 "}<span style={{ color: "#92400E" }}>{totalPending} pending</span>
          {" \u00B7 "}<span style={{ color: "#065F46" }}>{totalApproved} approved</span>
          {" \u00B7 "}<span style={{ color: "#991B1B" }}>{totalRejected} rejected</span>
        </div>

        {/* Filters + search + pagination info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              padding: "6px 10px", fontSize: 12, border: "1px solid #D1D5DB",
              borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer",
            }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px", fontSize: 12, border: "1px solid #D1D5DB",
              borderRadius: 6, width: 200, color: "#374151",
            }}
          />
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>
            Showing {showFrom}-{showTo} of {filtered.length}
          </span>
        </div>

        {/* Loading */}
        {loading && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Loading...</p>}

        {/* ─── Customer Table ─── */}
        {!loading && tab === "customer" && (
          filtered.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>No results</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Date of Birth</th>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Submitted</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCustomer.map((s, idx) => (
                    <tr key={s.id} style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    >
                      {/* User */}
                      <td style={tdStyle(idx)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", color: "#DC2626",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            C
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                              {s.full_name}
                            </div>
                            {s.email && (
                              <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                                {s.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* DOB */}
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{s.birthdate}</span>
                      </td>
                      {/* ID Photo */}
                      <td style={tdStyle(idx)}>
                        {s.id_image_url ? (
                          <IDThumb path={s.id_image_url} />
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 40, height: 28, background: "#F3F4F6", borderRadius: 3,
                            fontSize: 9, color: "#9CA3AF", border: "1px solid #E5E7EB",
                          }}>
                            ID
                          </span>
                        )}
                      </td>
                      {/* Submitted */}
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(s.created_at)}</span>
                      </td>
                      {/* Status */}
                      <td style={tdStyle(idx)}>
                        <StatusBadge status={s.status} />
                      </td>
                      {/* Actions */}
                      <td style={{ ...tdStyle(idx), textAlign: "center" }}>
                        {s.status === "pending" ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              style={actionBtn("#16A34A", acting === s.id)}
                              disabled={acting === s.id}
                              onClick={() => handleCustomerAction(s.id, s.user_id, "approve")}
                              title="Approve"
                            >
                              {acting === s.id ? "\u2026" : "\u2713"}
                            </button>
                            <button
                              style={actionBtn("#DC2626", acting === s.id)}
                              disabled={acting === s.id}
                              onClick={() => handleCustomerAction(s.id, s.user_id, "reject")}
                              title="Reject"
                            >
                              {acting === s.id ? "\u2026" : "\u2717"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#D1D5DB", fontSize: 14 }}>&ndash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ─── Escort Table ─── */}
        {!loading && tab === "escort" && (
          filtered.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>No results</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Date of Birth</th>
                    <th style={thStyle}>Country</th>
                    <th style={thStyle}>ID Front</th>
                    <th style={thStyle}>ID Back</th>
                    <th style={thStyle}>Selfie</th>
                    <th style={thStyle}>Submitted</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEscort.map((s, idx) => (
                    <tr key={s.id} style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    >
                      {/* User */}
                      <td style={tdStyle(idx)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", color: "#DC2626",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            {getInitial(s.full_name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <a
                              href={s.listing_id ? `/ads/${s.listing_id}` : "#"}
                              style={{ fontWeight: 600, fontSize: 13, color: "#DC2626", textDecoration: "none", whiteSpace: "nowrap" }}
                            >
                              {s.full_name}
                            </a>
                          </div>
                        </div>
                      </td>
                      {/* DOB */}
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{s.date_of_birth}</span>
                      </td>
                      {/* Country */}
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12 }}>{s.country}</span>
                      </td>
                      {/* ID Front */}
                      <td style={tdStyle(idx)}>
                        {s.id_front_url ? <IDThumb path={s.id_front_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                      </td>
                      {/* ID Back */}
                      <td style={tdStyle(idx)}>
                        {s.id_back_url ? <IDThumb path={s.id_back_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                      </td>
                      {/* Selfie */}
                      <td style={tdStyle(idx)}>
                        {s.selfie_url ? <IDThumb path={s.selfie_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                      </td>
                      {/* Submitted */}
                      <td style={tdStyle(idx)}>
                        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(s.submitted_at)}</span>
                      </td>
                      {/* Status */}
                      <td style={tdStyle(idx)}>
                        <StatusBadge status={s.status} />
                      </td>
                      {/* Actions */}
                      <td style={{ ...tdStyle(idx), textAlign: "center" }}>
                        {s.status === "pending" ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              style={actionBtn("#16A34A", acting === s.id)}
                              disabled={acting === s.id}
                              onClick={() => handleEscortAction(s.id, "approve")}
                              title="Approve"
                            >
                              {acting === s.id ? "\u2026" : "\u2713"}
                            </button>
                            <button
                              style={actionBtn("#DC2626", acting === s.id)}
                              disabled={acting === s.id}
                              onClick={() => handleEscortAction(s.id, "reject")}
                              title="Reject"
                            >
                              {acting === s.id ? "\u2026" : "\u2717"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#D1D5DB", fontSize: 14 }}>&ndash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: "6px 14px", fontSize: 12, border: "1px solid #D1D5DB", borderRadius: 6,
                background: page === 0 ? "#F9FAFB" : "#fff", color: page === 0 ? "#D1D5DB" : "#374151",
                cursor: page === 0 ? "default" : "pointer",
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: "6px 14px", fontSize: 12, border: "1px solid #D1D5DB", borderRadius: 6,
                background: page >= totalPages - 1 ? "#F9FAFB" : "#fff",
                color: page >= totalPages - 1 ? "#D1D5DB" : "#374151",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
