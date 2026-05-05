import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import AdList from "@/components/AdList";
import FilterBar from "@/components/FilterBar";

// Dynamic imports for below-fold components
const StoryCircles = dynamic(() => import("@/components/StoryCircles"));
const PremiumCarousel = dynamic(() => import("@/components/PremiumCarousel"));
const CityFilter = dynamic(() => import("@/components/CityFilter"));

export default function Home() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <Suspense fallback={null}>
        <CityFilter />
      </Suspense>
      <main className="bg-[#F5F5F7]">
        <StoryCircles />
        <PremiumCarousel />
        <AdList />
      </main>
    </>
  );
}
