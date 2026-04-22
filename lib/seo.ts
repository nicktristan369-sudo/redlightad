// SEO utilities for domain-specific meta tags and hreflang

export type SupportedLocale = 'en' | 'nl' | 'de' | 'da' | 'fr' | 'es' | 'it' | 'pt' | 'sv' | 'no' | 'pl' | 'cs' | 'ru' | 'th' | 'ar'

// Domain to locale mapping
export const DOMAIN_LOCALE_MAP: Record<string, SupportedLocale> = {
  'redlightad.com': 'en',
  'redlightad.eu': 'en',
  'redlightad.nl': 'nl',
  'redlightad.de': 'de',
  'redlightad.dk': 'da',
  'redlightad.fr': 'fr',
  'redlightad.es': 'es',
  'redlightad.it': 'it',
  'redlightad.pt': 'pt',
  'redlightad.se': 'sv',
  'redlightad.no': 'no',
  'redlightad.pl': 'pl',
  'redlightad.cz': 'cs',
  'redlightad.ru': 'ru',
  'redlightad.th': 'th',
  'redlightad.ae': 'ar',
}

// hreflang links for all domains
export const HREFLANG_DOMAINS: Record<SupportedLocale, string> = {
  en: 'https://redlightad.com',
  nl: 'https://redlightad.nl',
  de: 'https://redlightad.de',
  da: 'https://redlightad.dk',
  fr: 'https://redlightad.fr',
  es: 'https://redlightad.es',
  it: 'https://redlightad.it',
  pt: 'https://redlightad.pt',
  sv: 'https://redlightad.se',
  no: 'https://redlightad.no',
  pl: 'https://redlightad.pl',
  cs: 'https://redlightad.cz',
  ru: 'https://redlightad.ru',
  th: 'https://redlightad.th',
  ar: 'https://redlightad.ae',
}

// SEO config per locale
export const SEO_CONFIG: Record<SupportedLocale, {
  title: string
  description: string
  keywords: string
}> = {
  en: {
    title: 'RedLightAD - Escort & Adult Services Directory',
    description: 'Find verified escorts and adult services worldwide. Discreet, safe, and reliable.',
    keywords: 'escorts, escort directory, adult services, verified escorts',
  },
  nl: {
    title: 'RedLightAD - Escort & Volwassen Services Nederland',
    description: 'Vind geverifieerde escorts en volwassenendiensten in Nederland. Discreet en betrouwbaar.',
    keywords: 'escorts Nederland, Amsterdam escorts, Rotterdam escorts, escort diensten',
  },
  de: {
    title: 'RedLightAD - Escort & Erwachsenen Services Deutschland',
    description: 'Finde verifizierte Escorts und Erwachsenendienste in Deutschland. Diskret und zuverlässig.',
    keywords: 'Escorts Deutschland, Berlin Escorts, München Escorts, Escort Dienste',
  },
  da: {
    title: 'RedLightAD - Escort & Voksen Services Danmark',
    description: 'Find verificerede escorts og voksen services i Danmark. Diskret og pålidelig.',
    keywords: 'escorts Danmark, København escorts, escort tjenester',
  },
  fr: {
    title: 'RedLightAD - Escort & Services Adultes France',
    description: 'Trouvez des escorts vérifiés et services pour adultes en France. Discret et fiable.',
    keywords: 'escorts France, Paris escorts, services escort',
  },
  es: {
    title: 'RedLightAD - Escort & Servicios para Adultos España',
    description: 'Encuentra escorts verificados y servicios para adultos en España. Discreto y confiable.',
    keywords: 'escorts España, Madrid escorts, Barcelona escorts, servicios escort',
  },
  it: {
    title: 'RedLightAD - Escort & Servizi per Adulti Italia',
    description: 'Trova escort verificati e servizi per adulti in Italia. Discreto e affidabile.',
    keywords: 'escort Italia, Milano escort, Roma escort, servizi escort',
  },
  pt: {
    title: 'RedLightAD - Escort & Serviços Adultos Portugal',
    description: 'Encontre escorts verificados e serviços para adultos em Portugal. Discreto e confiável.',
    keywords: 'escorts Portugal, Lisboa escorts, Porto escorts, serviços escort',
  },
  sv: {
    title: 'RedLightAD - Escort & Vuxentjänster Sverige',
    description: 'Hitta verifierade escorts och vuxentjänster i Sverige. Diskret och pålitlig.',
    keywords: 'escorts Sverige, Stockholm escorts, escort tjänster',
  },
  no: {
    title: 'RedLightAD - Escort & Voksentjenester Norge',
    description: 'Finn verifiserte escorts og voksentjenester i Norge. Diskret og pålitelig.',
    keywords: 'escorts Norge, Oslo escorts, escort tjenester',
  },
  pl: {
    title: 'RedLightAD - Escort & Usługi dla Dorosłych Polska',
    description: 'Znajdź zweryfikowane escorts i usługi dla dorosłych w Polsce. Dyskretnie i niezawodnie.',
    keywords: 'escorts Polska, Warszawa escorts, Kraków escorts, usługi escort',
  },
  cs: {
    title: 'RedLightAD - Escort & Služby pro Dospělé Česká Republika',
    description: 'Najděte ověřené escort služby v České republice. Diskrétně a spolehlivě.',
    keywords: 'escort Česká Republika, Praha escort, Brno escort, escort služby',
  },
  ru: {
    title: 'RedLightAD - Эскорт услуги Россия',
    description: 'Найдите проверенные эскорт услуги в России. Дискретно и надежно.',
    keywords: 'эскорт Россия, Москва эскорт, эскорт услуги',
  },
  th: {
    title: 'RedLightAD - บริการเอสคอร์ท ประเทศไทย',
    description: 'ค้นหาบริการเอสคอร์ทที่ได้รับการยืนยันในประเทศไทย',
    keywords: 'escort Thailand, Bangkok escort, escort services',
  },
  ar: {
    title: 'RedLightAD - خدمات المرافقة',
    description: 'ابحث عن خدمات المرافقة المعتمدة. سري وموثوق.',
    keywords: 'escort services, مرافقة',
  },
}

/**
 * Get SEO metadata for a given locale
 */
export function getSeoMeta(locale: SupportedLocale, pageTitle?: string) {
  const config = SEO_CONFIG[locale] || SEO_CONFIG.en
  
  return {
    title: pageTitle ? `${pageTitle} | ${config.title}` : config.title,
    description: config.description,
    keywords: config.keywords,
  }
}

/**
 * Generate hreflang links for a given path
 */
export function getHreflangLinks(path: string = '/'): Array<{ locale: string; href: string }> {
  const links: Array<{ locale: string; href: string }> = []
  
  for (const [locale, domain] of Object.entries(HREFLANG_DOMAINS)) {
    links.push({
      locale,
      href: `${domain}${path}`,
    })
  }
  
  // Add x-default (fallback to English)
  links.push({
    locale: 'x-default',
    href: `https://redlightad.com${path}`,
  })
  
  return links
}

/**
 * Get locale from domain
 */
export function getLocaleFromDomain(host: string): SupportedLocale {
  const domain = host.split(':')[0]
  
  for (const [mappedDomain, locale] of Object.entries(DOMAIN_LOCALE_MAP)) {
    if (domain.includes(mappedDomain)) {
      return locale
    }
  }
  
  return 'en'
}
