"use client"
import { useState } from "react"
import { Country } from "country-state-city"

const POPULAR_ISOS = ["US", "GB", "DK", "SE", "NO", "DE", "FR", "ES", "AU", "CA", "TH", "RU", "PL", "SA"]
const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DK: "🇩🇰", SE: "🇸🇪", NO: "🇳🇴", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸",
  AU: "🇦🇺", CA: "🇨🇦", TH: "🇹🇭", RU: "🇷🇺", PL: "🇵🇱", SA: "🇸🇦", NL: "🇳🇱",
  IT: "🇮🇹", JP: "🇯🇵", KR: "🇰🇷", BR: "🇧🇷", MX: "🇲🇽", IN: "🇮🇳", ZA: "🇿🇦",
  AE: "🇦🇪", SG: "🇸🇬", NZ: "🇳🇿", IE: "🇮🇪", CH: "🇨🇭", AT: "🇦🇹", BE: "🇧🇪", PT: "🇵🇹",
}

export default function FilterBar() {
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søg efter by, navn, service..."
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
              <option value="">🌍 Alle lande</option>
              <optgroup label="Populære lande">
                {popularCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {COUNTRY_FLAGS[c.isoCode] || "🏳️"} {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Alle lande">
                {otherCountries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {COUNTRY_FLAGS[c.isoCode] || "🏳️"} {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
          </div>

          {/* Category */}
          <div className="relative">
            <select
              className={selectClass}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">📁 Alle kategorier</option>
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
          </div>

          {/* Gender */}
          <div className="relative">
            <select
              className={selectClass}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="">👤 Alle</option>
              <option value="Female">♀️ Female</option>
              <option value="Male">♂️ Male</option>
              <option value="Transgender">⚧️ Transgender</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
          </div>

          {/* Search button */}
          <button className="h-11 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2">
            🔍 Søg
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
              ✕ Ryd
            </button>
          )}
        </div>

        {/* Active filters pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCountry && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {COUNTRY_FLAGS[selectedCountry] || "🏳️"} {allCountries.find(c => c.isoCode === selectedCountry)?.name}
                <button onClick={() => setSelectedCountry("")} className="ml-1 hover:text-red-900">✕</button>
              </span>
            )}
            {selectedCategory && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-900">✕</button>
              </span>
            )}
            {selectedGender && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                {selectedGender}
                <button onClick={() => setSelectedGender("")} className="ml-1 hover:text-red-900">✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-red-900">✕</button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
