"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            Home
          </a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
            Support
          </a>
          <a href="/opret-annonce" className="text-sm font-medium text-gray-600 hover:text-red-600">
            Post an Ad
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
          <Link href="/login" className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Login
          </Link>
          <Link href="/register" className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">
            Create Account
          </Link>
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
            <a href="/" className="text-sm font-medium text-gray-900">Home</a>
            <a href="#" className="text-sm font-medium text-gray-600">Support</a>
            <a href="/opret-annonce" className="text-sm font-medium text-gray-600">Post an Ad</a>
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
          <div className="flex gap-2">
            <Link href="/login" className="flex-1 rounded-lg border border-gray-300 py-1.5 text-center text-sm font-medium text-gray-700">
              Login
            </Link>
            <Link href="/register" className="flex-1 rounded-lg bg-red-600 py-1.5 text-center text-sm font-medium text-white">
              Create Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
