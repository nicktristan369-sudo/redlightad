"use client"

import { useState, useEffect, useRef, Suspense, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, X, MapPin, Grid3X3, Users, Search, SlidersHorizontal, Check, Video } from "lucide-react"
import { CATEGORIES } from "@/lib/constants/categories"
import {
  BODY_BUILD_OPTIONS, HAIR_COLOR_OPTIONS,
  NATIONALITY_OPTIONS, ETHNICITY_OPTIONS,
  ORIENTATION_OPTIONS,
} from "@/lib/listingOptions"
import { GENDERS, GENDER_LABELS } from "@/lib/constants/genders"
import { SUPPORTED_COUNTRIES, getCountryByName, slugify, COUNTRIES, getCountryEntryByCode, getCountryEntryByName } from "@/lib/countries"
import { useLanguage } from "@/lib/i18n/LanguageContext"

// ── Filter Drawer ─────────────────────────────────────────────────────────────
function FilterDrawer({
  onClose,
  onApply,
  initial,
}: {
  onClose: () => void
  onApply: (filters: Record<string, string>) => void
  initial: Record<string, string>
}) {
  const { t } = useLanguage()
  const [ageMin, setAgeMin] = useState(initial.age_min ?? "")
  const [ageMax, setAgeMax] = useState(initial.age_max ?? "")
  const [premiumOnly, setPremiumOnly] = useState(initial.premium_only === "1")
  const [hasVideo, setHasVideo] = useState(initial.has_video === "1")
  const [sort, setSort] = useState(initial.sort ?? "premium")
  const [nationality, setNationality] = useState(initial.nationality ?? "")
  const [bodyBuild, setBodyBuild] = useState(initial.body_build ?? "")
  const [hairColor, setHairColor] = useState(initial.hair_color ?? "")
  const [ethnicity, setEthnicity] = useState(initial.ethnicity ?? "")
  const [orientation, setOrientation] = useState(initial.orientation ?? "")
  const [languages, setLanguages] = useState<string[]>(initial.languages ? initial.languages.split(",") : [])
  const [heightMin, setHeightMin] = useState(initial.height_min ?? "")
  const [heightMax, setHeightMax] = useState(initial.height_max ?? "")
  const [outcall, setOutcall] = useState(initial.outcall === "1")
  const [hasOwnPlace, setHasOwnPlace] = useState(initial.has_own_place === "1")
  const [verified, setVerified] = useState(initial.verified === "1")
  const [availableNow, setAvailableNow] = useState(initial.available_now === "1")

  const SORT_OPTIONS = [
    { value: "premium", label: t.filter_premium_first },
    { value: "newest",  label: t.filter_newest },
    { value: "oldest",  label: t.filter_oldest },
  ]

  const apply = () => {
    const f: Record<string, string> = { sort }
    if (ageMin)        f.age_min        = ageMin
    if (ageMax)        f.age_max        = ageMax
    if (premiumOnly)   f.premium_only   = "1"
    if (hasVideo)      f.has_video      = "1"
    if (nationality)   f.nationality    = nationality
    if (bodyBuild)     f.body_build     = bodyBuild
    if (hairColor)     f.hair_color     = hairColor
    if (ethnicity)     f.ethnicity      = ethnicity
    if (orientation)   f.orientation    = orientation
    if (languages.length > 0) f.languages = languages.join(",")
    if (heightMin)     f.height_min     = heightMin
    if (heightMax)     f.height_max     = heightMax
    if (outcall)       f.outcall        = "1"
    if (hasOwnPlace)   f.has_own_place  = "1"
    if (verified)      f.verified       = "1"
    if (availableNow)  f.available_now  = "1"
    onApply(f)
  }

  const reset = () => {
    setAgeMin(""); setAgeMax(""); setPremiumOnly(false); setHasVideo(false); setSort("premium")
    setNationality(""); setBodyBuild(""); setHairColor(""); setEthnicity(""); setOrientation("")
    setLanguages([]); setHeightMin(""); setHeightMax(""); setOutcall(false); setHasOwnPlace(false)
    setVerified(false); setAvailableNow(false)
  }

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: value ? "#DC2626" : "#D1D5DB", position: "relative", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", display: "block",
        }} />
      </button>
    </div>
  )

  const SelectFilter = ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]
  }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", border: "1px solid #E5E7EB", padding: "8px 10px", fontSize: 14, outline: "none", borderRadius: 0, background: "#fff", color: value ? "#111" : "#9CA3AF" }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[201] bg-white flex flex-col"
        style={{ width: "min(380px, 100vw)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{t.filter_title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} color="#374151" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2">

          {/* Sort */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-3">{t.filter_sort}</p>
            <div className="flex flex-col gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className="flex items-center justify-between px-3 py-2.5 text-sm border transition-colors"
                  style={{
                    borderRadius: 0,
                    border: sort === opt.value ? "1px solid #DC2626" : "1px solid #E5E7EB",
                    background: sort === opt.value ? "#FEF2F2" : "#fff",
                    color: sort === opt.value ? "#DC2626" : "#374151",
                    fontWeight: sort === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                  {sort === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.filter_age_range}</p>
            <div className="flex items-center gap-2">
              <input
                type="number" min="18" max="99" placeholder={t.filter_min}
                value={ageMin}
                onChange={e => setAgeMin(e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", padding: "8px 10px", fontSize: 14, outline: "none", borderRadius: 0 }}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number" min="18" max="99" placeholder={t.filter_max}
                value={ageMax}
                onChange={e => setAgeMax(e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", padding: "8px 10px", fontSize: 14, outline: "none", borderRadius: 0 }}
              />
            </div>
          </div>

          {/* Height */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">HEIGHT (CM)</p>
            <div className="flex items-center gap-2">
              <input type="number" min="140" max="210" placeholder="Min"
                value={heightMin} onChange={e => setHeightMin(e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", padding: "8px 10px", fontSize: 14, outline: "none", borderRadius: 0 }} />
              <span className="text-gray-400 text-sm">–</span>
              <input type="number" min="140" max="210" placeholder="Max"
                value={heightMax} onChange={e => setHeightMax(e.target.value)}
                style={{ flex: 1, border: "1px solid #E5E7EB", padding: "8px 10px", fontSize: 14, outline: "none", borderRadius: 0 }} />
            </div>
          </div>

          {/* Toggles */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.filter_show_only}</p>
            <Toggle label={t.filter_premium_profiles} value={premiumOnly} onChange={setPremiumOnly} />
            <Toggle label={t.filter_has_video} value={hasVideo} onChange={setHasVideo} />
            <Toggle label="Outcall available" value={outcall} onChange={setOutcall} />
            <Toggle label="Has own place" value={hasOwnPlace} onChange={setHasOwnPlace} />
            <Toggle label="Verified profiles only" value={verified} onChange={setVerified} />
            <Toggle label="Available now (cam)" value={availableNow} onChange={setAvailableNow} />
          </div>

          <SelectFilter label="NATIONALITY" value={nationality} onChange={setNationality} options={NATIONALITY_OPTIONS} />
          <SelectFilter label="BODY TYPE" value={bodyBuild} onChange={setBodyBuild} options={BODY_BUILD_OPTIONS} />
          <SelectFilter label="HAIR COLOR" value={hairColor} onChange={setHairColor} options={HAIR_COLOR_OPTIONS} />
          <SelectFilter label="ETHNICITY" value={ethnicity} onChange={setEthnicity} options={ETHNICITY_OPTIONS} />
          <SelectFilter label="ORIENTATION" value={orientation} onChange={setOrientation} options={ORIENTATION_OPTIONS} />

          {/* Languages */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">LANGUAGES</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["English","Danish","Swedish","Norwegian","German","French","Spanish","Russian","Arabic","Thai"].map(lang => (
                <button key={lang}
                  onClick={() => setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: "pointer", border: "1px solid",
                    borderColor: languages.includes(lang) ? "#DC2626" : "#E5E7EB",
                    background: languages.includes(lang) ? "#FEF2F2" : "#fff",
                    color: languages.includes(lang) ? "#DC2626" : "#6B7280",
                  }}>{lang}</button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderRadius: 0 }}
          >
            {t.filter_reset}
          </button>
          <button
            onClick={apply}
            className="flex-1 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ borderRadius: 0, background: "#111" }}
          >
            {t.filter_apply}
          </button>
        </div>
      </div>
    </>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

function getCountryEmoji(name: string): string {
  const map: Record<string, string> = {
    "Denmark": "🇩🇰","Sweden": "🇸🇪","Norway": "🇳🇴","Finland": "🇫🇮",
    "Germany": "🇩🇪","France": "🇫🇷","Spain": "🇪🇸","United Kingdom": "🇬🇧",
    "USA": "🇺🇸","United States": "🇺🇸","Netherlands": "🇳🇱","Belgium": "🇧🇪",
    "Switzerland": "🇨🇭","Austria": "🇦🇹","Italy": "🇮🇹","Portugal": "🇵🇹",
    "Poland": "🇵🇱","Czech Republic": "🇨🇿","Hungary": "🇭🇺","Romania": "🇷🇴",
    "Bulgaria": "🇧🇬","Greece": "🇬🇷","Thailand": "🇹🇭","Japan": "🇯🇵",
    "Australia": "🇦🇺","Canada": "🇨🇦","Brazil": "🇧🇷","Mexico": "🇲🇽",
    "Russia": "🇷🇺","Ukraine": "🇺🇦","Turkey": "🇹🇷","UAE": "🇦🇪",
    "Singapore": "🇸🇬","South Africa": "🇿🇦",
  }
  return map[name] ?? "🌍"
}

// ── Simple dropdown container ─────────────────────────────────────────
function DropMenu({ children, maxH }: { children: React.ReactNode; maxH?: number }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 z-[100] overflow-hidden"
      style={{ minWidth: "220px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", borderRadius: 8, overflowY: maxH ? "auto" : "hidden", maxHeight: maxH ? maxH : undefined }}
    >
      {children}
    </div>
  )
}

// ── Category ─────────────────────────────────────────────────────────
function CategoryMenu({ current, onSelect }: { current: string; onSelect: (v: string) => void }) {
  const { t } = useLanguage()
  return (
    <DropMenu>
      {["", ...CATEGORIES].map(c => (
        <button
          key={c || "__all"}
          onClick={() => onSelect(c)}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
            current === c ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
          }`}
        >
          {c || t.filter_all_categories}
        </button>
      ))}
    </DropMenu>
  )
}

// ── Gender ───────────────────────────────────────────────────────────
function GenderMenu({ current, onSelect }: { current: string; onSelect: (v: string) => void }) {
  const { t } = useLanguage()
  return (
    <DropMenu>
      {["", ...GENDERS].map(g => (
        <button
          key={g || "__all"}
          onClick={() => onSelect(g)}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
            current === g ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
          }`}
        >
          {g ? (GENDER_LABELS[g] ?? g) : t.common_all}
        </button>
      ))}
    </DropMenu>
  )
}


// ── CountryOnlyMenu ──────────────────────────────────────────────────────────
function CountryOnlyMenu({
  current,
  onSelect,
}: {
  current: string
  onSelect: (country: string) => void
}) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  const allCountries = [...COUNTRIES.europe, ...COUNTRIES.worldwide]
  const filtered = search
    ? allCountries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20)
    : allCountries.slice(0, 80)

  return (
    <DropMenu maxH={320}>
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search country..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
          />
        </div>
      </div>
      <button
        onClick={() => onSelect("")}
        className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50 ${
          !current ? "text-red-600 font-semibold bg-red-50" : "text-gray-500"
        }`}
      >
        <MapPin size={13} /> All countries
      </button>
      {filtered.map(c => (
        <button
          key={c.code}
          onClick={() => onSelect(c.name)}
          className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 flex items-center gap-2.5 hover:bg-gray-50 ${
            current === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
          }`}
        >
          <span className={`fi fi-${c.code.toLowerCase()} fis`} style={{ width: 16, height: 16, borderRadius: 2, flexShrink: 0 }} />
          {c.name}
          {current === c.name && <Check size={13} className="ml-auto text-red-500" />}
        </button>
      ))}
    </DropMenu>
  )
}

// ── CityOnlyMenu — bruger geonames_cities via /api/geo/search ─────────────────
function CityOnlyMenu({
  countryName,
  countryCode,
  current,
  onSelect,
}: {
  countryName: string
  countryCode: string
  current: string
  onSelect: (city: string, majorCity?: string) => void
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<{ name: string; ascii_name: string; admin1_name: string; is_major_city: boolean; latitude: number; longitude: number; population: number }[]>([])
  const [majorCities, setMajorCities] = useState<{ name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMajor, setLoadingMajor] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  // Load major cities on mount
  useEffect(() => {
    if (!countryCode) return
    setLoadingMajor(true)
    fetch(`/api/geo/search?q=a&country=${countryCode}&limit=50`)
      .then(r => r.json())
      .then(data => {
        const major = (data.results || []).filter((c: { is_major_city: boolean }) => c.is_major_city)
        setMajorCities(major)
        setLoadingMajor(false)
      })
      .catch(() => setLoadingMajor(false))
  }, [countryCode])

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 2) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geo/search?q=${encodeURIComponent(search)}&country=${countryCode}&limit=20`)
        .then(r => r.json())
        .then(data => {
          setResults(data.results || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 200)
  }, [search, countryCode])

  const handleSelect = async (city: { name: string; is_major_city: boolean; latitude: number; longitude: number; ascii_name: string }) => {
    if (city.is_major_city) {
      onSelect(city.name)
    } else {
      // Snap til nærmeste major city
      try {
        const res = await fetch(`/api/geo/nearest-major?lat=${city.latitude}&lng=${city.longitude}&country=${countryCode}`)
        const data = await res.json()
        const major = data.city?.name || city.name
        onSelect(city.name, major)
      } catch {
        onSelect(city.name)
      }
    }
  }

  const showMajor = search.length < 2

  return (
    <DropMenu maxH={340}>
      {/* Search input */}
      <div className="px-3 py-2 border-b border-gray-100 sticky top-0 bg-white">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search any city in ${countryName}...`}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* All cities option */}
      <button
        onClick={() => onSelect("")}
        className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 flex items-center gap-2 hover:bg-gray-50 ${
          !current ? "text-red-600 font-semibold bg-red-50" : "text-gray-500"
        }`}
      >
        <MapPin size={13} /> All cities in {countryName}
      </button>

      {/* Major cities (default view) */}
      {showMajor && (
        <>
          {loadingMajor ? (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">Loading...</div>
          ) : (
            <>
              {majorCities.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular cities</span>
                </div>
              )}
              {majorCities.map(c => (
                <button
                  key={c.name}
                  onClick={() => onSelect(c.name)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 flex items-center gap-2.5 hover:bg-gray-50 ${
                    current === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
                  }`}
                >
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1">{c.name}</span>
                  {current === c.name && <Check size={13} className="text-red-500" />}
                </button>
              ))}
            </>
          )}
        </>
      )}

      {/* Search results */}
      {!showMajor && (
        loading ? (
          <div className="px-4 py-4 text-sm text-gray-400 text-center">Searching...</div>
        ) : results.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-400 text-center">No cities found</div>
        ) : results.map(c => (
          <button
            key={c.ascii_name + c.admin1_name}
            onClick={() => handleSelect(c)}
            className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 flex items-center gap-2.5 hover:bg-gray-50 ${
              current === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-700"
            }`}
          >
            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span>{c.name}</span>
              {c.admin1_name && <span className="text-xs text-gray-400 ml-1.5">{c.admin1_name}</span>}
            </div>
            {c.is_major_city && <span className="text-[10px] text-gray-400 flex-shrink-0">Popular</span>}
            {current === c.name && <Check size={13} className="text-red-500 flex-shrink-0" />}
          </button>
        ))
      )}
    </DropMenu>
  )
}

// ── Location (Global Search - Booking.com style) ────────────────────────────────────
function LocationMenu({
  currentCountry,
  currentCity,
  onSelect,
}: {
  currentCountry: string
  currentCity: string
  onSelect: (v: { country: string; city: string }) => void
}) {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<{ name: string; region: string; country: string; countryCode: string; display: string; isMajor: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"main" | "country">("main")
  const [selCountry, setSelCountry] = useState("")
  const [selCode, setSelCode] = useState("")
  const [countryCities, setCountryCities] = useState<{ name: string; region?: string; isMajor?: boolean }[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Global city search using GeoNames
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setResults([])
      return
    }
    
    setLoading(true)
    
    try {
      // Use GeoNames API - search globally or within selected country
      const url = selCode 
        ? `/api/geo/search?q=${encodeURIComponent(query)}&country=${selCode}&limit=20`
        : `/api/geo/search?q=${encodeURIComponent(query)}&limit=20`
      const res = await fetch(url)
      const data = await res.json()
      // Map to expected format
      const mapped = (data.results || []).map((c: any) => ({
        name: c.name,
        region: c.admin1_name || '',
        country: COUNTRIES.europe.find(x => x.code.toUpperCase() === c.country_code)?.name ||
                 COUNTRIES.worldwide.find(x => x.code.toUpperCase() === c.country_code)?.name ||
                 c.country_code,
        countryCode: c.country_code,
        isMajor: c.is_major_city,
      }))
      setResults(mapped)
    } catch (err) {
      setResults([])
    }
    setLoading(false)
  }

  // Load MAJOR cities for selected country using GeoNames
  const loadCountryCities = async (code: string) => {
    setLoadingCities(true)
    try {
      const res = await fetch(`/api/geo/major-cities?country=${code}`)
      const data = await res.json()
      // Map to expected format - these are already sorted by population
      const mapped = (data.cities || []).map((c: any) => ({
        name: c.name,
        region: c.admin1_name || '',
        isMajor: true,
        population: c.population,
      }))
      setCountryCities(mapped)
    } catch (err) {
      setCountryCities([])
    }
    setLoadingCities(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (value.length < 2) {
      setResults([])
      return
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchCities(value)
    }, 300)
  }

  const selectCountry = (name: string, code: string) => {
    setSelCountry(name)
    setSelCode(code)
    setStep("country")
    setSearch("")
    setResults([])
    loadCountryCities(code)
  }

  // Show search results if searching, otherwise show country list
  const isSearching = search.length >= 2
  const filteredEurope = COUNTRIES.europe.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const filteredWorldwide = COUNTRIES.worldwide.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // Filter country cities by search
  const filteredCountryCities = search 
    ? countryCities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : countryCities

  // Step 2: Show cities in selected country
  if (step === "country") {
    return (
      <div
        className="absolute top-full mt-1 bg-white border border-gray-200 z-[100] overflow-hidden"
        style={{ width: "min(320px, calc(100vw - 16px))", maxHeight: "420px", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.10)", borderRadius: 0, right: 0, left: "auto" }}
      >
        {/* Back button */}
        <button
          onClick={() => { setStep("main"); setSearch(""); setResults([]) }}
          className="flex-shrink-0 w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 border-b border-gray-200"
        >
          <span>←</span>
          <span className={`fi fi-${selCode.toLowerCase()} fis`} style={{ width: 18, height: 18, display: "inline-block", borderRadius: 2 }} />
          {selCountry}
        </button>
        
        {/* Search cities */}
        <div className="p-2 border-b border-gray-100 flex-shrink-0">
          <input
            autoFocus
            placeholder={`Search city in ${selCountry}...`}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 outline-none focus:border-red-400"
            style={{ borderRadius: 0, fontSize: 15 }}
          />
        </div>
        
        {/* All cities in country */}
        <button
          onClick={() => onSelect({ country: selCountry, city: "" })}
          className="flex-shrink-0 w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100"
        >
          <MapPin size={14} /> All cities in {selCountry}
        </button>
        
        {/* City list */}
        <div className="overflow-y-auto flex-1">
          {loading || loadingCities ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : isSearching ? (
            /* Show search results when searching */
            results.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">
                No cities found for "{search}"
              </p>
            ) : (
              <>
                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  Search Results
                </div>
                {results.map((city, i) => (
                  <button
                    key={`search-${city.name}-${i}`}
                    onClick={() => onSelect({ country: selCountry, city: city.name })}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 ${
                      currentCity === city.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
                    }`}
                  >
                    <MapPin size={14} className={city.isMajor ? "text-red-500" : "text-gray-400"} />
                    <div className="text-left">
                      <span className={city.isMajor ? "font-medium" : ""}>{city.name}</span>
                      {city.region && <span className="text-xs text-gray-400 ml-1">({city.region})</span>}
                    </div>
                  </button>
                ))}
              </>
            )
          ) : countryCities.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400 text-center">
              No major cities found
            </p>
          ) : (
            /* Show major cities when not searching */
            <>
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                Major Cities
              </div>
              {countryCities.map((city, i) => (
                <button
                  key={`major-${city.name}-${i}`}
                  onClick={() => onSelect({ country: selCountry, city: city.name })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 ${
                    currentCity === city.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
                  }`}
                >
                  <MapPin size={14} className="text-red-500" />
                  <div className="text-left">
                    <span className="font-medium">{city.name}</span>
                    {city.region && <span className="text-xs text-gray-400 ml-1">({city.region})</span>}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  // Step 1: Main menu - countries + global search
  return (
    <div
      className="absolute top-full mt-1 bg-white border border-gray-200 z-[100] overflow-hidden"
      style={{ width: "min(320px, calc(100vw - 16px))", maxHeight: "420px", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.10)", borderRadius: 0, right: 0, left: "auto" }}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100 flex-shrink-0">
        <input
          autoFocus
          placeholder="Search any city worldwide..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 outline-none focus:border-red-400"
          style={{ borderRadius: 0, fontSize: 15 }}
        />
      </div>
      
      {/* All locations button */}
      <button
        onClick={() => onSelect({ country: "", city: "" })}
        className="flex-shrink-0 w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-200"
      >
        <MapPin size={14} className="flex-shrink-0" /> All Locations
      </button>
      
      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        )}
        
        {/* Global search results */}
        {!loading && isSearching && results.length > 0 && (
          <>
            <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
              Cities
            </div>
            {results.map((city, i) => (
              <button
                key={`${city.name}-${city.country}-${i}`}
                onClick={() => onSelect({ country: city.country, city: city.name })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100"
              >
                <MapPin size={14} className={city.isMajor ? "text-red-500" : "text-gray-400"} />
                <div className="text-left">
                  <div className={city.isMajor ? "font-semibold text-gray-900" : "text-gray-800"}>
                    {city.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {city.region ? `${city.region}, ${city.country}` : city.country}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
        
        {/* No results */}
        {!loading && isSearching && results.length === 0 && (
          <p className="px-4 py-4 text-sm text-gray-400 text-center">
            No cities found for "{search}"
          </p>
        )}
        
        {/* Country list (when not searching) */}
        {!isSearching && (
          <>
            {/* EUROPE section */}
            {filteredEurope.length > 0 && (
              <>
                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 sticky top-0">
                  {t.filter_europe}
                </div>
                {filteredEurope.map(c => (
                  <button
                    key={c.code}
                    onClick={() => selectCountry(c.name, c.code)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      currentCountry === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
                    }`}
                  >
                    <span className={`fi fi-${c.code} fis`} style={{ width: 18, height: 18, display: "inline-block", flexShrink: 0, borderRadius: 2 }} />{" "}{c.name}
                    <ChevronRight size={14} className="ml-auto text-gray-400" />
                  </button>
                ))}
              </>
            )}
            {/* WORLDWIDE section */}
            {filteredWorldwide.length > 0 && (
              <>
                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 sticky top-0">
                  {t.filter_worldwide}
                </div>
                {filteredWorldwide.map(c => (
                  <button
                    key={c.code}
                    onClick={() => selectCountry(c.name, c.code)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      currentCountry === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
                    }`}
                  >
                    <span className={`fi fi-${c.code} fis`} style={{ width: 18, height: 18, display: "inline-block", flexShrink: 0, borderRadius: 2 }} />{" "}{c.name}
                    <ChevronRight size={14} className="ml-auto text-gray-400" />
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Pill button ───────────────────────────────────────────────────────
function Pill({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-1.5 w-full px-3 md:px-2.5 py-2 md:py-1.5 text-sm md:text-[13px] font-medium border transition-colors ${
        active
          ? "border-gray-900 text-gray-900 bg-white font-semibold"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
      style={{ borderRadius: 0 }}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="truncate max-w-[90px]">{label}</span>
      </span>
      <ChevronDown size={11} className="flex-shrink-0" />
    </button>
  )
}

// Parse country/city from path: /dk → dk, /dk/copenhagen → dk + copenhagen
function parsePathLocation(pathname: string): { countryCode: string; citySlug: string } {
  const parts = pathname.split("/").filter(Boolean)
  // Skip known non-country paths
  const skip = new Set(["dashboard", "admin", "api", "ads", "annoncer", "marketplace", "login", "register", "support", "about", "privacy", "terms", "cookies", "premium", "unlock", "opret-annonce"])
  if (parts.length === 0 || skip.has(parts[0])) return { countryCode: "", citySlug: "" }
  const countryCode = parts[0] // e.g. "dk"
  const citySlug = parts[1] ?? "" // e.g. "copenhagen"
  return { countryCode, citySlug }
}

function unslugify(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// ── Inner (uses useSearchParams) ──────────────────────────────────────
function FilterBarInner() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [q, setQ] = useState(searchParams.get("q") ?? "")

  const category = searchParams.get("category") ?? ""
  const gender = searchParams.get("gender") ?? ""

  // Location: read from URL path
  const { countryCode, citySlug } = parsePathLocation(pathname)
  const countryObj = SUPPORTED_COUNTRIES.find(c => c.code === countryCode)
  const currentCountryName = countryObj?.name ?? ""
  const currentCityName = citySlug ? unslugify(citySlug) : ""

  // Navigate location via URL path
  const navigateLocation = ({ country, city }: { country: string; city: string }) => {
    if (!country) { router.push("/"); setOpen(null); return }
    const c = getCountryEntryByName(country) ?? getCountryByName(country) ?? SUPPORTED_COUNTRIES.find(x => x.name === country)
    if (!c) { setOpen(null); return }
    if (!city) { router.push(`/${c.code}`); setOpen(null); return }
    router.push(`/${c.code}/${slugify(city)}`); setOpen(null)
  }

  const update = (changes: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(changes).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k))
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setOpen(null)
  }

  // Click outside → close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const toggle = (key: string) => setOpen(o => o === key ? null : key)

  const locationLabel = currentCityName
    ? currentCityName
    : currentCountryName || t.filter_location

  const locationIcon = countryCode
    ? <span className={`fi fi-${countryCode} fis`} style={{ width: 16, height: 16, display: "inline-block", flexShrink: 0, borderRadius: 2 }} />
    : <MapPin size={13} />

  const ageMin      = searchParams.get("age_min") ?? ""
  const ageMax      = searchParams.get("age_max") ?? ""
  const premiumOnly = searchParams.get("premium_only") ?? ""
  const hasVideo    = searchParams.get("has_video") ?? ""
  const sort        = searchParams.get("sort") ?? ""
  const nationality = searchParams.get("nationality") ?? ""
  const bodyBuild   = searchParams.get("body_build") ?? ""
  const hairColor   = searchParams.get("hair_color") ?? ""
  const ethnicity   = searchParams.get("ethnicity") ?? ""
  const orientation = searchParams.get("orientation") ?? ""
  const languages   = searchParams.get("languages") ?? ""
  const heightMin   = searchParams.get("height_min") ?? ""
  const heightMax   = searchParams.get("height_max") ?? ""
  const outcall     = searchParams.get("outcall") ?? ""
  const hasOwnPlace = searchParams.get("has_own_place") ?? ""
  const verifiedParam = searchParams.get("verified") ?? ""
  const availableNow  = searchParams.get("available_now") ?? ""

  const hasFilters = category || countryCode || citySlug || gender || q || ageMin || ageMax || premiumOnly || hasVideo || sort || nationality || bodyBuild || hairColor || ethnicity || orientation || languages || heightMin || heightMax || outcall || hasOwnPlace || verifiedParam || availableNow

  const applyDrawer = (filters: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    // Clear old drawer filters
    ;["age_min","age_max","premium_only","has_video","sort","nationality","body_build","hair_color","ethnicity","orientation","languages","height_min","height_max","outcall","has_own_place","verified","available_now"].forEach(k => p.delete(k))
    // Set new ones
    Object.entries(filters).forEach(([k,v]) => v ? p.set(k,v) : p.delete(k))
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setDrawerOpen(false)
  }

  return (
    <>
    <div ref={ref} className="bg-white border-b border-gray-200" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      {/* Section tabs — desktop only */}
      <div className="hidden md:block" style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 16px 0 16px' }}>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", minHeight: 40, paddingBottom: 0, alignItems: "stretch" }}>
          {[
            { href: "/",            label: "Escorts",     cam: false, of: false },
            { href: "/onlyfans",    label: "OnlyFans",    cam: false, of: true  },
            { href: "/cam",         label: "RedLightCAM", cam: true,  of: false },
            { href: "/marketplace", label: "Marketplace", cam: false, of: false },
            { href: "/reviews",     label: "Reviews",     cam: false, of: false },
            { href: "/videos",      label: "Videos",      cam: false, of: false },
          ].map(tab => {
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
            return (
              <a key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                padding: "0 14px", borderRadius: 0,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                background: "transparent",
                color: isActive ? "#111" : "#9CA3AF",
                textDecoration: "none",
                borderBottom: isActive ? "2px solid #111" : "2px solid transparent",
                transition: "color 0.15s", flexShrink: 0,
                letterSpacing: "-0.01em",
              }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#374151" }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#9CA3AF" }}
              >
                {tab.of && <><img src="/onlyfans-logo.svg" alt="OnlyFans" style={{ height: 12, width: 65, objectFit: "contain", objectPosition: "left center", opacity: isActive ? 1 : 0.5 }} /><span style={{ display: "none" }}>OnlyFans</span></>}
                {tab.cam && <><Video size={12} strokeWidth={2} color="#DC2626" style={{ flexShrink: 0 }} /><span style={{ color: "#DC2626", fontWeight: 900, letterSpacing: "-0.02em", fontSize: 13 }}>RED</span><span style={{ color: "#111", fontWeight: 900, letterSpacing: "-0.02em", fontSize: 13 }}>LIGHT</span><span style={{ color: "#DC2626", fontWeight: 900, letterSpacing: "-0.02em", fontSize: 13 }}>CAM</span></>}
                {!tab.of && !tab.cam && tab.label}
              </a>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 16px 6px 16px' }}>

        {/* Search — full width top row on mobile */}
        <div className="relative mb-2 md:hidden">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t.common_search}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") update({ q }) }}
            onBlur={() => { if (q !== (searchParams.get("q") ?? "")) update({ q }) }}
            className="w-full h-9 pl-8 pr-3 bg-white border border-gray-200 outline-none focus:border-gray-400"
            style={{ borderRadius: 0, fontSize: 16 }}
          />
        </div>

        {/* Pills row */}
        <div className="flex items-stretch gap-0">

          {/* Search — desktop only, left of pills */}
          <div className="relative hidden md:block mr-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t.common_search}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") update({ q }) }}
              onBlur={() => { if (q !== (searchParams.get("q") ?? "")) update({ q }) }}
              className="h-8 w-36 pl-7 pr-3 bg-white border border-gray-200 outline-none focus:border-gray-400"
              style={{ borderRadius: 0, fontSize: 13 }}
            />
          </div>

          {/* Mobile: 2x2 grid — Desktop: single row */}
          <div className="grid grid-cols-2 gap-px md:flex md:gap-px flex-1">

            {/* Category */}
            <div className="relative">
              <Pill
                icon={<Grid3X3 size={13} />}
                label={category || t.filter_category}
                active={!!category}
                onClick={() => toggle("category")}
              />
              {open === "category" && (
                <CategoryMenu current={category} onSelect={v => update({ category: v })} />
              )}
            </div>

            {/* Country pill */}
            <div className="relative">
              <Pill
                icon={countryCode
                  ? <span className={`fi fi-${countryCode} fis`} style={{ width: 14, height: 14, display: "inline-block", flexShrink: 0, borderRadius: 2 }} />
                  : <MapPin size={13} />}
                label={currentCountryName || t.filter_location}
                active={!!countryCode}
                onClick={() => toggle("country")}
              />
              {open === "country" && (
                <CountryOnlyMenu
                  current={currentCountryName}
                  onSelect={country => {
                    navigateLocation({ country, city: "" })
                    setOpen(null)
                  }}
                />
              )}
            </div>

            {/* City pill — only shown when country is selected */}
            {countryCode && (
              <div className="relative">
                <Pill
                  icon={<MapPin size={13} />}
                  label={currentCityName || "All cities"}
                  active={!!citySlug}
                  onClick={() => toggle("city")}
                />
                {open === "city" && (
                  <CityOnlyMenu
                    countryName={currentCountryName}
                    countryCode={countryCode.toUpperCase()}
                    current={currentCityName}
                    onSelect={(city, majorCity) => {
                      // Snap lille by til nærmeste storby
                      navigateLocation({ country: currentCountryName, city: majorCity || city })
                      setOpen(null)
                    }}
                  />
                )}
              </div>
            )}

            {/* Gender */}
            <div className="relative">
              <Pill
                icon={<Users size={13} />}
                label={gender ? (GENDER_LABELS[gender] ?? gender) : t.filter_gender}
                active={!!gender}
                onClick={() => toggle("gender")}
              />
              {open === "gender" && (
                <GenderMenu current={gender} onSelect={v => update({ gender: v })} />
              )}
            </div>

            {/* Filters drawer button */}
            <div className="relative">
              <Pill
                icon={<SlidersHorizontal size={13} />}
                label={t.filter_filters}
                active={!!(ageMin || ageMax || premiumOnly || hasVideo || sort || nationality || bodyBuild || hairColor || ethnicity || orientation || languages || heightMin || heightMax || outcall || hasOwnPlace || verifiedParam || availableNow)}
                onClick={() => setDrawerOpen(true)}
              />
            </div>



          </div>
        </div>
      </div>
    </div>

    {/* Filter drawer */}
    {drawerOpen && (
      <FilterDrawer
        onClose={() => setDrawerOpen(false)}
        onApply={applyDrawer}
        initial={{
          age_min: ageMin, age_max: ageMax,
          premium_only: premiumOnly, has_video: hasVideo, sort,
          nationality, body_build: bodyBuild, hair_color: hairColor,
          ethnicity, orientation, languages, height_min: heightMin,
          height_max: heightMax, outcall, has_own_place: hasOwnPlace,
          verified: verifiedParam, available_now: availableNow,
        }}
      />
    )}
    </>
  )
}

export default function FilterBar() {
  return (
    <Suspense fallback={
      <div className="bg-white border-b border-gray-200 h-[100px] md:h-[56px]" />
    }>
      <FilterBarInner />
    </Suspense>
  )
}
