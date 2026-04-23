// Get country name from domain TLD
export const TLD_TO_COUNTRY: Record<string, string> = {
  'nl': 'Netherlands',
  'de': 'Germany',
  'dk': 'Denmark',
  'fr': 'France',
  'es': 'Spain',
  'it': 'Italy',
  'pt': 'Portugal',
  'se': 'Sweden',
  'no': 'Norway',
  'pl': 'Poland',
  'cz': 'Czech Republic',
  'ch': 'Switzerland',
  'co': 'Colombia',
  'ca': 'Canada',
  'fi': 'Finland',
  'at': 'Austria',
  'be': 'Belgium',
  'gb': 'United Kingdom',
  'uk': 'United Kingdom',
}

// Client-side: get country from current hostname
export function getCountryFromHostname(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname
  const tld = hostname.split('.').pop()?.toLowerCase() || ''
  return TLD_TO_COUNTRY[tld] || null
}

// Server-side: get country from headers
export function getCountryFromHeaders(headers: Headers): string | null {
  const host = headers.get('host') || ''
  const tld = host.split('.').pop()?.toLowerCase() || ''
  return TLD_TO_COUNTRY[tld] || null
}
