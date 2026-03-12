"use client"
import { useState } from "react"
import LocationSelector from "@/components/LocationSelector"

interface LocationValue {
  country: string
  countryName: string
  region: string
  regionName: string
  city: string
}

export default function FilterBar() {
  const [location, setLocation] = useState<LocationValue>({
    country: "", countryName: "", region: "", regionName: "", city: ""
  })
  const [activeCategory, setActiveCategory] = useState("")
  const [activeGender, setActiveGender] = useState("")

  const categories = ["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"]
  const genders = ["Female", "Male", "Transgender"]

  return (
    <div className="bg-gray-50 border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Location selector - compact mode */}
          <LocationSelector
            value={location}
            onChange={setLocation}
            compact={true}
          />

          {/* Category filter */}
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-red-500 outline-none"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option value="">📁 Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Gender filter */}
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-red-500 outline-none"
            value={activeGender}
            onChange={(e) => setActiveGender(e.target.value)}
          >
            <option value="">👤 Køn</option>
            {genders.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(location.country || activeCategory || activeGender) && (
            <button
              onClick={() => {
                setLocation({ country: "", countryName: "", region: "", regionName: "", city: "" })
                setActiveCategory("")
                setActiveGender("")
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2"
            >
              ✕ Ryd filtre
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
