"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getLocaleFromDomain } from "@/lib/seo"
import { getCitiesForCountry } from "@/lib/cities"
// Icons removed - cleaner minimal design

// Map locale to country name
const LOCALE_TO_COUNTRY: Record<string, string> = {
  nl: 'Netherlands',
  de: 'Germany',
  da: 'Denmark',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  pt: 'Portugal',
  sv: 'Sweden',
  no: 'Norway',
  pl: 'Poland',
  cs: 'Czech Republic',
  ch: 'Switzerland',
  co: 'Colombia',
  ca: 'Canada',
}

export default function CityFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [countryName, setCountryName] = useState<string | null>(null)
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Detect country from domain
  useEffect(() => {
    const hostname = window.location.hostname
    const domainLocale = getLocaleFromDomain(hostname)
    
    if (domainLocale && LOCALE_TO_COUNTRY[domainLocale]) {
      const country = LOCALE_TO_COUNTRY[domainLocale]
      setCountryName(country)
      setCities(getCitiesForCountry(country))
    }
  }, [])

  // Sync with URL params
  useEffect(() => {
    const cityParam = searchParams.get("city")
    setSelectedCity(cityParam)
  }, [searchParams])

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
    
    const newUrl = params.toString() ? `/?${params.toString()}` : "/"
    router.push(newUrl)
    setSelectedCity(city)
  }

  // Don't render on global domains or if no cities
  if (!countryName || cities.length === 0) {
    return null
  }

  return (
    <div className="bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
        {/* Scrollable city list */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All cities pill */}
          <button
            onClick={() => handleCityClick(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedCity
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            All {countryName}
          </button>
          
          {/* City pills */}
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCity === city
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
