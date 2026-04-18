import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PremiumCarousel from "@/components/PremiumCarousel";
import AdList from "@/components/AdList";
import StoryCircles from "@/components/StoryCircles";

export default function Home() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="theme-bg">
        <StoryCircles />
        <PremiumCarousel />
        <AdList />
      </main>
    </>
  );
}
