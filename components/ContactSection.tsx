"use client"

import { useRef, useEffect, useState } from "react"
import { Phone, MessageCircle, Mail } from "lucide-react"

interface ContactInfo {
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  snapchat?: string | null
  email?: string | null
}

// ── Icons ─────────────────────────────────────────────────────
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function SnapchatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFFC00">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.989-.217a.845.845 0 01.266-.043c.193 0 .37.058.496.155a.578.578 0 01.218.452c0 .373-.382.63-1.15.856-.142.035-.273.062-.39.086-.39.074-.725.143-.913.482-.058.101-.084.211-.084.318 0 .106.027.197.055.264.408.938 1.665 2.168 3.243 2.468a.583.583 0 01.479.548c0 .065-.013.13-.037.188-.191.465-.914.793-2.088.953a2.56 2.56 0 00-.071.264c-.053.24-.121.502-.444.502a3.454 3.454 0 01-.611-.078 5.548 5.548 0 00-1.264-.148c-.255 0-.474.023-.666.07-.569.14-1.034.567-1.554 1.043-.718.66-1.532 1.409-2.912 1.409h-.055c-1.38 0-2.194-.749-2.912-1.409-.52-.476-.985-.903-1.554-1.043a3.468 3.468 0 00-.666-.07c-.457 0-.89.063-1.264.148a3.37 3.37 0 01-.611.078c-.323 0-.391-.262-.444-.502a2.56 2.56 0 00-.071-.264c-1.174-.16-1.897-.488-2.088-.953a.583.583 0 01-.037-.188.583.583 0 01.479-.548c1.578-.3 2.835-1.53 3.243-2.468.028-.067.055-.158.055-.264 0-.107-.026-.217-.084-.318-.188-.339-.523-.408-.913-.482a6.74 6.74 0 01-.39-.086c-.585-.174-1.15-.435-1.15-.856a.578.578 0 01.218-.452.685.685 0 01.496-.155c.087 0 .175.015.266.043.33.097.689.217.989.217.198 0 .326-.045.401-.09a41.9 41.9 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.653 1.069 11.017.793 12.006.793h.2z" />
    </svg>
  )
}

// ── Canvas renderer (anti-scraping) ──────────────────────────
function CanvasText({ text, fontSize = 13 }: { text: string; fontSize?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    ctx.font = font
    const textW = ctx.measureText(text).width
    const w = Math.ceil(textW) + 8
    const h = fontSize + 10
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + "px"
    canvas.style.height = h + "px"
    ctx.scale(dpr, dpr)
    ctx.font = font
    ctx.fillStyle = "#111827"
    ctx.textBaseline = "middle"
    ctx.fillText(text, 4, h / 2)
  }, [text, fontSize])

  return <canvas ref={canvasRef} style={{ display: "inline-block", verticalAlign: "middle" }} />
}

// ── Single contact row ────────────────────────────────────────
function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const [revealed, setReveal] = useState(false)

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 relative group">
      {/* Icon */}
      <span className="flex-shrink-0 w-5 flex items-center justify-center">{icon}</span>

      {/* Value */}
      <div className="flex-1 min-w-0 relative overflow-hidden">
        {revealed ? (
          <CanvasText text={value} fontSize={13} />
        ) : (
          // Skjult: viser prikker + gradient fade
          <div className="flex items-center gap-1 select-none">
            <span className="text-sm font-semibold text-gray-400 tracking-widest">••••••••••</span>
            <div
              className="absolute inset-y-0 right-0 w-12 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent 0%, white 100%)" }}
            />
          </div>
        )}
      </div>

      {/* SHOW / SKJUL button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setReveal(v => !v) }}
        className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-md text-white transition-colors"
        style={{ background: revealed ? "#6B7280" : "#DC2626", borderRadius: "6px" }}
      >
        {revealed ? "SKJUL" : "SHOW"}
      </button>
    </div>
  )

  // Wrap in link only when revealed
  if (revealed && href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="block border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
      >
        {inner}
      </a>
    )
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      {inner}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function ContactSection({ contact }: { contact: ContactInfo }) {
  const rows = [
    contact.phone && {
      icon: <Phone size={16} color="#6B7280" />,
      label: "Telefon",
      value: contact.phone,
      href: `tel:${contact.phone}`,
    },
    contact.whatsapp && {
      icon: <WhatsAppIcon size={16} />,
      label: "WhatsApp",
      value: contact.whatsapp,
      href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
    },
    contact.telegram && {
      icon: <MessageCircle size={16} color="#229ED9" />,
      label: "Telegram",
      value: contact.telegram,
      href: `https://t.me/${contact.telegram}`,
    },
    contact.snapchat && {
      icon: <SnapchatIcon size={16} />,
      label: "Snapchat",
      value: contact.snapchat,
    },
    contact.email && {
      icon: <Mail size={16} color="#6B7280" />,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href?: string }[]

  if (!rows.length) return null

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid #E5E5E5",
        borderRadius: "4px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Honeypot — scrapers fanger fake data */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}
      >
        <span>+45 0000 0000</span>
        <span>+45 1111 1111</span>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-bold text-gray-900">Contact Info</h3>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row, i) => (
          <ContactRow key={i} {...row} />
        ))}
      </div>
    </div>
  )
}
