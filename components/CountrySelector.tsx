"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getLocaleFromDomain } from "@/lib/seo"
import { SUPPORTED_COUNTRIES, getCountry } from "@/lib/countries"

// Map locale to country code for auto-selection
const LOCALE_TO_COUNTRY: Record<string, string> = {
  nl: 'nl', de: 'de', da: 'dk', fr: 'fr', es: 'es', it: 'it',
  pt: 'pt', sv: 'se', no: 'no', pl: 'pl', cs: 'cz', ru: 'ru',
  th: 'th', ar: 'ae', en: '',
}

// Popular countries for quick access
const POPULAR_CODES = ["dk", "de", "nl", "fr", "es", "it", "gb", "us", "th", "ae", "se", "no", "ch", "pt", "pl"]

// Continent groups
const CONTINENT_ORDER = ["EU", "NA", "SA", "AS", "AF", "OC"] as const
const CONTINENT_NAMES: Record<string, string> = {
  EU: "Europe",
  NA: "Americas",
  SA: "Americas", 
  AS: "Asia & Middle East",
  AF: "Africa",
  OC: "Oceania"
}
const CONTINENT_ICONS: Record<string, string> = {
  EU: "🌍",
  NA: "🌎",
  SA: "🌎",
  AS: "🌏",
  AF: "🌍",
  OC: "🌏"
}

interface GeoCountry {
  id: string
  iso_code: string
  name: string
  continent: string
  population: number
}

interface Props {
  onClose?: () => void
  forceOpen?: boolean
}

// Emoji flag from 2-letter ISO code
function codeToFlag(code: string): string {
  const c = code.toUpperCase()
  if (c.length !== 2) return "🌍"
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
}

