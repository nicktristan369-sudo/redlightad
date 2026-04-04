"use client"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import { Camera, Upload, X, Plus, Eye } from "lucide-react"

const LANGUAGES = ["Dansk","Engelsk","Norsk","Svensk","Tysk","Fransk","Spansk","Italiensk","Russisk","Arabisk","Thai","Polsk","Hollandsk","Portugisisk","Japansk","Kinesisk"]
const KINK_OPTIONS = ["Oral","Anal","BDSM","Rollespil","Fetish","Massage","Dominans","Underkastelse","GFE","Squirting","Cosplay","Voyeurisme","Exhibitionisme","Gruppeleg","Legetøj","Lingeri","Outdoor","Crossdressing"]

export default function KundeProfil() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
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
  const [profileMeta, setProfileMeta] = useState<{ created_at: string; phone_verified: boolean } | null>(null)

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
        setProfileMeta({ created_at: data.created_at, phone_verified: !!data.phone_verified })
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Min profil</h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Kun synlig for profiler du har kontaktet</p>
          </div>
          <button onClick={() => setShowPreview(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", fontSize: 13, fontWeight: 700, border: "1.5px solid #E5E7EB", borderRadius: 9, background: "#fff", cursor: "pointer", color: "#374151", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
            <Eye size={15} /> Vis din profil
          </button>
        </div>

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

      {/* ── Preview Modal ── */}
      {showPreview && (
        <div onClick={() => setShowPreview(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", position: "relative" }}>
            {/* Header */}
            <div style={{ background: "#111", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Forhåndsvisning — sådan ser andre din profil</span>
              <button onClick={() => setShowPreview(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
            </div>

            {/* Profile card */}
            <div style={{ padding: "24px 24px 20px" }}>
              {/* Avatar + navn + verified */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#E5E7EB", border: "3px solid #F3F4F6" }}>
                    {form.avatar_url
                      ? <img src={form.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{form.username.slice(0,2).toUpperCase() || "?"}</span>
                        </div>
                    }
                  </div>
                  {profileMeta?.phone_verified && (
                    <div title="Verificeret af RedLightAD" style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: "#16A34A", borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{form.username || "Anonym"}</span>
                    {profileMeta?.phone_verified && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 7px", borderRadius: 20, border: "1px solid #BBF7D0" }}>
                        ✓ Verificeret af RedLightAD
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    {form.gender && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>
                        {form.gender === "male" ? "Mand" : form.gender === "female" ? "Dame" : form.gender === "trans" ? "Trans" : "Andet"}
                      </span>
                    )}
                    {form.age && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{form.age} år</span>}
                    {form.nationality && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{form.nationality}</span>}
                  </div>
                  {profileMeta?.created_at && (
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
                      Profil oprettet {new Date(profileMeta.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              {(form.height_cm || form.weight_kg || form.smoker || form.tattoo || form.penis_size) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginBottom: 16 }}>
                  {form.height_cm && (
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{form.height_cm}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>cm høj</div>
                    </div>
                  )}
                  {form.weight_kg && (
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{form.weight_kg}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>kg</div>
                    </div>
                  )}
                  {form.smoker && (
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 13 }}>{form.smoker === "no" ? "🚭" : form.smoker === "yes" ? "🚬" : "💨"}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{form.smoker === "no" ? "Ryger ikke" : form.smoker === "yes" ? "Ryger" : "Lejlighedsvis"}</div>
                    </div>
                  )}
                  {form.tattoo && form.tattoo !== "none" && (
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 13 }}>🖋️</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{form.tattoo === "few" ? "Et par" : "Mange"} tatoveringer</div>
                    </div>
                  )}
                  {form.penis_size && (form.gender === "male" || form.gender === "trans") && (
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "9px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 13 }}>📏</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>
                        {form.penis_size === "small" ? "<14 cm" : form.penis_size === "medium" ? "14–18 cm" : form.penis_size === "large" ? "18–22 cm" : ">22 cm"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sprog */}
              {form.languages.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Taler</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {form.languages.map(l => <span key={l} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 9px", borderRadius: 12 }}>{l}</span>)}
                  </div>
                </div>
              )}

              {/* Kinks */}
              {form.kinks.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Interesser</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {form.kinks.map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, background: "#FFF1F2", color: "#DC2626", padding: "3px 9px", borderRadius: 12 }}>{k}</span>)}
                  </div>
                </div>
              )}

              {/* Kink bio */}
              {form.kink_bio && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Om mig</div>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>{form.kink_bio}</p>
                </div>
              )}

              {/* Media */}
              {form.media.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Billeder & videoer</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {form.media.slice(0, 6).map((m, i) => (
                      <div key={i} style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#111", position: "relative" }}>
                        {m.type === "video"
                          ? <video src={`${m.url}#t=1`} style={{ width: "100%", height: "100%", objectFit: "cover" }} preload="metadata" />
                          : <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {m.type === "video" && <div style={{ position: "absolute", bottom: 3, left: 3, background: "rgba(0,0,0,0.65)", borderRadius: 3, padding: "1px 4px", fontSize: 8, color: "#fff", fontWeight: 700 }}>VIDEO</div>}
                        {i === 5 && form.media.length > 6 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>+{form.media.length - 6}</span>
                        </div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #F3F4F6", padding: "14px 24px", background: "#FAFAFA", display: "flex", gap: 8 }}>
              <button onClick={() => setShowPreview(false)}
                style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 700, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer" }}>
                Luk
              </button>
              <button onClick={() => { setShowPreview(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 8, background: "#000", color: "#fff", cursor: "pointer" }}>
                Rediger profil
              </button>
            </div>
          </div>
        </div>
      )}
    </KundeLayout>
  )
}
