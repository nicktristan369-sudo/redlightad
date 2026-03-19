import { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import { getCountry, SUPPORTED_CODES } from "@/lib/countries"

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

  if (!SUPPORTED_CODES.has(code)) notFound()
  if (!countryData) notFound()

  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <span className={`fi fi-${code}`} style={{ width: 24, height: 18, borderRadius: 0, display: "inline-block" }} />
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Escorts in {cityName}, {countryData.name}
              </h1>
              <p className="text-xs text-gray-400">Browse verified profiles</p>
            </div>
          </div>
        </div>

        <PremiumCarousel
          country={countryData.name}
          title={`Premium i ${cityName}`}
          subtitle="Top verificerede profiler"
        />
        <AdList country={code} city={cityName} limit={40} />
      </main>
    </>
  )
}
