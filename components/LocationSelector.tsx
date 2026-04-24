"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase"

interface LocationValue {
  country: string
  countryName: string
  region: string
  regionName: string
  city: string
}

interface LocationSelectorProps {
  value: LocationValue
  onChange: (val: LocationValue) => void
  compact?: boolean
}

interface GeoCountry {
  id: string
  iso_code: string
  name: string
  continent: string
}

interface GeoRegion {
  id: string
  name: string
  admin1_code: string
}

interface GeoCity {
  id: string
  name: string
  population: number
}

// Emoji flag from 2-letter ISO code
function codeToFlag(code: string): string {
  const c = code.toUpperCase()
  if (c.length !== 2) return "🌍"
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
}

const POPULAR_CODES = ["US", "GB", "DE", "FR", "NL", "DK", "SE", "NO", "ES", "IT", "CH", "TH", "AE"]

export default function LocationSelector({ value, onChange, compact = false }: LocationSelectorProps) {
  const [countries, setCountries] = useState<GeoCountry[]>([])
  const [regions, setRegions] = useState<GeoRegion[]>([])
  const [cities, setCities] = useState<GeoCity[]>([])
  const [loading, setLoading] = useState({ countries: true, regions: false, cities: false })
  const [countrySearch, setCountrySearch] = useState("")
  const [citySearch, setCitySearch] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  const supabase = createClient()
  const countryRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  // Fetch countries
  useEffect(() => {
    async function fetchCountries() {
      const { data } = await supabase
        .from("geo_countries")
        .select("id, iso_code, name, continent")
        .order("name")
      
      if (data) setCountries(data)
      setLoading(l => ({ ...l, countries: false }))
    }
    fetchCountries()
  }, [])

  // Fetch regions when country changes
  useEffect(() => {
    if (!value.country) {
      setRegions([])
      return
    }

    async function fetchRegions() {
      setLoading(l => ({ ...l, regions: true }))
      
      const { data } = await supabase
        .from("geo_regions")
        .select("id, name, admin1_code, country_id!inner(iso_code)")
        .eq("country_id.iso_code", value.country.toUpperCase())
        .order("name")
      
      if (data) {
        setRegions(data.map(r => ({
          id: r.id,
          name: r.name,
          admin1_code: r.admin1_code
        })))
      }
      setLoading(l => ({ ...l, regions: false }))
    }
    fetchRegions()
  }, [value.country])

  // Fetch cities when country/region changes
  useEffect(() => {
    if (!value.country) {
      setCities([])
      return
    }

    async function fetchCities() {
      setLoading(l => ({ ...l, cities: true }))
      
      let query = supabase
        .from("geo_cities")
        .select("id, name, population, country_id!inner(iso_code)")
        .eq("country_id.iso_code", value.country.toUpperCase())
        .order("population", { ascending: false })
        .limit(100)
      
      const { data } = await query
      
      if (data) {
        setCities(data.map(c => ({
          id: c.id,
          name: c.name,
          population: c.population
        })))
      }
      setLoading(l => ({ ...l, cities: false }))
    }
    fetchCities()
  }, [value.country, value.region])

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false)
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!countrySearch) {
      // Show popular first, then rest
      const popular = countries.filter(c => POPULAR_CODES.includes(c.iso_code))
      const rest = countries.filter(c => !POPULAR_CODES.includes(c.iso_code))
      return [...popular, ...rest]
    }
    const q = countrySearch.toLowerCase()
    return countries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.iso_code.toLowerCase().includes(q)
    )
  }, [countries, countrySearch])

  // Filter cities
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities
    const q = citySearch.toLowerCase()
    return cities.filter(c => c.name.toLowerCase().includes(q))
  }, [cities, citySearch])

  const selectedCountry = countries.find(c => c.iso_code.toLowerCase() === value.country?.toLowerCase())

  const baseSelect = compact
    ? "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"

  const containerClass = compact
    ? "flex items-center gap-2 flex-wrap"
    : "space-y-3"

  return (
    <div className={containerClass}>
      {/* Country Selector */}
      <div className={`relative ${compact ? "" : "w-full"}`} ref={countryRef}>
        <button
          type="button"
          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
          className={`${baseSelect} flex items-center gap-2 cursor-pointer ${compact ? "min-w-[180px]" : "w-full"}`}
        >
          {selectedCountry ? (
            <>
              <span className="text-lg">{codeToFlag(selectedCountry.iso_code)}</span>
              <span className="truncate">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select country...</span>
          )}
          <svg className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCountryDropdown && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-80 min-w-[280px]">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search countries..."
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-rose-400"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-60">
              {loading.countries ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No countries found</div>
              ) : (
                <>
                  {!countrySearch && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase bg-gray-50">Popular</div>
                  )}
                  {filteredCountries.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange({
                          country: c.iso_code.toLowerCase(),
                          countryName: c.name,
                          region: "",
                          regionName: "",
                          city: ""
                        })
                        setShowCountryDropdown(false)
                        setCountrySearch("")
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-rose-50 transition-colors ${
                        value.country?.toLowerCase() === c.iso_code.toLowerCase() ? "bg-rose-50" : ""
                      } ${!countrySearch && i === POPULAR_CODES.length ? "border-t border-gray-100 mt-1 pt-3" : ""}`}
                    >
                      <span className="text-xl">{codeToFlag(c.iso_code)}</span>
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      {POPULAR_CODES.includes(c.iso_code) && !countrySearch && (
                        <span className="ml-auto text-[10px] font-medium text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded">Popular</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Region Selector */}
      {value.country && regions.length > 0 && (
        <select
          className={baseSelect}
          value={value.region}
          onChange={(e) => {
            const region = regions.find(r => r.admin1_code === e.target.value)
            onChange({
              ...value,
              region: e.target.value,
              regionName: region?.name || "",
              city: ""
            })
          }}
        >
          <option value="">Select region...</option>
          {regions.map(r => (
            <option key={r.id} value={r.admin1_code}>{r.name}</option>
          ))}
        </select>
      )}

      {/* City Selector */}
      {value.country && (
        <div className={`relative ${compact ? "" : "w-full"}`} ref={cityRef}>
          <button
            type="button"
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className={`${baseSelect} flex items-center gap-2 cursor-pointer ${compact ? "min-w-[180px]" : "w-full"}`}
          >
            {value.city ? (
              <span className="truncate">{value.city}</span>
            ) : (
              <span className="text-gray-400">Select city...</span>
            )}
            <svg className="w-4 h-4 ml-auto text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCityDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden max-h-80 min-w-[250px]">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search cities..."
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-rose-400"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-60">
                {loading.cities ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                ) : filteredCities.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {citySearch ? "No cities found" : "No cities available"}
                  </div>
                ) : (
                  filteredCities.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange({ ...value, city: c.name })
                        setShowCityDropdown(false)
                        setCitySearch("")
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-rose-50 transition-colors ${
                        value.city === c.name ? "bg-rose-50" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      {c.population > 0 && (
                        <span className="text-xs text-gray-400">
                          {c.population > 1000000 
                            ? `${(c.population / 1000000).toFixed(1)}M`
                            : c.population > 1000 
                            ? `${Math.round(c.population / 1000)}K`
                            : c.population.toLocaleString()
                          }
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              
              {/* Manual input option */}
              {citySearch && !filteredCities.some(c => c.name.toLowerCase() === citySearch.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, city: citySearch })
                    setShowCityDropdown(false)
                    setCitySearch("")
                  }}
                  className="w-full px-3 py-2.5 text-left border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-rose-500">+ Add &quot;{citySearch}&quot; as custom city</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
