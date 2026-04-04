"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import { Camera, Upload, X, Plus } from "lucide-react"

const LANGUAGES = ["Dansk","Engelsk","Norsk","Svensk","Tysk","Fransk","Spansk","Italiensk","Russisk","Arabisk","Thai","Polsk","Hollandsk","Portugisisk","Japansk","Kinesisk"]
const KINK_OPTIONS = ["Oral","Anal","BDSM","Rollespil","Fetish","Massage","Dominans","Underkastelse","GFE","Squirting","Cosplay","Voyeurisme","Exhibitionisme","Gruppeleg","Legetøj","Lingeri","Outdoor","Crossdressing"]

export default function KundeProfil() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    username: "",
    age: "",
    bio: "",
    kink_bio: "",
    avatar_url: "",
    gender: "",
    nationality: "",
    languages: [] as string[],
    height_cm: "",
    weight_kg: "",
    smoker: "",
    tattoo: "",
    penis_size: "",
    kinks: [] as string[],
    media: [] as { url: string; type: "image" | "video" }[],
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from("customer_profiles").select("*").eq("user_id", user.id).single()
      if (data) {
        setForm({
          username: data.username || "",
          age: data.age?.toString() || "",
          bio: data.bio || "",
          kink_bio: data.kink_bio || "",
          avatar_url: data.avatar_url || "",
          gender: data.gender || "",
          nationality: data.nationality || "",
          languages: data.languages || [],
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          smoker: data.smoker || "",
          tattoo: data.tattoo || "",
          penis_size: data.penis_size || "",
          kinks: data.kinks || [],
          media: data.media || [],
        })
      } else {
        setForm(prev => ({ ...prev, username: user.email?.split("@")[0] || "" }))
      }
    })
  }, [])

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const { uploadImages } = await import("@/lib/uploadImages")
      const [url] = await uploadImages([file])
      setForm(prev => ({ ...prev, avatar_url: url }))
    } catch { /* ignore */ }
    setUploadingAvatar(false)
  }

  const uploadMedia = async (files: FileList) => {
    setUploadingMedia(true)
    try {
      const { uploadMedia: upload } = await import("@/lib/uploadImages")
      const results = await Promise.all(Array.from(files).slice(0, 10).map(f => upload(f)))
      setForm(prev => ({ ...prev, media: [...prev.media, ...results] }))
    } catch { /* ignore */ }
    setUploadingMedia(false)
  }

  const removeMedia = (i: number) => setForm(prev => ({ ...prev, media: prev.media.filter((_, idx) => idx !== i) }))

  const toggleLanguage = (lang: string) => setForm(prev => ({
    ...prev,
    languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang]
  }))

  const toggleKink = (k: string) => setForm(prev => ({
    ...prev,
    kinks: prev.kinks.includes(k) ? prev.kinks.filter(x => x !== k) : [...prev.kinks, k]
  }))

  const save = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("customer_profiles").upsert({
      user_id: userId,
      username: form.username,
      age: form.age ? parseInt(form.age) : null,
      bio: form.bio,
      kink_bio: form.kink_bio,
      avatar_url: form.avatar_url,
      gender: form.gender || null,
      nationality: form.nationality || null,
      languages: form.languages,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
      smoker: form.smoker || null,
      tattoo: form.tattoo || null,
      penis_size: form.penis_size || null,
      kinks: form.kinks,
      media: form.media,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #E5E5E5", borderRadius: 8, outline: "none", background: "#fff", boxSizing: "border-box" }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }
  const section = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>{title}</div>
  )

  return (
    <KundeLayout>
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Min profil</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Kun synlig for profiler du har kontaktet</p>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ── Avatar ── */}
          <div>
            <span style={lbl}>Profilbillede</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: form.avatar_url ? "transparent" : "#E5E7EB", overflow: "hidden", border: "2px solid #E5E7EB", flexShrink: 0, position: "relative" }}>
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={22} color="#9CA3AF" /></div>}
                {uploadingAvatar && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 18, height: 18, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>}
              </div>
              <div>
                <button onClick={() => avatarInputRef.current?.click()}
                  style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #E5E5E5", borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Upload size={13} /> Upload billede
                </button>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>JPG eller PNG, maks 5MB</p>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
            </div>
          </div>

          <div style={{ height: 1, background: "#F3F4F6" }} />

          {/* ── Grundinfo ── */}
          {section("Grundoplysninger")}

          <div>
            <span style={lbl}>Brugernavn *</span>
            <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} style={inp} placeholder="dit_brugernavn" />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Synligt ved anmeldelser — ikke ved beskeder</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={lbl}>Køn</span>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} style={inp}>
                <option value="">Vælg...</option>
                <option value="male">Mand</option>
                <option value="female">Dame</option>
                <option value="trans">Trans</option>
                <option value="other">Andet</option>
              </select>
            </div>
            <div>
              <span style={lbl}>Alder</span>
              <select value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} style={inp}>
                <option value="">Ikke oplyst</option>
                {Array.from({ length: 63 }, (_, i) => i + 18).map(a => <option key={a} value={a}>{a} år</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={lbl}>Nationalitet</span>
              <input type="text" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} style={inp} placeholder="f.eks. Dansk, Polsk..." />
            </div>
            <div>
              <span style={lbl}>Højde (cm)</span>
              <input type="number" value={form.height_cm} onChange={e => setForm(p => ({ ...p, height_cm: e.target.value }))} style={inp} placeholder="175" min={140} max={220} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={lbl}>Vægt (kg)</span>
              <input type="number" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} style={inp} placeholder="75" min={40} max={200} />
            </div>
            <div>
              <span style={lbl}>Ryger</span>
              <select value={form.smoker} onChange={e => setForm(p => ({ ...p, smoker: e.target.value }))} style={inp}>
                <option value="">Vælg...</option>
                <option value="no">Ryger ikke</option>
                <option value="yes">Ryger</option>
                <option value="occasionally">Lejlighedsvis</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={lbl}>Tatoveringer</span>
              <select value={form.tattoo} onChange={e => setForm(p => ({ ...p, tattoo: e.target.value }))} style={inp}>
                <option value="">Vælg...</option>
                <option value="none">Ingen</option>
                <option value="few">Et par</option>
                <option value="many">Mange</option>
              </select>
            </div>
            {(form.gender === "male" || form.gender === "trans") && (
              <div>
                <span style={lbl}>Peniss størrelse</span>
                <select value={form.penis_size} onChange={e => setForm(p => ({ ...p, penis_size: e.target.value }))} style={inp}>
                  <option value="">Vælg...</option>
                  <option value="small">Under 14 cm</option>
                  <option value="medium">14–18 cm</option>
                  <option value="large">18–22 cm</option>
                  <option value="xlarge">Over 22 cm</option>
                </select>
              </div>
            )}
          </div>

          {/* Sprog */}
          <div>
            <span style={lbl}>Sprog</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button key={lang} onClick={() => toggleLanguage(lang)} type="button"
                  style={{ padding: "5px 10px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: "1.5px solid", cursor: "pointer",
                    background: form.languages.includes(lang) ? "#111" : "#fff",
                    color: form.languages.includes(lang) ? "#fff" : "#374151",
                    borderColor: form.languages.includes(lang) ? "#111" : "#E5E7EB" }}>
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#F3F4F6" }} />

          {/* ── Bio & Kinks ── */}
          {section("Om mig & præferencer")}

          <div>
            <span style={lbl}>Bio (valgfrit)</span>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              rows={3} style={{ ...inp, resize: "vertical" }} placeholder="Fortæl lidt om dig selv..." maxLength={300} />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{form.bio.length}/300</p>
          </div>

          {/* Kinks */}
          <div>
            <span style={lbl}>Hvad tænder du på</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {KINK_OPTIONS.map(k => (
                <button key={k} onClick={() => toggleKink(k)} type="button"
                  style={{ padding: "5px 10px", fontSize: 12, fontWeight: 500, borderRadius: 20, border: "1.5px solid", cursor: "pointer",
                    background: form.kinks.includes(k) ? "#DC2626" : "#fff",
                    color: form.kinks.includes(k) ? "#fff" : "#374151",
                    borderColor: form.kinks.includes(k) ? "#DC2626" : "#E5E7EB" }}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={lbl}>Beskriv hvad du tænder på (synligt for profiler du kontakter)</span>
            <textarea value={form.kink_bio} onChange={e => setForm(p => ({ ...p, kink_bio: e.target.value }))}
              rows={4} style={{ ...inp, resize: "vertical" }} placeholder="Beskriv dine præferencer og fantasier..." maxLength={500} />
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{form.kink_bio.length}/500</p>
          </div>

          <div style={{ height: 1, background: "#F3F4F6" }} />

          {/* ── Billeder & Videoer ── */}
          {section("Mine billeder & videoer")}
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: -12 }}>Synlige for profiler du har kontaktet</p>

          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.media.map((m, i) => (
                <div key={i} style={{ position: "relative", width: 90, height: 90, borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", background: "#111" }}>
                  {m.type === "video"
                    ? <video src={`${m.url}#t=1`} style={{ width: "100%", height: "100%", objectFit: "cover" }} preload="metadata" />
                    : <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {m.type === "video" && (
                    <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.6)", borderRadius: 3, padding: "1px 5px", fontSize: 9, color: "#fff", fontWeight: 700 }}>VIDEO</div>
                  )}
                  <button onClick={() => removeMedia(i)}
                    style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "#DC2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={10} color="#fff" />
                  </button>
                </div>
              ))}
              {/* Upload knap */}
              <button onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia}
                style={{ width: 90, height: 90, borderRadius: 8, border: "2px dashed #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {uploadingMedia
                  ? <div style={{ width: 18, height: 18, border: "2px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  : <><Plus size={20} color="#9CA3AF" /><span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Tilføj</span></>}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Billeder og videoer — maks 10 stk</p>
            <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
              onChange={e => { if (e.target.files) uploadMedia(e.target.files); }} />
          </div>

          <div style={{ height: 1, background: "#F3F4F6" }} />

          {/* ── Privacy notice ── */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
              ⚠️ <strong>Anmeldelser:</strong> Hvis du skriver en anmeldelse, vises dit brugernavn offentligt. Du vil blive advaret inden du indsender.
            </p>
          </div>

          {/* Gem */}
          <button onClick={save} disabled={saving || !form.username.trim()}
            style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700, borderRadius: 8, border: "none",
              cursor: saving || !form.username.trim() ? "not-allowed" : "pointer",
              background: saved ? "#16A34A" : "#000", color: "#fff" }}>
            {saving ? "Gemmer..." : saved ? "✓ Profil gemt!" : "Gem profil"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </KundeLayout>
  )
}
