"use client"
import { Country, State, City } from "country-state-city"

interface LocationValue {
  country: string
  countryName: string
  region: string
  regionName: string
  city: string
}

interface LocationSelectorProps {
  value: LocationValue
  onChange: (val: LocationValue) => void
  compact?: boolean
}

const POPULAR_ISOS = ["US", "GB", "AU", "CA", "DE", "FR", "NL", "DK", "SE", "NO"]
const POPULAR_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", AU: "Australia", CA: "Canada",
  DE: "Germany", FR: "France", NL: "Netherlands", DK: "Denmark", SE: "Sweden", NO: "Norway"
}

const COUNTRIES_WITH_STATES = ["US", "CA", "AU", "GB", "DE", "FR", "NL", "SE", "NO"]

export default function LocationSelector({ value, onChange, compact = false }: LocationSelectorProps) {
  const allCountries = Country.getAllCountries()

  const sortedCountries = [
    ...POPULAR_ISOS.map(iso => allCountries.find(c => c.isoCode === iso)).filter(Boolean),
    ...allCountries.filter(c => !POPULAR_ISOS.includes(c.isoCode)).sort((a, b) => a.name.localeCompare(b.name))
  ] as typeof allCountries

  const states = value.country ? State.getStatesOfCountry(value.country) : []
  const hasStates = COUNTRIES_WITH_STATES.includes(value.country) && states.length > 0
  const cities = value.region
    ? City.getCitiesOfState(value.country, value.region)
    : value.country
    ? City.getCitiesOfCountry(value.country) || []
    : []

  const cityOptions = cities.slice(0, 500)

  const selectClass = compact
    ? "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
    : "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"

  const containerClass = compact
    ? "flex items-center gap-2 flex-wrap"
    : "space-y-3"

  return (
    <div className={containerClass}>
      {/* Country */}
      <select
        className={selectClass}
        value={value.country}
        onChange={(e) => {
          const iso = e.target.value
          const name = POPULAR_NAMES[iso] || allCountries.find(c => c.isoCode === iso)?.name || ""
          onChange({ country: iso, countryName: name, region: "", regionName: "", city: "" })
        }}
      >
        <option value="">🌍 Land</option>
        <optgroup label="Populære lande">
          {POPULAR_ISOS.map(iso => (
            <option key={iso} value={iso}>{POPULAR_NAMES[iso]}</option>
          ))}
        </optgroup>
        <optgroup label="Alle lande">
          {sortedCountries.filter(c => !POPULAR_ISOS.includes(c.isoCode)).map(c => (
            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
          ))}
        </optgroup>
      </select>

      {/* Region/State */}
      {value.country && hasStates && (
        <select
          className={selectClass}
          value={value.region}
          onChange={(e) => {
            const iso = e.target.value
            const name = states.find(s => s.isoCode === iso)?.name || ""
            onChange({ ...value, region: iso, regionName: name, city: "" })
          }}
        >
          <option value="">📍 Region</option>
          {states.map(s => (
            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
          ))}
        </select>
      )}

      {/* City */}
      {value.country && (
        <select
          className={selectClass}
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
        >
          <option value="">🏙️ By</option>
          {cityOptions.map(c => (
            <option key={`${c.name}-${c.stateCode}`} value={c.name}>{c.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
