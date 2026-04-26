import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Escorts in Asia | RedLightAD",
  description: "Browse verified escort profiles across Asia. Find premium services in Thailand, Japan, Singapore, and more.",
}

const ASIA_COUNTRIES = [
  { name: "Thailand", code: "th", flag: "🇹🇭" },
  { name: "Japan", code: "jp", flag: "🇯🇵" },
  { name: "Singapore", code: "sg", flag: "🇸🇬" },
  { name: "Malaysia", code: "my", flag: "🇲🇾" },
  { name: "Philippines", code: "ph", flag: "🇵🇭" },
  { name: "Indonesia", code: "id", flag: "🇮🇩" },
  { name: "South Korea", code: "kr", flag: "🇰🇷" },
  { name: "UAE", code: "ae", flag: "🇦🇪" },
  { name: "India", code: "in", flag: "🇮🇳" },
  { name: "China", code: "cn", flag: "🇨🇳" },
]

export default function AsiaPage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">🌏 Asia</h1>
              <span className="text-gray-300">·</span>
              <p className="text-sm text-gray-400">Browse by country</p>
            </div>
          </div>
        </div>
        
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ASIA_COUNTRIES.map(country => (
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
        <PremiumCarousel region="asia" title="Premium in Asia" subtitle="Top verified profiles" />
        <AdList region="asia" limit={40} />
      </main>
    </>
  )
}
