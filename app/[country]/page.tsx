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
          <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
            <div className="mx-auto max-w-7xl flex items-center gap-2">
              <span className={`fi fi-${code} fis`} style={{ width: 22, height: 22, display: "inline-block", borderRadius: 3, flexShrink: 0 }} />
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Escorts in {displayName}</h1>
                <p className="text-xs text-gray-400">Browse verified profiles</p>
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
