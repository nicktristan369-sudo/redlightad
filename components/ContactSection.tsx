"use client"

import { useState } from "react"
import { ContactModal } from "@/components/ContactModal"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface ContactInfo {
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  snapchat?: string | null
  email?: string | null
  viber?: string | null
  wechat?: string | null
  line_app?: string | null
  signal?: string | null
  instagram?: string | null
  x_twitter?: string | null
  profileImage?: string | null
  name?: string
}

function AppLogo({ src, alt, radius = 12 }: { src: string; alt: string; radius?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: 32, height: 32, borderRadius: radius, objectFit: "cover", flexShrink: 0 }}
    />
  )
}

export default function ContactSection({ contact }: { contact: ContactInfo }) {
  const { t } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)

  const hasPhone = !!(contact.phone || contact.whatsapp)
  const hasTelegram = !!contact.telegram
  const hasEmail = !!contact.email
  const hasSnapchat = !!contact.snapchat
  const hasViber = !!contact.viber
  const hasWechat = !!contact.wechat
  const hasLine = !!contact.line_app
  const hasSignal = !!contact.signal
  const hasInstagram = !!contact.instagram
  const hasX = !!contact.x_twitter

  if (!hasPhone && !hasTelegram && !hasEmail && !hasSnapchat && !hasViber && !hasWechat && !hasLine && !hasSignal && !hasInstagram && !hasX) return null

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
    borderBottom: "1px solid #F3F4F6", textDecoration: "none", cursor: "pointer",
    background: "#fff", width: "100%", border: "none", textAlign: "left" as const,
    transition: "background 0.15s",
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }
  const valueStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#374151", letterSpacing: "0.15em", marginTop: 2 }
  const btnStyle = (bg: string, color = "#fff"): React.CSSProperties => ({
    marginLeft: "auto", flexShrink: 0, fontSize: 12, fontWeight: 700,
    padding: "7px 14px", borderRadius: 8, background: bg, color, border: "none", cursor: "pointer"
  })

  return (
    <>
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>{t.contact_info}</h3>
        </div>

        {/* Phone / WhatsApp */}
        {hasPhone && (
          <button onClick={() => setModalOpen(true)} style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6", width: "100%" }}>
            <AppLogo src="/logos/whatsapp.jpg" alt="Phone" radius={12} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>{t.contact_phone}</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#DC2626")}>{t.contact_show}</span>
          </button>
        )}

        {/* Telegram */}
        {hasTelegram && (
          <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer"
            style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <AppLogo src="/logos/telegram.jpg" alt="Telegram" radius={12} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Telegram</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#0088CC")}>{t.contact_open}</span>
          </a>
        )}

        {/* WhatsApp standalone */}
        {!hasPhone && contact.whatsapp && (
          <button onClick={() => setModalOpen(true)} style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6", width: "100%" }}>
            <AppLogo src="/logos/whatsapp.jpg" alt="WhatsApp" radius={12} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>WhatsApp</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#25D366")}>{t.contact_show}</span>
          </button>
        )}

        {/* Signal */}
        {hasSignal && (
          <div style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <AppLogo src="/logos/signal.jpg" alt="Signal" radius={12} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Signal</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginTop: 2 }}>{contact.signal}</p>
            </div>
          </div>
        )}

        {/* Snapchat */}
        {hasSnapchat && (
          <div style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <AppLogo src="/logos/snapchat.jpg" alt="Snapchat" radius={8} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Snapchat</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginTop: 2 }}>{contact.snapchat}</p>
            </div>
          </div>
        )}

        {/* Instagram */}
        {hasInstagram && (
          <a href={`https://instagram.com/${contact.instagram?.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <AppLogo src="/logos/instagram.jpg" alt="Instagram" radius={8} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Instagram</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#E1306C")}>{t.contact_open}</span>
          </a>
        )}

        {/* X / Twitter */}
        {hasX && (
          <a href={`https://x.com/${contact.x_twitter?.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <AppLogo src="/logos/x.jpg" alt="X" radius={12} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>X / Twitter</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#111")}>{t.contact_open}</span>
          </a>
        )}

        {/* Viber */}
        {hasViber && (
          <a href={`viber://chat?number=${contact.viber}`}
            style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 32, height: 32, borderRadius: 12, background: "#7360F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>V</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Viber</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#7360F2")}>{t.contact_open}</span>
          </a>
        )}

        {/* WeChat */}
        {hasWechat && (
          <div style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 32, height: 32, borderRadius: 12, background: "#07C160", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>W</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>WeChat</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginTop: 2 }}>{contact.wechat}</p>
            </div>
          </div>
        )}

        {/* LINE */}
        {hasLine && (
          <a href={`https://line.me/ti/p/${contact.line_app}`} target="_blank" rel="noopener noreferrer"
            style={{ ...rowStyle, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#00B900", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>LINE</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>LINE</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#00B900")}>{t.contact_open}</span>
          </a>
        )}

        {/* Email */}
        {hasEmail && (
          <a href={`mailto:${contact.email}`}
            style={{ ...rowStyle }}>
            <AppLogo src="/logos/email.jpg" alt="Email" radius={8} />
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Email</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#F3F4F6", "#374151")}>{t.contact_open}</span>
          </a>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          phone={contact.phone ?? null}
          whatsapp={contact.whatsapp ?? null}
          profileImage={contact.profileImage}
          name={contact.name}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
