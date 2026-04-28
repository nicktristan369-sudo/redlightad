import { City, State, Country } from "country-state-city"

// Cache for performance
const cache = new Map<string, string>()

/**
 * Given a city name and country name (full name, e.g. "Denmark"),
 * returns the state/region name, e.g. "South Denmark".
 * Returns empty string if not found.
 */
export function getRegionForCity(cityName: string, countryName: string): string {
  if (!cityName || !countryName) return ""
  const key = `${cityName.toLowerCase()}::${countryName.toLowerCase()}`
  if (cache.has(key)) return cache.get(key)!

  // Find country by name
  const allCountries = Country.getAllCountries()
  const country = allCountries.find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  )
  if (!country) {
    cache.set(key, "")
    return ""
  }

  // Find city in that country
  const cities = City.getCitiesOfCountry(country.isoCode) || []
  const match = cities.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  )
  if (!match) {
    cache.set(key, "")
    return ""
  }

  // Get state name
  const state = State.getStateByCodeAndCountry(match.stateCode, country.isoCode)
  const regionName = state?.name || ""
  cache.set(key, regionName)
  return regionName
}

/**
 * Strips country name from a region string to avoid duplication.
 * e.g. "North Denmark Region" → "North Denmark"
 * e.g. "Capital Region of Denmark" → "Capital Region"
 */
function stripCountryFromRegion(region: string, country: string): string {
  // Remove " of <Country>" suffix
  const ofPattern = new RegExp(`\\s+of\\s+${country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
  let clean = region.replace(ofPattern, "").trim()
  // Remove " <Country>" suffix (e.g. "North Denmark Region" where country="Denmark" is embedded)
  // Only strip if country appears as a whole word at end (e.g. "North Denmark Region" → don't strip "Denmark" mid-string)
  const suffixPattern = new RegExp(`\\s+${country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
  clean = clean.replace(suffixPattern, "").trim()
  // Remove trailing " Region" if it remains standalone
  clean = clean.replace(/\s+Region$/i, "").trim()
  return clean || region
}

/**
 * Returns formatted location string, e.g.:
 * "Tønder, South Denmark, Denmark" or "Copenhagen, Capital Region, Denmark"
 * Falls back to "city, country" if no region found.
 */
export function formatLocation(cityName: string | null | undefined, countryName: string | null | undefined): string {
  const city = cityName?.trim() || ""
  const country = countryName?.trim() || ""
  if (!city && !country) return ""
  if (!city) return country
  if (!country) return city

  const region = getRegionForCity(city, country)
  if (region && region !== city && region !== country) {
    const cleanRegion = stripCountryFromRegion(region, country)
    return `${city}, ${cleanRegion}, ${country}`
  }
  return `${city}, ${country}`
}
