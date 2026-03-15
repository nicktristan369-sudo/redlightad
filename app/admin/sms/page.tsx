"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import { MessageCircle, Send, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface SmsLog {
  id: string;
  phone_number: string;
  message: string;
  status: string;
  direction: string;
  recipients: number;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const MAX_SMS = 160;

export default function AdminSmsPage() {
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"single" | "broadcast">("single");
  const [phone, setPhone] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "providers" | "customers">("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    // Check if Twilio configured by trying the endpoint
    fetch("/api/admin/sms", { method: "GET" }).then(r => {
      setTwilioOk(r.ok);
      if (r.ok) r.json().then(d => setLogs(Array.isArray(d) ? d : []));
      setLoadingLogs(false);
    });
  }, []);

  const searchUsers = async (q: string) => {
    setSearchUser(q);
    if (q.length < 2) { setFoundUsers([]); return; }
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id, full_name, email").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(8);
    setFoundUsers(data ?? []);
  };

  const sendSms = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);

    let body: Record<string, unknown>;
    if (mode === "single") {
      if (!phone && !selectedUser) { setSending(false); return; }
      body = { to_phone: phone || "+unknown", message, to_user_id: selectedUser?.id ?? null };
    } else {
      // For broadcast: we'd need phone numbers from profiles — stub for now
      const supabase = createClient();
      let q = supabase.from("profiles").select("id", { count: "exact", head: true }).not("email", "is", null);
      if (broadcastTarget !== "all") q = q.eq("account_type", broadcastTarget);
      const { count } = await q;
      body = { to_phone: ["+15555555555"], message, is_broadcast: true, recipient_count: count ?? 0 };
    }

    try {
      const res = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) setResult({ ok: false, msg: data.error });
      else setResult({ ok: true, msg: `SMS sent successfully` });
      setMessage("");
      setPhone("");
      setSelectedUser(null);
      // Reload logs
      fetch("/api/admin/sms").then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : []));
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    }
    setSending(false);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">SMS Center</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Send SMS via Twilio — sender: REDLIGHTAD</p>
      </div>

      {/* Twilio not configured banner */}
      {twilioOk === false && (
        <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-xl"
          style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
          <AlertCircle size={16} color="#92400E" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-900">Twilio not configured</p>
            <p className="text-[12px] text-amber-700 mt-0.5">
              Add these environment variables to Vercel to enable SMS:
            </p>
            <ul className="mt-2 space-y-0.5">
              {["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"].map(v => (
                <li key={v} className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-amber-100 rounded inline-block mr-1" style={{ color: "#92400E" }}>{v}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send form */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Compose SMS</h2>

          {/* Mode toggle */}
          <div className="flex gap-0.5 p-1 rounded-lg mb-4" style={{ background: "#F3F4F6" }}>
            {(["single", "broadcast"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 text-[12px] font-semibold rounded-md capitalize transition-colors"
                style={{ background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111" : "#6B7280" }}>
                {m === "single" ? "Single User" : "Broadcast"}
              </button>
            ))}
          </div>

          {mode === "single" ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Search User</label>
                <input value={searchUser} onChange={e => searchUsers(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "1px solid #E5E5E5" }} />
                {foundUsers.length > 0 && (
                  <div className="mt-1 bg-white rounded-lg shadow-lg overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
                    {foundUsers.map(u => (
                      <button key={u.id} onClick={() => { setSelectedUser(u); setFoundUsers([]); setSearchUser(u.full_name ?? u.email ?? ""); }}
                        className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-gray-900">{u.full_name ?? "—"}</span>
                        <span className="text-gray-400 ml-2">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+45 XX XX XX XX"
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none font-mono"
                  style={{ border: "1px solid #E5E5E5" }} />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="text-[12px] font-semibold text-gray-700 block mb-2">Recipients</label>
              <div className="flex gap-2">
                {(["all", "providers", "customers"] as const).map(t => (
                  <button key={t} onClick={() => setBroadcastTarget(t)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg capitalize transition-colors"
                    style={{
                      background: broadcastTarget === t ? "#000" : "#F3F4F6",
                      color: broadcastTarget === t ? "#fff" : "#6B7280",
                    }}>
                    <Users size={12} /> {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-semibold text-gray-700">Message</label>
              <span className="text-[11px]" style={{ color: message.length > MAX_SMS ? "#CC0000" : "#9CA3AF" }}>
                {message.length}/{MAX_SMS}
              </span>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Write your SMS message…"
              rows={4} maxLength={MAX_SMS}
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none"
              style={{ border: `1px solid ${message.length >= MAX_SMS ? "#CC0000" : "#E5E5E5"}` }} />
          </div>

          {result && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-[12px]"
              style={{ background: result.ok ? "#DCFCE7" : "#FEE2E2", color: result.ok ? "#14532D" : "#7F1D1D" }}>
              {result.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {result.msg}
            </div>
          )}

          <button onClick={sendSms} disabled={sending || !message.trim() || twilioOk === false}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
            style={{ background: "#000" }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = "#CC0000"; }}
            onMouseLeave={e => e.currentTarget.style.background = "#000"}>
            <Send size={14} />
            {sending ? "Sending…" : mode === "broadcast" ? "Send Broadcast SMS" : "Send SMS"}
          </button>
        </div>

        {/* SMS History */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <MessageCircle size={15} color="#6B7280" />
            <h2 className="text-[15px] font-semibold text-gray-900">SMS History</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-gray-400">No SMS sent yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map(l => (
                  <div key={l.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: l.direction === "broadcast" ? "#2563EB" : "#6B7280" }}>
                            {l.direction === "broadcast" ? `Broadcast (${l.recipients})` : l.phone_number}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: l.status === "sent" ? "#DCFCE7" : "#FEE2E2", color: l.status === "sent" ? "#14532D" : "#7F1D1D" }}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-600 truncate">{l.message}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {new Date(l.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
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
