"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  document_url: string | null;
  selfie_url: string | null;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

type Tab = "pending" | "approved" | "rejected" | "all";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#DCFCE7", color: "#14532D" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D" },
};

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient()
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
    setPage(1);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab]);

  const approve = async (id: string) => {
    setBusy(id);
    await createClient().rpc("admin_update_verification", { p_id: id, p_status: "approved" });
    setRequests(p => p.map(r => r.id === id ? { ...r, status: "approved" as const } : r));
    setBusy(null);
  };

  const reject = async () => {
    if (!rejectId) return;
    setBusy(rejectId);
    await createClient().rpc("admin_update_verification", { p_id: rejectId, p_status: "rejected", p_note: rejectNote || null });
    setRequests(p => p.map(r => r.id === rejectId ? { ...r, status: "rejected" as const, note: rejectNote } : r));
    setBusy(null);
    setRejectId(null);
    setRejectNote("");
  };

  const counts = {
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    all:      requests.length,
  };

  const base = tab === "all" ? requests : requests.filter(r => r.status === tab);
  const pages = Math.max(1, Math.ceil(base.length / PAGE_SIZE));
  const paged = base.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <AdminLayout>
      {/* Document preview modal */}
      {docPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setDocPreview(null)}>
          <div className="relative max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={docPreview} alt="Document" className="w-full rounded-xl object-contain max-h-[80vh]" /> {/* eslint-disable-line @next/next/no-img-element */}
            <button onClick={() => setDocPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-[14px]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1">Reject verification</h3>
            <p className="text-[13px] text-gray-500 mb-4">The user will be notified. Add a reason (optional).</p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection…"
              rows={3}
              className="w-full text-[13px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{ border: "1px solid #E5E5E5" }} />
            <div className="flex gap-2 mt-4">
              <button onClick={reject} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>Confirm Reject</button>
              <button onClick={() => { setRejectId(null); setRejectNote(""); }}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Verification</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Review ID verification requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending", count: counts.pending, color: "#92400E", bg: "#FEF3C7" },
          { label: "Approved", count: counts.approved, color: "#14532D", bg: "#DCFCE7" },
          { label: "Rejected", count: counts.rejected, color: "#7F1D1D", bg: "#FEE2E2" },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{s.label}</p>
            <p className="text-[28px] font-bold mt-1 leading-none" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-lg w-fit mb-5" style={{ background: "#F3F4F6" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
            style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
            {t.label}
            {t.key === "pending" && counts.pending > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#CC0000", color: "#fff" }}>{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : paged.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center text-[14px] text-gray-400" style={{ border: "1px solid #E5E5E5" }}>
          No {tab === "all" ? "" : tab} verification requests
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map(r => {
            const sb = STATUS_BADGE[r.status];
            return (
              <div key={r.id} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E5E5E5" }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold"
                        style={{ background: "#F3F4F6", color: "#374151" }}>
                        {((r.full_name ?? r.email ?? "?")[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">{r.full_name ?? "No name"}</p>
                        <p className="text-[12px] text-gray-400">{r.email ?? "No email"}</p>
                      </div>
                      <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: sb.bg, color: sb.color }}>{r.status}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                      <Clock size={11} />
                      <span>Submitted {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      {r.reviewed_at && (
                        <span>· Reviewed {new Date(r.reviewed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                      )}
                    </div>

                    {r.note && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-[12px]" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        Note: {r.note}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.document_url && (
                      <button onClick={() => setDocPreview(r.document_url!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
                        style={{ border: "1px solid #E5E5E5", color: "#374151" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <ExternalLink size={12} /> ID Doc
                      </button>
                    )}
                    {r.selfie_url && (
                      <button onClick={() => setDocPreview(r.selfie_url!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
                        style={{ border: "1px solid #E5E5E5", color: "#374151" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <ExternalLink size={12} /> Selfie
                      </button>
                    )}

                    {r.status === "pending" && (
                      <>
                        <button onClick={() => approve(r.id)} disabled={busy === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-50"
                          style={{ background: "#16A34A" }}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => setRejectId(r.id)} disabled={busy === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-50"
                          style={{ background: "#DC2626" }}>
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {r.status === "rejected" && (
                      <button onClick={() => approve(r.id)} disabled={busy === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-50"
                        style={{ background: "#16A34A" }}>
                        <CheckCircle size={13} /> Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] text-gray-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, base.length)} of {base.length}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-7 h-7 rounded-md text-[12px] font-medium"
                style={{ background: n === page ? "#000" : "transparent", color: n === page ? "#fff" : "#6B7280" }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
