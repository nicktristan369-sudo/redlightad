import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PremiumCarousel from "@/components/PremiumCarousel";
import AdList from "@/components/AdList";

export default function Home() {
  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-gray-50">
        <PremiumCarousel />
        <AdList />
      </main>
      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
