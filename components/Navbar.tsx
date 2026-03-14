"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X, Globe, Search, ChevronDown, MapPin, LayoutGrid, Users, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase";
import {
  BODY_BUILD_OPTIONS,
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
  GROOMING_OPTIONS,
  BRA_SIZE_OPTIONS,
  NATIONALITY_OPTIONS,
} from "@/lib/listingOptions";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [customSearchOpen, setCustomSearchOpen] = useState(false);
  const customSearchRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    ageMin: "", ageMax: "",
    heightMin: "", heightMax: "",
    weightMin: "", weightMax: "",
    body_build: "", hair_color: "", eye_color: "",
    grooming: "", bra_size: "", nationality: "",
    outcall: false, handicap_friendly: false,
    has_own_place: false, is_trans: false, old_ads: false,
  });

  const resetFilters = () => setFilters({
    ageMin: "", ageMax: "",
    heightMin: "", heightMax: "",
    weightMin: "", weightMax: "",
    body_build: "", hair_color: "", eye_color: "",
    grooming: "", bra_size: "", nationality: "",
    outcall: false, handicap_friendly: false,
    has_own_place: false, is_trans: false, old_ads: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email || "" });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email || "" } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close custom search on click outside or ESC
  useEffect(() => {
    if (!customSearchOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (customSearchRef.current && !customSearchRef.current.contains(e.target as Node)) {
        setCustomSearchOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [customSearchOpen]);

  return (
    <>
      {/* ── Main navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-xl font-black tracking-wide">
            <span style={{ color: "#CC0000" }}>RED</span>
            <span className="text-black">LIGHTAD</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 ml-2">
            <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
              Home
            </Link>
            <Link href="/support" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Support
            </Link>
            <Link href="/opret-annonce" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Post an Ad
            </Link>
          </div>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for profiles, city or keyword..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Right — desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Language */}
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              US
            </button>

            {/* Auth */}
            {user ? (
              <Link href="/dashboard" className="bg-gray-900 hover:bg-black text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-gray-900 hover:bg-black text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors whitespace-nowrap">
                  Login / Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-5 md:hidden">
            {/* Search */}
            <div className="relative my-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for profiles, city or keyword..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:outline-none"
              />
            </div>
            {/* Links */}
            <div className="flex flex-col gap-3 mb-4">
              <Link href="/" className="text-sm font-semibold text-gray-900" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/support" className="text-sm font-medium text-gray-500" onClick={() => setMobileOpen(false)}>Support</Link>
              <Link href="/opret-annonce" className="text-sm font-medium text-gray-500" onClick={() => setMobileOpen(false)}>Post an Ad</Link>
            </div>
            {/* Auth */}
            {user ? (
              <Link href="/dashboard" className="block w-full text-center bg-gray-900 text-white py-3 rounded-full text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/register" className="block w-full text-center bg-gray-900 text-white py-3 rounded-full text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                Login / Create Account
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
            {/* Hele landet */}
            <button className="flex-shrink-0 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Hele landet
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Alle kategorier */}
            <button className="flex-shrink-0 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
              Alle kategorier
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Alle køn */}
            <button className="flex-shrink-0 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              Alle køn
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Tilpasset søgning */}
            <button
              onClick={() => setCustomSearchOpen(!customSearchOpen)}
              className={`flex-shrink-0 flex items-center gap-2 border rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                customSearchOpen
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${customSearchOpen ? "text-white" : "text-gray-400"}`} />
              Tilpasset søgning
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${customSearchOpen ? "text-white rotate-180" : "text-gray-400"}`} />
            </button>
          </div>

          {/* Custom search dropdown */}
          {customSearchOpen && (
            <div
              ref={customSearchRef}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-full max-w-[800px] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
            >
              {/* Fysiske mål */}
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Fysiske mål</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Alder", minKey: "ageMin", maxKey: "ageMax", min: 18, max: 99 },
                  { label: "Højde (cm)", minKey: "heightMin", maxKey: "heightMax", min: 140, max: 220 },
                  { label: "Vægt (kg)", minKey: "weightMin", maxKey: "weightMax", min: 40, max: 150 },
                ].map((r) => (
                  <div key={r.label}>
                    <span className="block text-xs text-gray-500 mb-1">{r.label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={r.min}
                        max={r.max}
                        placeholder="Min"
                        value={filters[r.minKey as keyof typeof filters] as string}
                        onChange={(e) => setFilters((p) => ({ ...p, [r.minKey]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="number"
                        min={r.min}
                        max={r.max}
                        placeholder="Max"
                        value={filters[r.maxKey as keyof typeof filters] as string}
                        onChange={(e) => setFilters((p) => ({ ...p, [r.maxKey]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Udseende */}
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Udseende</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Kropsbygning", key: "body_build", options: BODY_BUILD_OPTIONS },
                  { label: "Hårfarve", key: "hair_color", options: HAIR_COLOR_OPTIONS },
                  { label: "Øjenfarve", key: "eye_color", options: EYE_COLOR_OPTIONS },
                  { label: "Intimbelshåring", key: "grooming", options: GROOMING_OPTIONS },
                  { label: "BH-størrelse", key: "bra_size", options: BRA_SIZE_OPTIONS },
                  { label: "Nationalitet", key: "nationality", options: NATIONALITY_OPTIONS },
                ].map((s) => (
                  <div key={s.key}>
                    <span className="block text-xs text-gray-500 mb-1">{s.label}</span>
                    <select
                      value={filters[s.key as keyof typeof filters] as string}
                      onChange={(e) => setFilters((p) => ({ ...p, [s.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    >
                      <option value="">Alle</option>
                      {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Checkboxes */}
              <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Ekstra</h4>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
                {[
                  { key: "outcall", label: "Kører escort" },
                  { key: "handicap_friendly", label: "Modtager handicappede" },
                  { key: "has_own_place", label: "Har eget sted" },
                  { key: "is_trans", label: "Trans" },
                  { key: "old_ads", label: "Gamle annoncer" },
                ].map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[c.key as keyof typeof filters] as boolean}
                      onChange={(e) => setFilters((p) => ({ ...p, [c.key]: e.target.checked }))}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    {c.label}
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Ryd filtre
                </button>
                <button
                  onClick={() => setCustomSearchOpen(false)}
                  className="bg-gray-900 hover:bg-black text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors"
                >
                  Vis resultater
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
