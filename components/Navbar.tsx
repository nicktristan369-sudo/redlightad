"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Menu, X, Search, ChevronDown, MapPin, LayoutGrid, Users, SlidersHorizontal, Globe, Home, Star, CheckCircle, Play, MessageSquare, ShoppingBag, LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import CountrySelector from "@/components/CountrySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  BODY_BUILD_OPTIONS,
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
  GROOMING_OPTIONS,
  BRA_SIZE_OPTIONS,
  NATIONALITY_OPTIONS,
} from "@/lib/listingOptions";
import { CATEGORIES } from "@/lib/constants/categories";
import { GENDERS } from "@/lib/constants/genders";

export default function Navbar() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [customSearchOpen, setCustomSearchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [categoryRect, setCategoryRect] = useState<DOMRect | null>(null);
  const [genderRect, setGenderRect] = useState<DOMRect | null>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; flag: string; name: string } | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
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
    try {
      const code = localStorage.getItem("selected_country");
      if (code) {
        import("@/lib/countries").then(({ getCountry }) => {
          const c = getCountry(code);
          if (c) setSelectedCountry({ code: c.code, flag: c.flag, name: c.name });
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email || "", id: user.id });
        supabase.from("wallets").select("balance").eq("user_id", user.id).single()
          .then(({ data }) => { if (data) setCoinBalance(data.balance) });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email || "", id: session.user.id } : null);
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

  // Close category/gender dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(t)) setCategoryOpen(false);
      if (genderRef.current && !genderRef.current.contains(t)) setGenderOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Update rect on scroll so fixed dropdown follows the button
  useEffect(() => {
    const onScroll = () => {
      if (categoryOpen && categoryRef.current) setCategoryRect(categoryRef.current.getBoundingClientRect());
      if (genderOpen && genderRef.current) setGenderRect(genderRef.current.getBoundingClientRect());
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categoryOpen, genderOpen]);

  return (
    <>
      {showCountrySelector && (
        <CountrySelector
          forceOpen
          onClose={() => {
            setShowCountrySelector(false);
            try {
              const code = localStorage.getItem("selected_country");
              if (code) {
                import("@/lib/countries").then(({ getCountry }) => {
                  const c = getCountry(code);
                  if (c) setSelectedCountry({ code: c.code, flag: c.flag, name: c.name });
                });
              }
            } catch { /* ignore */ }
          }}
        />
      )}
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
              {t.nav_home}
            </Link>
            <Link href="/support" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {t.nav_support}
            </Link>
            <Link href="/opret-annonce" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {t.nav_post_ad}
            </Link>
          </div>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t.search_placeholder}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Right — desktop */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">

            {/* Country + Language + separator */}
            <div className="flex items-center gap-3">
              {selectedCountry && (
                <button
                  onClick={() => setShowCountrySelector(true)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  <span className={`fi fi-${selectedCountry.code} flex-shrink-0`} style={{ width: "15px", height: "11px", display: "inline-block" }} />
                  <span>{selectedCountry.name}</span>
                  <ChevronDown size={11} className="text-gray-400" />
                </button>
              )}
              <span className="w-px h-4 bg-gray-200 flex-shrink-0" />
              <LanguageSelector />
            </div>

            {/* Separator before auth */}
            <span className="w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Coin balance */}
            {user && coinBalance !== null && (
              <Link href="/dashboard/wallet" className="flex items-center gap-1 text-[13px] font-semibold text-red-600 hover:text-red-700 transition-colors">
                🔴 {coinBalance}
              </Link>
            )}

            {/* Auth */}
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gray-900 hover:bg-black text-white text-[13px] font-semibold px-4 py-2 transition-colors whitespace-nowrap"
                style={{ borderRadius: "8px" }}
              >
                {t.nav_dashboard}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
                  {t.nav_login}
                </Link>
                <Link
                  href="/register"
                  className="bg-gray-900 hover:bg-black text-white text-[13px] font-semibold px-4 py-2 transition-colors whitespace-nowrap flex items-center gap-1"
                  style={{ borderRadius: "8px" }}
                >
                  {t.nav_create_account} →
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
        {/* Mobile menu — full-screen slide-in overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[9998] md:hidden flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <div className="animate-slide-in-left relative flex flex-col w-[82vw] max-w-[340px] h-full overflow-y-auto" style={{ background: "#F5F5F7" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E5E5E5" }}>
                <span className="text-[17px] font-black tracking-tight">
                  <span style={{ color: "#CC0000" }}>RED</span><span style={{ color: "#000" }}>LIGHTAD</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  <X size={20} color="#111" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex flex-col py-3 px-3 gap-0.5">
                {[
                  { href: "/",               icon: <Home size={18} />,         label: "Home" },
                  { href: "/search",         icon: <Search size={18} />,       label: "Search" },
                  { href: "/annoncer",       icon: <Star size={18} />,         label: "Premium Profiles" },
                  { href: "/available-now",  icon: <CheckCircle size={18} />,  label: "Available Now" },
                  { href: "/videos",         icon: <Play size={18} />,         label: "Videos" },
                  { href: "/reviews",        icon: <MessageSquare size={18} />,label: "Reviews" },
                  { href: "/marketplace",    icon: <ShoppingBag size={18} />,  label: "Marketplace" },
                ].map(({ href, icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors"
                    style={{ color: "#111" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#EBEBEB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ color: "#9CA3AF" }} className="group-hover:text-[#CC0000] transition-colors">{icon}</span>
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Divider */}
              <div style={{ height: "1px", background: "#E5E5E5", margin: "0 16px" }} />

              {/* Auth section */}
              <div className="flex flex-col gap-2 px-4 py-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold text-white transition-colors"
                    style={{ background: "#000" }}
                  >
                    {t.nav_dashboard}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors"
                      style={{ color: "#111" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#EBEBEB"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <LogIn size={18} color="#9CA3AF" />
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold text-white transition-colors"
                      style={{ background: "#CC0000" }}
                    >
                      <UserPlus size={16} />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#E5E5E5", margin: "0 16px" }} />

              {/* Language */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={e => { e.currentTarget.style.background = "#EBEBEB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Globe size={18} color="#9CA3AF" />
                  <span className="text-[15px] font-medium" style={{ color: "#111" }}>Language</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </nav>

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">

            {/* Category dropdown */}
            <div className="relative flex-shrink-0">
              <button
                ref={categoryRef}
                onClick={() => {
                  const r = categoryRef.current?.getBoundingClientRect() ?? null;
                  setCategoryRect(r);
                  setCategoryOpen(o => !o);
                  setGenderOpen(false);
                }}
                className="inline-flex items-center gap-2 border bg-white px-4 py-2 text-[14px] font-medium transition-colors whitespace-nowrap"
                style={{ borderRadius: "8px", borderColor: categoryOpen ? "#000" : "#D1D5DB", color: selectedCategory ? "#000" : "#374151" }}
              >
                <LayoutGrid size={14} color="#6B7280" />
                {selectedCategory || t.filter_all_categories}
                <ChevronDown size={12} color="#6B7280" className={`transition-transform duration-150 ${categoryOpen ? "rotate-180" : ""}`} />
              </button>
              {categoryOpen && categoryRect && (
                <div className="fixed z-[9999] w-52 animate-dropdown"
                  style={{ top: categoryRect.bottom + 6, left: categoryRect.left, background: "#fff", border: "1px solid #E5E5E5", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "8px" }}>
                  <button
                    onClick={() => { setSelectedCategory(null); setCategoryOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors duration-150 rounded-lg"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {t.filter_all_categories}
                  </button>
                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors duration-150 rounded-lg flex items-center justify-between"
                      style={{ background: selectedCategory === cat ? "#000" : "transparent", color: selectedCategory === cat ? "#fff" : "#111" }}
                      onMouseEnter={e => { if (selectedCategory !== cat) e.currentTarget.style.background = "#F5F5F5" }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedCategory === cat ? "#000" : "transparent" }}
                    >
                      {cat}
                      {selectedCategory === cat && <span className="text-white text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender dropdown */}
            <div className="relative flex-shrink-0">
              <button
                ref={genderRef}
                onClick={() => {
                  const r = genderRef.current?.getBoundingClientRect() ?? null;
                  setGenderRect(r);
                  setGenderOpen(o => !o);
                  setCategoryOpen(false);
                }}
                className="inline-flex items-center gap-2 border bg-white px-4 py-2 text-[14px] font-medium transition-colors whitespace-nowrap"
                style={{ borderRadius: "8px", borderColor: genderOpen ? "#000" : "#D1D5DB", color: selectedGender ? "#000" : "#374151" }}
              >
                <Users size={14} color="#6B7280" />
                {selectedGender || t.filter_all_genders}
                <ChevronDown size={12} color="#6B7280" className={`transition-transform duration-150 ${genderOpen ? "rotate-180" : ""}`} />
              </button>
              {genderOpen && genderRect && (
                <div className="fixed z-[9999] w-44 animate-dropdown"
                  style={{ top: genderRect.bottom + 6, left: genderRect.left, background: "#fff", border: "1px solid #E5E5E5", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "8px" }}>
                  <button
                    onClick={() => { setSelectedGender(null); setGenderOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors duration-150 rounded-lg"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {t.filter_all_genders}
                  </button>
                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  {GENDERS.map(g => (
                    <button
                      key={g}
                      onClick={() => { setSelectedGender(g); setGenderOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors duration-150 rounded-lg flex items-center justify-between"
                      style={{ background: selectedGender === g ? "#000" : "transparent", color: selectedGender === g ? "#fff" : "#111" }}
                      onMouseEnter={e => { if (selectedGender !== g) e.currentTarget.style.background = "#F5F5F5" }}
                      onMouseLeave={e => { e.currentTarget.style.background = selectedGender === g ? "#000" : "transparent" }}
                    >
                      {g}
                      {selectedGender === g && <span className="text-white text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <button
              onClick={() => setCustomSearchOpen(!customSearchOpen)}
              className={`flex-shrink-0 inline-flex items-center gap-2 border px-4 py-2 text-[14px] font-medium transition-colors whitespace-nowrap ${
                customSearchOpen
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-[#D1D5DB] bg-white text-[#374151] hover:border-[#9CA3AF]"
              }`}
              style={{ borderRadius: "8px" }}
            >
              <SlidersHorizontal size={14} color={customSearchOpen ? "#fff" : "#6B7280"} />
              Filters
              <ChevronDown size={12} color={customSearchOpen ? "#fff" : "#6B7280"} className={`transition-transform ${customSearchOpen ? "rotate-180" : ""}`} />
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

export { CountrySelector };
