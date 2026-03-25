"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ChevronDown, MapPin, Globe } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";
import CountrySelector from "@/components/CountrySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleSearch = () => {
    if (navSearch.trim()) router.push(`/search?q=${encodeURIComponent(navSearch.trim())}`);
    else router.push("/search");
    setSearchOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/premium", label: "Premium" },
    { href: "/available-now", label: "Available Now" },
    { href: "/videos", label: "Videos" },
    { href: "/reviews", label: "Reviews" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/support", label: t.nav_support },
    { href: "/opret-annonce", label: t.nav_post_ad, isPostAd: true },
  ];

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
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#fff",
          borderBottom: "1px solid #F3F3F3",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          height: "56px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
            padding: "0 16px",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0 }}>
            <Logo variant="light" height={28} />
          </Link>

          {/* Right icons: Search + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Search icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <Search size={22} color="#374151" />
            </button>

            {/* Hamburger icon */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <Menu size={22} color="#374151" />
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div
            style={{
              position: "absolute",
              top: "56px",
              left: 0,
              right: 0,
              background: "#fff",
              borderBottom: "1px solid #E5E5E5",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              zIndex: 39,
            }}
          >
            <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
              <input
                type="text"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                placeholder={t.search_placeholder}
                autoFocus
                style={{
                  width: "100%",
                  borderRadius: "9999px",
                  border: "1px solid #E5E5E5",
                  background: "#F9F9F9",
                  padding: "10px 16px 10px 40px",
                  fontSize: "14px",
                  color: "#111",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <Search size={16} color="#9CA3AF" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Overlay ── */}
      <div
        onClick={closeDrawer}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9998,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* ── Slide-in Drawer ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "280px",
          maxWidth: "100vw",
          background: "#fff",
          zIndex: 9999,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 8px" }}>
          <button
            onClick={closeDrawer}
            style={{
              padding: "6px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={22} color="#111" />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {navLinks.map(({ href, label, isPostAd }) => (
            <Link
              key={href}
              href={href}
              onClick={closeDrawer}
              style={{
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: isPostAd ? 700 : 500,
                color: isPostAd ? "#DC2626" : "#111",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: "1px", background: "#E5E5E5", margin: "8px 16px" }} />

        {/* Auth section */}
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {user ? (
            <>
              {coinBalance !== null && (
                <Link
                  href="/dashboard/wallet"
                  onClick={closeDrawer}
                  style={{
                    padding: "14px 8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#DC2626",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DC2626" }} />
                  {coinBalance} coins
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#111",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#000"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#111"; }}
              >
                {t.nav_dashboard}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  background: "#fff",
                  color: "#111",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >
                {t.nav_login}
              </Link>
              <Link
                href="/register"
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#B91C1C"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#DC2626"; }}
              >
                {t.nav_create_account}
              </Link>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#E5E5E5", margin: "8px 16px" }} />

        {/* Language selector */}
        <div style={{ padding: "8px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Globe size={16} color="#9CA3AF" />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280" }}>Language</span>
          </div>
          <LanguageSelector />
        </div>

        {/* Location selector */}
        {selectedCountry && (
          <div style={{ padding: "8px 24px" }}>
            <button
              onClick={() => { setShowCountrySelector(true); closeDrawer(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#111",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              <MapPin size={16} color="#9CA3AF" />
              <span className={`fi fi-${selectedCountry.code}`} style={{ width: "16px", height: "12px", display: "inline-block" }} />
              <span>{selectedCountry.name}</span>
              <ChevronDown size={12} color="#9CA3AF" />
            </button>
          </div>
        )}

        {/* Spacer for bottom padding */}
        <div style={{ height: "24px" }} />
      </div>

      {/* Mobile-specific: make drawer full-width on small screens */}
      <style>{`
        @media (max-width: 639px) {
          div[style*="width: 280px"][style*="z-index: 9999"] {
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
    </>
  );
}

export { CountrySelector };
