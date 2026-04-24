"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { getLocaleFromDomain } from "@/lib/seo"
import { SUPPORTED_COUNTRIES, getCountry } from "@/lib/countries"
import "flag-icons/css/flag-icons.min.css"

// Map locale to country code for auto-selection
const LOCALE_TO_COUNTRY: Record<string, string> = {
  nl: 'nl', de: 'de', da: 'dk', fr: 'fr', es: 'es', it: 'it',
  pt: 'pt', sv: 'se', no: 'no', pl: 'pl', cs: 'cz', ru: 'ru',
  th: 'th', ar: 'ae', en: '',
}

// Popular countries for quick access
const POPULAR_CODES = ["dk", "de", "nl", "gb", "fr", "es", "it", "us", "th", "ae", "se", "no", "ch", "pt", "pl"]

// Continent groups
const CONTINENT_ORDER = ["EU", "NA", "AS", "AF", "OC"]
const CONTINENT_NAMES: Record<string, string> = {
  EU: "Europe",
  NA: "Americas",
  SA: "Americas", 
  AS: "Asia & Middle East",
  AF: "Africa",
  OC: "Oceania"
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

export default function CountrySelector({ onClose, forceOpen }: Props) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState("")
  const [countries, setCountries] = useState<GeoCountry[]>([])
  const [loading, setLoading] = useState(true)
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

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!search) return countries
    const q = search.toLowerCase()
    return countries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.iso_code.toLowerCase().includes(q)
    )
  }, [countries, search])

  // Group by continent
  const groupedCountries = useMemo(() => {
    const groups: Record<string, GeoCountry[]> = {}
    
    for (const country of filteredCountries) {
      let continent = country.continent || "OC"
      if (continent === "SA") continent = "NA"
      
      if (!groups[continent]) groups[continent] = []
      groups[continent].push(country)
    }
    
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return groups
  }, [filteredCountries])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f1419] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Select Your Location</h2>
                <p className="text-sm text-gray-500">Choose a country to browse local listings</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={() => { setVisible(false); onClose() }} 
                className="text-gray-500 hover:text-white transition-colors w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1a2028] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-700 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : search ? (
            // Search results - 3 columns
            filteredCountries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No countries found for &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
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
          ) : (
            // Grouped by continent
            CONTINENT_ORDER.map(continent => {
              const countriesInGroup = groupedCountries[continent]
              if (!countriesInGroup?.length) return null
              
              return (
                <div key={continent}>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                    {CONTINENT_NAMES[continent]}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
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
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-[#0a0d10]">
          <p className="text-xs text-gray-600 text-center">
            {countries.length} countries available
          </p>
        </div>
      </div>
    </div>
  )
}

// Country button with square flag
function CountryButton({ code, name, onClick }: { 
  code: string
  name: string
  onClick: () => void
}) {
  const flagCode = code.toLowerCase()
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-800/70 transition-colors text-left group"
    >
      <span 
        className={`fi fi-${flagCode} fis`} 
        style={{ 
          width: 20, 
          height: 15
        }} 
      />
      <span className="text-sm text-gray-300 group-hover:text-white truncate">{name}</span>
    </button>
  )
}
