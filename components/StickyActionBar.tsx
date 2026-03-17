"use client"

import { useState } from "react"
import { Phone, Star, MessageCircle, Flag, X, Send, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Props {
  phone: string | null
  whatsapp: string | null
  listingId: string
  listingTitle: string
  isLoggedIn: boolean
}

// ── Reusable bottom-sheet wrapper ─────────────────────────────────────────────
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-2xl pb-[env(safe-area-inset-bottom,16px)]"
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Login gate (shared) ───────────────────────────────────────────────────────
function LoginGate({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-3 pb-6 text-center space-y-4">
        <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
        <p className="text-[13px] text-gray-500">{body}</p>
        <Link href="/register" onClick={onClose}
          className="block w-full py-3 rounded-xl text-[14px] font-semibold text-white text-center"
          style={{ background: "#DC2626" }}>
          Opret gratis konto
        </Link>
        <Link href="/login" onClick={onClose}
          className="block w-full py-3 rounded-xl text-[14px] font-semibold text-gray-700 bg-gray-100 text-center">
          Log ind
        </Link>
      </div>
    </Sheet>
  )
}

// ── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ phone, whatsapp, onClose }: { phone: string | null; whatsapp: string | null; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-3 pb-6 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-bold text-gray-900">Kontakt</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X size={15} color="#6B7280" />
          </button>
        </div>
        {phone && (
          <a href={`tel:${phone}`}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            <Phone size={18} color="#DC2626" />
            Ring: {phone}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp: {whatsapp}
          </a>
        )}
        {!phone && !whatsapp && (
          <p className="text-[14px] text-gray-400 text-center py-4">Ingen kontaktinfo tilgængeligt</p>
        )}
        {/* Info hint */}
        <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 mt-1">
          <span className="text-[13px] text-gray-400 flex-shrink-0 mt-px">💡</span>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Husk at nævne at du fandt annoncen på <strong className="text-gray-500">RedLightAD.com</strong>
          </p>
        </div>
      </div>
    </Sheet>
  )
}

