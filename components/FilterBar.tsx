"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, X, MapPin, Grid3X3, Users, Search } from "lucide-react"
import { CATEGORIES } from "@/lib/constants/categories"
import { GENDERS } from "@/lib/constants/genders"

// ── Country emoji flag mapping ──────────────────────────────────────────
function getCountryEmoji(countryName: string): string {
  const mapping: Record<string, string> = {
    "Denmark": "🇩🇰", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Finland": "🇫🇮",
    "Germany": "🇩🇪", "France": "🇫🇷", "Spain": "🇪🇸", "United Kingdom": "🇬🇧",
    "USA": "🇺🇸", "United States": "🇺🇸", "Netherlands": "🇳🇱", "Belgium": "🇧🇪",
    "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Italy": "🇮🇹", "Portugal": "🇵🇹",
    "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Hungary": "🇭🇺", "Romania": "🇷🇴",
    "Bulgaria": "🇧🇬", "Greece": "🇬🇷", "Thailand": "🇹🇭", "Japan": "🇯🇵",
    "Australia": "🇦🇺", "Canada": "🇨🇦", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
    "Russia": "🇷🇺", "Ukraine": "🇺🇦", "Turkey": "🇹🇷", "UAE": "🇦🇪",
    "Singapore": "🇸🇬", "South Africa": "🇿🇦", "New Zealand": "🇳🇿",
    "Hong Kong": "🇭🇰", "Malaysia": "🇲🇾", "Philippines": "🇵🇭",
    "Vietnam": "🇻🇳", "Indonesia": "🇮🇩", "India": "🇮🇳", "Argentina": "🇦🇷",
  }
  return mapping[countryName] ?? "🌍"
}

