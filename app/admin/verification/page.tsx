"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

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

interface CustomerKyc {
  id: string;
  user_id: string;
  full_name: string;
  birthdate: string;
  id_image_url: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  email?: string;
}

interface EscortKyc {
  id: string;
  user_id: string;
  listing_id: string;
  full_name: string;
  date_of_birth: string;
  country: string;
  id_front_url: string | null;
  id_back_url: string | null;
  selfie_url: string | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

type TopTab = "escort" | "kyc";
type VerifTab = "pending" | "approved" | "rejected" | "all";
type KycTab = "customer" | "escort";
type StatusFilter = "all" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 25;

/* ═══════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════ */

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#DCFCE7", color: "#14532D" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitial(name: string) {
  return (name[0] || "?").toUpperCase();
}

/* ─── ID Thumbnail with signed URL ─── */

function IDThumb({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    fetch(`/api/admin/kyc-signed-url?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setUrl(d.url); })
      .catch(() => {});
  }, [path]);

  if (!url) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 28, background: "#F3F4F6", borderRadius: 3,
        fontSize: 9, color: "#9CA3AF", border: "1px solid #E5E7EB",
      }}>
        ID
      </span>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="View full ID">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="ID"
        style={{
          width: 40, height: 28, objectFit: "cover",
          borderRadius: 3, border: "1px solid #E5E7EB", cursor: "pointer",
        }}
      />
    </a>
  );
}

/* ─── KYC Status Badge ─── */

function KycStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#D1FAE5", color: "#065F46" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = map[status] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{
      display: "inline-block", background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
      textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export default function AdminVerificationPage() {
  const [topTab, setTopTab] = useState<TopTab>("escort");

  /* ── Escort Verification state ── */
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [verifLoading, setVerifLoading] = useState(true);
  const [verifTab, setVerifTab] = useState<VerifTab>("pending");
  const [verifPage, setVerifPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [docPreview, setDocPreview] = useState<string | null>(null);

  /* ── KYC state ── */
  const [kycTab, setKycTab] = useState<KycTab>("customer");
  const [customerKyc, setCustomerKyc] = useState<CustomerKyc[]>([]);
  const [escortKyc, setEscortKyc] = useState<EscortKyc[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycActing, setKycActing] = useState<string | null>(null);
  const [kycStatusFilter, setKycStatusFilter] = useState<StatusFilter>("all");
  const [kycSearch, setKycSearch] = useState("");
  const [kycPage, setKycPage] = useState(0);

  /* ── Load escort verification ── */
  const loadVerif = useCallback(async () => {
    setVerifLoading(true);
    const { data } = await createClient()
      .from("verification_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setVerifLoading(false);
    setVerifPage(1);
  }, []);

  /* ── Load KYC ── */
  const loadKyc = useCallback(async () => {
    setKycLoading(true);
    try {
      const [custRes, escRes] = await Promise.all([
        fetch("/api/admin/customer-kyc"),
        fetch("/api/admin/kyc"),
      ]);
      const custData = await custRes.json();
      const escData = await escRes.json();
      if (Array.isArray(custData)) setCustomerKyc(custData);
      if (Array.isArray(escData)) setEscortKyc(escData);
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => { loadVerif(); }, [loadVerif]);
  useEffect(() => { loadKyc(); }, [loadKyc]);
  useEffect(() => { setVerifPage(1); }, [verifTab]);
  useEffect(() => { setKycPage(0); }, [kycTab, kycStatusFilter, kycSearch]);

  /* ── Escort verification actions ── */
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

  /* ── KYC actions ── */
  async function handleCustomerAction(id: string, userId: string, action: "approve" | "reject") {
    setKycActing(id);
    try {
      const res = await fetch("/api/admin/customer-kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: userId, action }),
      });
      const json = await res.json();
      if (json.ok) {
        setCustomerKyc((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() }
              : s
          )
        );
      } else {
        alert(json.error || "Action failed");
      }
    } finally {
      setKycActing(null);
    }
  }

  async function handleEscortKycAction(id: string, action: "approve" | "reject") {
    setKycActing(id);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id, action, rejection_reason: null }),
      });
      const json = await res.json();
      if (json.ok) {
        setEscortKyc((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() }
              : s
          )
        );
      } else {
        alert(json.error || "Action failed");
      }
    } finally {
      setKycActing(null);
    }
  }

  /* ── Verification computed ── */
  const verifCounts = {
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    all:      requests.length,
  };

  const verifBase = verifTab === "all" ? requests : requests.filter(r => r.status === verifTab);
  const verifPages = Math.max(1, Math.ceil(verifBase.length / PAGE_SIZE));
  const verifPaged = verifBase.slice((verifPage - 1) * PAGE_SIZE, verifPage * PAGE_SIZE);

  const VERIF_TABS: { key: VerifTab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  /* ── KYC computed ── */
  const kycActiveList = kycTab === "customer" ? customerKyc : escortKyc;
  const kycTotalPending = kycActiveList.filter((s) => s.status === "pending").length;
  const kycTotalApproved = kycActiveList.filter((s) => s.status === "approved").length;
  const kycTotalRejected = kycActiveList.filter((s) => s.status === "rejected").length;

  const filteredCustomer = useMemo(() => {
    let list: CustomerKyc[] = customerKyc;
    if (kycStatusFilter !== "all") list = list.filter((s) => s.status === kycStatusFilter);
    if (kycSearch.trim()) {
      const q = kycSearch.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [customerKyc, kycStatusFilter, kycSearch]);

  const filteredEscortKyc = useMemo(() => {
    let list: EscortKyc[] = escortKyc;
    if (kycStatusFilter !== "all") list = list.filter((s) => s.status === kycStatusFilter);
    if (kycSearch.trim()) {
      const q = kycSearch.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [escortKyc, kycStatusFilter, kycSearch]);

  const kycFiltered = kycTab === "customer" ? filteredCustomer : filteredEscortKyc;
  const kycTotalPages = Math.max(1, Math.ceil(kycFiltered.length / PAGE_SIZE));
  const pagedCustomer = filteredCustomer.slice(kycPage * PAGE_SIZE, (kycPage + 1) * PAGE_SIZE);
  const pagedEscortKyc = filteredEscortKyc.slice(kycPage * PAGE_SIZE, (kycPage + 1) * PAGE_SIZE);
  const kycShowFrom = kycFiltered.length === 0 ? 0 : kycPage * PAGE_SIZE + 1;
  const kycShowTo = Math.min((kycPage + 1) * PAGE_SIZE, kycFiltered.length);

  /* ── KYC table styles ── */
  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#6B7280",
    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left",
    borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap",
  };

  const tdStyle = (idx: number): React.CSSProperties => ({
    padding: "8px 12px", fontSize: 13, color: "#374151",
    borderBottom: "1px solid #F3F4F6", verticalAlign: "middle",
    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
  });

  const actionBtn = (color: string, disabled: boolean): React.CSSProperties => ({
    width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, fontSize: 14, fontWeight: 700, color: "#fff", background: color,
  });

  /* ── Top tab style ── */
  const topTabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 20px", fontSize: 14, fontWeight: active ? 700 : 500,
    color: active ? "#DC2626" : "#6B7280", background: "none", border: "none",
    borderBottom: active ? "2px solid #DC2626" : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <AdminLayout>
      {/* ── Document preview modal ── */}
      {docPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setDocPreview(null)}>
          <div className="relative max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={docPreview} alt="Document" className="w-full rounded-xl object-contain max-h-[80vh]" />
            <button onClick={() => setDocPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-[14px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
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

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Verification</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Escort verification and customer KYC</p>
      </div>

      {/* ── Top-level tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: 20 }}>
        <button style={topTabStyle(topTab === "escort")} onClick={() => setTopTab("escort")}>
          Escort Verification ({verifCounts.all})
        </button>
        <button style={topTabStyle(topTab === "kyc")} onClick={() => setTopTab("kyc")}>
          Customer KYC ({customerKyc.length + escortKyc.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
         TAB 1: Escort Verification
         ═══════════════════════════════════════════════════════ */}
      {topTab === "escort" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pending", count: verifCounts.pending, color: "#92400E", bg: "#FEF3C7" },
              { label: "Approved", count: verifCounts.approved, color: "#14532D", bg: "#DCFCE7" },
              { label: "Rejected", count: verifCounts.rejected, color: "#7F1D1D", bg: "#FEE2E2" },
            ].map(s => (
              <div key={s.label} className="bg-white p-4 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{s.label}</p>
                <p className="text-[28px] font-bold mt-1 leading-none" style={{ color: s.color }}>{s.count}</p>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-0.5 p-1 rounded-lg w-fit mb-5" style={{ background: "#F3F4F6" }}>
            {VERIF_TABS.map(t => (
              <button key={t.key} onClick={() => setVerifTab(t.key)}
                className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
                style={{ background: verifTab === t.key ? "#fff" : "transparent", color: verifTab === t.key ? "#111" : "#6B7280" }}>
                {t.label}
                {t.key === "pending" && verifCounts.pending > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#CC0000", color: "#fff" }}>{verifCounts.pending}</span>
                )}
              </button>
            ))}
          </div>

          {/* Cards */}
          {verifLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : verifPaged.length === 0 ? (
            <div className="bg-white rounded-xl py-16 text-center text-[14px] text-gray-400" style={{ border: "1px solid #E5E5E5" }}>
              No {verifTab === "all" ? "" : verifTab} verification requests
            </div>
          ) : (
            <div className="space-y-3">
              {verifPaged.map(r => {
                const sb = STATUS_BADGE[r.status];
                return (
                  <div key={r.id} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E5E5E5" }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
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
                          <span>Submitted {formatDate(r.created_at)}</span>
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

          {verifPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[12px] text-gray-400">
                {(verifPage - 1) * PAGE_SIZE + 1}–{Math.min(verifPage * PAGE_SIZE, verifBase.length)} of {verifBase.length}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: verifPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setVerifPage(n)}
                    className="w-7 h-7 rounded-md text-[12px] font-medium"
                    style={{ background: n === verifPage ? "#000" : "transparent", color: n === verifPage ? "#fff" : "#6B7280" }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
         TAB 2: Customer KYC
         ═══════════════════════════════════════════════════════ */}
      {topTab === "kyc" && (
        <div style={{ maxWidth: 1200 }}>
          {/* KYC sub-tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", marginBottom: 16 }}>
            <button
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: kycTab === "customer" ? 700 : 500,
                color: kycTab === "customer" ? "#DC2626" : "#6B7280", background: "none", border: "none",
                borderBottom: kycTab === "customer" ? "2px solid #DC2626" : "2px solid transparent", cursor: "pointer",
              }}
              onClick={() => setKycTab("customer")}
            >
              Customer KYC ({customerKyc.length})
            </button>
            <button
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: kycTab === "escort" ? 700 : 500,
                color: kycTab === "escort" ? "#DC2626" : "#6B7280", background: "none", border: "none",
                borderBottom: kycTab === "escort" ? "2px solid #DC2626" : "2px solid transparent", cursor: "pointer",
              }}
              onClick={() => setKycTab("escort")}
            >
              Escort KYC ({escortKyc.length})
            </button>
          </div>

          {/* Stats line */}
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
            {kycActiveList.length} total
            {" \u00B7 "}<span style={{ color: "#92400E" }}>{kycTotalPending} pending</span>
            {" \u00B7 "}<span style={{ color: "#065F46" }}>{kycTotalApproved} approved</span>
            {" \u00B7 "}<span style={{ color: "#991B1B" }}>{kycTotalRejected} rejected</span>
          </div>

          {/* Filters + search */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <select
              value={kycStatusFilter}
              onChange={(e) => setKycStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: "6px 10px", fontSize: 12, border: "1px solid #D1D5DB",
                borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer",
              }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Search by name..."
              value={kycSearch}
              onChange={(e) => setKycSearch(e.target.value)}
              style={{
                padding: "6px 10px", fontSize: 12, border: "1px solid #D1D5DB",
                borderRadius: 6, width: 200, color: "#374151",
              }}
            />
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>
              Showing {kycShowFrom}-{kycShowTo} of {kycFiltered.length}
            </span>
          </div>

          {/* Loading */}
          {kycLoading && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Loading...</p>}

          {/* ─── Customer Table ─── */}
          {!kycLoading && kycTab === "customer" && (
            kycFiltered.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No results</p>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>User</th>
                      <th style={thStyle}>Date of Birth</th>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Submitted</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCustomer.map((s, idx) => (
                      <tr key={s.id} style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA"; }}
                      >
                        <td style={tdStyle(idx)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", color: "#DC2626",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>
                              C
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <Link href={`/admin/brugere/${s.user_id}`} style={{ fontWeight: 700, fontSize: 13, color: "#DC2626", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200, display: "block" }}>
                                {s.full_name}
                              </Link>
                              {s.email && (
                                <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                                  {s.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle(idx)}>
                          <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{s.birthdate}</span>
                        </td>
                        <td style={tdStyle(idx)}>
                          {s.id_image_url ? (
                            <IDThumb path={s.id_image_url} />
                          ) : (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 40, height: 28, background: "#F3F4F6", borderRadius: 3,
                              fontSize: 9, color: "#9CA3AF", border: "1px solid #E5E7EB",
                            }}>
                              ID
                            </span>
                          )}
                        </td>
                        <td style={tdStyle(idx)}>
                          <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(s.created_at)}</span>
                        </td>
                        <td style={tdStyle(idx)}>
                          <KycStatusBadge status={s.status} />
                        </td>
                        <td style={{ ...tdStyle(idx), textAlign: "center" }}>
                          {s.status === "pending" ? (
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              <button
                                style={actionBtn("#16A34A", kycActing === s.id)}
                                disabled={kycActing === s.id}
                                onClick={() => handleCustomerAction(s.id, s.user_id, "approve")}
                                title="Approve"
                              >
                                {kycActing === s.id ? "\u2026" : "\u2713"}
                              </button>
                              <button
                                style={actionBtn("#DC2626", kycActing === s.id)}
                                disabled={kycActing === s.id}
                                onClick={() => handleCustomerAction(s.id, s.user_id, "reject")}
                                title="Reject"
                              >
                                {kycActing === s.id ? "\u2026" : "\u2717"}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#D1D5DB", fontSize: 14 }}>&ndash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ─── Escort KYC Table ─── */}
          {!kycLoading && kycTab === "escort" && (
            kycFiltered.length === 0 ? (
              <p style={{ color: "#9CA3AF", fontSize: 13 }}>No results</p>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>User</th>
                      <th style={thStyle}>Date of Birth</th>
                      <th style={thStyle}>Country</th>
                      <th style={thStyle}>ID Front</th>
                      <th style={thStyle}>ID Back</th>
                      <th style={thStyle}>Selfie</th>
                      <th style={thStyle}>Submitted</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEscortKyc.map((s, idx) => (
                      <tr key={s.id} style={{ transition: "background 0.1s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA"; }}
                      >
                        <td style={tdStyle(idx)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", background: "#FEE2E2", color: "#DC2626",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>
                              {getInitial(s.full_name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <a
                                href={s.listing_id ? `/ads/${s.listing_id}` : "#"}
                                style={{ fontWeight: 600, fontSize: 13, color: "#DC2626", textDecoration: "none", whiteSpace: "nowrap" }}
                              >
                                {s.full_name}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle(idx)}>
                          <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{s.date_of_birth}</span>
                        </td>
                        <td style={tdStyle(idx)}>
                          <span style={{ fontSize: 12 }}>{s.country}</span>
                        </td>
                        <td style={tdStyle(idx)}>
                          {s.id_front_url ? <IDThumb path={s.id_front_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                        </td>
                        <td style={tdStyle(idx)}>
                          {s.id_back_url ? <IDThumb path={s.id_back_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                        </td>
                        <td style={tdStyle(idx)}>
                          {s.selfie_url ? <IDThumb path={s.selfie_url} /> : <span style={{ color: "#D1D5DB", fontSize: 10 }}>&ndash;</span>}
                        </td>
                        <td style={tdStyle(idx)}>
                          <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(s.submitted_at)}</span>
                        </td>
                        <td style={tdStyle(idx)}>
                          <KycStatusBadge status={s.status} />
                        </td>
                        <td style={{ ...tdStyle(idx), textAlign: "center" }}>
                          {s.status === "pending" ? (
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              <button
                                style={actionBtn("#16A34A", kycActing === s.id)}
                                disabled={kycActing === s.id}
                                onClick={() => handleEscortKycAction(s.id, "approve")}
                                title="Approve"
                              >
                                {kycActing === s.id ? "\u2026" : "\u2713"}
                              </button>
                              <button
                                style={actionBtn("#DC2626", kycActing === s.id)}
                                disabled={kycActing === s.id}
                                onClick={() => handleEscortKycAction(s.id, "reject")}
                                title="Reject"
                              >
                                {kycActing === s.id ? "\u2026" : "\u2717"}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#D1D5DB", fontSize: 14 }}>&ndash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination */}
          {!kycLoading && kycFiltered.length > PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <button
                onClick={() => setKycPage((p) => Math.max(0, p - 1))}
                disabled={kycPage === 0}
                style={{
                  padding: "6px 14px", fontSize: 12, border: "1px solid #D1D5DB", borderRadius: 6,
                  background: kycPage === 0 ? "#F9FAFB" : "#fff", color: kycPage === 0 ? "#D1D5DB" : "#374151",
                  cursor: kycPage === 0 ? "default" : "pointer",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                Page {kycPage + 1} of {kycTotalPages}
              </span>
              <button
                onClick={() => setKycPage((p) => Math.min(kycTotalPages - 1, p + 1))}
                disabled={kycPage >= kycTotalPages - 1}
                style={{
                  padding: "6px 14px", fontSize: 12, border: "1px solid #D1D5DB", borderRadius: 6,
                  background: kycPage >= kycTotalPages - 1 ? "#F9FAFB" : "#fff",
                  color: kycPage >= kycTotalPages - 1 ? "#D1D5DB" : "#374151",
                  cursor: kycPage >= kycTotalPages - 1 ? "default" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
