"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import { CATEGORY_LABELS, type MarketplaceItem, type MarketplaceStatus } from "@/lib/marketplace";
import { CheckCircle, XCircle, Trash2, Eye, Clock } from "lucide-react";

const TABS: { value: MarketplaceStatus | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MarketplaceStatus | "all">("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
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
  };

  useEffect(() => { load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id: string, status: MarketplaceStatus) => {
    setProcessing(id);
    const supabase = createClient();
    await supabase.from("marketplace_items").update({ status }).eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setProcessing(null);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return;
    setProcessing(id);
    const supabase = createClient();
    await supabase.from("marketplace_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setProcessing(null);
  };

  const counts = {
    pending: items.filter(i => i.status === "pending").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Marketplace</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Review and approve seller listings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
              style={{ background: tab === t.value ? "#fff" : "transparent", color: tab === t.value ? "#111" : "#6B7280" }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-[14px] text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5E5]">
            <p className="text-[28px] mb-2">🛍</p>
            <p className="text-[14px] font-semibold text-gray-900">
              {tab === "pending" ? "No pending items" : `No ${tab} items`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {counts.pending > 0 && tab !== "pending" && (
              <div className="flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <Clock size={14} /> {counts.pending} item{counts.pending !== 1 ? "s" : ""} awaiting review
              </div>
            )}
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded-xl overflow-hidden">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[20px]">🖼</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-semibold text-gray-900">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] text-gray-500">{CATEGORY_LABELS[item.category]}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[12px] font-semibold" style={{ color: "#CC0000" }}>🔴 {item.coin_price} coins</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[12px] text-gray-500">{item.seller_name ?? "Unknown seller"}</span>
                        </div>
                        {item.description && (
                          <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {item.stock !== null && (
                          <p className="text-[12px] text-gray-400 mt-1">Stock: {item.stock}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(item.id, "approved")}
                              disabled={processing === item.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
                              style={{ background: "#16A34A", borderRadius: "6px" }}>
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, "rejected")}
                              disabled={processing === item.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
                              style={{ background: "#DC2626", borderRadius: "6px" }}>
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {item.status === "approved" && (
                          <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            style={{ borderRadius: "6px" }}>
                            <Eye size={13} /> View
                          </a>
                        )}
                        {item.status === "rejected" && (
                          <button
                            onClick={() => updateStatus(item.id, "approved")}
                            disabled={processing === item.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: "#16A34A", borderRadius: "6px" }}>
                            <CheckCircle size={13} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={processing === item.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
