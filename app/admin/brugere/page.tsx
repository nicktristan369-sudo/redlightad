"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Ban, Trash2, FileText, BadgeCheck, Crown, Archive, MapPin } from "lucide-react";

/* ───── Types ───── */
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
  whatsapp: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  created_at: string;
}

interface ArchivedUser {
  id: string;
  original_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  account_type: string | null;
  subscription_tier: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  registered_at: string | null;
  deleted_at: string;
  deleted_by: string;
}

type Tab = "all" | "providers" | "customers" | "banned" | "verified" | "archived";
const PAGE_SIZE = 25;

/* ───── Tier ───── */
const TIERS: { value: string | null; label: string; price: string; color: string }[] = [
  { value: "vip",      label: "VIP",      price: "$49.99/mo", color: "#CA8A04" },
  { value: "featured", label: "Featured", price: "$24.99/mo", color: "#2563EB" },
  { value: "basic",    label: "Basic",    price: "$9.99/mo",  color: "#6B7280" },
  { value: null,       label: "Free",     price: "fjern",     color: "#DC2626" },
];

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-[11px] text-gray-300">—</span>;
  const map: Record<string, { bg: string; color: string }> = {
    vip:      { bg: "#FEF9C3", color: "#92400E" },
    featured: { bg: "#EFF6FF", color: "#1E40AF" },
    basic:    { bg: "#F3F4F6", color: "#374151" },
  };
  const s = map[tier];
  if (!s) return null;
  return (
    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{tier}</span>
  );
}

/* ───── Avatar ───── */
function Avatar({ url, name }: { url: string | null; name: string | null }) {
  const [err, setErr] = useState(false);
  const initials = ((name ?? "?")[0] ?? "?").toUpperCase();
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name ?? ""} onError={() => setErr(true)}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
      style={{ background: "#F3F4F6", color: "#374151" }}>{initials}</div>
  );
}

