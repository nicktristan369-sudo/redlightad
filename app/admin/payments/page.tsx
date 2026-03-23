"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { DollarSign, TrendingUp, CreditCard, Search, Download } from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  listing_id: string | null;
  stripe_session_id: string | null;
  tier: string | null;
  amount: number;       // cents
  status: string;
  created_at: string;
  buyer_email?: string;
}

type Tab = "all" | "paid" | "pending" | "failed";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  paid:      { bg: "#DCFCE7", color: "#14532D" },
  complete:  { bg: "#DCFCE7", color: "#14532D" },
  pending:   { bg: "#FEF3C7", color: "#92400E" },
  failed:    { bg: "#FEE2E2", color: "#7F1D1D" },
  cancelled: { bg: "#F3F4F6", color: "#4B5563" },
};

const TIER_COLOR: Record<string, string> = {
  basic:    "#6B7280",
  featured: "#2563EB",
  vip:      "#C9A84C",
};

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("orders")
      .select("id, user_id, listing_id, stripe_session_id, tier, amount, status, created_at, profiles(email)")
      .order("created_at", { ascending: false });
    if (tab !== "all") {
      if (tab === "paid") q = q.in("status", ["paid", "complete"]);
      else q = q.eq("status", tab);
    }
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    const mapped = (data ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      buyer_email: (d.profiles as Record<string, unknown> | null)?.email as string ?? undefined,
    })) as Order[];
    setOrders(mapped);
    setLoading(false);
    setPage(1);
  }, [tab, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  // Stats
  const totalRevenue = orders.filter(o => ["paid","complete"].includes(o.status)).reduce((s, o) => s + o.amount, 0);
  const thisMonth = (() => {
    const now = new Date();
    return orders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && ["paid","complete"].includes(o.status);
      })
      .reduce((s, o) => s + o.amount, 0);
  })();
  const pendingCount = orders.filter(o => o.status === "pending").length;

  const q = search.toLowerCase();
  const filtered = orders.filter(o =>
    !q || o.buyer_email?.toLowerCase().includes(q) || o.stripe_session_id?.toLowerCase().includes(q) || o.tier?.toLowerCase().includes(q)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["ID","User","Tier","Amount (USD)","Status","Stripe Session","Date"],
      ...filtered.map(o => [
        o.id, o.buyer_email ?? o.user_id, o.tier ?? "", formatUSD(o.amount),
        o.status, o.stripe_session_id ?? "", new Date(o.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" }, { key: "paid", label: "Paid" },
    { key: "pending", label: "Pending" }, { key: "failed", label: "Failed" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Payments</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Stripe listing upgrade payments</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors"
          style={{ border: "1px solid #E5E5E5", color: "#374151" }}
          onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue",    value: formatUSD(totalRevenue),  Icon: DollarSign,  accent: false },
          { label: "This Month",       value: formatUSD(thisMonth),     Icon: TrendingUp,  accent: false },
          { label: "Total Orders",     value: orders.length.toString(), Icon: CreditCard,  accent: false },
          { label: "Pending",          value: pendingCount.toString(),  Icon: CreditCard,  accent: pendingCount > 0 },
        ].map(({ label, value, Icon, accent }) => (
          <div key={label} className="bg-white p-5 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accent ? "rgba(204,0,0,0.08)" : "#F5F5F5" }}>
                <Icon size={15} color={accent ? "#CC0000" : "#6B7280"} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-[160px] max-w-xs"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search email, tier…"
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-[12px] px-2 py-2 rounded-lg outline-none bg-white"
            style={{ border: "1px solid #E5E5E5", color: "#374151" }} />
          <span className="text-[12px] text-gray-400">→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-[12px] px-2 py-2 rounded-lg outline-none bg-white"
            style={{ border: "1px solid #E5E5E5", color: "#374151" }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-gray-400">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["User", "Tier", "Amount", "Status", "Stripe ID", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(o => {
                  const sb = STATUS_BADGE[o.status] ?? STATUS_BADGE.cancelled;
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[200px] truncate">
                        {o.buyer_email ?? o.user_id.slice(0, 12) + "…"}
                      </td>
                      <td className="px-4 py-3">
                        {o.tier ? (
                          <span className="text-[12px] font-semibold uppercase"
                            style={{ color: TIER_COLOR[o.tier] ?? "#6B7280" }}>{o.tier}</span>
                        ) : <span className="text-[12px] text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold text-gray-900">{formatUSD(o.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: sb.bg, color: sb.color }}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-400 max-w-[140px] truncate">
                        {o.stripe_session_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
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
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
