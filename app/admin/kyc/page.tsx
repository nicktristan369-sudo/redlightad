"use client"

import { useEffect, useState, useCallback } from "react"
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

/* ─── Helpers ─── */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    approved: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
    rejected: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
  }
  const c = map[status] || { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: c.bg,
        color: c.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {status}
    </span>
  )
}

/* ─── ID Image component with signed URL ─── */

function IDImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    fetch(`/api/admin/kyc-signed-url?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setUrl(d.url)
      })
      .catch(() => {})
  }, [path])

  if (!url) {
    return (
      <div
        style={{
          width: 50,
          height: 70,
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#9CA3AF",
          border: "1px solid #E5E7EB",
          borderRadius: 4,
        }}
      >
        Loading
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt="ID Document"
        style={{
          width: 50,
          height: 70,
          objectFit: "cover",
          border: "1px solid #E5E7EB",
          borderRadius: 4,
          cursor: "pointer",
        }}
      />
    </a>
  )
}

/* ─── Stats Row ─── */

function StatsRow({ items }: { items: { label: string; count: number; bg: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      {items.map((s) => (
        <div
          key={s.label}
          style={{
            background: s.bg,
            color: s.color,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            minWidth: 100,
          }}
        >
          {s.count} {s.label}
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ─── */

export default function AdminKycPage() {
  const [tab, setTab] = useState<Tab>("customer")
  const [customerKyc, setCustomerKyc] = useState<CustomerKyc[]>([])
  const [escortKyc, setEscortKyc] = useState<EscortKyc[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ─── Customer KYC actions ─── */
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

  /* ─── Escort KYC actions ─── */
  async function handleEscortAction(id: string, action: "approve" | "reject", rejectionReason?: string) {
    setActing(id)
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: id,
          action,
          rejection_reason: action === "reject" ? (rejectionReason || null) : null,
        }),
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

  /* ─── Stats ─── */
  const activeList = tab === "customer" ? customerKyc : escortKyc
  const pending = activeList.filter((s) => s.status === "pending").length
  const approved = activeList.filter((s) => s.status === "approved").length
  const rejected = activeList.filter((s) => s.status === "rejected").length

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: active ? "#DC2626" : "#6B7280",
    borderBottom: active ? "2px solid #DC2626" : "2px solid transparent",
    background: "none",
    border: "none",
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: active ? "#DC2626" : "transparent",
    cursor: "pointer",
    transition: "color 0.15s",
  })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 24 }}>
          KYC Verification
        </h1>

        {/* ─── Tabs ─── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E5E7EB", marginBottom: 20 }}>
          <button style={tabStyle(tab === "customer")} onClick={() => setTab("customer")}>
            Customer KYC ({customerKyc.length})
          </button>
          <button style={tabStyle(tab === "escort")} onClick={() => setTab("escort")}>
            Escort KYC ({escortKyc.length})
          </button>
        </div>

        {/* ─── Stats ─── */}
        <StatsRow
          items={[
            { label: "Pending", count: pending, bg: "#FEF3C7", color: "#92400E" },
            { label: "Approved", count: approved, bg: "#D1FAE5", color: "#065F46" },
            { label: "Rejected", count: rejected, bg: "#FEE2E2", color: "#991B1B" },
          ]}
        />

        {/* ─── Loading ─── */}
        {loading && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Loading...</p>}

        {/* ─── Customer KYC Cards ─── */}
        {!loading && tab === "customer" && (
          customerKyc.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>No customer KYC requests</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {customerKyc.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* Header: avatar + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(s.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
                        {s.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        Born: {s.birthdate}
                      </div>
                      {s.email && (
                        <div style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID image + submitted date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {s.id_image_url ? (
                      <IDImage path={s.id_image_url} />
                    ) : (
                      <div
                        style={{
                          width: 50,
                          height: 70,
                          background: "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "#9CA3AF",
                          border: "1px solid #E5E7EB",
                          borderRadius: 4,
                        }}
                      >
                        No ID
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Submitted</div>
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        {formatDate(s.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <StatusBadge status={s.status} />
                    {s.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleCustomerAction(s.id, s.user_id, "approve")}
                          disabled={acting === s.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 14px",
                            background: "#16A34A",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: acting === s.id ? "not-allowed" : "pointer",
                            opacity: acting === s.id ? 0.6 : 1,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCustomerAction(s.id, s.user_id, "reject")}
                          disabled={acting === s.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 14px",
                            background: "#DC2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: acting === s.id ? "not-allowed" : "pointer",
                            opacity: acting === s.id ? 0.6 : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─── Escort KYC Cards ─── */}
        {!loading && tab === "escort" && (
          escortKyc.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>No escort KYC submissions</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {escortKyc.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* Header: avatar + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(s.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={s.listing_id ? `/ads/${s.listing_id}` : "#"}
                        style={{ fontWeight: 700, fontSize: 15, color: "#DC2626", textDecoration: "none" }}
                      >
                        {s.full_name}
                      </a>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        {s.country} &middot; Born: {s.date_of_birth}
                      </div>
                    </div>
                  </div>

                  {/* Documents row */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {s.id_front_url && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Front</div>
                        <IDImage path={s.id_front_url} />
                      </div>
                    )}
                    {s.id_back_url && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Back</div>
                        <IDImage path={s.id_back_url} />
                      </div>
                    )}
                    {s.selfie_url && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>Selfie</div>
                        <IDImage path={s.selfie_url} />
                      </div>
                    )}
                    <div style={{ marginLeft: "auto" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>Submitted</div>
                      <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        {formatDate(s.submitted_at)}
                      </div>
                    </div>
                  </div>

                  {/* Rejection reason if present */}
                  {s.rejection_reason && (
                    <div style={{ fontSize: 12, color: "#991B1B", background: "#FEF2F2", padding: "6px 10px", borderRadius: 6 }}>
                      Reason: {s.rejection_reason}
                    </div>
                  )}

                  {/* Status + actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <StatusBadge status={s.status} />
                    {s.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleEscortAction(s.id, "approve")}
                          disabled={acting === s.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 14px",
                            background: "#16A34A",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: acting === s.id ? "not-allowed" : "pointer",
                            opacity: acting === s.id ? 0.6 : 1,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleEscortAction(s.id, "reject")}
                          disabled={acting === s.id}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 14px",
                            background: "#DC2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: acting === s.id ? "not-allowed" : "pointer",
                            opacity: acting === s.id ? 0.6 : 1,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  )
}
