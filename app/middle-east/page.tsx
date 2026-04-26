import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Escorts in Middle East | RedLightAD",
  description: "Browse verified escort profiles in the Middle East. Find premium services in Dubai, Qatar, Bahrain, and more.",
}

const MIDDLE_EAST_COUNTRIES = [
  { name: "UAE (Dubai)", code: "ae" },
  { name: "Qatar", code: "qa" },
  { name: "Bahrain", code: "bh" },
  { name: "Kuwait", code: "kw" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Oman", code: "om" },
  { name: "Jordan", code: "jo" },
  { name: "Lebanon", code: "lb" },
  { name: "Israel", code: "il" },
  { name: "Turkey", code: "tr" },
]

export default function MiddleEastPage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 16px' }}>
            <h1 className="text-xl font-bold text-gray-900">Middle East</h1>
            <p className="text-sm text-gray-500 mt-1">Browse escorts by country</p>
          </div>
        </div>
        
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {MIDDLE_EAST_COUNTRIES.map(country => (
              <Link
                key={country.code}
                href={`/${country.code}`}
                className="group flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-9 rounded-md overflow-hidden shadow-sm mb-3 ring-1 ring-gray-200">
                  <Image
                    src={`https://flagcdn.com/w80/${country.code}.png`}
                    alt={country.name}
                    width={48}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition-colors text-center">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <StoryCircles />
        <PremiumCarousel title="Premium in Middle East" subtitle="Top verified profiles" />
        <AdList limit={40} />
      </main>
    </>
  )
}
