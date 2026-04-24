import { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import CountryNotAvailable from "@/components/CountryNotAvailable"
import StoryCircles from "@/components/StoryCircles"
import { getCountry, EXTENDED_SUPPORTED_CODES, getCountryEntryByCode, codeToEmoji } from "@/lib/countries"

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
          {/* Hero Location Header */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-white/20">
                  <span className={`fi fi-${code} fis`} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Discover</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">
                    {displayName}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Browse verified profiles in {displayName}
                  </p>
                </div>
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
