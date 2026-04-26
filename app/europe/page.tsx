import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Escorts in Europe | RedLightAD",
  description: "Browse verified escort profiles across Europe. Find premium services in Germany, UK, France, Spain, and more.",
}

const EUROPE_COUNTRIES = [
  { name: "Germany", code: "de", flag: "🇩🇪" },
  { name: "United Kingdom", code: "gb", flag: "🇬🇧" },
  { name: "France", code: "fr", flag: "🇫🇷" },
  { name: "Spain", code: "es", flag: "🇪🇸" },
  { name: "Italy", code: "it", flag: "🇮🇹" },
  { name: "Netherlands", code: "nl", flag: "🇳🇱" },
  { name: "Belgium", code: "be", flag: "🇧🇪" },
  { name: "Switzerland", code: "ch", flag: "🇨🇭" },
  { name: "Austria", code: "at", flag: "🇦🇹" },
  { name: "Poland", code: "pl", flag: "🇵🇱" },
  { name: "Czech Republic", code: "cz", flag: "🇨🇿" },
  { name: "Portugal", code: "pt", flag: "🇵🇹" },
]

export default function EuropePage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">🌍 Europe</h1>
              <span className="text-gray-300">·</span>
              <p className="text-sm text-gray-400">Browse by country</p>
            </div>
          </div>
        </div>
        
        {/* Country Grid */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {EUROPE_COUNTRIES.map(country => (
              <Link
                key={country.code}
                href={`/${country.code}`}
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all"
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm font-medium text-gray-800">{country.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <StoryCircles />
        <PremiumCarousel title="Premium in Europe" subtitle="Top verified profiles" />
        <AdList limit={40} />
      </main>
    </>
  )
}
