import { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import CountryPremiumCarousel from "@/components/CountryPremiumCarousel"
import CountryAdFeed from "@/components/CountryAdFeed"
import CountryNotAvailable from "@/components/CountryNotAvailable"
import { getCountry, SUPPORTED_CODES } from "@/lib/countries"

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

  if (!SUPPORTED_CODES.has(code)) {
    // Invalid country code entirely
    notFound()
  }

  return (
    <>
      <Navbar />
      {!countryData ? (
        <CountryNotAvailable countryCode={code} />
      ) : (
        <main className="bg-[#F5F5F7] min-h-screen">
          {/* Country header */}
          <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
            <div className="mx-auto max-w-7xl flex items-center gap-2">
              <span className="text-2xl">{countryData.flag}</span>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">Escorts in {countryData.name}</h1>
                <p className="text-xs text-gray-400">Browse verified profiles</p>
              </div>
            </div>
          </div>

          <CountryPremiumCarousel country={code} countryName={countryData.name} />
          <CountryAdFeed country={code} />
        </main>
      )}
    </>
  )
}
