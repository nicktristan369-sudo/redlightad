import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import PremiumCarousel from "@/components/PremiumCarousel"
import AdList from "@/components/AdList"
import StoryCircles from "@/components/StoryCircles"

export const metadata: Metadata = {
  title: "Pornstar Profiles | RedLightAD",
  description: "Browse verified pornstar profiles on RedLightAD. Meet real adult film stars.",
}

export default function PornstarPage() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 16px' }}>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900">Pornstar</h1>
              <span className="text-gray-300">·</span>
              <p className="text-sm text-gray-400">Verified profiles</p>
            </div>
          </div>
        </div>
        <StoryCircles />
        <PremiumCarousel title="Pornstar Profiles" subtitle="Real adult film stars" />
        <AdList limit={40} />
      </main>
    </>
  )
}
