"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import { CATEGORY_LABELS, type MarketplaceItem, type MarketplaceStatus } from "@/lib/marketplace";
import { CheckCircle, XCircle, Trash2, Eye, Search } from "lucide-react";

type Tab = MarketplaceStatus | "all";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#DCFCE7", color: "#14532D" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D" },
};

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectMsg, setRejectMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("marketplace_items")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false });
    if (tab !== "all") query = query.eq("status", tab);
    const { data } = await query;
    const mapped = (data ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      seller_name: (d.profiles as Record<string, unknown> | null)?.full_name ?? undefined,
    })) as MarketplaceItem[];
    setItems(mapped);
    setLoading(false);
    setPage(1);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setBusy(id);
    await fetch("/api/admin/marketplace-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, action: "approve" }),
    });
    setItems(p => tab === "pending" ? p.filter(i => i.id !== id) : p.map(i => i.id === id ? { ...i, status: "approved" as const } : i));
    setBusy(null);
  };

  const reject = async () => {
    if (!rejectId) return;
    setBusy(rejectId);
    await fetch("/api/admin/marketplace-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: rejectId, action: "reject", reason: rejectMsg || undefined }),
    });
    setItems(p => tab === "pending" ? p.filter(i => i.id !== rejectId) : p.map(i => i.id === rejectId ? { ...i, status: "rejected" as const } : i));
    setBusy(null);
    setRejectId(null);
    setRejectMsg("");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setBusy(id);
    await createClient().from("marketplace_items").delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
    setBusy(null);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  const pendingCount = items.filter(i => i.status === "pending").length;
  const q = search.toLowerCase();
  const filtered = items.filter(i => !q || i.title?.toLowerCase().includes(q));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout pendingMarketplace={pendingCount}>
      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1">Reject item</h3>
            <p className="text-[13px] text-gray-500 mb-4">Optional: leave a message to the seller</p>
            <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={3}
              className="w-full text-[13px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{ border: "1px solid #E5E5E5" }} />
            <div className="flex gap-2 mt-4">
              <button onClick={reject} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>
                Confirm Reject
              </button>
              <button onClick={() => { setRejectId(null); setRejectMsg(""); }}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-gray-900">Marketplace</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Review and moderate seller items</p>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && tab !== "pending" && (
        <button onClick={() => setTab("pending")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-5 text-left transition-opacity hover:opacity-90"
          style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <div className="flex items-center gap-2">
            <span className="text-[18px]">⚠️</span>
            <div>
              <p className="text-[13px] font-semibold text-orange-900">{pendingCount} item{pendingCount !== 1 ? "s" : ""} waiting for review</p>
              <p className="text-[12px] text-orange-700">Click to review pending submissions</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full">Review →</span>
        </button>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
              {t.key === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#CC0000", color: "#fff" }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white rounded-lg px-3 py-2"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title…"
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-gray-400">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["", "Item", "Category", "Seller", "Price", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(item => {
                  const sb = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="pl-4 py-3 w-12">
                        {item.thumbnail_url
                          ? <img src={item.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px]"
                              style={{ background: "#F3F4F6" }}>🖼</div>}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{item.title}</p>
                        {item.description && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        {item.seller_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold whitespace-nowrap" style={{ color: "#CC0000" }}>
                        {item.coin_price} coins
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: sb.bg, color: sb.color }}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.status === "approved" && (
                            <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-md" style={{ color: "#9CA3AF" }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                              <Eye size={14} />
                            </a>
                          )}
                          {item.status === "pending" ? (
                            <>
                              <button onClick={() => approve(item.id)} disabled={busy === item.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-colors"
                                style={{ background: "#DCFCE7", color: "#14532D" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#BBF7D0")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#DCFCE7")}>
                                {busy === item.id
                                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  : <><CheckCircle size={12} /> Godkend</>}
                              </button>
                              <button onClick={() => setRejectId(item.id)} disabled={busy === item.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-colors"
                                style={{ background: "#FEE2E2", color: "#991B1B" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FECACA")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#FEE2E2")}>
                                <XCircle size={12} /> Afvis
                              </button>
                            </>
                          ) : (
                            <>
                              {item.status !== "approved" && (
                                <button onClick={() => approve(item.id)} disabled={busy === item.id}
                                  className="p-1.5 rounded-md disabled:opacity-40"
                                  style={{ color: "#16A34A" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#DCFCE7")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {item.status !== "rejected" && (
                                <button onClick={() => setRejectId(item.id)} disabled={busy === item.id}
                                  className="p-1.5 rounded-md disabled:opacity-40"
                                  style={{ color: "#DC2626" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#FEE2E2")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <XCircle size={14} />
                                </button>
                              )}
                            </>
                          )}
                          <button onClick={() => remove(item.id)} disabled={busy === item.id}
                            className="p-1.5 rounded-md disabled:opacity-40" style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Trash2 size={14} />
                          </button>
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