// ── Category Dropdown ───────────────────────────────────────────────────
function CategoryDropdown({
  current,
  onSelect,
  onClose,
}: {
  current: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
      <button
        onClick={() => { onSelect(""); onClose() }}
        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${!current ? "text-red-600 font-semibold" : "text-gray-700"}`}
      >
        All categories
      </button>
      <div className="h-px bg-gray-100 mx-2" />
      {CATEGORIES.map(c => (
        <button
          key={c}
          onClick={() => { onSelect(c); onClose() }}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${current === c ? "text-red-600 font-semibold" : "text-gray-700"}`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

// ── Gender Dropdown ─────────────────────────────────────────────────────
function GenderDropdown({
  current,
  onSelect,
  onClose,
}: {
  current: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
      <button
        onClick={() => { onSelect(""); onClose() }}
        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${!current ? "text-red-600 font-semibold" : "text-gray-700"}`}
      >
        All genders
      </button>
      <div className="h-px bg-gray-100 mx-2" />
      {GENDERS.map(g => (
        <button
          key={g}
          onClick={() => { onSelect(g); onClose() }}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${current === g ? "text-red-600 font-semibold" : "text-gray-700"}`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

// ── Location Dropdown (2-step: Country → City) ──────────────────────────
function LocationDropdown({
  currentCountry,
  currentCity,
  onSelect,
  onClose,
}: {
  currentCountry: string
  currentCity: string
  onSelect: (v: { country: string; city: string }) => void
  onClose: () => void
}) {
  const [countries, setCountries] = useState<{ name: string }[]>([])
  const [cities, setCities] = useState<{ name: string }[]>([])
  const [selectedCountry, setSelectedCountry] = useState(currentCountry)
  const [step, setStep] = useState<"country" | "city">(currentCountry ? "city" : "country")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/listings/locations")
      .then(r => r.json())
      .then(d => setCountries(d.countries ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCountry) return
    setLoading(true)
    fetch(`/api/listings/locations?country=${encodeURIComponent(selectedCountry)}`)
      .then(r => r.json())
      .then(d => { setCities(d.cities ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedCountry])

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (step === "country") {
    return (
      <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded shadow-xl border border-gray-100 z-50 overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <input
            autoFocus
            placeholder="Search country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded outline-none focus:border-gray-400"
          />
        </div>
        {/* Country list */}
        <div className="max-h-64 overflow-y-auto">
          <button
            onClick={() => { onSelect({ country: "", city: "" }); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-600"
          >
            <span>🌍</span> All countries
          </button>
          {filteredCountries.map(c => (
            <button
              key={c.name}
              onClick={() => { setSelectedCountry(c.name); setStep("city"); setSearch("") }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800"
            >
              <span style={{ borderRadius: 0 }}>{getCountryEmoji(c.name)}</span>
              <span>{c.name}</span>
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">No countries found</div>
          )}
        </div>
      </div>
    )
  }

  // Step: city
  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded shadow-xl border border-gray-100 z-50 overflow-hidden">
      {/* Back header */}
      <button
        onClick={() => { setStep("country"); setSearch("") }}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        <span>←</span>
        <span style={{ borderRadius: 0 }}>{getCountryEmoji(selectedCountry)}</span>
        {selectedCountry}
      </button>
      {/* Cities */}
      <div className="max-h-64 overflow-y-auto">
        <button
          onClick={() => { onSelect({ country: selectedCountry, city: "" }); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-600"
        >
          All cities in {selectedCountry}
        </button>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : cities.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 text-center">No cities found</div>
        ) : (
          cities.map(city => (
            <button
              key={city.name}
              onClick={() => { onSelect({ country: selectedCountry, city: city.name }); onClose() }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm ${currentCity === city.name ? "text-red-600 font-semibold" : "text-gray-800"}`}
            >
              <MapPin size={12} /> {city.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ── Inner FilterBar (uses useSearchParams) ──────────────────────────────
function FilterBarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Read current values from URL
  const currentCategory = searchParams.get("category") ?? ""
  const currentCountry = searchParams.get("country") ?? ""
  const currentCity = searchParams.get("city") ?? ""
  const currentGender = searchParams.get("gender") ?? ""
  const currentQ = searchParams.get("q") ?? ""
  const [searchValue, setSearchValue] = useState(currentQ)

  // Update URL params
  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Close dropdown on click outside
  useEffect(() => {
    if (!openDropdown) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openDropdown])

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const hasFilters = currentCategory || currentCountry || currentCity || currentGender || currentQ

  const pillBase = "flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all whitespace-nowrap"
  const pillActive = "border border-red-500 text-red-600 bg-red-50"
  const pillInactive = "bg-[#F5F5F7] text-gray-700 hover:bg-gray-200"

  // Location pill label
  const locationLabel = currentCity
    ? `📍 ${currentCity}`
    : currentCountry
      ? `${getCountryEmoji(currentCountry)} ${currentCountry}`
      : "Location"

  return (
    <div
      ref={containerRef}
      className="bg-white border-b border-gray-100"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden flex-nowrap">

          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") updateParams({ q: searchValue }) }}
              onBlur={() => updateParams({ q: searchValue })}
              className="h-9 w-40 md:w-48 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Category pill */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenDropdown(o => o === "category" ? null : "category")}
              className={`${pillBase} ${currentCategory ? pillActive : pillInactive}`}
            >
              <Grid3X3 size={14} />
              {currentCategory || "Category"}
              <ChevronDown size={12} />
            </button>
            {openDropdown === "category" && (
              <CategoryDropdown
                current={currentCategory}
                onSelect={v => { updateParams({ category: v }); setOpenDropdown(null) }}
                onClose={() => setOpenDropdown(null)}
              />
            )}
          </div>

          {/* Location pill */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenDropdown(o => o === "location" ? null : "location")}
              className={`${pillBase} ${currentCountry || currentCity ? pillActive : pillInactive}`}
            >
              <MapPin size={14} />
              {locationLabel}
              <ChevronDown size={12} />
            </button>
            {openDropdown === "location" && (
              <LocationDropdown
                currentCountry={currentCountry}
                currentCity={currentCity}
                onSelect={({ country, city }) => updateParams({ country, city })}
                onClose={() => setOpenDropdown(null)}
              />
            )}
          </div>

          {/* Gender pill */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenDropdown(o => o === "gender" ? null : "gender")}
              className={`${pillBase} ${currentGender ? pillActive : pillInactive}`}
            >
              <Users size={14} />
              {currentGender || "Gender"}
              <ChevronDown size={12} />
            </button>
            {openDropdown === "gender" && (
              <GenderDropdown
                current={currentGender}
                onSelect={v => { updateParams({ gender: v }); setOpenDropdown(null) }}
                onClose={() => setOpenDropdown(null)}
              />
            )}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={() => { updateParams({ category: "", country: "", city: "", gender: "", q: "" }); setSearchValue("") }}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex-shrink-0"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Exported FilterBar with Suspense boundary ───────────────────────────
export default function FilterBar() {
  return (
    <Suspense fallback={
      <div className="bg-white border-b border-gray-100 h-[52px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} />
    }>
      <FilterBarInner />
    </Suspense>
  )
}
