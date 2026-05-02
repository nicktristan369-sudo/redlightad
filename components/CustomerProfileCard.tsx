"use client"

import { useState } from "react"
import { X, ShieldCheck } from "lucide-react"

interface CustomerProfile {
  user_id: string
  username: string | null
  avatar_url: string | null
  age?: number | null
  gender?: string | null
  nationality?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  smoker?: string | null
  tattoo?: string | null
  penis_size?: string | null
  languages?: string[] | null
  kinks?: string[] | null
  kink_bio?: string | null
  phone_verified?: boolean
  created_at?: string
  media?: { url: string; type: "image" | "video" }[] | null
}

interface Props {
  profile: CustomerProfile
  onClose: () => void
}

const genderLabel = (g: string | null | undefined) => {
  if (!g) return null
  return g === "male" ? "Mand" : g === "female" ? "Dame" : g === "trans" ? "Trans" : g
}

const smokerLabel = (s: string | null | undefined) => {
  if (!s) return null
  return s === "no" ? "Ryger ikke" : s === "yes" ? "Ryger" : "Lejlighedsvis"
}

const tattooLabel = (t: string | null | undefined) => {
  if (!t || t === "none") return null
  return t === "few" ? "Et par tatoveringer" : "Mange tatoveringer"
}

const penisLabel = (p: string | null | undefined) => {
  if (!p) return null
  return p === "small" ? "Under 14 cm" : p === "medium" ? "14–18 cm" : p === "large" ? "18–22 cm" : "Over 22 cm"
}

export default function CustomerProfileCard({ profile, onClose }: Props) {
  const name = profile.username || "Anonym"
  const initials = name.slice(0, 2).toUpperCase()
  const gl = genderLabel(profile.gender)
  const sl = smokerLabel(profile.smoker)
  const tl = tattooLabel(profile.tattoo)
  const pl = penisLabel(profile.penis_size)
  const media = profile.media || []
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null)

  const openLightbox = (index: number) => setLightbox({ index })
  const closeLightbox = () => setLightbox(null)
  const prevMedia = () => setLightbox(lb => lb ? { index: (lb.index - 1 + media.length) % media.length } : null)
  const nextMedia = () => setLightbox(lb => lb ? { index: (lb.index + 1) % media.length } : null)

  const stats = [
    profile.height_cm ? { value: `${profile.height_cm}`, unit: "cm høj" } : null,
    profile.weight_kg ? { value: `${profile.weight_kg}`, unit: "kg" } : null,
    sl ? { value: sl, unit: "ryger" } : null,
    tl ? { value: tl, unit: "" } : null,
    pl && (profile.gender === "male" || profile.gender === "trans") ? { value: pl, unit: "penis" } : null,
  ].filter(Boolean) as { value: string; unit: string }[]

  return (
    <>
    {/* Lightbox */}
    {lightbox !== null && media[lightbox.index] && (
      <div onClick={closeLightbox}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 10010, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Close */}
        <button onClick={closeLightbox}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <X size={20} color="#fff" />
        </button>
        {/* Counter */}
        <span style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
          {lightbox.index + 1} / {media.length}
        </span>
        {/* Prev */}
        {media.length > 1 && (
          <button onClick={e => { e.stopPropagation(); prevMedia() }}
            style={{ position: "absolute", left: 12, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        {/* Media */}
        <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {media[lightbox.index].type === "video" ? (
            <video
              src={media[lightbox.index].url}
              controls
              autoPlay
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, background: "#000" }}
            />
          ) : (
            <img
              src={media[lightbox.index].url}
              alt=""
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }}
            />
          )}
        </div>
        {/* Next */}
        {media.length > 1 && (
          <button onClick={e => { e.stopPropagation(); nextMedia() }}
            style={{ position: "absolute", right: 12, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>
    )}

    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.28)" }}
      >
        {/* ── Top banner ── */}
        <div style={{ position: "relative", background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "28px 24px 20px" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={14} color="#fff" />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.2)" }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{initials}</span>
                    </div>}
              </div>
              {profile.phone_verified && (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "#16A34A", borderRadius: "50%", border: "2px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={11} color="#fff" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Navn + badges */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{name}</span>
                {profile.phone_verified && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", background: "rgba(74,222,128,0.15)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(74,222,128,0.3)" }}>
                    Verificeret
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                {gl && <Tag dark>{gl}</Tag>}
                {profile.age && <Tag dark>{profile.age} år</Tag>}
                {profile.nationality && <Tag dark>{profile.nationality}</Tag>}
              </div>
              {profile.created_at && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>
                  Medlem siden {new Date(profile.created_at).toLocaleDateString("da-DK", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Stats */}
          {stats.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: 8 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: "#F8F8F8", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid #F0F0F0" }}>
                  <div style={{ fontSize: s.value.length > 6 ? 11 : 15, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{s.value}</div>
                  {s.unit && <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, marginTop: 2, textTransform: "lowercase" }}>{s.unit}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Sprog */}
          {profile.languages && profile.languages.length > 0 && (
            <div>
              <SectionLabel>Speaks</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                {profile.languages.map(l => (
                  <span key={l} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#2563EB", padding: "4px 10px", borderRadius: 20 }}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interesser */}
          {profile.kinks && profile.kinks.length > 0 && (
            <div>
              <SectionLabel>Interesser</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                {profile.kinks.map(k => (
                  <span key={k} style={{ fontSize: 12, fontWeight: 600, background: "#FFF1F2", color: "#DC2626", padding: "4px 10px", borderRadius: 20, border: "1px solid #FEE2E2" }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.kink_bio && (
            <div>
              <SectionLabel>Om mig</SectionLabel>
              <div style={{ background: "#F9FAFB", border: "1px solid #F0F0F0", borderRadius: 10, padding: "12px 14px", marginTop: 7 }}>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{profile.kink_bio}</p>
              </div>
            </div>
          )}

          {/* Billeder & videoer */}
          {media.length > 0 && (
            <div>
              <SectionLabel>Billeder & videoer</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 7 }}>
                {media.slice(0, 6).map((m, i) => (
                  <div key={i}
                    onClick={() => openLightbox(i)}
                    style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "#111", cursor: "pointer" }}>
                    {m.type === "video"
                      ? <video src={`${m.url}#t=1`} style={{ width: "100%", height: "100%", objectFit: "cover" }} preload="metadata" />
                      : <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {m.type === "video" && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="#111"><path d="M0 0l10 6-10 6z"/></svg>
                        </div>
                      </div>
                    )}
                    {i === 5 && media.length > 6 && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>+{media.length - 6}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid #F0F0F0", padding: "12px 24px", background: "#FAFAFA", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 20px", fontSize: 13, fontWeight: 700, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#374151" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

function Tag({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 12,
      background: dark ? "rgba(255,255,255,0.12)" : "#F3F4F6",
      color: dark ? "rgba(255,255,255,0.8)" : "#374151",
    }}>
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {children}
    </div>
  )
}
