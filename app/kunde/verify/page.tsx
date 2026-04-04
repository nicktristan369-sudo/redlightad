"use client"
import KundeLayout from "@/components/KundeLayout"
import { Shield, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

export default function KundeVerify() {
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from("customer_profiles").select("phone_verified").eq("user_id", user.id).single()
      if (data?.phone_verified) setVerified(true)
    })
  }, [])

  return (
    <KundeLayout>
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Verificér dig selv</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Byg tillid — profiler kan se at du er verificeret</p>

        {verified ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <CheckCircle size={40} color="#16A34A" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#166534", margin: "0 0 8px" }}>Du er verificeret ✓</h2>
            <p style={{ fontSize: 13, color: "#166534" }}>Dit verificerede badge er synligt for profiler du kontakter</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={24} color="#374151" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>Telefon verifikation</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>Bekræft dit nummer via SMS</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
              Verificering sker ved at bekræfte dit telefonnummer. Dit nummer deles <strong>aldrig</strong> med andre brugere — kun verificerings-badget er synligt.
            </p>
            <a href="/register?step=3" style={{ display: "block", padding: "11px", background: "#000", color: "#fff", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Start verifikation
            </a>
          </div>
        )}
      </div>
    </KundeLayout>
  )
}
