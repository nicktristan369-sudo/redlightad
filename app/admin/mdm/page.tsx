"use client"

import { useState, useEffect, useRef } from "react"
import AdminLayout from "@/components/AdminLayout"
import { Smartphone, Wifi, ExternalLink, RefreshCw, ShieldAlert, CheckCircle } from "lucide-react"

const MDM_SERVER = "https://76.13.154.9:3000"

export default function MDMPage() {
  const [certAccepted, setCertAccepted] = useState(false)
  const [checking, setChecking]         = useState(true)
  const [deviceCount, setDeviceCount]   = useState<number | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check if cert is already trusted (server reachable)
  const checkServer = async () => {
    setChecking(true)
    try {
      const r = await fetch(MDM_SERVER + "/api/devices", { signal: AbortSignal.timeout(4000) })
      if (r.ok) {
        const data = await r.json()
        setDeviceCount(Array.isArray(data) ? data.length : 0)
        setCertAccepted(true)
      } else {
        setCertAccepted(false)
      }
    } catch {
      setCertAccepted(false)
    }
    setChecking(false)
  }

  useEffect(() => { checkServer() }, [])

  // Poll device count every 10s when connected
  useEffect(() => {
    if (!certAccepted) return
    const t = setInterval(async () => {
      try {
        const r = await fetch(MDM_SERVER + "/api/devices", { signal: AbortSignal.timeout(3000) })
        if (r.ok) { const d = await r.json(); setDeviceCount(Array.isArray(d) ? d.length : 0) }
      } catch {}
    }, 10000)
    return () => clearInterval(t)
  }, [certAccepted])

  const openCertPage = () => {
    window.open(MDM_SERVER, "_blank")
  }

  return (
    <AdminLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)", overflow: "hidden" }}>

        {/* ── Header bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#0a0b0e", borderBottom: "1px solid #1f2937", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#111827", border: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Smartphone size={16} color="#9ca3af" />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Phone<span style={{ color: "#00e5a0" }}>Control</span> — MDM
            </h1>
            <p style={{ fontSize: 11, color: "#4b5563", margin: 0, fontFamily: "monospace" }}>Mobile Device Management · {MDM_SERVER}</p>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {certAccepted && deviceCount !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", boxShadow: "0 0 6px #00e5a0" }} />
                <span style={{ fontSize: 11, color: "#00e5a0", fontFamily: "monospace", fontWeight: 600 }}>
                  {deviceCount} enhed{deviceCount !== 1 ? "er" : ""} online
                </span>
              </div>
            )}
            <button onClick={checkServer}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#111827", border: "1px solid #1f2937", borderRadius: 6, color: "#6b7280", fontSize: 11, cursor: "pointer" }}>
              <RefreshCw size={11} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
              Genopfrisk
            </button>
            <a href={MDM_SERVER} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#111827", border: "1px solid #1f2937", borderRadius: 6, color: "#6b7280", fontSize: 11, textDecoration: "none" }}>
              <ExternalLink size={11} /> Åbn direkte
            </a>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* ── Content ── */}
        {checking ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0e" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 36, border: "2px solid #1f2937", borderTopColor: "#00e5a0", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 13, color: "#4b5563", fontFamily: "monospace" }}>Forbinder til MDM server...</p>
            </div>
          </div>

        ) : !certAccepted ? (
          /* ── Cert not trusted yet ── */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0e" }}>
            <div style={{ maxWidth: 420, textAlign: "center", padding: "0 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "#111827", border: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <ShieldAlert size={28} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Certifikat ikke godkendt</h2>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7, margin: "0 0 24px" }}>
                MDM-serveren bruger et self-signed SSL-certifikat. Du skal godkende det én gang i din browser, derefter virker dashboardet automatisk.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={openCertPage}
                  style={{ padding: "12px 24px", background: "#00e5a0", color: "#000", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Åbn server og godkend certifikat →
                </button>
                <p style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>
                  Klik &quot;Avanceret&quot; → &quot;Fortsæt til {MDM_SERVER.replace("https://", "")} (usikkert)&quot;
                </p>
                <button onClick={checkServer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 24px", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, fontSize: 13, color: "#9ca3af", cursor: "pointer" }}>
                  <CheckCircle size={14} /> Jeg har godkendt — prøv igen
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ── Full embedded dashboard ── */
          <div style={{ flex: 1, position: "relative", background: "#0a0b0e" }}>
            <iframe
              ref={iframeRef}
              src={MDM_SERVER}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              allow="fullscreen"
              title="PhoneControl MDM Dashboard"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
