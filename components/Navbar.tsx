"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Globe, Search, ChevronDown, MapPin, LayoutGrid, Users, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
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
            <button className="flex-shrink-0 flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              Tilpasset søgning
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
