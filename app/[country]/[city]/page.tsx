import { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import { getCountry, EXTENDED_SUPPORTED_CODES, getCountryEntryByCode, codeToEmoji } from "@/lib/countries"

interface Props {
  params: Promise<{ country: string; city: string }>
}

// "new-york" → "New York"
function unslugify(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params
  const c = getCountry(country)
  const cityName = unslugify(city)
  if (!c) return { title: "RedLightAD" }
  return {
    title: `Escorts in ${cityName}, ${c.name} | RedLightAD`,
    description: `Find verified escort profiles in ${cityName}, ${c.name}.`,
    openGraph: {
      title: `Escorts in ${cityName}, ${c.name} | RedLightAD`,
      description: `Browse verified profiles in ${cityName}.`,
    },
  }
}

export default async function CityPage({ params }: Props) {
  const { country, city } = await params
  const code = country.toLowerCase()
  const countryData = getCountry(code)
  const cityName = unslugify(city)

  if (!EXTENDED_SUPPORTED_CODES.has(code)) notFound()

  const entry = getCountryEntryByCode(code)
  const displayCountry = countryData?.name ?? entry?.name ?? code.toUpperCase()
  const flag = codeToEmoji(code)

  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        {/* Minimal Location Header */}
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">{cityName}, {displayCountry}</h1>
              <span className="text-gray-300">·</span>
              <p className="text-sm text-gray-400">Verified ads</p>
            </div>
          </div>
        </div>
        <PremiumCarousel country={displayCountry} title={`Premium i ${cityName}`} subtitle="Top verificerede profiler" />
        <AdList country={displayCountry} city={cityName} limit={40} />
      </main>
    </>
  )
}
