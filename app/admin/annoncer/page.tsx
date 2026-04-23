"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Eye, Pencil, Trash2, CheckCircle, XCircle, CheckSquare, Crown, MapPin, ChevronDown, Star, Users } from "lucide-react";
import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// Resolve flag emoji from country name stored in listings
function getFlag(countryName: string): string {
  const match = SUPPORTED_COUNTRIES.find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  return match?.flag ?? "";
}

interface Listing {
  id: string;
  title: string;
  category: string | null;
  gender: string | null;
  city: string | null;
  country: string | null;
  status: string;
  tier: string | null;
  in_carousel: boolean;
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

const TIERS: { value: string | null; label: string; color: string }[] = [
  { value: "vip",      label: "VIP",      color: "#C9A84C" },
  { value: "featured", label: "Featured", color: "#2563EB" },
  { value: "basic",    label: "Basic",    color: "#6B7280" },
  { value: null,       label: "Standard", color: "#9CA3AF" },
];

const TIER_COLOR: Record<string, string> = {
  vip: "#C9A84C", featured: "#2563EB", basic: "#6B7280",
};

/* ── Inline Tier Dropdown ── */
const TIER_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  vip:      { bg: "#FEF08A", color: "#78350F", border: "#F59E0B" },
  featured: { bg: "#BFDBFE", color: "#1E3A8A", border: "#3B82F6" },
  basic:    { bg: "#E5E7EB", color: "#374151", border: "#D1D5DB" },
  standard: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

function TierDropdown({ listingId, currentTier, onSet }: {
  listingId: string;
  currentTier: string | null;
  onSet: (id: string, tier: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Close on scroll so fixed menu tracks correctly
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  };

  const select = async (tier: string | null) => {
    if (tier === currentTier) { setOpen(false); return; }
    setBusy(true);
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action: "set_tier", tier }),
    });
    onSet(listingId, tier);
    setBusy(false);
    setOpen(false);
  };

  const key = currentTier ?? "standard";
  const s = TIER_STYLE[key] ?? TIER_STYLE.standard;
  const label = currentTier ? currentTier.charAt(0).toUpperCase() + currentTier.slice(1) : "Standard";

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40 whitespace-nowrap"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      >
        {currentTier && currentTier !== "basic" && <Crown size={11} />}
        {label}
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Fixed-position menu — floats above overflow containers */}
      {open && rect && (
        <div
          ref={menuRef}
          className="rounded-xl shadow-2xl overflow-hidden"
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            width: 160,
            background: "#fff",
            border: "1px solid #E5E5E5",
            zIndex: 9999,
          }}
        >
          <div className="px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sæt Tier</p>
          </div>
          {TIERS.map(t => {
            const active = t.value === currentTier;
            const ts = TIER_STYLE[t.value ?? "standard"] ?? TIER_STYLE.standard;
            return (
              <button
                key={String(t.value)}
                onClick={() => select(t.value)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{ background: active ? ts.bg : "transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? ts.bg : "transparent"; }}
              >
                {t.value && t.value !== "basic" && <Crown size={12} color={ts.color} />}
                {(!t.value || t.value === "basic") && <span className="w-3 h-3 flex-shrink-0" />}
                <span className="text-[13px] font-semibold" style={{ color: ts.color }}>{t.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ts.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Main ── */
export default function AdminAnnoncerPage() {
  const [listings, setListings]         = useState<Listing[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<Tab>("pending");
  const [search, setSearch]             = useState("");
  const [country, setCountry]           = useState("all");
  const [gender, setGender]             = useState("all");
  const [page, setPage]                 = useState(1);
  const [busy, setBusy]                 = useState<string | null>(null);
  const [carouselBusy, setCarouselBusy] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/listings${country !== "all" ? `?country=${encodeURIComponent(country)}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    setListings(json.listings ?? []);
    setLoading(false);
  }, [country]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [tab, search, country, gender]);

  const update = async (id: string, status: "active" | "rejected") => {
    setBusy(id);
    const action = status === "active" ? "approve" : "reject";
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, action }),
    });
    setListings(p => p.map(l => l.id === id ? { ...l, status } : l));
    setBusy(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    setBusy(id);
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, action: "delete" }),
    });
    setListings(p => p.filter(l => l.id !== id));
    setBusy(null);
  };

  const setTier = (id: string, tier: string | null) =>
    setListings(p => p.map(l => l.id === id ? { ...l, tier } : l));

  const toggleCarousel = async (id: string, current: boolean) => {
    setCarouselBusy(id);
    await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, action: "set_carousel", in_carousel: !current }),
    });
    setListings(p => p.map(l => l.id === id ? { ...l, in_carousel: !current } : l));
    setCarouselBusy(null);
  };

  const bulkApprove = async () => {
    const pending = filtered.filter(l => l.status === "pending");
    if (!pending.length) return;
    if (!confirm(`Approve all ${pending.length} pending listings?`)) return;
    setBulkLoading(true);
    await Promise.all(pending.map(l =>
      fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: l.id, action: "approve" }),
      })
    ));
    setListings(p => p.map(l => l.status === "pending" ? { ...l, status: "active" } : l));
    setBulkLoading(false);
  };

  const counts = {
    pending:  listings.filter(l => (l.status ?? "").toLowerCase() === "pending").length,
    active:   listings.filter(l => (l.status ?? "").toLowerCase() === "active").length,
    rejected: listings.filter(l => (l.status ?? "").toLowerCase() === "rejected").length,
    all:      listings.length,
  };

  // All supported countries sorted alphabetically for filter
  const allCountries = [...SUPPORTED_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

  const q = search.toLowerCase();
  const base = tab === "all" ? listings : listings.filter(l => (l.status ?? "").toLowerCase() === tab.toLowerCase());
  const filtered = base
    .filter(l => gender === "all" || (l.gender ?? "").toLowerCase() === gender.toLowerCase())
    .filter(l =>
      !q || l.title?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q)
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
          <h1 className="text-[22px] font-bold text-gray-900">Profiles</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{counts.all} profiles{country !== "all" ? ` in ${country}` : ""}</p>
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

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Tabs */}
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

        {/* Country filter */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-2" style={{ border: "1px solid #E5E5E5" }}>
          <MapPin size={13} color="#9CA3AF" />
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="text-[13px] bg-transparent outline-none text-gray-700 cursor-pointer"
          >
            <option value="all">🌍 All countries</option>
            {allCountries.map(c => (
              <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Gender filter */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-2" style={{ border: "1px solid #E5E5E5" }}>
          <Users size={13} color="#9CA3AF" />
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="text-[13px] bg-transparent outline-none text-gray-700 cursor-pointer"
          >
            <option value="all">All genders</option>
            <option value="Woman">Women</option>
            <option value="Man">Men</option>
            <option value="Trans / Non-binary">Trans</option>
          </select>
        </div>

        {/* Search */}
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
                  {[
                    { label: "",          w: "w-12" },
                    { label: "Listing",   w: "w-[220px]" },
                    { label: "Category",  w: "" },
                    { label: "Location",  w: "w-[160px]" },
                    { label: "Tier",      w: "w-[148px]" },
                    { label: "Carousel",  w: "w-[80px]" },
                    { label: "Status",    w: "" },
                    { label: "Date",      w: "" },
                    { label: "Actions",   w: "" },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${h.w}`}
                      style={{ color: "#9CA3AF" }}>{h.label}</th>
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
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={l.profile_image} alt="" className="w-9 h-9 rounded-lg object-cover" />
                          : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold"
                              style={{ background: "#F3F4F6", color: "#9CA3AF" }}>N/A</div>}
                      </td>
                      {/* Title + tier badge */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{l.title}</p>
                          {l.tier === "vip" && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D" }}>VIP</span>
                          )}
                          {l.tier === "featured" && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>FEAT</span>
                          )}
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{l.category ?? "—"}</td>
                      {/* Location — flag + by, land */}
                      <td className="px-4 py-3 text-[12px] text-gray-600 whitespace-nowrap">
                        {l.country ? (
                          <span className="flex items-center gap-1.5">
                            <span>{getFlag(l.country)}</span>
                            <span>{[l.city, l.country].filter(Boolean).join(", ")}</span>
                          </span>
                        ) : "—"}
                      </td>
                      {/* Tier — editable dropdown */}
                      <td className="px-4 py-3">
                        <TierDropdown listingId={l.id} currentTier={l.tier} onSet={setTier} />
                      </td>
                      {/* Carousel toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleCarousel(l.id, l.in_carousel)}
                          disabled={carouselBusy === l.id}
                          title={l.in_carousel ? "Fjern fra carousel" : "Tilføj til carousel"}
                          className="p-1.5 rounded-md transition-all disabled:opacity-40"
                          style={{ color: l.in_carousel ? "#F59E0B" : "#D1D5DB" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#FFFBEB"; e.currentTarget.style.color = "#F59E0B"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = l.in_carousel ? "#F59E0B" : "#D1D5DB"; }}
                        >
                          <Star size={16} fill={l.in_carousel ? "#F59E0B" : "none"} />
                        </button>
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
                          <Link href={`/ads/${l.id}`} target="_blank"
                            className="p-1.5 rounded-md transition-colors" title="Preview"
                            style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Eye size={14} />
                          </Link>
                          <Link href={`/admin/listings/${l.id}/edit`}
                            className="p-1.5 rounded-md transition-colors" title="Admin Edit"
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
              {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(n => (
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
