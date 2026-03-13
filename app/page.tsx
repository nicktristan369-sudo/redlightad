import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PremiumCarousel from "@/components/PremiumCarousel";
import AdList from "@/components/AdList";

export default function Home() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7]">
        <PremiumCarousel />
        <AdList />
      </main>
    </>
  );
}
