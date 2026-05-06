"use client"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"

const API = "/api/messenger/api"
type Step = "start" | "instructions" | "done" | "expired"

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>("start")
  const [error, setError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check validity on mount
  useEffect(() => {
    if (!token) return
    fetch(`${API}/pair/invite/${token}`).then(r => {
      if (r.status === 404) setStep("expired")
      else r.json().then(d => { if (d.status === "connected") setStep("done") })
    }).catch(() => {})
  }, [token])

  // Poll for connected status when on instructions step
  useEffect(() => {
    if (step !== "instructions" || !token) return
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/pair/invite/${token}`)
        if (!r.ok) return
        const d = await r.json()
        if (d.status === "connected") setStep("done")
      } catch {}
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, token])

  return (
    <div className="min-h-screen bg-[#0b141a] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#00a884] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/></svg>
          </div>
          <h1 className="text-xl font-bold">WhatsApp Forbindelse</h1>
        </div>

        {/* Start */}
        {step === "start" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-300 mb-5">Du er blevet inviteret til at forbinde din WhatsApp</p>
            <button onClick={() => setStep("instructions")}
              className="w-full py-3 bg-[#00a884] hover:bg-[#00c49a] text-white font-medium rounded-xl">
              Forbind min WhatsApp →
            </button>
          </div>
        )}

        {/* Instructions */}
        {step === "instructions" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6">
            <p className="text-sm font-medium text-center mb-5">Følg disse trin:</p>
            <div className="space-y-4 mb-5">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold">1</span>
                <p className="text-sm text-gray-300 pt-0.5">Åbn <span className="text-[#00a884] font-medium">WhatsApp</span> på din telefon</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold">2</span>
                <p className="text-sm text-gray-300 pt-0.5">Gå til <span className="text-white font-medium">Indstillinger</span> → <span className="text-white font-medium">Linkede enheder</span></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold">3</span>
                <p className="text-sm text-gray-300 pt-0.5">Tryk <span className="text-white font-medium">Link en enhed</span></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold">4</span>
                <p className="text-sm text-gray-300 pt-0.5">Tryk <span className="text-white font-medium">&quot;Link med telefonnummer&quot;</span> i bunden</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-[#00a884]/20 rounded-full flex items-center justify-center shrink-0 text-xs text-[#00a884] font-bold">5</span>
                <p className="text-sm text-gray-300 pt-0.5">Du får en <span className="text-white font-medium">8-cifret kode</span> — send den til den der inviterede dig</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#2a3942]">
              <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Venter på forbindelse...</span>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-lg font-bold text-[#00a884]">Forbundet!</h2>
            <p className="text-sm text-gray-400 mt-2">Din WhatsApp er nu forbundet</p>
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
            <p className="text-sm text-gray-400 mt-2">Bed om et nyt link</p>
          </div>
        )}
      </div>
    </div>
  )
}
