import AdCard from "./AdCard";
import { mockListings } from "@/lib/mockAds";

interface Listing {
  id: number;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
  hasVideo?: boolean;
  age: number;
  gender: string;
  category: string;
  country?: string;
  region?: string;
  city?: string;
  location?: string;
  language: string;
  premium_tier?: string | null;
}

interface AdListProps {
  listings?: Listing[];
}

function tierOrder(tier: string | null | undefined): number {
  if (tier === "vip") return 0;
  if (tier === "featured") return 1;
  return 2;
}

export default function AdList({ listings }: AdListProps) {
  const ads = listings || mockListings;
  const sorted = [...ads].sort((a, b) => tierOrder(a.premium_tier) - tierOrder(b.premium_tier));

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Latest Listings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((ad) => (
            <AdCard key={ad.id} {...ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
