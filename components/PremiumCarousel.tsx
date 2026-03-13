"use client"
import { useState, useEffect } from "react"

const premiumListings = [
  { id: 1, name: "Sofia", city: "Copenhagen", country: "Denmark", age: 24, img: "https://picsum.photos/300/400?random=10" },
  { id: 2, name: "Jessica", city: "New York", country: "USA", age: 26, img: "https://picsum.photos/300/400?random=50" },
  { id: 3, name: "Charlotte", city: "London", country: "UK", age: 28, img: "https://picsum.photos/300/400?random=53" },
  { id: 4, name: "Emma", city: "Sydney", country: "Australia", age: 25, img: "https://picsum.photos/300/400?random=59" },
  { id: 5, name: "Lena", city: "Berlin", country: "Germany", age: 27, img: "https://picsum.photos/300/400?random=57" },
  { id: 6, name: "Isabelle", city: "Toronto", country: "Canada", age: 26, img: "https://picsum.photos/300/400?random=61" },
]

const VISIBLE = 4

export default function PremiumCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % premiumListings.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isHovered])

  const goTo = (i: number) => setActiveIndex(i)

  const visibleListings = Array.from({ length: VISIBLE }, (_, i) =>
    premiumListings[(activeIndex + i) % premiumListings.length]
  )

  return (
    <section className="py-10 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">⭐ Premium Listings</h2>
          <div className="flex gap-1.5">
            {premiumListings.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-red-600" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {visibleListings.map((listing, i) => (
            <div
              key={`${listing.id}-${activeIndex}-${i}`}
              className="relative overflow-hidden rounded-2xl shadow-md group cursor-pointer animate-fadeSlideIn"
            >
              <div className="relative h-[320px] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.img}
                  alt={listing.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                👑 PREMIUM
              </span>

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="font-bold text-lg leading-tight">{listing.name}, {listing.age}</p>
                <p className="text-sm text-gray-300">{listing.city} · {listing.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
