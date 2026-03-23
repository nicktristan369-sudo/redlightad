"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ChevronDown, MapPin, Globe, Home, Crown, CheckCircle, Play, MessageSquare, ShoppingBag, LogIn, UserPlus } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";
import CountrySelector from "@/components/CountrySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; flag: string; name: string } | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

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
          <Link href="/" className="flex-shrink-0">
            <Logo variant="light" height={28} />
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 ml-2">
            <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
              {t.nav_home}
            </Link>
            <Link href="/premium" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <Crown size={14} /> Premium
            </Link>
            <Link href="/available-now" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Available Now
            </Link>
            <Link href="/support" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {t.nav_support}
            </Link>
            <Link href="/opret-annonce" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              {t.nav_post_ad}
            </Link>
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <ShoppingBag size={14} /> Marketplace
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
                <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />{coinBalance}
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
                <Logo variant="light" height={24} />
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  <X size={20} color="#111" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex flex-col py-3 px-3 gap-0.5">
                {[
                  { href: "/",               icon: <Home size={18} />,         label: "Home" },
                  { href: "/search",         icon: <Search size={18} />,       label: "Search" },
                  { href: "/premium",        icon: <Crown size={18} />,        label: "Premium" },
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

      {/* Filter bar is now rendered separately via <FilterBar /> component */}
    </>
  );
}

export { CountrySelector };
