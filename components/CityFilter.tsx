"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getLocaleFromDomain } from "@/lib/seo"
import { getCitiesForCountry } from "@/lib/cities"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"

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
    <div className="bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="relative py-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Browse by city</span>
          </div>
          
          {/* Scroll container with arrows */}
          <div className="relative group">
            {/* Left arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 -ml-2 md:ml-0"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            
            {/* Right arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 -mr-2 md:mr-0"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            )}
            
            {/* Scrollable city list */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All cities pill */}
              <button
                onClick={() => handleCityClick(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  !selectedCity
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                All {countryName}
              </button>
              
              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />
              
              {/* City pills */}
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCity === city
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-600"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          
          {/* Gradient fade on edges (desktop) */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50/50 to-transparent pointer-events-none" />
        </div>
      </div>
      
      {/* Bottom border with subtle gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  )
}
