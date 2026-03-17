export interface Country {
  code: string
  name: string
  flag: string
  region: string
}

export const SUPPORTED_COUNTRIES: Country[] = [
  // Europe
  { code: "dk", name: "Denmark", flag: "🇩🇰", region: "Europe" },
  { code: "se", name: "Sweden", flag: "🇸🇪", region: "Europe" },
  { code: "no", name: "Norway", flag: "🇳🇴", region: "Europe" },
  { code: "fi", name: "Finland", flag: "🇫🇮", region: "Europe" },
  { code: "de", name: "Germany", flag: "🇩🇪", region: "Europe" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱", region: "Europe" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧", region: "Europe" },
  { code: "fr", name: "France", flag: "🇫🇷", region: "Europe" },
  { code: "es", name: "Spain", flag: "🇪🇸", region: "Europe" },
  { code: "it", name: "Italy", flag: "🇮🇹", region: "Europe" },
  { code: "ch", name: "Switzerland", flag: "🇨🇭", region: "Europe" },
  { code: "at", name: "Austria", flag: "🇦🇹", region: "Europe" },
  { code: "be", name: "Belgium", flag: "🇧🇪", region: "Europe" },
  { code: "pl", name: "Poland", flag: "🇵🇱", region: "Europe" },
  { code: "cz", name: "Czech Republic", flag: "🇨🇿", region: "Europe" },
  { code: "hu", name: "Hungary", flag: "🇭🇺", region: "Europe" },
  // Asia
  { code: "th", name: "Thailand", flag: "🇹🇭", region: "Asia" },
  { code: "ae", name: "UAE", flag: "🇦🇪", region: "Asia" },
  { code: "sg", name: "Singapore", flag: "🇸🇬", region: "Asia" },
  { code: "jp", name: "Japan", flag: "🇯🇵", region: "Asia" },
  { code: "hk", name: "Hong Kong", flag: "🇭🇰", region: "Asia" },
  { code: "my", name: "Malaysia", flag: "🇲🇾", region: "Asia" },
  { code: "ph", name: "Philippines", flag: "🇵🇭", region: "Asia" },
  { code: "vn", name: "Vietnam", flag: "🇻🇳", region: "Asia" },
  { code: "id", name: "Indonesia", flag: "🇮🇩", region: "Asia" },
  { code: "in", name: "India", flag: "🇮🇳", region: "Asia" },
  // Americas
  { code: "us", name: "USA", flag: "🇺🇸", region: "Americas" },
  { code: "ca", name: "Canada", flag: "🇨🇦", region: "Americas" },
  { code: "mx", name: "Mexico", flag: "🇲🇽", region: "Americas" },
  { code: "br", name: "Brazil", flag: "🇧🇷", region: "Americas" },
  { code: "ar", name: "Argentina", flag: "🇦🇷", region: "Americas" },
  // Africa & Oceania
  { code: "au", name: "Australia", flag: "🇦🇺", region: "Oceania" },
  { code: "nz", name: "New Zealand", flag: "🇳🇿", region: "Oceania" },
  { code: "za", name: "South Africa", flag: "🇿🇦", region: "Africa" },
]

export const POPULAR_COUNTRY_CODES = ["dk", "us", "gb", "de", "th", "ae", "fr", "nl", "se"]

export const SUPPORTED_CODES = new Set(SUPPORTED_COUNTRIES.map(c => c.code))

export function getCountry(code: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === code.toLowerCase())
}

/**
 * Build a Supabase OR-filter string covering all country variants:
 * ISO code (dk/DK) + full name (Denmark) + lowercase name (denmark)
 * Input can be ISO code ("dk") or full name ("Denmark")
 */
export function buildCountryOrFilter(input: string): string {
  const byCode = SUPPORTED_COUNTRIES.find(c => c.code === input.toLowerCase())
  const byName = SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === input.toLowerCase())
  const c = byCode ?? byName

  const variants = c
    ? [c.name, c.name.toLowerCase(), c.code.toUpperCase(), c.code.toLowerCase()]
    : [input, input.toLowerCase(), input.toUpperCase(), input.toUpperCase().slice(0, 2)]

  return [...new Set(variants.filter(Boolean))]
    .map(v => `country.eq.${v}`)
    .join(",")
}
