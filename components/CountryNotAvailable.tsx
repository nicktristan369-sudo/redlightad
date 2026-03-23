"use client"

import Link from "next/link"
import { useState } from "react"
import CountrySelector from "@/components/CountrySelector"

interface Props {
  countryCode: string
}

export default function CountryNotAvailable({ countryCode }: Props) {
  const [showSelector, setShowSelector] = useState(false)

  return (
    <main className="bg-[#F5F5F7] min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-5 flex justify-center"><svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          We&apos;re coming soon!
        </h1>
        <p className="text-gray-500 text-sm mb-2">
          RedLightAD hasn&apos;t launched in <strong className="uppercase">{countryCode}</strong> yet.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Be the first to post an ad in this country.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/opret-annonce"
            className="bg-gray-900 hover:bg-black text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Post an Ad
          </Link>
          <button
            onClick={() => setShowSelector(true)}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Choose another country
          </button>
        </div>
      </div>
      {showSelector && <CountrySelector forceOpen onClose={() => setShowSelector(false)} />}
    </main>
  )
}
