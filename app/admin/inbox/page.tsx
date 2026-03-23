"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Mail, MailOpen, Reply, Tag, Search, RefreshCw } from "lucide-react";

interface InboxMessage {
  id: string;
  from_name: string | null;
  from_email: string | null;
  subject: string | null;
  message: string;
  category: string;
  is_read: boolean;
  replied: boolean;
  reply_body: string | null;
  replied_at: string | null;
  created_at: string;
}

type Tab = "all" | "support" | "report" | "payment" | "other";
const CATEGORIES: { key: Tab; label: string; color: string }[] = [
  { key: "all",     label: "All",     color: "#6B7280" },
  { key: "support", label: "Support", color: "#2563EB" },
  { key: "report",  label: "Report",  color: "#DC2626" },
  { key: "payment", label: "Payment", color: "#C9A84C" },
  { key: "other",   label: "Other",   color: "#6B7280" },
];

export default function AdminInboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/inbox");
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await fetch("/api/admin/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_read: true }),
    });
    setMessages(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    await fetch("/api/admin/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, reply_body: replyText }),
    });
    setMessages(p => p.map(m => m.id === selected.id ? { ...m, replied: true, reply_body: replyText } : m));
    setSelected(s => s ? { ...s, replied: true, reply_body: replyText } : s);
    setReplyText("");
    setShowReply(false);
    setReplying(false);
  };

  const q = search.toLowerCase();
  const base = tab === "all" ? messages : messages.filter(m => m.category === tab);
  const filtered = base.filter(m =>
    !q || m.from_email?.toLowerCase().includes(q) || m.from_name?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
  );

  const unreadCount = messages.filter(m => !m.is_read).length;

  const catColor = (cat: string) => CATEGORIES.find(c => c.key === cat)?.color ?? "#6B7280";

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Inbox</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Messages to contact@redlightad.com
              {unreadCount > 0 && <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#CC0000", color: "#fff" }}>{unreadCount} unread</span>}
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-lg transition-colors" style={{ border: "1px solid #E5E5E5" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <RefreshCw size={14} color="#6B7280" />
          </button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left: message list */}
          <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl overflow-hidden"
            style={{ border: "1px solid #E5E5E5" }}>

            {/* Search + tabs */}
            <div className="p-3 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2"
                style={{ border: "1px solid #F3F4F6" }}>
                <Search size={12} color="#9CA3AF" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
              </div>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setTab(c.key)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                    style={{
                      background: tab === c.key ? c.color : "#F3F4F6",
                      color: tab === c.key ? "#fff" : "#6B7280",
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-gray-400">No messages</div>
              ) : filtered.map(m => (
                <button key={m.id} onClick={() => { setSelected(m); markRead(m.id); setShowReply(false); setReplyText(""); }}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{
                    background: selected?.id === m.id ? "#F5F5F7" : m.is_read ? "transparent" : "rgba(204,0,0,0.03)",
                  }}
                  onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.background = "#FAFAFA"; }}
                  onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.background = m.is_read ? "transparent" : "rgba(204,0,0,0.03)"; }}>
                  <div className="flex items-center gap-2 mb-1">
                    {m.is_read
                      ? <MailOpen size={12} color="#9CA3AF" className="flex-shrink-0" />
                      : <Mail size={12} color="#CC0000" className="flex-shrink-0" />}
                    <span className={`text-[12px] truncate flex-1 ${m.is_read ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                      {m.from_name ?? m.from_email ?? "Anonymous"}
                    </span>
                    <span className="text-[10px] flex-shrink-0"
                      style={{ color: "#9CA3AF" }}>
                      {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{m.subject ?? "(no subject)"}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{m.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Tag size={9} color={catColor(m.category)} />
                    <span className="text-[10px] capitalize" style={{ color: catColor(m.category) }}>{m.category}</span>
                    {m.replied && <span className="ml-2 text-[10px] text-green-600">Replied</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: message detail */}
          <div className="flex-1 bg-white rounded-xl overflow-hidden flex flex-col"
            style={{ border: "1px solid #E5E5E5" }}>
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-[14px] text-gray-400">
                <div className="text-center">
                  <Mail size={32} color="#E5E5E5" className="mx-auto mb-3" />
                  <p>Select a message to read</p>
                </div>
              </div>
            ) : (
              <>
                {/* Message header */}
                <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[17px] font-bold text-gray-900">{selected.subject ?? "(no subject)"}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[12px] text-gray-600">{selected.from_name ?? "—"}</span>
                        {selected.from_email && (
                          <a href={`mailto:${selected.from_email}`}
                            className="text-[12px] underline" style={{ color: "#6B7280" }}>
                            &lt;{selected.from_email}&gt;
                          </a>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                          style={{ background: "#F3F4F6", color: catColor(selected.category) }}>
                          {selected.category}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>
                        {new Date(selected.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => setShowReply(r => !r)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg transition-colors flex-shrink-0"
                      style={{ background: showReply ? "#000" : "#F3F4F6", color: showReply ? "#fff" : "#374151" }}>
                      <Reply size={13} /> Reply
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.message}</p>

                  {selected.reply_body && (
                    <div className="mt-6 p-4 rounded-xl" style={{ background: "#F5F5F7", border: "1px solid #E5E5E5" }}>
                      <p className="text-[11px] font-semibold text-green-700 mb-2">
                        Replied {selected.replied_at ? new Date(selected.replied_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
                      </p>
                      <p className="text-[13px] text-gray-600 whitespace-pre-wrap">{selected.reply_body}</p>
                    </div>
                  )}
                </div>

                {/* Reply box */}
                {showReply && (
                  <div className="flex-shrink-0 px-6 pb-5" style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px" }}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selected.from_email ?? "sender"}…`}
                      rows={4}
                      className="w-full text-[13px] px-4 py-3 rounded-xl outline-none resize-none"
                      style={{ border: "1px solid #E5E5E5", background: "#FAFAFA" }}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setShowReply(false)}
                        className="px-4 py-2 text-[12px] font-medium rounded-lg"
                        style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Cancel</button>
                      <button onClick={sendReply} disabled={replying || !replyText.trim()}
                        className="px-4 py-2 text-[12px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                        style={{ background: "#000" }}
                        onMouseEnter={e => { if (!replying && replyText.trim()) e.currentTarget.style.background = "#CC0000"; }}
                        onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                        {replying ? "Sending…" : "Send Reply"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
