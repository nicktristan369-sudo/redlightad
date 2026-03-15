"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { ArrowDownToLine, DollarSign, Clock, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import { COIN_SELL_RATE } from "@/lib/coinPackages";

interface PayoutRequest {
  id: string;
  seller_id: string;
  coins_amount: number;
  usd_amount: number;
  iban: string;
  status: string;
  created_at: string;
  seller_email?: string;
  seller_name?: string;
}

type Tab = "pending" | "paid" | "rejected" | "all";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#DBEAFE", color: "#1E40AF" },
  paid:     { bg: "#DCFCE7", color: "#14532D" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D" },
};

function IBANCell({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] text-gray-600">{iban}</span>
      <button onClick={copy} className="flex-shrink-0 p-1 rounded transition-colors"
        style={{ color: copied ? "#16A34A" : "#9CA3AF" }}
        onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("payout_requests")
      .select("id, seller_id, coins_amount, usd_amount, iban, status, created_at, profiles!seller_id(email, full_name)")
      .order("created_at", { ascending: false });
    if (tab !== "all") {
      if (tab === "paid") q = q.in("status", ["paid", "approved"]);
      else q = q.eq("status", tab);
    }
    const { data } = await q;
    const mapped = (data ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      seller_email: (d.profiles as Record<string, unknown> | null)?.email as string ?? undefined,
      seller_name:  (d.profiles as Record<string, unknown> | null)?.full_name as string ?? undefined,
    })) as PayoutRequest[];
    setRequests(mapped);
    setLoading(false);
    setPage(1);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (r: PayoutRequest) => {
    setBusy(r.id);
    const supabase = createClient();
    await supabase.from("payout_requests").update({ status: "paid" }).eq("id", r.id);
    // Deduct coins from wallet
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", r.seller_id).maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Math.max(0, wallet.balance - r.coins_amount) }).eq("user_id", r.seller_id);
    }
    await supabase.from("coin_transactions").insert({
      user_id: r.seller_id,
      type: "payout",
      amount: -r.coins_amount,
      note: `Payout paid: ${r.coins_amount} coins = $${(r.coins_amount * COIN_SELL_RATE).toFixed(2)}`,
    });
    setRequests(p => p.filter(x => x.id !== r.id));
    setBusy(null);
  };

  const reject = async (id: string) => {
    setBusy(id);
    await createClient().from("payout_requests").update({ status: "rejected" }).eq("id", id);
    setRequests(p => p.filter(x => x.id !== id));
    setBusy(null);
    setRejectId(null);
  };

  const counts = {
    pending:  requests.filter(r => r.status === "pending").length,
    paid:     requests.filter(r => ["paid","approved"].includes(r.status)).length,
    rejected: requests.filter(r => r.status === "rejected").length,
    all:      requests.length,
  };
  const pendingUSD = requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.usd_amount), 0);

  const pages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const paged = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "paid",     label: "Paid" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <AdminLayout>
      {/* Reject confirm */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Reject payout?</h3>
            <p className="text-[13px] text-gray-500 mb-5">The seller will not receive their payment. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => reject(rejectId)} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>Reject</button>
              <button onClick={() => setRejectId(null)}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Payouts</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Seller coin withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Payouts", value: counts.pending.toString(),    Icon: Clock,            accent: counts.pending > 0 },
          { label: "Total Pending $", value: `$${pendingUSD.toFixed(2)}`, Icon: DollarSign,       accent: counts.pending > 0 },
          { label: "Paid Out",        value: counts.paid.toString(),       Icon: CheckCircle,      accent: false },
          { label: "Rejected",        value: counts.rejected.toString(),   Icon: ArrowDownToLine,  accent: false },
        ].map(({ label, value, Icon, accent }) => (
          <div key={label} className="bg-white p-5 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accent ? "rgba(204,0,0,0.08)" : "#F5F5F5" }}>
                <Icon size={15} color={accent ? "#CC0000" : "#6B7280"} />
              </div>
            </div>
            <p className="text-[26px] font-bold leading-none" style={{ color: accent ? "#CC0000" : "#111" }}>{value}</p>
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

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-gray-400">No payout requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Seller", "Coins", "USD", "IBAN", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(r => {
                  const sb = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-gray-900">{r.seller_name ?? "—"}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{r.seller_email ?? r.seller_id.slice(0,12)+"…"}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: "#CC0000" }}>
                        {r.coins_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-gray-900">
                        ${Number(r.usd_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3"><IBANCell iban={r.iban} /></td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: sb.bg, color: sb.color }}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(r.status === "pending" || r.status === "approved") && (
                            <button onClick={() => markPaid(r)} disabled={busy === r.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-40"
                              style={{ background: "#16A34A" }}>
                              <CheckCircle size={13} />
                              {busy === r.id ? "…" : "Mark Paid"}
                            </button>
                          )}
                          {r.status === "pending" && (
                            <button onClick={() => setRejectId(r.id)} disabled={busy === r.id}
                              className="p-1.5 rounded-md disabled:opacity-40" style={{ color: "#9CA3AF" }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[12px] text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, requests.length)} of {requests.length}
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
      </div>
    </AdminLayout>
  );
}
