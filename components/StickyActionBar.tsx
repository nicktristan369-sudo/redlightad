"use client"

import { useState } from "react"
import { Phone, Star, MessageCircle, Flag, X, Send, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Sheet, ContactModal as SharedContactModal } from "@/components/ContactModal"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface Props {
  phone: string | null
  whatsapp: string | null
  listingId: string
  listingTitle: string
  isLoggedIn: boolean
  profileImage?: string | null
  name?: string
}

// Sheet re-exported from shared module (imported above)

// ── Login gate (shared) ───────────────────────────────────────────────────────
function LoginGate({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-3 pb-6 text-center space-y-4">
        <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
        <p className="text-[13px] text-gray-500">{body}</p>
        <Link href="/register" onClick={onClose}
          className="block w-full py-3 rounded-xl text-[14px] font-semibold text-white text-center"
          style={{ background: "#DC2626" }}>
          {t.sticky_create_free}
        </Link>
        <Link href="/login" onClick={onClose}
          className="block w-full py-3 rounded-xl text-[14px] font-semibold text-gray-700 bg-gray-100 text-center">
          {t.sticky_login}
        </Link>
      </div>
    </Sheet>
  )
}

// ContactModal imported from shared module as SharedContactModal
const ContactModal = SharedContactModal

// ── Message Modal — 2 valg ────────────────────────────────────────────────────
function MessageModal({
  phone, listingTitle, isLoggedIn, onClose,
}: { phone: string | null; listingTitle: string; isLoggedIn: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState("")
  const [sent, setSent] = useState(false)

  if (showForm) {
    return (
      <Sheet onClose={onClose}>
        <div className="px-6 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[17px] font-bold text-gray-900">{t.sticky_send_msg}</h3>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X size={15} color="#6B7280" />
            </button>
          </div>
          <p className="text-[12px] text-gray-500">{t.sticky_to} <strong className="text-gray-700">{listingTitle}</strong></p>
          {sent ? (
            <p className="text-[14px] text-green-600 font-semibold text-center py-6">{t.sticky_msg_sent}</p>
          ) : (
            <>
              <textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)}
                placeholder={t.sticky_write_msg}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] resize-none focus:outline-none focus:border-gray-400" />
              <button onClick={() => { setSent(true); setTimeout(onClose, 1500) }} disabled={!msg.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40"
                style={{ background: "#DC2626" }}>
                <Send size={15} /> {t.sticky_send_msg}
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
          <h3 className="text-[17px] font-bold text-gray-900">{t.sticky_contact_title} {listingTitle}</h3>
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
              <div>{t.sticky_send_sms}</div>
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
              <div>{t.sticky_platform_msg}</div>
              <div className="text-[11px] font-normal opacity-80 mt-0.5">{t.sticky_platform_anonymous}</div>
            </div>
          </button>
        ) : (
          <div className="rounded-xl border border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} color="#6B7280" />
              <div>
                <p className="text-[14px] font-semibold text-gray-700">{t.sticky_platform_msg}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{t.sticky_platform_anonymous}</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-500">{t.sticky_create_free}</p>
            <div className="flex gap-2">
              <Link href="/register" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white text-center"
                style={{ background: "#DC2626" }}>
                {t.sticky_create_account}
              </Link>
              <Link href="/login" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 bg-gray-100 text-center">
                {t.sticky_login}
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
  const { t } = useLanguage()
  const [reason, setReason] = useState("")
  const [sent, setSent] = useState(false)

  if (!isLoggedIn) {
    return (
      <LoginGate
        title={t.sticky_report_title}
        body={t.sticky_report_body}
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
          <h3 className="text-[17px] font-bold text-gray-900">{t.sticky_report_title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X size={15} color="#6B7280" />
          </button>
        </div>
        {sent ? (
          <p className="text-[14px] text-green-600 font-semibold text-center py-6">{t.sticky_report_received}</p>
        ) : (
          <>
            <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)}
              placeholder={t.sticky_describe_problem}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] resize-none focus:outline-none focus:border-gray-400" />
            <button onClick={submit} disabled={!reason.trim()}
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40"
              style={{ background: "#111" }}>
              {t.sticky_send_report}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Review gate ───────────────────────────────────────────────────────────────
function ReviewGate({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <LoginGate
      title={t.sticky_write_review}
      body={t.sticky_review_body}
      onClose={onClose}
    />
  )
}

function scrollToReviews() {
  const el = document.getElementById("reviews")
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
}

// ── Main component ────────────────────────────────────────────────────────────
type Modal = "contact" | "message" | "report" | "review-gate" | null

export default function StickyActionBar({ phone, whatsapp, listingId, listingTitle, isLoggedIn, profileImage, name }: Props) {
  const { t } = useLanguage()
  const [modal, setModal] = useState<Modal>(null)

  const handleReview = () => {
    if (!isLoggedIn) { setModal("review-gate"); return }
    scrollToReviews()
  }

  const buttons = [
    { icon: <Phone size={20} />,          label: t.sticky_contact, primary: true,  action: () => setModal("contact") },
    { icon: <Star size={20} />,           label: t.sticky_review,  primary: false, action: handleReview },
    { icon: <MessageCircle size={20} />,  label: t.sticky_message, primary: false, action: () => setModal("message") },
    { icon: <Flag size={20} />,           label: t.sticky_report,  primary: false, action: () => setModal("report") },
  ]

  return (
    <>
      {/* ── Sticky bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-stretch divide-x divide-gray-100">
          {buttons.map((btn, i) => (
            <button key={i} onClick={btn.action}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-70"
              style={{ background: btn.primary ? "#DC2626" : "#fff", color: btn.primary ? "#fff" : "#6B7280" }}>
              {btn.icon}
              <span className="text-[11px] font-semibold tracking-wide">{btn.label}</span>
            </button>
          ))}
        </div>
        <div className="bg-white" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>

      {/* ── Modals ── */}
      {modal === "contact" && (
        <ContactModal phone={phone} whatsapp={whatsapp} profileImage={profileImage} name={name} onClose={() => setModal(null)} />
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
