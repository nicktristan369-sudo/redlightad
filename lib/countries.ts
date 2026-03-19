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

/**
 * Returns an array of all country DB variants for use with Supabase .in()
 * Input: ISO code ("dk") or full name ("Denmark")
 */
export function getCountryVariants(input: string): string[] {
  const byCode = SUPPORTED_COUNTRIES.find(c => c.code === input.toLowerCase())
  const byName = SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === input.toLowerCase())
  const c = byCode ?? byName

  const variants = c
    ? [c.name, c.name.toLowerCase(), c.code.toUpperCase(), c.code.toLowerCase()]
    : [input, input.toLowerCase(), input.toUpperCase()]

  return [...new Set(variants.filter(Boolean))]
}

export function getCountryByName(name: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

// ── Full country list (hardcoded) ──────────────────────────────────────
export interface CountryEntry { name: string; code: string }

export const COUNTRIES: { europe: CountryEntry[]; worldwide: CountryEntry[] } = {
  europe: [
    { name: "Albania", code: "al" },
    { name: "Andorra", code: "ad" },
    { name: "Armenia", code: "am" },
    { name: "Austria", code: "at" },
    { name: "Belarus", code: "by" },
    { name: "Belgium", code: "be" },
    { name: "Bosnia Herzegovina", code: "ba" },
    { name: "Bulgaria", code: "bg" },
    { name: "Croatia", code: "hr" },
    { name: "Cyprus", code: "cy" },
    { name: "Czech Republic", code: "cz" },
    { name: "Denmark", code: "dk" },
    { name: "Estonia", code: "ee" },
    { name: "Finland", code: "fi" },
    { name: "France", code: "fr" },
    { name: "Georgia", code: "ge" },
    { name: "Germany", code: "de" },
    { name: "Greece", code: "gr" },
    { name: "Hungary", code: "hu" },
    { name: "Iceland", code: "is" },
    { name: "Ireland", code: "ie" },
    { name: "Italy", code: "it" },
    { name: "Kosovo", code: "xk" },
    { name: "Latvia", code: "lv" },
    { name: "Liechtenstein", code: "li" },
    { name: "Lithuania", code: "lt" },
    { name: "Luxembourg", code: "lu" },
    { name: "Malta", code: "mt" },
    { name: "Moldova", code: "md" },
    { name: "Monaco", code: "mc" },
    { name: "Montenegro", code: "me" },
    { name: "Netherlands", code: "nl" },
    { name: "North Macedonia", code: "mk" },
    { name: "Norway", code: "no" },
    { name: "Poland", code: "pl" },
    { name: "Portugal", code: "pt" },
    { name: "Romania", code: "ro" },
    { name: "Russia", code: "ru" },
    { name: "Serbia", code: "rs" },
    { name: "Slovakia", code: "sk" },
    { name: "Slovenia", code: "si" },
    { name: "Spain", code: "es" },
    { name: "Sweden", code: "se" },
    { name: "Switzerland", code: "ch" },
    { name: "Turkey", code: "tr" },
    { name: "UK", code: "uk" },
    { name: "Ukraine", code: "ua" },
  ],
  worldwide: [
    { name: "Algeria", code: "dz" },
    { name: "Angola", code: "ao" },
    { name: "Argentina", code: "ar" },
    { name: "Australia", code: "au" },
    { name: "Azerbaijan", code: "az" },
    { name: "Bahrain", code: "bh" },
    { name: "Bangladesh", code: "bd" },
    { name: "Brazil", code: "br" },
    { name: "Cambodia", code: "kh" },
    { name: "Cameroon", code: "cm" },
    { name: "Canada", code: "ca" },
    { name: "Chile", code: "cl" },
    { name: "China", code: "cn" },
    { name: "Colombia", code: "co" },
    { name: "Costa Rica", code: "cr" },
    { name: "Ecuador", code: "ec" },
    { name: "Egypt", code: "eg" },
    { name: "Ghana", code: "gh" },
    { name: "India", code: "in" },
    { name: "Indonesia", code: "id" },
    { name: "Israel", code: "il" },
    { name: "Ivory Coast", code: "ci" },
    { name: "Jamaica", code: "jm" },
    { name: "Japan", code: "jp" },
    { name: "Jordan", code: "jo" },
    { name: "Kazakhstan", code: "kz" },
    { name: "Kenya", code: "ke" },
    { name: "Kuwait", code: "kw" },
    { name: "Lebanon", code: "lb" },
    { name: "Malaysia", code: "my" },
    { name: "Mexico", code: "mx" },
    { name: "Morocco", code: "ma" },
    { name: "Nepal", code: "np" },
    { name: "New Zealand", code: "nz" },
    { name: "Nigeria", code: "ng" },
    { name: "Oman", code: "om" },
    { name: "Pakistan", code: "pk" },
    { name: "Panama", code: "pa" },
    { name: "Peru", code: "pe" },
    { name: "Philippines", code: "ph" },
    { name: "Qatar", code: "qa" },
    { name: "Saudi Arabia", code: "sa" },
    { name: "Senegal", code: "sn" },
    { name: "Singapore", code: "sg" },
    { name: "South Africa", code: "za" },
    { name: "South Korea", code: "kr" },
    { name: "Sri Lanka", code: "lk" },
    { name: "Taiwan", code: "tw" },
    { name: "Thailand", code: "th" },
    { name: "Tunisia", code: "tn" },
    { name: "UAE", code: "ae" },
    { name: "Uganda", code: "ug" },
    { name: "USA", code: "us" },
    { name: "Uzbekistan", code: "uz" },
  ],
}

// All countries flat + extended SUPPORTED_CODES
export const ALL_COUNTRIES: CountryEntry[] = [...COUNTRIES.europe, ...COUNTRIES.worldwide]
export const ALL_COUNTRY_CODES = new Set(ALL_COUNTRIES.map(c => c.code))
export const EXTENDED_SUPPORTED_CODES = new Set([...SUPPORTED_CODES, ...ALL_COUNTRY_CODES])

export function getCountryEntryByName(name: string): CountryEntry | undefined {
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase())
}

export function getCountryEntryByCode(code: string): CountryEntry | undefined {
  return ALL_COUNTRIES.find(c => c.code === code.toLowerCase())
}

// Emoji flag from 2-letter ISO code
export function codeToEmoji(code: string): string {
  const c = code.toUpperCase()
  if (c.length !== 2) return "🌍"
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 - 65 + ch.charCodeAt(0)))
}
