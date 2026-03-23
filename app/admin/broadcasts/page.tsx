"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import { Megaphone, Send, Eye, CheckCircle, XCircle, Users } from "lucide-react";

interface BroadcastHistory {
  id: string;
  subject: string;
  body: string;
  recipients_type: string;
  recipients_count: number;
  status: string;
  created_at: string;
}

type RecipientType = "all" | "providers" | "customers" | "country";

export default function AdminBroadcastsPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [country, setCountry] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then(r => r.json())
      .then(d => { setHistory(Array.isArray(d) ? d : []); setLoadingHistory(false); });
  }, []);

  // Estimate recipient count
  useEffect(() => {
    const estimate = async () => {
      const supabase = createClient();
      let q = supabase.from("profiles").select("id", { count: "exact", head: true }).not("email", "is", null);
      if (recipientType === "providers") q = q.eq("account_type", "provider");
      if (recipientType === "customers") q = q.eq("account_type", "customer");
      if (recipientType === "country" && country) q = q.eq("country", country);
      const { count } = await q;
      setRecipientCount(count ?? 0);
    };
    estimate();
  }, [recipientType, country]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send to ~${recipientCount} recipients? This cannot be undone.`)) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject, body,
          recipients_type: recipientType,
          recipients_filter: recipientType === "country" ? { country } : null,
        }),
      });
      const data = await res.json();
      if (data.error) setResult({ ok: false, msg: data.error });
      else {
        setResult({ ok: true, msg: `Sent to ${data.sent} recipients` });
        setSubject(""); setBody(""); setPreview(false);
        // Reload history
        fetch("/api/admin/broadcast").then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : []));
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    }
    setSending(false);
  };

  const RECIPIENT_TYPES: { key: RecipientType; label: string; desc: string }[] = [
    { key: "all",       label: "All Users",    desc: "Every registered user" },
    { key: "providers", label: "Providers",    desc: "Listing owners only" },
    { key: "customers", label: "Customers",    desc: "Buyers only" },
    { key: "country",   label: "By Country",   desc: "Filter by country" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Broadcasts</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Send email broadcasts to segmented users via Resend</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recipients */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <h2 className="text-[14px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={15} color="#6B7280" /> Recipients
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {RECIPIENT_TYPES.map(t => (
                <button key={t.key} onClick={() => setRecipientType(t.key)}
                  className="p-3 rounded-xl text-left transition-colors"
                  style={{
                    border: `1px solid ${recipientType === t.key ? "#000" : "#E5E5E5"}`,
                    background: recipientType === t.key ? "#000" : "transparent",
                  }}>
                  <p className="text-[12px] font-semibold" style={{ color: recipientType === t.key ? "#fff" : "#111" }}>{t.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: recipientType === t.key ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}>{t.desc}</p>
                </button>
              ))}
            </div>
            {recipientType === "country" && (
              <input value={country} onChange={e => setCountry(e.target.value)}
                placeholder="Country name (e.g. Denmark, Thailand)"
                className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none mt-2"
                style={{ border: "1px solid #E5E5E5" }} />
            )}
            {recipientCount !== null && (
              <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "#6B7280" }}>
                <Users size={12} />
                <span>Estimated recipients: <strong style={{ color: "#111" }}>{recipientCount.toLocaleString()}</strong></span>
              </div>
            )}
          </div>

          {/* Subject + Body */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <h2 className="text-[14px] font-semibold text-gray-900 mb-4">Email Content</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject…"
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "1px solid #E5E5E5" }} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Write your email message… (plain text, newlines supported)"
                  rows={10}
                  className="w-full text-[13px] px-3 py-3 rounded-lg outline-none resize-y"
                  style={{ border: "1px solid #E5E5E5" }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => setPreview(p => !p)} disabled={!subject || !body}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-lg disabled:opacity-40 transition-colors"
              style={{ border: "1px solid #E5E5E5", color: "#374151" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Eye size={14} /> {preview ? "Hide Preview" : "Preview"}
            </button>
            <button onClick={send} disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: "#000" }}
              onMouseEnter={e => { if (!sending) e.currentTarget.style.background = "#CC0000"; }}
              onMouseLeave={e => e.currentTarget.style.background = "#000"}>
              <Send size={14} />
              {sending ? "Sending…" : `Send to ${recipientCount ?? "?"} users`}
            </button>
          </div>

          {result && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px]"
              style={{ background: result.ok ? "#DCFCE7" : "#FEE2E2", color: result.ok ? "#14532D" : "#7F1D1D" }}>
              {result.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {result.msg}
            </div>
          )}

          {/* Preview */}
          {preview && subject && body && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <Eye size={13} color="#9CA3AF" />
                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Email Preview</span>
              </div>
              <div className="p-6" style={{ background: "#F5F5F7" }}>
                <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 12, padding: "32px", border: "1px solid #E5E5E5" }}>
                  <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #E5E5E5" }}>
                    <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 18 }}>
                      <span style={{ color: "#CC0000" }}>RED</span><span style={{ color: "#000" }}>LIGHTAD</span>
                    </span>
                  </div>
                  <h2 style={{ color: "#111", fontSize: 18, marginBottom: 16 }}>{subject}</h2>
                  <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{body}</div>
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #E5E5E5" }}>
                    <p style={{ color: "#9CA3AF", fontSize: 11 }}>
                      You received this email as a registered RedLightAD user.<br />
                      <a href="https://redlightad.com" style={{ color: "#9CA3AF" }}>redlightad.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Broadcast History */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5", height: "fit-content" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <Megaphone size={15} color="#6B7280" />
            <h2 className="text-[15px] font-semibold text-gray-900">History</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-gray-400">No broadcasts sent yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(b => (
                  <div key={b.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate flex-1">{b.subject}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: b.status === "sent" ? "#DCFCE7" : "#FEE2E2", color: b.status === "sent" ? "#14532D" : "#7F1D1D" }}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: "#9CA3AF" }}>
                      <span className="flex items-center gap-1"><Users size={10} /> {b.recipients_count}</span>
                      <span className="capitalize">{b.recipients_type}</span>
                      <span>{new Date(b.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
