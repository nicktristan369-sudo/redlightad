import Image from "next/image";

const premiumListings = [
  { id: 1, name: "Sofia", city: "Copenhagen", age: 24, img: "https://picsum.photos/300/400?random=10" },
  { id: 2, name: "Isabella", city: "Aarhus", age: 27, img: "https://picsum.photos/300/400?random=11" },
  { id: 3, name: "Valentina", city: "Odense", age: 22, img: "https://picsum.photos/300/400?random=12" },
  { id: 4, name: "Aurora", city: "Aalborg", age: 25, img: "https://picsum.photos/300/400?random=13" },
];

export default function PremiumCarousel() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          ⭐ Premium Listings
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {premiumListings.map((listing) => (
            <div
              key={listing.id}
              className="relative min-w-[220px] flex-shrink-0 overflow-hidden rounded-xl shadow-lg"
            >
              <div className="relative h-[280px] w-[220px]">
                <Image
                  src={listing.img}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                PREMIUM
              </span>
              <div className="bg-white p-3">
                <p className="font-semibold text-gray-900">{listing.name}</p>
                <p className="text-sm text-gray-500">
                  {listing.city} &middot; {listing.age} yrs
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
