import AdCard from "./AdCard";
import { createServerClient } from "@/lib/supabaseServer";

interface Listing {
  id: string;
  title: string;
  profile_image: string | null;
  age: number;
  gender: string;
  category: string;
  location: string;
  about: string | null;
  languages: string[];
  premium_tier: string | null;
  status: string;
}

function tierOrder(tier: string | null | undefined): number {
  if (tier === "vip") return 0;
  if (tier === "featured") return 1;
  return 2;
}

export default async function AdList() {
  const supabase = createServerClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, profile_image, age, gender, category, location, about, languages, premium_tier, status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("AdList fetch error:", error.message);
  }

  const ads = listings || [];
  const sorted = [...ads].sort((a, b) => tierOrder(a.premium_tier) - tierOrder(b.premium_tier));

  if (sorted.length === 0) {
    return (
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Seneste annoncer</h2>
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-lg">Ingen aktive annoncer endnu</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Seneste annoncer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              image={ad.profile_image || ""}
              verified={false}
              description={ad.about || ""}
              hasVoice={false}
              age={ad.age}
              gender={ad.gender}
              category={ad.category}
              location={ad.location}
              language={ad.languages?.[0] || ""}
              premium_tier={ad.premium_tier}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
