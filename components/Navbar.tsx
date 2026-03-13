"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/" className="text-xl font-extrabold tracking-tight text-red-600">
          REDLIGHTAD
        </a>

        {/* Center nav — desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <a href="/" className="text-sm font-medium text-gray-900 hover:text-red-600">
            {t.nav_home}
          </a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
            {t.nav_support}
          </a>
          <a href="/opret-annonce" className="text-sm font-medium text-gray-600 hover:text-red-600">
            {t.nav_post_ad}
          </a>
        </div>

        {/* Right side — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-44 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <LanguageSelector />
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                {t.nav_dashboard}
              </Link>
              <span className="text-xs text-gray-400 hidden md:block max-w-[120px] truncate">{user.email}</span>
              <Link
                href="/dashboard"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {t.nav_my_account}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-red-600 border border-gray-200 px-4 py-2 rounded-xl transition-colors">
                {t.nav_login}
              </Link>
              <Link href="/register" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                {t.nav_create_account}
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 py-3">
            <a href="/" className="text-sm font-medium text-gray-900">{t.nav_home}</a>
            <a href="#" className="text-sm font-medium text-gray-600">{t.nav_support}</a>
            <a href="/opret-annonce" className="text-sm font-medium text-gray-600">{t.nav_post_ad}</a>
          </div>
          <div className="mb-3">
            <LanguageSelector />
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {user ? (
            <div className="flex gap-2">
              <Link href="/dashboard" className="flex-1 rounded-xl bg-red-600 py-2 text-center text-sm font-medium text-white">
                {t.nav_dashboard}
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1 rounded-xl border border-gray-300 py-1.5 text-center text-sm font-medium text-gray-700">
                {t.nav_login}
              </Link>
              <Link href="/register" className="flex-1 rounded-xl bg-red-600 py-1.5 text-center text-sm font-medium text-white">
                {t.nav_create_account}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
