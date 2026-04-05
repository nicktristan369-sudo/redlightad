// Supabase SQL — kor i Supabase SQL Editor:
// create table if not exists public.customer_kyc_requests (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) on delete cascade,
//   full_name text not null,
//   birthdate date not null,
//   id_image_url text not null,
//   status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
//   created_at timestamptz default now(),
//   reviewed_at timestamptz
// );
// alter table public.customer_kyc_requests enable row level security;
// create policy "Users view own kyc" on public.customer_kyc_requests for select using (auth.uid() = user_id);
// create policy "Users insert own kyc" on public.customer_kyc_requests for insert with check (auth.uid() = user_id);

"use client"
import KundeLayout from "@/components/KundeLayout"
import { Shield, CheckCircle, Clock, X, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

type KycStatus = "none" | "pending" | "approved" | "rejected"

interface KycRequest {
  status: string
  created_at: string
  reviewed_at: string | null
}

export default function KundeVerify() {
  const [status, setStatus] = useState<KycStatus>("none")
  const [kycData, setKycData] = useState<KycRequest | null>(null)
  const [fullName, setFullName] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from("customer_kyc_requests")
        .select("status, created_at, reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setStatus(data.status as KycStatus)
        setKycData(data)
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!userId || !fullName.trim() || !birthdate || !file) {
      setError("Please fill in all fields and upload a photo of your ID")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      // Upload via server-side API (bruger service role — bypasser RLS)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)
      formData.append("fullName", fullName)
      formData.append("birthdate", birthdate)

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setStatus("pending")
      setKycData({ status: "pending", created_at: new Date().toISOString(), reviewed_at: null })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setStatus("none")
    setKycData(null)
    setFullName("")
    setBirthdate("")
    setFile(null)
    setError("")
  }

  return (
    <KundeLayout>
      <div style={{ maxWidth: 480 }}>
        {/* State: Not applied */}
        {status === "none" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>ID Verification</h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Verify your identity and get a trust badge on your profile</p>

            {/* Privacy info */}
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Shield size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.6 }}>
                Your personal information is never shared with other users. Only the platform sees your ID. The verification badge is the only thing visible.
              </p>
            </div>

            {/* Form */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="As it appears on your ID"
                  style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Date of birth</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>ID photo</label>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 8px" }}>Passport, driver license or national ID — front side</p>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px", border: "2px dashed #E5E7EB", borderRadius: 10, cursor: "pointer",
                  background: file ? "#F0FDF4" : "#FAFAFA", transition: "background 0.15s",
                }}>
                  <Upload size={18} color={file ? "#16A34A" : "#9CA3AF"} />
                  <span style={{ fontSize: 13, color: file ? "#16A34A" : "#6B7280", fontWeight: 600 }}>
                    {file ? file.name : "Choose file"}
                  </span>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                </label>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#DC2626", marginBottom: 12 }}>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%", padding: "12px", background: submitting ? "#6B7280" : "#000", color: "#fff",
                  borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Submit application"}
              </button>

              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
                We process your application within 48 hours
              </p>
            </div>
          </>
        )}

        {/* State: Pending */}
        {status === "pending" && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: 28, textAlign: "center" }}>
            <Clock size={40} color="#D97706" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#92400E", margin: "0 0 8px" }}>Application received</h2>
            <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
              We are processing your application within 48 hours. You will be notified when approved.
            </p>
            {kycData?.created_at && (
              <p style={{ fontSize: 12, color: "#B45309", marginTop: 12 }}>
                Submitted: {new Date(kycData.created_at).toLocaleDateString("en-US")}
              </p>
            )}
          </div>
        )}

        {/* State: Approved */}
        {status === "approved" && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: 28, textAlign: "center" }}>
            <CheckCircle size={40} color="#16A34A" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>ID Verified</h2>
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
              Your verification badge is visible to all profiles you contact
            </p>
            {kycData?.reviewed_at && (
              <p style={{ fontSize: 12, color: "#15803D", marginTop: 12 }}>
                Approved: {new Date(kycData.reviewed_at).toLocaleDateString("en-US")}
              </p>
            )}
          </div>
        )}

        {/* State: Rejected */}
        {status === "rejected" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: 28, textAlign: "center" }}>
            <X size={40} color="#DC2626" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#991B1B", margin: "0 0 8px" }}>Application rejected</h2>
            <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.6, marginBottom: 16 }}>
              Your application was rejected. You can submit a new one.
            </p>
            <button
              onClick={resetForm}
              style={{
                padding: "10px 24px", background: "#000", color: "#fff",
                borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              Submit new application
            </button>
          </div>
        )}
      </div>
    </KundeLayout>
  )
}
