"use client"
import { useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Mail, MessageSquare, Clock, CheckCircle } from "lucide-react"

const SUBJECTS = [
  "General Inquiry",
  "Advertising Help",
  "REDLIGHTCAM Support",
  "Payment Issue",
  "Account Problem",
  "Report a User",
  "Press & Media",
  "Other",
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all fields.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || "Something went wrong."); setSubmitting(false); return }
      setSent(true)
    } catch { setError("Network error. Please try again.") }
    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", border: "1px solid #E5E7EB",
    borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#111",
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#FAFAFA" }}>
        {/* Hero */}
        <div style={{ background: "#111", padding: "60px 16px 48px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Contact <span style={{ color: "#DC2626" }}>Us</span>
            </h1>
            <p style={{ fontSize: 16, color: "#9CA3AF", margin: 0 }}>We typically respond within 24 hours</p>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 16px 80px" }}>
          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { icon: <Mail size={20} color="#DC2626" />, title: "Email", desc: "contact@redlightad.com" },
              { icon: <MessageSquare size={20} color="#DC2626" />, title: "Support", desc: "Use the form below" },
              { icon: <Clock size={20} color="#DC2626" />, title: "Response time", desc: "Within 24 hours" },
            ].map(item => (
              <div key={item.title} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {sent ? (
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "72px 32px", textAlign: "center" }}>
              <CheckCircle size={52} color="#16A34A" style={{ margin: "0 auto 16px", display: "block" }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>Message sent!</h2>
              <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Thank you for reaching out. We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "36px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 24px" }}>Send us a message</h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Your name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="First Last" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email address *</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Subject *</label>
                <select style={{ ...inputStyle, color: form.subject ? "#111" : "#9CA3AF" }} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Message *</label>
                <textarea rows={6} style={{ ...inputStyle, resize: "vertical" }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your question or issue in detail..." />
              </div>

              {error && <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 16 }}>{error}</p>}

              <button type="submit" disabled={submitting}
                style={{ padding: "13px 32px", background: "#111", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
