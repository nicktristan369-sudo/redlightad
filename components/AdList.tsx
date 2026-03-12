import AdCard from "./AdCard";
import { mockListings } from "@/lib/mockAds";

interface Listing {
  id: number;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
  age: number;
  gender: string;
  category: string;
  country?: string;
  region?: string;
  city?: string;
  location?: string;
  language: string;
}

interface AdListProps {
  listings?: Listing[];
}

export default function AdList({ listings }: AdListProps) {
  const ads = listings || mockListings;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Latest Listings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ads.map((ad) => (
            <AdCard key={ad.id} {...ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
