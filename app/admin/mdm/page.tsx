"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/AdminLayout"
import { Smartphone, Wifi, Terminal, ExternalLink, Copy, Check } from "lucide-react"

const MDM_URL = process.env.NEXT_PUBLIC_MDM_SERVER_URL || ""

export default function MDMPage() {
  const [serverUrl, setServerUrl] = useState(MDM_URL)
  const [inputUrl, setInputUrl] = useState(MDM_URL)
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [tab, setTab] = useState<"panel" | "setup">(MDM_URL ? "panel" : "setup")

  // Check if MDM server is reachable
  useEffect(() => {
    if (!serverUrl) return
    fetch(`${serverUrl}/api/devices`, { signal: AbortSignal.timeout(4000) })
      .then(r => r.ok ? setConnected(true) : setConnected(false))
      .catch(() => setConnected(false))
  }, [serverUrl])

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div style={{ position: "relative", background: "#0a0b0e", border: "1px solid #252a36", borderRadius: 8, padding: "12px 16px", marginTop: 8, marginBottom: 16 }}>
      <pre style={{ fontFamily: "monospace", fontSize: 12, color: "#c8cdd8", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{code}</pre>
      <button onClick={() => copy(code, id)}
        style={{ position: "absolute", top: 8, right: 8, background: "#181c24", border: "1px solid #252a36", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: copied === id ? "#00e5a0" : "#4a5060", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
        {copied === id ? <><Check size={11} /> Kopieret</> : <><Copy size={11} /> Kopier</>}
      </button>
    </div>
  )

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#111827", border: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Smartphone size={18} color="#9ca3af" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>MDM — Mobile Device Management</h1>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Fjernstyring af Android-enheder via ADB over netværk</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#22c55e" : "#374151", boxShadow: connected ? "0 0 6px #22c55e" : "none" }} />
            <span style={{ fontSize: 12, color: connected ? "#22c55e" : "#6b7280", fontFamily: "monospace" }}>
              {connected ? "Server online" : serverUrl ? "Server ikke nået" : "Ikke konfigureret"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1f2937", marginTop: 16 }}>
          {[["panel", "📱 Kontrolpanel"], ["setup", "⚙️ Opsætning"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as "panel" | "setup")}
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "none", borderBottom: tab === key ? "2px solid #DC2626" : "2px solid transparent", background: "transparent", color: tab === key ? "#fff" : "#6b7280", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Server URL config bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, padding: "10px 14px", background: "#111", border: "1px solid #1f2937", borderRadius: 10 }}>
        <Wifi size={14} color="#6b7280" />
        <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", whiteSpace: "nowrap" }}>MDM SERVER URL</span>
        <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
          placeholder="http://din-server-ip:3000"
          style={{ flex: 1, background: "#0a0b0e", border: "1px solid #252a36", borderRadius: 6, padding: "6px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, outline: "none" }} />
        <button onClick={() => setServerUrl(inputUrl)}
          style={{ padding: "6px 14px", background: "#DC2626", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          Forbind
        </button>
        {serverUrl && (
          <a href={serverUrl} target="_blank" rel="noreferrer"
            style={{ padding: "6px 10px", background: "#1f2937", border: "1px solid #374151", borderRadius: 6, color: "#9ca3af", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <ExternalLink size={12} /> Åbn direkte
          </a>
        )}
      </div>

      {/* ── PANEL TAB ── */}
      {tab === "panel" && (
        <>
          {!serverUrl ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#4b5563" }}>
              <Smartphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ingen server konfigureret</p>
              <p style={{ fontSize: 13 }}>Gå til <strong style={{ color: "#9ca3af" }}>⚙️ Opsætning</strong> for at installere MDM-serveren</p>
            </div>
          ) : !connected ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#4b5563" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #374151", borderTopColor: "#DC2626", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Kan ikke nå serveren</p>
              <p style={{ fontSize: 13 }}>Tjek at MDM-serveren kører på <code style={{ color: "#9ca3af" }}>{serverUrl}</code></p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            /* Full-height iframe til MDM kontrolpanel */
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1f2937", height: "calc(100vh - 260px)" }}>
              <iframe
                src={serverUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allow="fullscreen"
                title="MDM PhoneControl"
              />
            </div>
          )}
        </>
      )}

      {/* ── SETUP TAB ── */}
      {tab === "setup" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Hvad er MDM */}
          <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Terminal size={16} color="#DC2626" /> Hvad er MDM?
            </h2>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7 }}>
              MDM-serveren er et separat Node.js-program der kører på en VPS eller Raspberry Pi.
              Den forbinder til Android-telefoner via ADB over WiFi og streamer skærmbilledet live.
              Du kan derefter fjernstyre telefonerne direkte fra dette admin panel.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
              {[["ADB over WiFi", "Forbinder til telefoner over netværk — ingen USB"],
                ["MJPEG Stream", "Live skærmvisning via ffmpeg transcode"],
                ["Touch/Keyboard", "Tap, swipe, tekst og hardwareknapper"]].map(([title, desc]) => (
                <div key={title} style={{ background: "#0a0b0e", borderRadius: 8, padding: "10px 12px", border: "1px solid #252a36" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trin 1: Server */}
          <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              <span style={{ color: "#DC2626" }}>1.</span> Installer MDM-serveren på din VPS
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Ubuntu/Debian anbefales (DigitalOcean, Hetzner, Linode)</p>
            <CodeBlock id="install" code={`# Installer afhængigheder
sudo apt update
sudo apt install -y android-tools-adb ffmpeg nodejs npm git

# Klon repo og gå til MDM-mappen
git clone https://github.com/nicktristan369-sudo/redlightad.git
cd redlightad/mdm-server

# Installer Node-pakker og start
npm install
npm start
# → Åbn http://DIN-SERVER-IP:3000`} />
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Eller upload <code style={{ color: "#9ca3af" }}>mdm-server/</code> mappen manuelt til serveren via SFTP.
            </p>
          </div>

          {/* Trin 2: Telefoner */}
          <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              <span style={{ color: "#DC2626" }}>2.</span> Aktiver ADB over WiFi på telefonerne
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>Gøres én gang per telefon. Android 11+:</p>
            <ol style={{ fontSize: 12, color: "#9ca3af", lineHeight: 2, paddingLeft: 18, marginBottom: 8 }}>
              <li>Indstillinger → Om telefonen → tryk 7× på "Buildnummer"</li>
              <li>Udviklermuligheder → aktiver "Trådløs fejlretning"</li>
              <li>Tryk på "Trådløs fejlretning" → "Par enhed med parringskode"</li>
              <li>Kør disse kommandoer på serveren:</li>
            </ol>
            <CodeBlock id="pair" code={`# Par telefonen (brug IP og port fra telefonen)
adb pair <TELEFON-IP>:<PARRINGSPORT>
# Indtast parringskoden

# Tilslut permanent
adb connect <TELEFON-IP>:5555`} />
          </div>

          {/* Trin 3: Internet adgang */}
          <div style={{ background: "#111", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              <span style={{ color: "#DC2626" }}>3.</span> Gør tilgængeligt over internet
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Anbefalet: SSH-tunnel fra en Raspberry Pi/PC i Danmark til serveren</p>
            <CodeBlock id="tunnel" code={`# Kør på Raspberry Pi / PC i Danmark (én tunnel per telefon)
ssh -R 5555:localhost:5555 bruger@DIN-SERVER-IP -N -f
ssh -R 5556:localhost:5556 bruger@DIN-SERVER-IP -N -f

# Tilslut derefter i MDM-panelet med:
# IP: 127.0.0.1  Port: 5555`} />
          </div>

          {/* Trin 4: Forbind her */}
          <div style={{ background: "#111", border: "1px solid #DC2626", borderRadius: 12, padding: "20px 24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              <span style={{ color: "#DC2626" }}>4.</span> Forbind MDM-serveren til admin panel
            </h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
              Når serveren kører, indsæt URL&apos;en øverst på siden og klik &quot;Forbind&quot;. Skift til &quot;📱 Kontrolpanel&quot; for at styre telefonerne.
            </p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              For permanent konfiguration: tilføj <code style={{ color: "#9ca3af" }}>NEXT_PUBLIC_MDM_SERVER_URL=http://din-server:3000</code> til Vercel environment variables.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
