import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Escorts in Scandinavia | RedLightAD",
  description: "Browse verified escort profiles in Scandinavia. Find premium services in Denmark, Sweden, Norway, and Finland.",
}

const SCANDINAVIA_COUNTRIES = [
  { name: "Denmark", code: "dk", flag: "🇩🇰" },
  { name: "Sweden", code: "se", flag: "🇸🇪" },
  { name: "Norway", code: "no", flag: "🇳🇴" },
  { name: "Finland", code: "fi", flag: "🇫🇮" },
  { name: "Iceland", code: "is", flag: "🇮🇸" },
]

export default function ScandinaviaPage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">🇩🇰 Scandinavia</h1>
              <span className="text-gray-300">·</span>
              <p className="text-sm text-gray-400">Browse by country</p>
            </div>
          </div>
        </div>
        
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SCANDINAVIA_COUNTRIES.map(country => (
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
        <PremiumCarousel region="scandinavia" title="Premium in Scandinavia" subtitle="Top verified profiles" />
        <AdList region="scandinavia" limit={40} />
      </main>
    </>
  )
}
