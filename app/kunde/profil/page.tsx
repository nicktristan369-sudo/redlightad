"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"

export default function KundeProfil() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: "", age: "", bio: "", avatar_url: "",
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from("customer_profiles").select("*").eq("user_id", user.id).single()
      if (data) setForm({ username: data.username || "", age: data.age?.toString() || "", bio: data.bio || "", avatar_url: data.avatar_url || "" })
      else setForm(prev => ({ ...prev, username: user.email?.split("@")[0] || "" }))
    })
  }, [])

  const save = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("customer_profiles").upsert({
      user_id: userId,
      username: form.username,
      age: form.age ? parseInt(form.age) : null,
      bio: form.bio,
      avatar_url: form.avatar_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", fontSize: 13,
    border: "1px solid #E5E5E5", borderRadius: 8, outline: "none", background: "#fff",
    boxSizing: "border-box" as const,
  }
  const label = { fontSize: 12, fontWeight: 600 as const, color: "#374151", marginBottom: 4, display: "block" as const }

  return (
    <KundeLayout>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Min profil</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Kun synlig for profiler du har kontaktet</p>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24 }}>
          {/* Avatar URL */}
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Profilbillede URL (valgfrit)</span>
            <input type="url" value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
            {form.avatar_url && (
              <img src={form.avatar_url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "50%", marginTop: 8, border: "2px solid #E5E7EB" }} />
            )}
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Brugernavn *</span>
            <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} style={inputStyle} placeholder="dit_brugernavn" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Synligt ved anmeldelser (ikke ved beskeder)</p>
          </div>

          {/* Age */}
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Alder (valgfrit)</span>
            <select value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} style={inputStyle}>
              <option value="">Ikke oplyst</option>
              {Array.from({ length: 63 }, (_, i) => i + 18).map(a => <option key={a} value={a}>{a} år</option>)}
            </select>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <span style={label}>Om mig (valgfrit)</span>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
              style={{ ...inputStyle, resize: "vertical" }} placeholder="Kort beskrivelse..." maxLength={200} />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{form.bio.length}/200 tegn</p>
          </div>

          {/* Privacy notice */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0 }}>
              ⚠️ <strong>Anmeldelser:</strong> Hvis du skriver en anmeldelse på en profil, vises dit brugernavn offentligt. Du vil blive advaret inden du indsender.
            </p>
          </div>

          <button onClick={save} disabled={saving || !form.username.trim()}
            style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer", background: saved ? "#16A34A" : "#000", color: "#fff" }}>
            {saving ? "Gemmer..." : saved ? "✓ Gemt!" : "Gem profil"}
          </button>
        </div>
      </div>
    </KundeLayout>
  )
}