export default function CountrySelector({ onClose, forceOpen }: Props) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState("")
  const [countries, setCountries] = useState<GeoCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"popular" | "all">("popular")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Fetch countries from geo_countries
  useEffect(() => {
    async function fetchCountries() {
      try {
        const { data, error } = await supabase
          .from("geo_countries")
          .select("id, iso_code, name, continent, population")
          .order("name")
        
        if (error) throw error
        setCountries(data || [])
      } catch (err) {
        console.error("Failed to fetch countries:", err)
        // Fallback to hardcoded list
        setCountries(SUPPORTED_COUNTRIES.map(c => ({
          id: c.code,
          iso_code: c.code.toUpperCase(),
          name: c.name,
          continent: c.region === "Europe" ? "EU" : c.region === "Americas" ? "NA" : c.region === "Asia" ? "AS" : c.region === "Africa" ? "AF" : "OC",
          population: 0
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    if (forceOpen) { setVisible(true); return }
    try {
      const hostname = window.location.hostname
      const domainLocale = getLocaleFromDomain(hostname)
      const countryFromDomain = LOCALE_TO_COUNTRY[domainLocale]
      
      if (countryFromDomain) {
        localStorage.setItem("selected_country", countryFromDomain)
        const match = SUPPORTED_COUNTRIES.find(c => c.code === countryFromDomain)
        if (match) localStorage.setItem("selected_country_name", match.name)
        window.dispatchEvent(new Event("countryChanged"))
        return
      }
      
      const ageVerified = localStorage.getItem("age_verified")
      const selectedCountry = localStorage.getItem("selected_country")
      if (ageVerified && !selectedCountry) setVisible(true)
    } catch { /* ignore */ }
  }, [forceOpen])

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 100)
  }, [visible])

  const handleSelect = (code: string, name: string) => {
    try {
      localStorage.setItem("selected_country", code.toLowerCase())
      localStorage.setItem("selected_country_name", name)
      window.dispatchEvent(new Event("countryChanged"))
    } catch { /* ignore */ }
    setVisible(false)
    onClose?.()
    
    const hostname = window.location.hostname
    const domainLocale = getLocaleFromDomain(hostname)
    const countryFromDomain = LOCALE_TO_COUNTRY[domainLocale]
    
    if (countryFromDomain) {
      window.location.href = '/'
    } else {
      router.push(`/${code.toLowerCase()}`)
    }
  }

  // Filter and group countries
  const filteredCountries = useMemo(() => {
    if (!search) return countries
    const q = search.toLowerCase()
    return countries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.iso_code.toLowerCase().includes(q)
    )
  }, [countries, search])

  const popularCountries = useMemo(() => {
    return countries.filter(c => POPULAR_CODES.includes(c.iso_code.toLowerCase()))
      .sort((a, b) => POPULAR_CODES.indexOf(a.iso_code.toLowerCase()) - POPULAR_CODES.indexOf(b.iso_code.toLowerCase()))
  }, [countries])

  const groupedCountries = useMemo(() => {
    const groups: Record<string, GeoCountry[]> = {}
    
    for (const country of filteredCountries) {
      let continent = country.continent || "OC"
      // Merge NA and SA into Americas
      if (continent === "SA") continent = "NA"
      
      if (!groups[continent]) groups[continent] = []
      groups[continent].push(country)
    }
    
    // Sort each group by name
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return groups
  }, [filteredCountries])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl shadow-2xl border border-gray-800/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800/50 bg-gradient-to-b from-gray-800/30 to-transparent">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Select Your Location</h2>
                <p className="text-sm text-gray-400">Choose a country to browse local listings</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={() => { setVisible(false); onClose() }} 
                className="text-gray-500 hover:text-white transition-colors w-10 h-10 rounded-xl hover:bg-gray-800/50 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>

          {/* Tabs */}
          {!search && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab("popular")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "popular" 
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                ⭐ Popular
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "all" 
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                🌍 All Countries
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : search ? (
            // Search results
            filteredCountries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No countries found for &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredCountries.map(c => (
                  <CountryButton 
                    key={c.id} 
                    code={c.iso_code} 
                    name={c.name} 
                    onClick={() => handleSelect(c.iso_code, c.name)} 
                  />
                ))}
              </div>
            )
          ) : activeTab === "popular" ? (
            // Popular countries
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularCountries.map(c => (
                <CountryButton 
                  key={c.id} 
                  code={c.iso_code} 
                  name={c.name} 
                  onClick={() => handleSelect(c.iso_code, c.name)}
                  showPopularity
                />
              ))}
            </div>
          ) : (
            // All countries grouped by continent
            <div className="space-y-6">
              {CONTINENT_ORDER.map(continent => {
                const displayContinent = continent === "SA" ? "NA" : continent
                const countriesInGroup = groupedCountries[displayContinent]
                if (!countriesInGroup?.length) return null
                
                return (
                  <div key={continent}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{CONTINENT_ICONS[continent]}</span>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {CONTINENT_NAMES[continent]}
                      </h3>
                      <span className="text-xs text-gray-600">({countriesInGroup.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {countriesInGroup.map(c => (
                        <CountryButton 
                          key={c.id} 
                          code={c.iso_code} 
                          name={c.name} 
                          onClick={() => handleSelect(c.iso_code, c.name)} 
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800/50 bg-gray-900/50">
          <p className="text-xs text-gray-500 text-center">
            {countries.length} countries available • Your selection is saved locally
          </p>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  )
}

// Country button component
function CountryButton({ code, name, onClick, showPopularity }: { 
  code: string
  name: string
  onClick: () => void
  showPopularity?: boolean
}) {
  const flag = codeToFlag(code)
  
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-rose-500/30 hover:bg-gray-800/50 transition-all text-left"
    >
      <span className="text-xl flex-shrink-0">{flag}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{name}</p>
        {showPopularity && (
          <p className="text-[10px] text-rose-400/70">Popular</p>
        )}
      </div>
      <svg className="w-4 h-4 text-gray-600 group-hover:text-rose-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
