"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SUPPORTED_COUNTRIES, POPULAR_COUNTRY_CODES, getCountry } from "@/lib/countries"

interface Props {
  onClose?: () => void
  forceOpen?: boolean
}

export default function CountrySelector({ onClose, forceOpen }: Props) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (forceOpen) { setVisible(true); return }
    try {
      const ageVerified = localStorage.getItem("age_verified")
      const selectedCountry = localStorage.getItem("selected_country")
      if (ageVerified && !selectedCountry) setVisible(true)
    } catch { /* ignore */ }
  }, [forceOpen])

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 100)
  }, [visible])

  const handleSelect = (code: string) => {
    try {
      localStorage.setItem("selected_country", code)
      // Store name too so PremiumCarousel can filter by country name
      const match = SUPPORTED_COUNTRIES.find(c => c.code === code)
      if (match) localStorage.setItem("selected_country_name", match.name)
      // Notify same-tab listeners (storage event only fires cross-tab)
      window.dispatchEvent(new Event("countryChanged"))
    } catch { /* ignore */ }
    setVisible(false)
    onClose?.()
    router.push(`/${code}`)
  }

  const filteredCountries = SUPPORTED_COUNTRIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  )

  const popularCountries = SUPPORTED_COUNTRIES.filter(c => POPULAR_COUNTRY_CODES.includes(c.code))

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Select Your Country</h2>
              <p className="text-sm text-gray-400 mt-0.5">Choose where you want to browse</p>
            </div>
            {onClose && (
              <button onClick={() => { setVisible(false); onClose() }} className="text-gray-400 hover:text-gray-700 text-2xl font-light w-8 h-8 flex items-center justify-center">×</button>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-gray-50"
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {!search && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Popular</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {popularCountries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <span className={`fi fi-${c.code}`} style={{ width: "20px", height: "15px", display: "inline-block" }} />
                    <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">All Countries</p>
            </>
          )}

          {search && filteredCountries.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No countries found for "{search}"</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(search ? filteredCountries : SUPPORTED_COUNTRIES).map(c => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c.code)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <span className={`fi fi-${c.code}`} style={{ width: "20px", height: "15px", display: "inline-block" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 uppercase">{c.code}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
