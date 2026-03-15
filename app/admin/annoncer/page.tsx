"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { Search, Eye, Pencil, Trash2, CheckCircle, XCircle, CheckSquare } from "lucide-react";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  location: string | null;
  status: string;
  tier: string | null;
  profile_image: string | null;
  created_at: string;
  user_id: string;
}

type Tab = "pending" | "active" | "rejected" | "all";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E", label: "Pending" },
  active:   { bg: "#DCFCE7", color: "#14532D", label: "Active" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D", label: "Rejected" },
  draft:    { bg: "#F3F4F6", color: "#4B5563", label: "Draft" },
};

const TIER_BADGE: Record<string, string> = {
  basic:    "#6B7280",
  featured: "#2563EB",
  vip:      "#C9A84C",
};

export default function AdminAnnoncerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("listings")
      .select("id, title, category, city, location, status, tier, profile_image, created_at, user_id")
      .order("created_at", { ascending: false });
    setListings(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const update = async (id: string, status: "active" | "rejected") => {
    setBusy(id);
    await createClient().from("listings").update({ status }).eq("id", id);
    setListings(p => p.map(l => l.id === id ? { ...l, status } : l));
    setBusy(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    setBusy(id);
    await createClient().from("listings").delete().eq("id", id);
    setListings(p => p.filter(l => l.id !== id));
    setBusy(null);
  };

  const bulkApprove = async () => {
    const pending = filtered.filter(l => l.status === "pending");
    if (!pending.length) return;
    if (!confirm(`Approve all ${pending.length} pending listings?`)) return;
    setBulkLoading(true);
    const supabase = createClient();
    await supabase.from("listings").update({ status: "active" }).in("id", pending.map(l => l.id));
    setListings(p => p.map(l => l.status === "pending" ? { ...l, status: "active" } : l));
    setBulkLoading(false);
  };

  const counts = {
    pending:  listings.filter(l => l.status === "pending").length,
    active:   listings.filter(l => l.status === "active").length,
    rejected: listings.filter(l => l.status === "rejected").length,
    all:      listings.length,
  };

  const q = search.toLowerCase();
  const base = tab === "all" ? listings : listings.filter(l => l.status === tab);
  const filtered = base.filter(l =>
    !q || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "active",   label: "Active" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <AdminLayout pendingListings={counts.pending}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Listings</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{counts.all} total listings</p>
        </div>
        {tab === "pending" && counts.pending > 0 && (
          <button onClick={bulkApprove} disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "#16A34A" }}>
            <CheckSquare size={14} />
            Approve all pending ({counts.pending})
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
              {t.key !== "all" && counts[t.key] > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: t.key === "pending" ? "#CC0000" : "#E5E7EB", color: t.key === "pending" ? "#fff" : "#374151" }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-white rounded-lg px-3 py-2"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, city…"
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
          <div className="py-16 text-center text-[14px] text-gray-400">No listings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["", "Listing", "Category", "Location", "Tier", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(l => {
                  const sb = STATUS_BADGE[l.status] ?? STATUS_BADGE.draft;
                  return (
                    <tr key={l.id} className="group" style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {/* Thumb */}
                      <td className="pl-4 py-3 w-12">
                        {l.profile_image
                          ? <img src={l.profile_image} alt="" className="w-9 h-9 rounded-lg object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold"
                              style={{ background: "#F3F4F6", color: "#9CA3AF" }}>N/A</div>}
                      </td>
                      {/* Title */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{l.title}</p>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{l.category ?? "—"}</td>
                      {/* Location */}
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{l.city ?? l.location ?? "—"}</td>
                      {/* Tier */}
                      <td className="px-4 py-3">
                        {l.tier ? (
                          <span className="text-[11px] font-semibold uppercase"
                            style={{ color: TIER_BADGE[l.tier] ?? "#6B7280" }}>{l.tier}</span>
                        ) : <span className="text-[11px] text-gray-300">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/annoncer/${l.id}`} target="_blank"
                            className="p-1.5 rounded-md transition-colors" title="Preview"
                            style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Eye size={14} />
                          </Link>
                          <Link href={`/dashboard/annoncer/edit/${l.id}`} target="_blank"
                            className="p-1.5 rounded-md transition-colors" title="Edit"
                            style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Pencil size={14} />
                          </Link>
                          {l.status !== "active" && (
                            <button onClick={() => update(l.id, "active")} disabled={busy === l.id}
                              className="p-1.5 rounded-md transition-colors disabled:opacity-40" title="Approve"
                              style={{ color: "#16A34A" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#DCFCE7"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {l.status !== "rejected" && (
                            <button onClick={() => update(l.id, "rejected")} disabled={busy === l.id}
                              className="p-1.5 rounded-md transition-colors disabled:opacity-40" title="Reject"
                              style={{ color: "#DC2626" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                              <XCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => remove(l.id)} disabled={busy === l.id}
                            className="p-1.5 rounded-md transition-colors disabled:opacity-40" title="Delete"
                            style={{ color: "#9CA3AF" }}
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[12px] text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-7 h-7 rounded-md text-[12px] font-medium transition-colors"
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
