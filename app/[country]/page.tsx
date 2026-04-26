import { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import CountryNotAvailable from "@/components/CountryNotAvailable"
import StoryCircles from "@/components/StoryCircles"
import { getCountry, EXTENDED_SUPPORTED_CODES, getCountryEntryByCode, codeToEmoji } from "@/lib/countries"

// Reserved routes that should NOT be handled by [country] dynamic route
const RESERVED_ROUTES = new Set([
  'escort', 'massage', 'fetish', 'transgender', 'bdsm', 'pornstar',
  'europe', 'asia', 'scandinavia',
  'cam', 'coins', 'premium', 'reviews', 'marketplace', 'videos', 'onlyfans',
  'faq', 'contact', 'safety', 'terms', 'report', 'help',
  'about', 'press', 'advertise', 'privacy', 'cookies',
  'login', 'register', 'dashboard', 'admin', 'api', 'listing'
])

interface Props {
  params: Promise<{ country: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  const c = getCountry(country)
  if (!c) return { title: "RedLightAD" }
  return {
    title: `Escorts in ${c.name} | RedLightAD`,
    description: `Find verified escort profiles in ${c.name}. Browse ads from top verified members on RedLightAD.`,
    openGraph: {
      title: `Escorts in ${c.name} | RedLightAD`,
      description: `Find verified escort profiles in ${c.name}.`,
    },
  }
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params
  const code = country.toLowerCase()
  
  // Let reserved routes fall through to their static pages
  if (RESERVED_ROUTES.has(code)) {
    notFound()
  }
  
  const countryData = getCountry(code)

  if (!EXTENDED_SUPPORTED_CODES.has(code)) {
    notFound()
  }

  const entry = getCountryEntryByCode(code)
  const displayName = countryData?.name ?? entry?.name ?? code.toUpperCase()
  const flag = codeToEmoji(code)

  return (
    <>
      <Navbar />
      <FilterBar />
      {!countryData && !entry ? (
        <CountryNotAvailable countryCode={code} />
      ) : (
        <main className="bg-[#F5F5F7] min-h-screen">
          {/* Minimal Location Header */}
          <div className="bg-white border-b border-gray-100">
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-900">{displayName}</h1>
                <span className="text-gray-300">·</span>
                <p className="text-sm text-gray-400">Verified ads</p>
              </div>
            </div>
          </div>
          <StoryCircles country={code} />
          <PremiumCarousel country={displayName} title={`Premium i ${displayName}`} subtitle="Top verificerede profiler" />
          <AdList country={displayName} limit={40} />
        </main>
      )}
    </>
  )
}
