"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { Search, Ban, Trash2, FileText, BadgeCheck, Mail, Smartphone } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  account_type: string | null;
  country: string | null;
  is_admin: boolean;
  is_banned: boolean;
  is_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  created_at: string;
}

type Tab = "all" | "providers" | "customers" | "banned" | "verified";
const PAGE_SIZE = 25;

export default function AdminBrugerePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient()
      .from("profiles")
      .select("id, email, full_name, account_type, country, is_admin, is_banned, is_verified, phone, phone_verified, created_at")
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const toggleBan = async (id: string, banned: boolean) => {
    setBusy(id);
    await createClient().from("profiles").update({ is_banned: !banned }).eq("id", id);
    setProfiles(p => p.map(u => u.id === id ? { ...u, is_banned: !banned } : u));
    setBusy(null);
  };

  const verify = async (id: string) => {
    setBusy(id);
    await createClient().from("profiles").update({ is_verified: true }).eq("id", id);
    setProfiles(p => p.map(u => u.id === id ? { ...u, is_verified: true } : u));
    setBusy(null);
  };

  const remove = async () => {
    if (!deleteId) return;
    setBusy(deleteId);
    await createClient().from("profiles").delete().eq("id", deleteId);
    setProfiles(p => p.filter(u => u.id !== deleteId));
    setBusy(null);
    setDeleteId(null);
  };

  const counts = {
    all:       profiles.length,
    providers: profiles.filter(u => u.account_type === "provider").length,
    customers: profiles.filter(u => u.account_type === "customer").length,
    banned:    profiles.filter(u => u.is_banned).length,
    verified:  profiles.filter(u => u.is_verified).length,
  };

  const q = search.toLowerCase();
  const base = tab === "all"       ? profiles
    : tab === "providers"          ? profiles.filter(u => u.account_type === "provider")
    : tab === "customers"          ? profiles.filter(u => u.account_type === "customer")
    : tab === "banned"             ? profiles.filter(u => u.is_banned)
    :                                profiles.filter(u => u.is_verified);
  const filtered = base.filter(u =>
    !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.country?.toLowerCase().includes(q)
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "providers", label: "Providers" },
    { key: "customers", label: "Customers" },
    { key: "banned",    label: "Banned" },
    { key: "verified",  label: "Verified" },
  ];

  const initials = (u: Profile) =>
    ((u.full_name ?? u.email ?? "?")[0] ?? "?").toUpperCase();

  return (
    <AdminLayout>
      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Delete user?</h3>
            <p className="text-[13px] text-gray-500 mb-5">This will permanently delete the user and all their data. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={remove} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>Delete</button>
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Users</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">{counts.all} registered users</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
              {counts[t.key] > 0 && t.key !== "all" && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: t.key === "banned" ? "#FEE2E2" : "#F3F4F6", color: t.key === "banned" ? "#7F1D1D" : "#6B7280" }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white rounded-lg px-3 py-2"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, country…"
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
          <div className="py-16 text-center text-[14px] text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["User", "Email", "Type", "Country", "Status", "Registered", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{ background: "#F3F4F6", color: "#374151" }}>
                          {initials(u)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{u.full_name ?? "No name"}</p>
                          {u.is_admin && (
                            <span className="text-[10px] font-semibold" style={{ color: "#2563EB" }}>Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-[12px] text-gray-500 max-w-[200px] truncate">{u.email ?? "—"}</td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
                        style={{
                          background: u.account_type === "provider" ? "#FEF3C7" : u.account_type === "customer" ? "#EFF6FF" : "#F3F4F6",
                          color:      u.account_type === "provider" ? "#92400E" : u.account_type === "customer" ? "#1E40AF" : "#6B7280",
                        }}>
                        {u.account_type ?? "—"}
                      </span>
                    </td>
                    {/* Country */}
                    <td className="px-4 py-3 text-[12px] text-gray-500">{u.country ?? "—"}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 items-center">
                        {u.is_banned ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#FEE2E2", color: "#7F1D1D" }}>Banned</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#DCFCE7", color: "#14532D" }}>Active</span>
                        )}
                        {/* Email verified icon */}
                        <span title={u.email ? "Email verified" : "No email"}>
                          <Mail size={13} color={u.email ? "#16A34A" : "#D1D5DB"} />
                        </span>
                        {/* Phone verified icon */}
                        <span title={u.phone_verified ? `Phone: ${u.phone}` : u.phone ? "Phone not verified" : "No phone"}>
                          <Smartphone size={13} color={u.phone_verified ? "#16A34A" : u.phone ? "#F59E0B" : "#D1D5DB"} />
                        </span>
                        {u.is_verified && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#EFF6FF", color: "#1E40AF" }}>✓ ID</span>
                        )}
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={`/admin/annoncer?user_id=${u.id}`}
                          className="p-1.5 rounded-md" title="See listings" style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                          <FileText size={14} />
                        </a>
                        {!u.is_verified && (
                          <button onClick={() => verify(u.id)} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40" title="Verify user" style={{ color: "#2563EB" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            <BadgeCheck size={14} />
                          </button>
                        )}
                        <button onClick={() => toggleBan(u.id, u.is_banned)} disabled={busy === u.id}
                          className="p-1.5 rounded-md disabled:opacity-40"
                          title={u.is_banned ? "Unban" : "Ban"}
                          style={{ color: u.is_banned ? "#16A34A" : "#DC2626" }}
                          onMouseEnter={e => { e.currentTarget.style.background = u.is_banned ? "#DCFCE7" : "#FEE2E2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <Ban size={14} />
                        </button>
                        {!u.is_admin && (
                          <button onClick={() => setDeleteId(u.id)} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40" title="Delete user" style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
