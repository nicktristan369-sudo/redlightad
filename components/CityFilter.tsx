"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getLocaleFromDomain } from "@/lib/seo"
import { getCitiesForCountry } from "@/lib/cities"
import { useLanguage } from "@/lib/i18n/LanguageContext"

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
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countryName, setCountryName] = useState<string | null>(null)
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

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
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* All cities button */}
          <button
            onClick={() => handleCityClick(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCity
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Cities
          </button>
          
          {/* City buttons */}
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCity === city
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
