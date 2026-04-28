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
    return `${city}, ${region}, ${country}`
  }
  return `${city}, ${country}`
}