/* ───── Premium dropdown ───── */
function PremiumDropdown({ userId, currentTier, onSet }: {
  userId: string; currentTier: string | null;
  onSet: (id: string, tier: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = async (tier: string | null) => {
    if (tier === currentTier) { setOpen(false); return; }
    setBusy(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "set_premium", tier }),
    });
    onSet(userId, tier);
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} disabled={busy}
        className="p-1.5 rounded-md disabled:opacity-40 transition-colors"
        title="Sæt premium"
        style={{ color: currentTier ? "#CA8A04" : "#9CA3AF" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#FEF9C3"; e.currentTarget.style.color = "#CA8A04"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = currentTier ? "#CA8A04" : "#9CA3AF"; }}>
        <Crown size={14} />
      </button>
      {open && (
        <div className="absolute z-50 right-0 mt-1 w-44 rounded-xl shadow-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #E5E5E5", top: "100%" }}>
          <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sæt Premium</p>
          </div>
          {TIERS.map(t => {
            const active = t.value === currentTier;
            return (
              <button key={String(t.value)} onClick={() => select(t.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                style={{ background: active ? "#F9FAFB" : "transparent", borderBottom: "1px solid #F9FAFB" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <div className="flex items-center gap-2">
                  {t.value && <Crown size={11} color={t.color} />}
                  <span className="text-[12px] font-semibold" style={{ color: t.color }}>{t.label}</span>
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

/* ───── Main ───── */
export default function AdminBrugerePage() {
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [archived, setArchived]   = useState<ArchivedUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [arcLoading, setArcLoading] = useState(false);
  const [tab, setTab]             = useState<Tab>("all");
  const [search, setSearch]       = useState("");
  const [country, setCountry]     = useState("all");
  const [countries, setCountries] = useState<string[]>([]);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [busy, setBusy]           = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      tab,
    });
    if (search) params.set("search", search);
    if (country !== "all") params.set("country", country);
    const res = await fetch(`/api/admin/users?${params}`);
    const json = await res.json();
    setProfiles(json.users ?? []);
    setTotal(json.total ?? 0);
    if (json.countries?.length) setCountries(json.countries);
    setLoading(false);
  }, [page, tab, search, country]);

  const loadArchived = useCallback(async () => {
    if (archived.length) return; // already loaded
    setArcLoading(true);
    const res = await fetch("/api/admin/archived-users");
    const json = await res.json();
    setArchived(json.archived ?? []);
    setArcLoading(false);
  }, [archived.length]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === "archived") loadArchived(); }, [tab, loadArchived]);
  useEffect(() => { setPage(1); }, [tab, search, country]);

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
    setArchived([]); // invalidate cache so archived tab reloads
    setBusy(null);
    setDeleteId(null);
  };

  const setPremium = (id: string, tier: string | null) =>
    setProfiles(p => p.map(u => u.id === id ? { ...u, subscription_tier: tier } : u));

  /* counts — server-side total for active tab, local for archived */
  const counts = {
    all:       tab === "all"       ? total : profiles.length,
    providers: tab === "providers" ? total : profiles.filter(u => u.account_type === "provider").length,
    customers: tab === "customers" ? total : profiles.filter(u => u.account_type === "customer").length,
    banned:    tab === "banned"    ? total : profiles.filter(u => u.is_banned).length,
    verified:  tab === "verified"  ? total : profiles.filter(u => u.is_verified).length,
    archived:  archived.length,
  };

  /* server already filters + paginates — just handle archived client-side */
  const q = search.toLowerCase();
  const arcFiltered = archived.filter(a =>
    !q || a.email?.toLowerCase().includes(q) || a.full_name?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q)
  );

  const displayList  = tab === "archived" ? arcFiltered : profiles;
  const serverTotal  = tab === "archived" ? arcFiltered.length : total;
  const pages        = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));
  const paged        = tab === "archived"
    ? arcFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : profiles; // already paginated by server

  const TABS: { key: Tab; label: string; danger?: boolean }[] = [
    { key: "all",       label: "Alle" },
    { key: "providers", label: "Providers" },
    { key: "customers", label: "Kunder" },
    { key: "banned",    label: "Banned", danger: true },
    { key: "verified",  label: "Verificerede" },
    { key: "archived",  label: "Old Users" },
  ];

  const isArchiveTab = tab === "archived";

  return (
    <AdminLayout>
      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Slet bruger?</h3>
            <p className="text-[13px] text-gray-500 mb-5">Brugerens data arkiveres og profilen slettes permanent. Handlingen kan ikke fortrydes.</p>
            <div className="flex gap-2">
              <button onClick={remove} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>Slet & Arkivér</button>
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Annuller</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Brugere</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {total > 0 ? `${total.toLocaleString()} brugere` : `${counts.all} aktive`}
            {country !== "all" ? ` i ${country}` : ""}
            {" · "}{archived.length} arkiverede
          </p>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
              {t.key === "banned" && counts.banned > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "#FEE2E2", color: "#7F1D1D" }}>{counts.banned}</span>
              )}
              {t.key === "archived" && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  <Archive size={9} className="inline" />
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Country filter */}
        {!loading && countries.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-2" style={{ border: "1px solid #E5E5E5" }}>
            <MapPin size={13} color="#9CA3AF" />
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="text-[13px] bg-transparent outline-none text-gray-700 cursor-pointer"
            >
              <option value="all">Alle lande</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white rounded-lg px-3 py-2"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Søg navn, email…"
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {(loading && !isArchiveTab) || (arcLoading && isArchiveTab) ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            {isArchiveTab
              ? <><Archive size={32} color="#D1D5DB" className="mx-auto mb-3" /><p className="text-[14px] text-gray-400">Ingen arkiverede brugere endnu</p></>
              : <p className="text-[14px] text-gray-400">Ingen brugere fundet</p>}
          </div>
        ) : isArchiveTab ? (
          /* ─── Archived table ─── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Bruger", "Email", "Telefon", "WhatsApp", "Land", "Type", "Slettet", "Handlinger"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(paged as ArchivedUser[]).map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar url={a.avatar_url} name={a.full_name} />
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{a.full_name ?? "Intet navn"}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "#FEE2E2", color: "#7F1D1D" }}>
                            {a.deleted_by === "admin" ? "Slettet af admin" : "Selvslettede"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 max-w-[180px] truncate">{a.email ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{a.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{a.whatsapp ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{a.country ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
                        style={{
                          background: a.account_type === "provider" ? "#FEF3C7" : "#EFF6FF",
                          color:      a.account_type === "provider" ? "#92400E" : "#1E40AF",
                        }}>{a.account_type ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(a.deleted_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-300 italic">Skrivebeskyttet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── Active users table ─── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Billede", "Navn", "Email", "Telefon", "WhatsApp", "Land", "Status", "Premium", "Oprettet", "Handlinger"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(paged as Profile[]).map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {/* Billede */}
                    <td className="px-4 py-3">
                      <Avatar url={u.avatar_url} name={u.full_name} />
                    </td>
                    {/* Navn */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{u.full_name ?? "Intet navn"}</p>
                        {u.is_admin && <span className="text-[10px] font-semibold" style={{ color: "#2563EB" }}>Admin</span>}
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-[12px] text-gray-500 max-w-[180px] truncate">{u.email ?? "—"}</td>
                    {/* Telefon */}
                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          {u.phone}
                          {u.phone_verified
                            ? <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#16A34A" }} title="Verified" />
                            : (
                              <button
                                title="Manually verify phone"
                                onClick={async () => {
                                  if (!confirm(`Manually verify ${u.phone}?`)) return
                                  const { createClient } = await import("@/lib/supabase")
                  const { data: { session } } = await createClient().auth.getSession()
                                  const res = await fetch("/api/admin/verify-phone", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                                    body: JSON.stringify({ phone: u.phone }),
                                  })
                                  if (res.ok) setProfiles(p => p.map(x => x.id === u.id ? { ...x, phone_verified: true } : x))
                                  else alert("Failed")
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#F59E0B" }} title="Not verified — click to verify manually" />
                              </button>
                            )}
                        </span>
                      ) : "—"}
                    </td>
                    {/* WhatsApp */}
                    <td className="px-4 py-3 text-[12px] text-gray-500">{u.whatsapp ?? "—"}</td>
                    {/* Land */}
                    <td className="px-4 py-3 text-[12px] text-gray-500">{u.country ?? "—"}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: u.is_banned ? "#FEE2E2" : "#DCFCE7", color: u.is_banned ? "#7F1D1D" : "#14532D" }}>
                        {u.is_banned ? "Banned" : "Aktiv"}
                      </span>
                    </td>
                    {/* Premium */}
                    <td className="px-4 py-3"><TierBadge tier={u.subscription_tier} /></td>
                    {/* Oprettet */}
                    <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    {/* Handlinger */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={`/admin/annoncer?user_id=${u.id}`}
                          className="p-1.5 rounded-md transition-colors" title="Se annoncer" style={{ color: "#9CA3AF" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                          <FileText size={14} />
                        </a>
                        {!u.is_verified && (
                          <button onClick={() => mutate(u.id, "verify")} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors" title="Verificer"
                            style={{ color: "#2563EB" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            <BadgeCheck size={14} />
                          </button>
                        )}
                        <PremiumDropdown userId={u.id} currentTier={u.subscription_tier} onSet={setPremium} />
                        <button onClick={() => mutate(u.id, u.is_banned ? "unban" : "ban")} disabled={busy === u.id}
                          className="p-1.5 rounded-md disabled:opacity-40 transition-colors"
                          title={u.is_banned ? "Ophæv ban" : "Ban bruger"}
                          style={{ color: u.is_banned ? "#16A34A" : "#DC2626" }}
                          onMouseEnter={e => { e.currentTarget.style.background = u.is_banned ? "#DCFCE7" : "#FEE2E2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <Ban size={14} />
                        </button>
                        {!u.is_admin && (
                          <button onClick={() => setDeleteId(u.id)} disabled={busy === u.id}
                            className="p-1.5 rounded-md disabled:opacity-40 transition-colors" title="Slet & Arkivér"
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[12px] text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, serverTotal)} af {serverTotal.toLocaleString()}
            </p>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(n => (
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
