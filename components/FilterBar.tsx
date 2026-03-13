"use client"
import { useState } from "react"
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

  const selectClass = "h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer appearance-none pr-8 shadow-sm hover:border-gray-300 transition-colors"

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{"\uD83D\uDD0D"}</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search_placeholder}
            className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-2xl text-sm text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Country with flags */}
          <div className="relative">
            <select
              className={selectClass}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              style={{ minWidth: "180px" }}
            >
              <option value="">{t.filter_all_countries}</option>
              <optgroup label="Popular">
                {popularCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {COUNTRY_FLAGS[c.isoCode] || "\uD83C\uDFF3\uFE0F"} {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All">
                {otherCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {COUNTRY_FLAGS[c.isoCode] || "\uD83C\uDFF3\uFE0F"} {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{"\u25BC"}</div>
          </div>

          {/* Category */}
          <div className="relative">
            <select
              className={selectClass}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t.filter_all_categories}</option>
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{"\u25BC"}</div>
          </div>

          {/* Gender */}
          <div className="relative">
            <select
              className={selectClass}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="">{t.filter_all_genders}</option>
              <option value="Female">{"\u2640\uFE0F"} Female</option>
              <option value="Male">{"\u2642\uFE0F"} Male</option>
              <option value="Transgender">{"\u26A7\uFE0F"} Transgender</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{"\u25BC"}</div>
          </div>

          {/* Search button */}
          <button className="h-11 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2">
            {t.filter_search_btn}
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => {
                setSelectedCountry("")
                setSelectedCategory("")
                setSelectedGender("")
                setSearchQuery("")
              }}
              className="h-11 text-sm text-gray-500 hover:text-red-600 font-medium px-4 rounded-xl hover:bg-red-50 transition-colors"
            >
              {t.filter_clear}
            </button>
          )}
        </div>

        {/* Active filters pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCountry && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {COUNTRY_FLAGS[selectedCountry] || "\uD83C\uDFF3\uFE0F"} {allCountries.find(c => c.isoCode === selectedCountry)?.name}
                <button onClick={() => setSelectedCountry("")} className="ml-1 hover:text-red-900">{"\u2715"}</button>
              </span>
            )}
            {selectedCategory && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-900">{"\u2715"}</button>
              </span>
            )}
            {selectedGender && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {selectedGender}
                <button onClick={() => setSelectedGender("")} className="ml-1 hover:text-red-900">{"\u2715"}</button>
              </span>
            )}
            {searchQuery && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-red-900">{"\u2715"}</button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
