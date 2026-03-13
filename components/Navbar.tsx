"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User, Plus, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const { t } = useLanguage();

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

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16">
        {/* Logo */}
        <a href="/" className="text-xl font-black tracking-wider" style={{ color: "#8B0000", letterSpacing: "0.08em" }}>
          REDLIGHTAD
        </a>

        {/* Center nav — desktop */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="/" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
            {t.nav_home}
          </a>
          <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            {t.nav_support}
          </a>
          <a href="/opret-annonce" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {t.nav_post_ad}
          </a>
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-48 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-0 transition-all"
            />
          </div>

          {/* Language selector */}
          <LanguageSelector />

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                {t.nav_dashboard}
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                <User className="w-3.5 h-3.5" />
                {t.nav_my_account}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-300 transition-colors">
                {t.nav_login}
              </Link>
              <Link href="/register" className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                {t.nav_create_account}
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 py-4">
            <a href="/" className="text-sm font-medium text-gray-900">{t.nav_home}</a>
            <a href="#" className="text-sm font-medium text-gray-500">{t.nav_support}</a>
            <a href="/opret-annonce" className="text-sm font-medium text-gray-500">{t.nav_post_ad}</a>
          </div>
          <div className="mb-4"><LanguageSelector /></div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none" />
          </div>
          {user ? (
            <Link href="/dashboard" className="block w-full text-center bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium">
              {t.nav_dashboard}
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1 text-center border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium">{t.nav_login}</Link>
              <Link href="/register" className="flex-1 text-center bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium">{t.nav_create_account}</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
