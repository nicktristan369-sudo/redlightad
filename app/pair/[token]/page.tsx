"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"

const API = "/api/messenger/api"

type PairStatus = "waiting" | "scanning" | "connected" | "expired" | "error"

export default function PairPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<PairStatus>("waiting")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [remainingMs, setRemainingMs] = useState(300000)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll pair status
  useEffect(() => {
    if (!token) return

    async function poll() {
      try {
        const res = await fetch(`${API}/pair/${token}`)
        if (!res.ok) {
          if (res.status === 404) { setStatus("expired"); return }
          return
        }
        const data = await res.json()
        if (data.status === "connected") {
          setStatus("connected")
          return
        }
        if (data.error === "expired") {
          setStatus("expired")
          return
        }
        if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl)
        if (data.remainingMs !== undefined) setRemainingMs(data.remainingMs)
        if (data.status) setStatus(data.status as PairStatus)
      } catch { /* ignore */ }
    }

    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [token])

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setRemainingMs(prev => {
        if (prev <= 0) { setStatus("expired"); return 0 }
        return prev - 1000
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [])

  // WebSocket for live updates
  useEffect(() => {
    if (!token) return
    try {
      const ws = new WebSocket("ws://76.13.154.9:3001/ws")
      wsRef.current = ws
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          if (msg.type === "pair_qr_update" && msg.data?.token === token) {
            if (msg.data.qrDataUrl) setQrDataUrl(msg.data.qrDataUrl)
          }
          if (msg.type === "pair_connected" && msg.data?.token === token) {
            setStatus("connected")
          }
          if (msg.type === "qr_code") {
            // Also catch general QR broadcasts
            if (msg.data?.qr) setQrDataUrl(msg.data.qr)
          }
        } catch { /* ignore */ }
      }
    } catch { /* WS not available */ }
    return () => { wsRef.current?.close() }
  }, [token])

  // Auto-close on success
  useEffect(() => {
    if (status === "connected") {
      const t = setTimeout(() => { window.close() }, 5000)
      return () => clearTimeout(t)
    }
  }, [status])

  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)

  return (
    <div className="min-h-screen bg-[#0b141a] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#00a884] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/></svg>
          </div>
          <h1 className="text-xl font-bold">WhatsApp Pairing</h1>
          <p className="text-sm text-gray-500 mt-1">MessengerHub</p>
        </div>

        {/* Status: Waiting / QR */}
        {(status === "waiting" || status === "scanning") && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-6">
            {qrDataUrl ? (
              <div className="text-center">
                <div className="bg-white rounded-xl p-4 inline-block mb-4">
                  <img src={qrDataUrl} alt="QR Code" className="w-[280px] h-[280px]" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Scan QR-koden med WhatsApp</p>
                  <div className="text-xs text-gray-400 space-y-1.5">
                    <p>1. Åbn <span className="text-[#00a884] font-medium">WhatsApp</span> på din telefon</p>
                    <p>2. Tryk <span className="text-white font-medium">⋮ Menu</span> → <span className="text-white font-medium">Linkede enheder</span></p>
                    <p>3. Tryk <span className="text-white font-medium">Link en enhed</span></p>
                    <p>4. Scan denne QR-kode</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#2a3942]">
                    <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500">Venter på scanning... {minutes}:{seconds.toString().padStart(2, "0")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-3 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Genererer QR-kode...</p>
                <p className="text-xs text-gray-600 mt-1">Vent venligst</p>
              </div>
            )}
          </div>
        )}

        {/* Status: Connected */}
        {status === "connected" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-lg font-bold text-[#00a884]">Forbundet!</h2>
            <p className="text-sm text-gray-400 mt-2">WhatsApp er nu linked til MessengerHub</p>
            <p className="text-xs text-gray-600 mt-3">Denne side lukker automatisk...</p>
          </div>
        )}

        {/* Status: Expired */}
        {status === "expired" && (
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 className="text-lg font-bold text-red-400">Link udløbet</h2>
            <p className="text-sm text-gray-400 mt-2">Dette pairing-link er ikke længere gyldigt</p>
            <p className="text-xs text-gray-600 mt-3">Bed om et nyt link fra admin-panelet</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-700 mt-6">Sikker engangs-forbindelse • Udløber automatisk</p>
      </div>
    </div>
  )
}
