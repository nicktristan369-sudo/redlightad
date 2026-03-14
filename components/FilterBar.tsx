"use client"
import { useState } from "react"
import { Search, MapPin, Grid3X3, Users, ChevronDown, X } from "lucide-react"
import { Country } from "country-state-city"
import { useLanguage } from "@/lib/i18n/LanguageContext"

const POPULAR_ISOS = ["US", "GB", "DK", "SE", "NO", "DE", "FR", "ES", "AU", "CA", "TH", "RU", "PL", "SA"]
const COUNTRY_FLAGS: Record<string, string> = {
  US: "\uD83C\uDDFA\uD83C\uDDF8", GB: "\uD83C\uDDEC\uD83C\uDDE7", DK: "\uD83C\uDDE9\uD83C\uDDF0", SE: "\uD83C\uDDF8\uD83C\uDDEA", NO: "\uD83C\uDDF3\uD83C\uDDF4", DE: "\uD83C\uDDE9\uD83C\uDDEA", FR: "\uD83C\uDDEB\uD83C\uDDF7", ES: "\uD83C\uDDEA\uD83C\uDDF8",
  AU: "\uD83C\uDDE6\uD83C\uDDFA", CA: "\uD83C\uDDE8\uD83C\uDDE6", TH: "\uD83C\uDDF9\uD83C\uDDED", RU: "\uD83C\uDDF7\uD83C\uDDFA", PL: "\uD83C\uDDF5\uD83C\uDDF1", SA: "\uD83C\uDDF8\uD83C\uDDE6", NL: "\uD83C\uDDF3\uD83C\uDDF1",
  IT: "\uD83C\uDDEE\uD83C\uDDF9", JP: "\uD83C\uDDEF\uD83C\uDDF5", KR: "\uD83C\uDDF0\uD83C\uDDF7", BR: "\uD83C\uDDE7\uD83C\uDDF7", MX: "\uD83C\uDDF2\uD83C\uDDFD", IN: "\uD83C\uDDEE\uD83C\uDDF3", ZA: "\uD83C\uDDFF\uD83C\uDDE6",
  AE: "\uD83C\uDDE6\uD83C\uDDEA", SG: "\uD83C\uDDF8\uD83C\uDDEC", NZ: "\uD83C\uDDF3\uD83C\uDDFF", IE: "\uD83C\uDDEE\uD83C\uDDEA", CH: "\uD83C\uDDE8\uD83C\uDDED", AT: "\uD83C\uDDE6\uD83C\uDDF9", BE: "\uD83C\uDDE7\uD83C\uDDEA", PT: "\uD83C\uDDF5\uD83C\uDDF9",
}

export default function FilterBar() {
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  const allCountries = Country.getAllCountries()
  const popularCountries = POPULAR_ISOS
    .map(iso => allCountries.find(c => c.isoCode === iso))
    .filter(Boolean) as typeof allCountries
  const otherCountries = allCountries
    .filter(c => !POPULAR_ISOS.includes(c.isoCode))
    .sort((a, b) => a.name.localeCompare(b.name))

  const hasFilters = selectedCountry || selectedCategory || selectedGender || searchQuery

  const inputClass = "h-11 w-full border border-gray-200 rounded-xl bg-white text-sm text-gray-700 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all placeholder-gray-400"
  const selectWrapClass = "relative flex-shrink-0"
  const selectClass = "h-11 border border-gray-200 rounded-xl pl-9 pr-8 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none cursor-pointer appearance-none transition-colors hover:border-gray-300"

  return (
    <div className="bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Search + filters in one row on desktop, scrollable on mobile */}
        <div className="flex items-center gap-3 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-x-visible">
          {/* Search bar */}
          <div className="relative flex-shrink-0 min-w-[200px] md:flex-1 md:min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className={`${inputClass} pl-10 pr-4`}
            />
          </div>

          {/* Country */}
          <div className={selectWrapClass} style={{ minWidth: "180px" }}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <select
              className={selectClass}
              style={{ minWidth: "180px" }}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">{t.filter_all_countries}</option>
              <optgroup label="Popular">
                {popularCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>{COUNTRY_FLAGS[c.isoCode] || ""} {c.name}</option>
                ))}
              </optgroup>
              <optgroup label="All countries">
                {otherCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>{COUNTRY_FLAGS[c.isoCode] || ""} {c.name}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Category */}
          <div className={selectWrapClass}>
            <Grid3X3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <select className={selectClass} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">{t.filter_all_categories}</option>
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Gender */}
          <div className={selectWrapClass}>
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <select className={selectClass} value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
              <option value="">{t.filter_all_genders}</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Transgender">Transgender</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Search btn */}
          <button className="h-11 flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-medium px-5 rounded-xl text-sm transition-colors flex-shrink-0">
            <Search className="w-3.5 h-3.5" />
            <span>{t.filter_search_btn}</span>
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSelectedCountry(""); setSelectedCategory(""); setSelectedGender(""); setSearchQuery("") }}
              className="h-11 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium px-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t.filter_clear}
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCountry && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {COUNTRY_FLAGS[selectedCountry]} {allCountries.find(c => c.isoCode === selectedCountry)?.name}
                <button onClick={() => setSelectedCountry("")} className="ml-0.5 text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("")} className="ml-0.5 text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedGender && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {selectedGender}
                <button onClick={() => setSelectedGender("")} className="ml-0.5 text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="ml-0.5 text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
