"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getLocaleFromDomain } from "@/lib/seo"
import { Search, MapPin, X, ChevronLeft, ChevronRight, Globe } from "lucide-react"

// Map locale to country info
const LOCALE_TO_COUNTRY: Record<string, { name: string; code: string }> = {
  nl: { name: 'Netherlands', code: 'NL' },
  de: { name: 'Germany', code: 'DE' },
  da: { name: 'Denmark', code: 'DK' },
  fr: { name: 'France', code: 'FR' },
  es: { name: 'Spain', code: 'ES' },
  it: { name: 'Italy', code: 'IT' },
  pt: { name: 'Portugal', code: 'PT' },
  sv: { name: 'Sweden', code: 'SE' },
  no: { name: 'Norway', code: 'NO' },
  pl: { name: 'Poland', code: 'PL' },
  cs: { name: 'Czech Republic', code: 'CZ' },
  ch: { name: 'Switzerland', code: 'CH' },
  gb: { name: 'United Kingdom', code: 'GB' },
  us: { name: 'United States', code: 'US' },
  ca: { name: 'Canada', code: 'CA' },
  au: { name: 'Australia', code: 'AU' },
  br: { name: 'Brazil', code: 'BR' },
  th: { name: 'Thailand', code: 'TH' },
  ae: { name: 'UAE', code: 'AE' },
}

interface CityData {
  name: string
  count: number
  region?: string
}

export default function CityFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [country, setCountry] = useState<{ name: string; code: string } | null>(null)
  const [cities, setCities] = useState<CityData[]>([])
  const [allCities, setAllCities] = useState<CityData[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const [loading, setLoading] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Detect country from domain
  useEffect(() => {
    const hostname = window.location.hostname
    const domainLocale = getLocaleFromDomain(hostname)
    
    if (domainLocale && LOCALE_TO_COUNTRY[domainLocale]) {
      setCountry(LOCALE_TO_COUNTRY[domainLocale])
    }
  }, [])

  // Fetch cities from API
  useEffect(() => {
    if (!country) {
      setLoading(false)
      return
    }

    fetch(`/api/locations?country=${country.code}`)
      .then(r => r.json())
      .then(data => {
        // Top cities for quick access bar
        setCities(data.topCities || [])
        // All cities for search
        const all = data.regions?.flatMap((r: { cities: CityData[] }) => r.cities) || []
        setAllCities(all)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [country])

  // Sync with URL params
  useEffect(() => {
    const cityParam = searchParams.get("city")
    setSelectedCity(cityParam)
  }, [searchParams])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Filter cities for search
  const filteredCities = useMemo(() => {
    if (!searchQuery) return allCities.slice(0, 20)
    const q = searchQuery.toLowerCase()
    return allCities
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 15)
  }, [allCities, searchQuery])

  // Check scroll position for arrows
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [cities])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleCityClick = (city: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set("city", city)
    } else {
      params.delete("city")
    }
    router.push(`?${params.toString()}`, { scroll: false })
    setShowSearch(false)
    setSearchQuery("")
  }

  // Don't render on global domains
  if (!country || loading) {
    return null
  }

  return (
    <>
      {/* Quick Access Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative flex items-center gap-2 py-2">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 z-10 p-1 bg-white dark:bg-gray-900 shadow-md rounded-full"
              >
                <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* City Pills */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Country */}
              <button
                onClick={() => handleCityClick(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedCity
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                All {country.name}
              </button>

              {/* Top Cities */}
              {cities.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleCityClick(city.name)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCity === city.name
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {city.name}
                  {city.count > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">({city.count})</span>
                  )}
                </button>
              ))}

              {/* More Cities Button */}
              {allCities.length > cities.length && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <Search size={14} />
                  More cities
                </button>
              )}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 z-10 p-1 bg-white dark:bg-gray-900 shadow-md rounded-full"
              >
                <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
          />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden animate-dropdown">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Find your city in {country.name}
                </h3>
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type city name..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {/* All Country Option */}
              <button
                onClick={() => handleCityClick(null)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !selectedCity ? "bg-red-50 dark:bg-red-900/20" : ""
                }`}
              >
                <Globe size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  All {country.name}
                </span>
              </button>

              {/* Cities */}
              {filteredCities.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleCityClick(city.name)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedCity === city.name ? "bg-red-50 dark:bg-red-900/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {city.name}
                      </div>
                      {city.region && (
                        <div className="text-xs text-gray-500">{city.region}</div>
                      )}
                    </div>
                  </div>
                  {city.count > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {city.count} profiles
                    </span>
                  )}
                </button>
              ))}

              {filteredCities.length === 0 && searchQuery && (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No cities found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
