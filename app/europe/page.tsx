import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Escorts in Europe | RedLightAD",
  description: "Browse verified escort profiles across Europe. Find premium services in Germany, UK, France, Spain, and more.",
}

const EUROPE_COUNTRIES = [
  { name: "Germany", code: "de" },
  { name: "United Kingdom", code: "gb" },
  { name: "France", code: "fr" },
  { name: "Spain", code: "es" },
  { name: "Italy", code: "it" },
  { name: "Netherlands", code: "nl" },
  { name: "Belgium", code: "be" },
  { name: "Switzerland", code: "ch" },
  { name: "Austria", code: "at" },
  { name: "Poland", code: "pl" },
  { name: "Czech Republic", code: "cz" },
  { name: "Portugal", code: "pt" },
  { name: "Greece", code: "gr" },
  { name: "Sweden", code: "se" },
  { name: "Norway", code: "no" },
  { name: "Denmark", code: "dk" },
  { name: "Finland", code: "fi" },
  { name: "Ireland", code: "ie" },
]

export default function EuropePage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 16px' }}>
            <h1 className="text-xl font-bold text-gray-900">Europe</h1>
            <p className="text-sm text-gray-500 mt-1">Browse escorts by country</p>
          </div>
        </div>
        
        {/* Country Grid */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {EUROPE_COUNTRIES.map(country => (
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
        <PremiumCarousel title="Premium in Europe" subtitle="Top verified profiles" />
        <AdList limit={40} />
      </main>
    </>
  )
}
