"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"

interface Earnings {
  total_earned: number
  available_for_payout: number
  next_payout_date: string
  bookings_count: number
  marketplace_count: number
}

interface PayoutDetails {
  id: string
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
}

const COUNTRIES = ["Denmark", "Sweden", "Norway", "Germany", "United Kingdom", "Thailand", "Other"]

function getNextPayoutDateLabel(): string {
  const now = new Date()
  const day = now.getDate()
  const year = now.getFullYear()
  const month = now.getMonth()
  if (day < 1) return `1. ${now.toLocaleString("en", { month: "short" })}`
  if (day < 14) return `14. ${now.toLocaleString("en", { month: "short" })}`
  const next = new Date(year, month + 1, 1)
  return `1. ${next.toLocaleString("en", { month: "short" })}`
}

export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  // Payout details state
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null)
  const [pdLoading, setPdLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [idUploading, setIdUploading] = useState(false)

  // Form state
  const [fullName, setFullName] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [regNumber, setRegNumber] = useState("")
  const [iban, setIban] = useState("")
  const [swift, setSwift] = useState("")
  const [country, setCountry] = useState("Denmark")
  const [idDocumentUrl, setIdDocumentUrl] = useState("")

  useEffect(() => {
    fetch("/api/earnings")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))

    fetch("/api/payout/details")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.id) {
          setPayoutDetails(d)
          setFullName(d.full_name || "")
          setBankName(d.bank_name || "")
          setAccountNumber(d.account_number || "")
          setRegNumber(d.reg_number || "")
          setIban(d.iban || "")
          setSwift(d.swift || "")
          setCountry(d.country || "Denmark")
          setIdDocumentUrl(d.id_document_url || "")
        }
      })
      .finally(() => setPdLoading(false))
  }, [])

  const today = new Date()
  const isPayoutDay = today.getDate() === 1 || today.getDate() === 14

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIdUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("upload_preset", "redlightad_unsigned")
      const res = await fetch("https://api.cloudinary.com/v1_1/drxpitjyw/image/upload", {
        method: "POST",
        body: fd,
      })
      const json = await res.json()
      if (json.secure_url) {
        setIdDocumentUrl(json.secure_url)
      }
    } catch {
      alert("Upload failed")
    } finally {
      setIdUploading(false)
    }
  }

  async function savePayoutDetails() {
    setSaving(true)
    try {
      const res = await fetch("/api/payout/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          bank_name: bankName || null,
          account_number: accountNumber,
          reg_number: regNumber || null,
          iban: iban || null,
          swift: swift || null,
          country,
          id_document_url: idDocumentUrl || null,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        // Refetch
        const r2 = await fetch("/api/payout/details")
        const d2 = await r2.json()
        if (d2 && d2.id) setPayoutDetails(d2)
        setEditing(false)
      } else {
        alert(json.error || "Failed to save")
      }
    } catch {
      alert("Failed to save payout details")
    } finally {
      setSaving(false)
    }
  }

  async function requestPayout() {
    setRequesting(true)
    try {
      const res = await fetch("/api/payout/request", { method: "POST" })
      const json = await res.json()
      if (json.ok) {
        alert(`Payout request submitted: ${json.amount_redcoins} RC (${json.amount_dkk.toFixed(2)} DKK). You will receive payment within 1-3 business days.`)
      } else {
        alert(json.error || "Failed to submit payout request")
      }
    } catch {
      alert("Failed to submit payout request")
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p style={{ color: "#999", fontSize: 14 }}>Loading earnings...</p>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <p style={{ color: "#DC2626", fontSize: 14 }}>Failed to load earnings</p>
      </DashboardLayout>
    )
  }

  const dkk = (data.total_earned / 10).toFixed(2)
  const showForm = !payoutDetails || editing
  const canPayout = isPayoutDay && (data.available_for_payout ?? 0) >= 500 && payoutDetails?.is_verified

  function maskValue(val: string) {
    if (!val || val.length <= 4) return val
    return "***" + val.slice(-4)
  }

  // Determine payout button label
  let payoutButtonLabel = "Request Payout"
  let payoutDisabled = false
  if (!payoutDetails?.is_verified) {
    payoutButtonLabel = "Verification required"
    payoutDisabled = true
  } else if (!isPayoutDay) {
    payoutButtonLabel = `Available on ${getNextPayoutDateLabel()}`
    payoutDisabled = true
  } else if ((data.available_for_payout ?? 0) < 500) {
    payoutButtonLabel = "Min 500 RedCoins required"
    payoutDisabled = true
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: 0,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4 }}>
          Earnings
        </h1>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
          Track your RedCoins income
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total earned</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.total_earned} RC
            </p>
            <p style={{ fontSize: 12, color: "#999" }}>= {dkk} DKK</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Available for payout</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.available_for_payout} RC
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Bookings completed</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.bookings_count}
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Marketplace sales</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.marketplace_count}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E5E5",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 8 }}>
            Payout schedule
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
            Next payout: <strong>{data.next_payout_date}</strong>
          </p>
          <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            Payout days: 1st and 14th of each month
          </p>
          <p style={{ fontSize: 12, color: "#999" }}>
            Minimum payout: 500 RedCoins
          </p>
        </div>

        {/* Warning box */}
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", padding: 16, marginTop: 0, marginBottom: 24, borderRadius: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#92400E", marginBottom: 8 }}>⚠️ Important information about payouts</p>
          <ul style={{ fontSize: 13, color: "#92400E", paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
            <li>Payouts are processed on the 1st and 14th of each month only</li>
            <li>Minimum payout: 500 RedCoins (= 50 DKK)</li>
            <li>Identity verification required before first payout</li>
            <li>Funds are paid ONLY to the registered bank account</li>
            <li>Changing bank details requires a new identity verification</li>
          </ul>
        </div>

        {/* Payout Details */}
        <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>Payout Details</h2>
            {payoutDetails && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Edit
              </button>
            )}
          </div>

          {pdLoading ? (
            <p style={{ fontSize: 13, color: "#999" }}>Loading...</p>
          ) : showForm ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Full name *</label>
                <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full legal name" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Bank name</label>
                <input style={inputStyle} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Danske Bank" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Country *</label>
                <select
                  style={{ ...inputStyle, appearance: "auto" }}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {country === "Denmark" && (
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Registration number (4 digits)</label>
                  <input style={inputStyle} value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. 1234" maxLength={4} />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Account number *</label>
                <input style={inputStyle} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>IBAN</label>
                <input style={inputStyle} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="e.g. DK50 0040 0440 1162 43" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>SWIFT/BIC</label>
                <input style={inputStyle} value={swift} onChange={(e) => setSwift(e.target.value)} placeholder="e.g. DABADKKK" />
              </div>

              {/* ID Verification */}
              <div style={{ marginTop: 24, padding: 16, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Identity Verification</h3>
                {payoutDetails?.id_verified ? (
                  <p style={{ color: "#16A34A", fontSize: 13 }}>✅ Identity verified</p>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
                      Upload a photo of your government-issued ID (passport or national ID card)
                    </p>
                    <input type="file" accept="image/*" onChange={handleIdUpload} style={{ fontSize: 13 }} />
                    {idUploading && <p style={{ fontSize: 12, color: "#6B7280" }}>Uploading...</p>}
                    {idDocumentUrl && !idUploading && (
                      <p style={{ fontSize: 12, color: "#16A34A", marginTop: 4 }}>ID document uploaded</p>
                    )}
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
                      Your ID is only used for verification and is never shared with other users. Payouts are only processed to verified accounts.
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={savePayoutDetails}
                disabled={saving || !fullName || !accountNumber}
                style={{
                  width: "100%",
                  background: saving || !fullName || !accountNumber ? "#E5E5E5" : "#111",
                  color: saving || !fullName || !accountNumber ? "#999" : "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 0,
                  cursor: saving || !fullName || !accountNumber ? "not-allowed" : "pointer",
                  marginTop: 8,
                }}
              >
                {saving ? "Saving..." : "Save Payout Details"}
              </button>
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    width: "100%",
                    background: "none",
                    color: "#6B7280",
                    fontSize: 13,
                    padding: "8px 0",
                    border: "1px solid #D1D5DB",
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 2 }}>
              <p><strong>Name:</strong> {payoutDetails.full_name}</p>
              {payoutDetails.bank_name && <p><strong>Bank:</strong> {payoutDetails.bank_name}</p>}
              <p><strong>Account:</strong> {maskValue(payoutDetails.account_number)}</p>
              {payoutDetails.reg_number && <p><strong>Reg:</strong> {maskValue(payoutDetails.reg_number)}</p>}
              {payoutDetails.iban && <p><strong>IBAN:</strong> {maskValue(payoutDetails.iban)}</p>}
              {payoutDetails.swift && <p><strong>SWIFT:</strong> {payoutDetails.swift}</p>}
              <p><strong>Country:</strong> {payoutDetails.country}</p>
              <p>
                <strong>Verified:</strong>{" "}
                {payoutDetails.is_verified ? (
                  <span style={{ color: "#16A34A" }}>✅ Verified</span>
                ) : (
                  <span style={{ color: "#F59E0B" }}>Pending verification</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Payout button */}
        {payoutDisabled ? (
          <button
            disabled
            style={{
              width: "100%",
              background: "#E5E5E5",
              color: "#999",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 0",
              border: "none",
              borderRadius: 0,
              cursor: "not-allowed",
            }}
          >
            {payoutButtonLabel}
          </button>
        ) : (
          <button
            onClick={requestPayout}
            disabled={requesting}
            style={{
              width: "100%",
              background: "#DC2626",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 0",
              border: "none",
              borderRadius: 0,
              cursor: requesting ? "wait" : "pointer",
              opacity: requesting ? 0.6 : 1,
            }}
          >
            {requesting ? "Requesting..." : "Request Payout"}
          </button>
        )}
      </div>
    </DashboardLayout>
  )
}
