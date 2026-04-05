"use client"

export default function DangerZone() {
  return (
    <div style={{ marginTop: 40, padding: 20, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Danger Zone
      </h3>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => alert("Not implemented yet")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "#DC2626",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Suspend Account
        </button>
        <button
          onClick={() => alert("Not implemented yet")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "#7F1D1D",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
