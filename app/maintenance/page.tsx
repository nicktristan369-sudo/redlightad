export default function MaintenancePage() {
  return (
    <html lang="da">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 480 }}>
          {/* Logo / brand */}
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.25em", color: "#DC2626", textTransform: "uppercase" }}>
              REDLIGHTAD
            </span>
          </div>

          {/* Icon */}
          <div style={{ marginBottom: 28 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Vi er tilbage snart
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>
            Siden er midlertidigt nede for vedligeholdelse.<br />Vi er tilbage inden længe.
          </p>
        </div>
      </body>
    </html>
  )
}
