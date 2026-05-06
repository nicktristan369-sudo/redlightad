"use client"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"

const API = "/api/messenger/api"
type Step = "form" | "qr" | "code" | "done" | "expired"

function isMobile() {
  if (typeof window === "undefined") return false
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [accountId, setAccountId] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setMobile(isMobile()) }, [])

  // Check invite validity on mount
  useEffect(() => {
    if (!token) return
    fetch(`${API}/pair/invite/${token}`).then(r => {
      if (r.status === 404) setStep("expired")
      else r.json().then(d => {
        if (d.status === "connected") setStep("done")
        else if (d.pairingCode) { setAccountId(d.accountId); setPairingCode(d.pairingCode); setStep("code") }
        else if (d.accountId) { setAccountId(d.accountId); setStep("qr"); if (d.qrDataUrl) setQrDataUrl(d.qrDataUrl) }
      })
    }).catch(() => {})
  }, [token])

  // WebSocket
  useEffect(() => {
    if (!token || step === "done" || step === "expired" || step === "form") return
    try {
      const ws = new WebSocket("ws://76.13.154.9:3001/ws")
      wsRef.current = ws
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          if (msg.type === "invite_qr_update" && msg.data?.token === token && msg.data.qrDataUrl) setQrDataUrl(msg.data.qrDataUrl)
          if (msg.type === "invite_connected" && msg.data?.token === token) setStep("done")
          if (msg.type === "invite_pairing_code" && msg.data?.token === token) setPairingCode(msg.data.code)
          if (msg.type === "qr_code" && msg.data?.qr) setQrDataUrl(msg.data.qr)
        } catch {}
      }
    } catch {}
    return () => { wsRef.current?.close() }
  }, [token, step])

  // Poll status
  useEffect(() => {
    if (step !== "qr" && step !== "code") return
    if (!token) return
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/pair/invite/${token}`)
        if (!r.ok) { if (r.status === 404) setStep("expired"); return }
        const d = await r.json()
        if (d.status === "connected") setStep("done")
        if (d.qrDataUrl && !qrDataUrl) setQrDataUrl(d.qrDataUrl)
        if (d.pairingCode && !pairingCode) setPairingCode(d.pairingCode)
      } catch {}
    }, 2500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, token])

  async function handleSetup() {
    if (!name.trim()) { setError("Indtast et navn"); return }
    setLoading(true); setError("")
    try {
      // Step 1: Create account + start session
      const r = await fetch(`${API}/pair/invite/${token}/setup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone_number: phone.trim() || null })
      })
      if (!r.ok) { const d = await r.json(); setError(d.error === "expired" ? "Link udløbet" : d.error || "Fejl"); setLoading(false); return }
      const d = await r.json()
      setAccountId(d.accountId)

      // If mobile + phone number provided, request pairing code
      if (mobile && phone.trim()) {
        // Wait a moment for session to initialize puppeteer
        await new Promise(r => setTimeout(r, 5000))
        try {
          const cr = await fetch(`${API}/pair/invite/${token}/pairing-code`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: phone.trim() })
          })
          if (cr.ok) {
            const cd = await cr.json()
            setPairingCode(cd.code)
            setStep("code")
            setLoading(false)
            return
          }
        } catch {}
        // Fallback to QR if pairing code fails
      }

      setStep("qr")
    } catch { setError("Netværksfejl") }
    setLoading(false)
  }

  // Format pairing code as "XXXX-XXXX"
  const formattedCode = pairingCode ? pairingCode.replace(/(.{4})/g, "$1-").replace(/-$/, "") : ""

  return (
    <div className="min-h-screen bg-[#0b141a] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#00a884] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/></svg>
          </div>
          <h1 className="text-xl font-bold">WhatsApp Forbindelse</h1>
          <p className="text-sm text-gray-500 mt-1">MessengerHub</p>
        </div>

        {/* Step 1: Form */}
        {step === "form" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Konto Navn *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dit navn eller firmanavn"
                className="w-full px-4 py-3 bg-[#1f2c34] border border-[#2a3942] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]"
                onKeyDown={e => { if (e.key === "Enter" && phone) handleSetup() }} autoFocus />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Telefonnummer {mobile ? "*" : "(valgfrit)"}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+45 12 34 56 78"
                className="w-full px-4 py-3 bg-[#1f2c34] border border-[#2a3942] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]"
                onKeyDown={e => { if (e.key === "Enter") handleSetup() }} />
              {mobile && <p className="text-xs text-[#00a884] mt-1.5">📱 Du får en kode du taster ind i WhatsApp</p>}
              {!mobile && <p className="text-xs text-gray-600 mt-1.5">💻 Du scanner en QR-kode med din telefon</p>}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button onClick={handleSetup} disabled={loading || !name.trim() || (mobile && !phone.trim())}
              className="w-full py-3 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {mobile ? "Henter kode..." : "Starter..."}</> : "Forbind →"}
            </button>
          </div>
        )}

        {/* Step: Pairing Code (mobile) */}
        {step === "code" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 text-center">
            <div className="mb-5">
              <p className="text-sm text-gray-400 mb-4">Indtast denne kode i WhatsApp</p>
              <div className="bg-[#1f2c34] rounded-2xl py-6 px-4 mb-4">
                <p className="text-4xl font-mono font-bold tracking-[0.3em] text-white">{formattedCode || "..."}</p>
              </div>
            </div>
            <div className="text-left space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold mt-0.5">1</span>
                <p className="text-sm text-gray-300">Åbn <span className="text-[#00a884] font-medium">WhatsApp</span> på denne telefon</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold mt-0.5">2</span>
                <p className="text-sm text-gray-300">Tryk <span className="text-white font-medium">⋮ Indstillinger</span> → <span className="text-white font-medium">Linkede enheder</span></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold mt-0.5">3</span>
                <p className="text-sm text-gray-300">Tryk <span className="text-white font-medium">Link en enhed</span></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold mt-0.5">4</span>
                <p className="text-sm text-gray-300">Tryk <span className="text-white font-medium">&quot;Link med telefonnummer&quot;</span> i bunden</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold mt-0.5">5</span>
                <p className="text-sm text-gray-300">Indtast koden <span className="text-white font-bold font-mono">{formattedCode}</span></p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#2a3942]">
              <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Venter på bekræftelse...</span>
            </div>
          </div>
        )}

        {/* Step: QR (desktop) */}
        {step === "qr" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 text-center">
            {qrDataUrl ? (
              <>
                <div className="bg-white rounded-xl p-4 inline-block mb-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-[280px] h-[280px]" />
                </div>
                <p className="text-sm font-medium mb-3">Scan QR-koden med WhatsApp</p>
                <div className="text-xs text-gray-400 space-y-1.5 text-left max-w-[280px] mx-auto">
                  <p>1. Åbn <span className="text-[#00a884] font-medium">WhatsApp</span> på din telefon</p>
                  <p>2. Tryk <span className="text-white font-medium">⋮ Menu</span> → <span className="text-white font-medium">Linkede enheder</span></p>
                  <p>3. Tryk <span className="text-white font-medium">Link en enhed</span></p>
                  <p>4. Scan QR-koden</p>
                </div>

                {/* Switch to code option */}
                <button onClick={async () => {
                  if (!phone.trim()) return
                  try {
                    const r = await fetch(`${API}/pair/invite/${token}/pairing-code`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phone_number: phone.trim() })
                    })
                    if (r.ok) { const d = await r.json(); setPairingCode(d.code); setStep("code") }
                  } catch {}
                }} className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline">
                  Kan ikke scanne? Brug kode i stedet
                </button>

                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[#2a3942]">
                  <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Venter på scanning...</span>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="w-10 h-10 mx-auto mb-3 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Starter WhatsApp session...</p>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-lg font-bold text-[#00a884]">Forbundet!</h2>
            <p className="text-sm text-gray-400 mt-2">Din WhatsApp er nu forbundet til MessengerHub</p>
            <p className="text-xs text-gray-600 mt-3">Du kan lukke denne side</p>
          </div>
        )}

        {/* Expired */}
        {step === "expired" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 className="text-lg font-bold text-red-400">Link udløbet</h2>
            <p className="text-sm text-gray-400 mt-2">Bed om et nyt invite-link</p>
          </div>
        )}

        <p className="text-center text-[10px] text-gray-700 mt-6">Sikker engangs-forbindelse • Udløber efter 24 timer</p>
      </div>
    </div>
  )
}
