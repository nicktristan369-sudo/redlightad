"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { createClient } from "@/lib/supabase"

interface KycSubmission {
  id: string
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_at: string
}

const COUNTRIES = [
  "Denmark", "Sweden", "Norway", "Finland", "Germany", "Netherlands",
  "Belgium", "France", "Spain", "Italy", "United Kingdom", "Ireland",
  "Poland", "Czech Republic", "Austria", "Switzerland", "Portugal",
  "Thailand", "Philippines", "Colombia", "Brazil", "United States", "Other",
]

const ID_TYPES = ["Passport", "Driver's License", "National ID"]

export default function VerifyPage() {
  const [step, setStep] = useState(1)
  const [existing, setExisting] = useState<KycSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [country, setCountry] = useState("Denmark")
  const [idType, setIdType] = useState("Passport")
  const [idFrontUrl, setIdFrontUrl] = useState("")
  const [idBackUrl, setIdBackUrl] = useState("")
  const [selfieUrl, setSelfieUrl] = useState("")
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)

  useEffect(() => {
    const load = async () => {
      // Fetch existing submission
      fetch("/api/kyc")
        .then((r) => r.json())
        .then((d) => { if (d && d.id) setExisting(d) })
        .catch(() => {})
        .finally(() => setLoading(false))

      // Get user's listing id
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: listing } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .single()
        if (listing) setListingId(listing.id)
      }
    }
    load()
  }, [])

  async function uploadToCloudinary(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", "redlightad_unsigned")
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/drxpitjyw/image/upload", {
        method: "POST",
        body: fd,
      })
      const json = await res.json()
      return json.secure_url || null
    } catch {
      alert("Upload failed")
      return null
    }
  }

  async function handleUploadFront(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFront(true)
    const url = await uploadToCloudinary(file)
    if (url) setIdFrontUrl(url)
    setUploadingFront(false)
  }

  async function handleUploadBack(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBack(true)
    const url = await uploadToCloudinary(file)
    if (url) setIdBackUrl(url)
    setUploadingBack(false)
  }

  async function handleUploadSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSelfie(true)
    const url = await uploadToCloudinary(file)
    if (url) setSelfieUrl(url)
    setUploadingSelfie(false)
  }

  async function handleSubmit() {
    if (!listingId) { alert("No listing found. Please create a listing first."); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          date_of_birth: dob,
          country,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl || null,
          selfie_url: selfieUrl,
          listing_id: listingId,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setExisting({ id: "new", status: "pending", rejection_reason: null, reviewed_at: null, submitted_at: new Date().toISOString() })
      } else {
        alert(json.error || "Failed to submit")
      }
    } catch {
      alert("Failed to submit verification")
    } finally {
      setSubmitting(false)
    }
  }

  function handleResubmit() {
    setExisting(null)
    setStep(1)
    setFullName("")
    setDob("")
    setCountry("Denmark")
    setIdType("Passport")
    setIdFrontUrl("")
    setIdBackUrl("")
    setSelfieUrl("")
  }

  const maxDob = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split("T")[0]
  const needsBack = idType === "Driver's License" || idType === "National ID"

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: 0,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>
      </DashboardLayout>
    )
  }

  // Status banner
  const renderBanner = () => {
    if (!existing) {
      return (
        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#92400E", margin: 0 }}>
            Your account is not verified. Complete verification to unlock payouts and content sales.
          </p>
        </div>
      )
    }
    if (existing.status === "pending") {
      return (
        <div style={{ background: "#DBEAFE", border: "1px solid #93C5FD", padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1E40AF", margin: 0 }}>
            Under review — typically 24-48 hours
          </p>
        </div>
      )
    }
    if (existing.status === "approved") {
      return (
        <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#065F46", margin: 0 }}>
            Verified {existing.reviewed_at ? `— ${new Date(existing.reviewed_at).toLocaleDateString()}` : ""}
          </p>
        </div>
      )
    }
    if (existing.status === "rejected") {
      return (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", padding: 16, marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#991B1B", margin: 0 }}>
            Not approved: {existing.rejection_reason || "No reason provided"}
          </p>
          <button
            onClick={handleResubmit}
            style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "#DC2626", background: "none", border: "1px solid #DC2626", padding: "6px 16px", borderRadius: 0, cursor: "pointer" }}
          >
            Resubmit
          </button>
        </div>
      )
    }
    return null
  }

  // Step indicator
  const renderSteps = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
      {[1, 2, 3].map((s) => {
        const labels = ["Personal Info", "ID Document", "Selfie"]
        const done = s < step
        const active = s === step
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? "#16A34A" : active ? "#DC2626" : "#E5E5E5",
              color: done || active ? "#fff" : "#6B7280",
              fontSize: 12, fontWeight: 700,
            }}>
              {done ? "✓" : s}
            </div>
            <span style={{ fontSize: 12, color: active ? "#111" : "#6B7280", fontWeight: active ? 600 : 400 }}>
              {labels[s - 1]}
            </span>
            {s < 3 && <span style={{ color: "#D1D5DB", margin: "0 4px" }}>—</span>}
          </div>
        )
      })}
    </div>
  )

  const showForm = !existing || existing.status === "rejected"

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4 }}>Identity Verification</h1>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>Verify your identity to unlock all features</p>

        {renderBanner()}

        {existing?.status === "approved" || existing?.status === "pending" ? null : (
          <>
            {renderSteps()}

            <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 24 }}>
              {/* Step 1 */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>Personal Information</h2>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Full legal name *</label>
                    <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full legal name as shown on ID" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Date of birth *</label>
                    <input type="date" style={inputStyle} value={dob} onChange={(e) => setDob(e.target.value)} max={maxDob} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Country of residence *</label>
                    <select style={{ ...inputStyle, appearance: "auto" }} value={country} onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!fullName || !dob}
                    style={{
                      width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 0, cursor: !fullName || !dob ? "not-allowed" : "pointer",
                      background: !fullName || !dob ? "#E5E5E5" : "#DC2626", color: !fullName || !dob ? "#999" : "#fff",
                    }}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>ID Document</h2>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 8 }}>Document type</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {ID_TYPES.map((t) => (
                        <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                          <input type="radio" name="idType" checked={idType === t} onChange={() => { setIdType(t); setIdBackUrl("") }} />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
                      {idFrontUrl ? "Front of ID uploaded" : "Upload front of ID *"}
                    </label>
                    <input type="file" accept="image/*" onChange={handleUploadFront} style={{ fontSize: 13 }} />
                    {uploadingFront && <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Uploading...</p>}
                    {idFrontUrl && !uploadingFront && <p style={{ fontSize: 12, color: "#16A34A", margin: "4px 0 0" }}>Uploaded</p>}
                  </div>
                  {needsBack && (
                    <div>
                      <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        {idBackUrl ? "Back of ID uploaded" : "Upload back of ID (optional)"}
                      </label>
                      <input type="file" accept="image/*" onChange={handleUploadBack} style={{ fontSize: 13 }} />
                      {uploadingBack && <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Uploading...</p>}
                      {idBackUrl && !uploadingBack && <p style={{ fontSize: 12, color: "#16A34A", margin: "4px 0 0" }}>Uploaded</p>}
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                    Your ID must be valid and not expired. File must be a clear photo.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setStep(1)}
                      style={{ flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, border: "1px solid #D1D5DB", borderRadius: 0, background: "#fff", color: "#374151", cursor: "pointer" }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!idFrontUrl}
                      style={{
                        flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 0, cursor: !idFrontUrl ? "not-allowed" : "pointer",
                        background: !idFrontUrl ? "#E5E5E5" : "#DC2626", color: !idFrontUrl ? "#999" : "#fff",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>Selfie with ID</h2>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
                      {selfieUrl ? "Selfie uploaded" : "Upload selfie *"}
                    </label>
                    <input type="file" accept="image/*" onChange={handleUploadSelfie} style={{ fontSize: 13 }} />
                    {uploadingSelfie && <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>Uploading...</p>}
                    {selfieUrl && !uploadingSelfie && <p style={{ fontSize: 12, color: "#16A34A", margin: "4px 0 0" }}>Uploaded</p>}
                  </div>
                  <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", padding: 14 }}>
                    <p style={{ fontSize: 13, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
                      Take a clear photo of yourself holding your ID next to your face.
                      Both your face and the ID must be clearly visible.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setStep(2)}
                      style={{ flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, border: "1px solid #D1D5DB", borderRadius: 0, background: "#fff", color: "#374151", cursor: "pointer" }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!selfieUrl || submitting}
                      style={{
                        flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 0,
                        cursor: !selfieUrl || submitting ? "not-allowed" : "pointer",
                        background: !selfieUrl || submitting ? "#E5E5E5" : "#DC2626",
                        color: !selfieUrl || submitting ? "#999" : "#fff",
                      }}
                    >
                      {submitting ? "Submitting..." : "Submit Verification"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
