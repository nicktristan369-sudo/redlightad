"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, X, MapPin, Grid3X3, Users, Search, SlidersHorizontal } from "lucide-react"
import { CATEGORIES } from "@/lib/constants/categories"
import { GENDERS } from "@/lib/constants/genders"

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
function DropMenu({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 z-[100] overflow-hidden"
      style={{ minWidth: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.10)", borderRadius: 0 }}
    >
      {children}
    </div>
  )
}

// ── Category ─────────────────────────────────────────────────────────
function CategoryMenu({ current, onSelect }: { current: string; onSelect: (v: string) => void }) {
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
          {c || "All categories"}
        </button>
      ))}
    </DropMenu>
  )
}

// ── Gender ───────────────────────────────────────────────────────────
function GenderMenu({ current, onSelect }: { current: string; onSelect: (v: string) => void }) {
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
          {g || "All"}
        </button>
      ))}
    </DropMenu>
  )
}

// ── Location (2-trins: Land → By) ────────────────────────────────────
function LocationMenu({
  currentCountry,
  currentCity,
  onSelect,
}: {
  currentCountry: string
  currentCity: string
  onSelect: (v: { country: string; city: string }) => void
}) {
  const [countries, setCountries] = useState<{ name: string }[]>([])
  const [cities, setCities] = useState<{ name: string }[]>([])
  const [selCountry, setSelCountry] = useState(currentCountry)
  const [step, setStep] = useState<"country" | "city">(currentCountry ? "city" : "country")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/listings/locations").then(r => r.json()).then(d => setCountries(d.countries ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selCountry) return
    setLoading(true)
    fetch(`/api/listings/locations?country=${encodeURIComponent(selCountry)}`)
      .then(r => r.json())
      .then(d => { setCities(d.cities ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selCountry])

  const filtered = countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  if (step === "country") {
    return (
      <DropMenu>
        <div className="p-2 border-b border-gray-100">
          <input
            autoFocus
            placeholder="Search country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-1.5 border border-gray-200 outline-none focus:border-gray-400"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          <button
            onClick={() => onSelect({ country: "", city: "" })}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100"
          >
            🌍 All countries
          </button>
          {filtered.map(c => (
            <button
              key={c.name}
              onClick={() => { setSelCountry(c.name); setStep("city") }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                currentCountry === c.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
              }`}
            >
              <span>{getCountryEmoji(c.name)}</span> {c.name}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>}
        </div>
      </DropMenu>
    )
  }

  return (
    <DropMenu>
      <button
        onClick={() => { setStep("country"); setSearch("") }}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 border-b border-gray-200"
      >
        ← {getCountryEmoji(selCountry)} {selCountry}
      </button>
      <div className="max-h-60 overflow-y-auto">
        <button
          onClick={() => onSelect({ country: selCountry, city: "" })}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100"
        >
          All cities
        </button>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : cities.map(city => (
          <button
            key={city.name}
            onClick={() => onSelect({ country: selCountry, city: city.name })}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
              currentCity === city.name ? "text-red-600 font-semibold bg-red-50" : "text-gray-800"
            }`}
          >
            <MapPin size={11} /> {city.name}
          </button>
        ))}
        {!loading && cities.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-400 text-center">No cities found</p>
        )}
      </div>
    </DropMenu>
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
      className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-sm font-medium border transition-colors ${
        active
          ? "border-red-500 text-red-600 bg-red-50"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
      style={{ borderRadius: 0 }}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="truncate max-w-[110px]">{label}</span>
      </span>
      <ChevronDown size={12} className="flex-shrink-0" />
    </button>
  )
}

// ── Inner (uses useSearchParams) ──────────────────────────────────────
function FilterBarInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [q, setQ] = useState(searchParams.get("q") ?? "")

  const category = searchParams.get("category") ?? ""
  const country = searchParams.get("country") ?? ""
  const city = searchParams.get("city") ?? ""
  const gender = searchParams.get("gender") ?? ""

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

  const locationLabel = city
    ? `📍 ${city}`
    : country
      ? `${getCountryEmoji(country)} ${country}`
      : "Location"

  const hasFilters = category || country || city || gender || q

  return (
    <div ref={ref} className="bg-white border-b border-gray-200" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2">

        {/* Search — full width top row on mobile */}
        <div className="relative mb-2 md:hidden">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") update({ q }) }}
            onBlur={() => { if (q !== (searchParams.get("q") ?? "")) update({ q }) }}
            className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-gray-200 outline-none focus:border-gray-400"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Pills row */}
        <div className="flex items-stretch gap-0">

          {/* Search — desktop only, left of pills */}
          <div className="relative hidden md:block mr-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") update({ q }) }}
              onBlur={() => { if (q !== (searchParams.get("q") ?? "")) update({ q }) }}
              className="h-9 w-44 pl-8 pr-3 text-sm bg-white border border-gray-200 outline-none focus:border-gray-400"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Mobile: 2x2 grid — Desktop: single row */}
          <div className="grid grid-cols-2 gap-px md:flex md:gap-px flex-1">

            {/* Category */}
            <div className="relative">
              <Pill
                icon={<Grid3X3 size={13} />}
                label={category || "Category"}
                active={!!category}
                onClick={() => toggle("category")}
              />
              {open === "category" && (
                <CategoryMenu current={category} onSelect={v => update({ category: v })} />
              )}
            </div>

            {/* Location */}
            <div className="relative">
              <Pill
                icon={<MapPin size={13} />}
                label={locationLabel}
                active={!!(country || city)}
                onClick={() => toggle("location")}
              />
              {open === "location" && (
                <LocationMenu
                  currentCountry={country}
                  currentCity={city}
                  onSelect={({ country: c, city: ci }) => update({ country: c, city: ci })}
                />
              )}
            </div>

            {/* Gender */}
            <div className="relative">
              <Pill
                icon={<Users size={13} />}
                label={gender || "Gender"}
                active={!!gender}
                onClick={() => toggle("gender")}
              />
              {open === "gender" && (
                <GenderMenu current={gender} onSelect={v => update({ gender: v })} />
              )}
            </div>

            {/* Filters / Clear */}
            <div className="relative">
              {hasFilters ? (
                <button
                  onClick={() => { update({ category: "", country: "", city: "", gender: "", q: "" }); setQ("") }}
                  className="flex items-center justify-center gap-1.5 w-full h-full px-3 py-2 text-sm font-medium border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <X size={13} /> Clear
                </button>
              ) : (
                <button
                  className="flex items-center justify-center gap-1.5 w-full h-full px-3 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <SlidersHorizontal size={13} /> Filters
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
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
