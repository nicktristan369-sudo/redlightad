"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Ban, Trash2, FileText, BadgeCheck, Mail, Smartphone, Crown } from "lucide-react";

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
  subscription_tier: string | null;
  created_at: string;
}

type Tab = "all" | "providers" | "customers" | "banned" | "verified";
const PAGE_SIZE = 25;

const TIERS: { value: string | null; label: string; price: string; color: string }[] = [
  { value: "vip",      label: "VIP",      price: "$49.99/mo", color: "#CA8A04" },
  { value: "featured", label: "Featured", price: "$24.99/mo", color: "#2563EB" },
  { value: "basic",    label: "Basic",    price: "$9.99/mo",  color: "#6B7280" },
  { value: null,       label: "Free",     price: "fjern",     color: "#DC2626" },
];

function tierBadge(tier: string | null) {
  if (!tier) return null;
  const map: Record<string, { bg: string; color: string }> = {
    vip:      { bg: "#FEF9C3", color: "#92400E" },
    featured: { bg: "#EFF6FF", color: "#1E40AF" },
    basic:    { bg: "#F3F4F6", color: "#374151" },
  };
  const s = map[tier];
  if (!s) return null;
  return (
    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {tier}
    </span>
  );
}

function PremiumDropdown({ userId, currentTier, onSet }: {
  userId: string;
  currentTier: string | null;
  onSet: (id: string, tier: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = async (tier: string | null) => {
    if (tier === currentTier) { setOpen(false); return; }
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "set_premium", tier }),
    });
    if (res.ok) onSet(userId, tier);
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        className="p-1.5 rounded-md disabled:opacity-40 transition-colors"
        title="Sæt premium"
        style={{ color: currentTier ? "#CA8A04" : "#9CA3AF" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#FEF9C3"; e.currentTarget.style.color = "#CA8A04"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = currentTier ? "#CA8A04" : "#9CA3AF"; }}
      >
        <Crown size={14} />
      </button>

      {open && (
        <div
          className="absolute z-50 right-0 mt-1 w-44 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #E5E5E5", top: "100%" }}
        >
          <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sæt Premium</p>
          </div>
          {TIERS.map(t => {
            const active = t.value === currentTier;
            return (
              <button
                key={String(t.value)}
                onClick={() => select(t.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                style={{
                  background: active ? "#F9FAFB" : "transparent",
                  borderBottom: "1px solid #F9FAFB",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex items-center gap-2">
                  {t.value && <Crown size={11} color={t.color} />}
                  <span className="text-[12px] font-semibold" style={{ color: t.color }}>
                    {t.label}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{t.price}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setProfiles(json.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const mutate = async (id: string, action: "ban" | "unban" | "verify") => {
    setBusy(id);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, action }),
    });
    if (action === "ban")    setProfiles(p => p.map(u => u.id === id ? { ...u, is_banned: true  } : u));
    if (action === "unban")  setProfiles(p => p.map(u => u.id === id ? { ...u, is_banned: false } : u));
    if (action === "verify") setProfiles(p => p.map(u => u.id === id ? { ...u, is_verified: true } : u));
    setBusy(null);
  };

  const remove = async () => {
    if (!deleteId) return;
    setBusy(deleteId);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteId, action: "delete" }),
    });
    setProfiles(p => p.filter(u => u.id !== deleteId));
    setBusy(null);
    setDeleteId(null);
  };

  const setPremium = (id: string, tier: string | null) => {
    setProfiles(p => p.map(u => u.id === id ? { ...u, subscription_tier: tier } : u));
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
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Slet bruger?</h3>
            <p className="text-[13px] text-gray-500 mb-5">Dette sletter brugeren og alt deres data permanent. Handlingen kan ikke fortrydes.</p>
            <div className="flex gap-2">
              <button onClick={remove} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>Slet</button>
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Annuller</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Brugere</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">{counts.all} registrerede brugere</p>
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
            placeholder="Søg navn, email, land…"
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
          <div className="py-16 text-center text-[14px] text-gray-400">Ingen brugere fundet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Bruger", "Email", "Type", "Land", "Status", "Premium", "Oprettet", "Handlinger"].map(h => (
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
                    {/* Bruger */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{ background: "#F3F4F6", color: "#374151" }}>
                          {initials(u)}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{u.full_name ?? "Intet navn"}</p>
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
                    {/* Land */}
                    <td className="px-4 py-3 text-[12px] text-gray-500">{u.country ?? "—"}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 items-center">
                        {u.is_banned ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#FEE2E2", color: "#7F1D1D" }}>Banned</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#DCFCE7", color: "#14532D" }}>Aktiv</span>
                        )}
                        <span title={u.email ? "Email registreret" : "Ingen email"}>
                          <Mail size={13} color={u.email ? "#16A34A" : "#D1D5DB"} />
                        </span>
                        <span title={u.phone_verified ? `Telefon: ${u.phone}` : u.phone ? "Telefon ikke verificeret" : "Ingen telefon"}>
                          <Smartphone size={13} color={u.phone_verified ? "#16A34A" : u.phone ? "#F59E0B" : "#D1D5DB"} />
                        </span>
                        {u.is_verified && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "#EFF6FF", color: "#1E40AF" }}>ID</span>
                        )}
                      </div>
                    </td>
                    {/* Premium */}
                    <td className="px-4 py-3">
                      {u.subscription_tier ? tierBadge(u.subscription_tier) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </td>
                    {/* Oprettet */}
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    {/* Handlinger */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Se annoncer */}
                        <a href={`/admin/annoncer?user_id=${u.id}`}
                          className="p-1.5 rounded-md transition-colors" title="Se annoncer" style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                          <FileText size={14} />
                        </a>
                        {/* Verificer */}
                        {!u.is_verified && (
                          <button onClick={() => mutate(u.id, "verify")} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors" title="Verificer bruger"
                            style={{ color: "#2563EB" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            <BadgeCheck size={14} />
                          </button>
                        )}
                        {/* Premium dropdown */}
                        <PremiumDropdown
                          userId={u.id}
                          currentTier={u.subscription_tier}
                          onSet={setPremium}
                        />
                        {/* Ban / Unban */}
                        <button onClick={() => mutate(u.id, u.is_banned ? "unban" : "ban")} disabled={busy === u.id}
                          className="p-1.5 rounded-md disabled:opacity-40 transition-colors"
                          title={u.is_banned ? "Ophæv ban" : "Ban bruger"}
                          style={{ color: u.is_banned ? "#16A34A" : "#DC2626" }}
                          onMouseEnter={e => { e.currentTarget.style.background = u.is_banned ? "#DCFCE7" : "#FEE2E2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <Ban size={14} />
                        </button>
                        {/* Slet */}
                        {!u.is_admin && (
                          <button onClick={() => setDeleteId(u.id)} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors" title="Slet bruger"
                            style={{ color: "#9CA3AF" }}
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
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} af {filtered.length}
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
