import AdCard from "./AdCard";

const ads = [
  { id: 1, title: "Sofia - Copenhagen Escort", image: "https://picsum.photos/200/200?random=20", verified: true, description: "Professional and discreet. Available for companionship in Copenhagen area.", hasVoice: true, age: 24, gender: "Female", category: "Escort", location: "Copenhagen", language: "Danish, English" },
  { id: 2, title: "Isabella - Aarhus", image: "https://picsum.photos/200/200?random=21", verified: true, description: "Independent and elegant. Available weekdays and weekends in Aarhus.", hasVoice: false, age: 27, gender: "Female", category: "Companion", location: "Aarhus", language: "English" },
  { id: 3, title: "Marco - Copenhagen", image: "https://picsum.photos/200/200?random=22", verified: false, description: "Male escort available for events, travel, and private meetings.", hasVoice: true, age: 30, gender: "Male", category: "Escort", location: "Copenhagen", language: "English, Italian" },
  { id: 4, title: "Luna - Odense", image: "https://picsum.photos/200/200?random=23", verified: true, description: "Sweet and sensual. New in Odense, limited availability.", hasVoice: true, age: 22, gender: "Female", category: "Massage", location: "Odense", language: "Danish" },
  { id: 5, title: "Alex - Aalborg", image: "https://picsum.photos/200/200?random=24", verified: false, description: "Available for private meetings and social events in Aalborg.", hasVoice: false, age: 29, gender: "Male", category: "Companion", location: "Aalborg", language: "English, Spanish" },
  { id: 6, title: "Aria - Copenhagen", image: "https://picsum.photos/200/200?random=25", verified: true, description: "Luxury companion for upscale clientele. Discretion guaranteed.", hasVoice: true, age: 26, gender: "Female", category: "Escort", location: "Copenhagen", language: "English, French" },
];

export default function AdList() {
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
