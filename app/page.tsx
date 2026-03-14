import Navbar from "@/components/Navbar";
import PremiumCarousel from "@/components/PremiumCarousel";
import AdList from "@/components/AdList";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="bg-gray-950">
        <PremiumCarousel />
      </div>
      <main className="bg-[#F5F5F7]">
        <AdList />
      </main>
    </>
  );
}