// ── Message Modal — 2 valg ────────────────────────────────────────────────────
function MessageModal({
  phone, listingTitle, isLoggedIn, onClose,
}: { phone: string | null; listingTitle: string; isLoggedIn: boolean; onClose: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState("")
  const [sent, setSent] = useState(false)

  if (showForm) {
    return (
      <Sheet onClose={onClose}>
        <div className="px-6 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[17px] font-bold text-gray-900">Send besked</h3>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X size={15} color="#6B7280" />
            </button>
          </div>
          <p className="text-[12px] text-gray-400">Til: <strong className="text-gray-700">{listingTitle}</strong></p>
          {sent ? (
            <p className="text-[14px] text-green-600 font-semibold text-center py-6">Besked sendt ✓</p>
          ) : (
            <>
              <textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="Skriv din besked…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] resize-none focus:outline-none focus:border-gray-400" />
              <button onClick={() => { setSent(true); setTimeout(onClose, 1500) }} disabled={!msg.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40"
                style={{ background: "#DC2626" }}>
                <Send size={15} /> Send besked
              </button>
            </>
          )}
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-3 pb-6 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-bold text-gray-900">Kontakt {listingTitle}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X size={15} color="#6B7280" />
          </button>
        </div>

        {/* SMS */}
        {phone && (
          <a href={`sms:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: "#111" }}>
            <Phone size={18} />
            <div>
              <div>Send SMS</div>
              <div className="text-[11px] font-normal opacity-70 mt-0.5">{phone}</div>
            </div>
          </a>
        )}

        {/* Platform besked */}
        {isLoggedIn ? (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: "#DC2626" }}>
            <MessageSquare size={18} />
            <div>
              <div>Send besked på platformen</div>
              <div className="text-[11px] font-normal opacity-80 mt-0.5">100% anonymt</div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} color="#6B7280" />
              <div>
                <p className="text-[14px] font-semibold text-gray-700">Send besked på platformen</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Platform beskeder er 100% anonyme</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-500">Opret en gratis konto for at sende anonyme beskeder</p>
            <div className="flex gap-2">
              <Link href="/register" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white text-center"
                style={{ background: "#DC2626" }}>
                Opret konto
              </Link>
              <Link href="/login" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 bg-gray-100 text-center">
                Log ind
              </Link>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}

// ── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ listingId, isLoggedIn, onClose }: { listingId: string; isLoggedIn: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("")
  const [sent, setSent] = useState(false)

  if (!isLoggedIn) {
    return (
      <LoginGate
        title="Rapporter annonce"
        body="Opret en gratis konto for at rapportere en annonce"
        onClose={onClose}
      />
    )
  }

  const submit = async () => {
    if (!reason.trim()) return
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, reason }),
      })
    } catch { /* best effort */ }
    setSent(true)
    setTimeout(onClose, 1500)
  }

  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-3 pb-6 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-bold text-gray-900">Rapporter annonce</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X size={15} color="#6B7280" />
          </button>
        </div>
        {sent ? (
          <p className="text-[14px] text-green-600 font-semibold text-center py-6">Tak — rapport modtaget ✓</p>
        ) : (
          <>
            <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Beskriv problemet kort…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] resize-none focus:outline-none focus:border-gray-400" />
            <button onClick={submit} disabled={!reason.trim()}
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40"
              style={{ background: "#111" }}>
              Send rapport
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Review gate ───────────────────────────────────────────────────────────────
function ReviewGate({ onClose }: { onClose: () => void }) {
  return (
    <LoginGate
      title="Skriv en anmeldelse"
      body="Opret en gratis konto for at skrive en anmeldelse"
      onClose={onClose}
    />
  )
}

function scrollToReviews() {
  const el = document.getElementById("reviews-section")
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
}

// ── Main component ────────────────────────────────────────────────────────────
type Modal = "contact" | "message" | "report" | "review-gate" | null

export default function StickyActionBar({ phone, whatsapp, listingId, listingTitle, isLoggedIn }: Props) {
  const [modal, setModal] = useState<Modal>(null)

  const handleReview = () => {
    if (!isLoggedIn) { setModal("review-gate"); return }
    scrollToReviews()
  }

  const buttons = [
    { icon: <Phone size={20} />,          label: "Contact", primary: true,  action: () => setModal("contact") },
    { icon: <Star size={20} />,           label: "Review",  primary: false, action: handleReview },
    { icon: <MessageCircle size={20} />,  label: "Message", primary: false, action: () => setModal("message") },
    { icon: <Flag size={20} />,           label: "Report",  primary: false, action: () => setModal("report") },
  ]

  return (
    <>
      {/* ── Sticky bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white"
        style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-stretch divide-x divide-gray-100">
          {buttons.map((btn, i) => (
            <button key={i} onClick={btn.action}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-70"
              style={{ background: btn.primary ? "#DC2626" : "#fff", color: btn.primary ? "#fff" : "#6B7280" }}>
              {btn.icon}
              <span className="text-[10px] font-semibold tracking-wide">{btn.label}</span>
            </button>
          ))}
        </div>
        <div className="bg-white" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>

      {/* ── Modals ── */}
      {modal === "contact" && (
        <ContactModal phone={phone} whatsapp={whatsapp} onClose={() => setModal(null)} />
      )}
      {modal === "message" && (
        <MessageModal phone={phone} listingTitle={listingTitle} isLoggedIn={isLoggedIn} onClose={() => setModal(null)} />
      )}
      {modal === "report" && (
        <ReportModal listingId={listingId} isLoggedIn={isLoggedIn} onClose={() => setModal(null)} />
      )}
      {modal === "review-gate" && (
        <ReviewGate onClose={() => setModal(null)} />
      )}
    </>
  )
}
