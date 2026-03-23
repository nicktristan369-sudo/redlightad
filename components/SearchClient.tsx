"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import AdCard from "@/components/AdCard"

interface Listing {
  id: number
  title: string
  profile_image: string | null
  video_url: string | null
  age: number
  gender: string
  category: string
  location: string | null
  city: string | null
  country: string | null
  about: string | null
  languages: string[] | null
  premium_tier: string | null
  created_at: string
  voice_message_url: string | null
  images: string[] | null
}

interface SearchParams {
  q: string
  country: string
  city: string
  category: string
  gender: string
  sort: string
  page: number
}

interface SearchClientProps {
  initialListings: Listing[]
  totalCount: number
  suggested: Listing[]
  searchParams: SearchParams
  pageSize: number
}

export default function SearchClient({
  initialListings,
  totalCount,
  suggested,
  searchParams: { q, country, city, category, gender, sort, page },
  pageSize,
}: SearchClientProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState(q)

  const updateSearch = (updates: Partial<Record<string, string>>) => {
    const current: Record<string, string> = { q, country, city, category, gender, sort, page: String(page) }
    const merged = { ...current, ...updates, page: updates.page || "1" }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/search?${params.toString()}`)
  }

  const debouncedSearch = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>
    return (value: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => updateSearch({ q: value }), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, country, city, category, gender, sort])

  const totalPages = Math.ceil(totalCount / pageSize)
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
    return start + i
  }).filter(n => n <= totalPages)

  return (
    <div className="bg-[#F5F5F7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Search field */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              debouncedSearch(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === "Enter") updateSearch({ q: inputValue })
            }}
            placeholder="Search profiles, locations..."
            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-200 bg-white text-gray-900 text-base shadow-sm focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("")
                updateSearch({ q: "" })
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Result count + sort */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {q
              ? `Showing ${totalCount.toLocaleString()} results for "${q}"`
              : `Browse all profiles (${totalCount.toLocaleString()})`}
          </p>
          <select
            value={sort}
            onChange={e => updateSearch({ sort: e.target.value })}
            className="h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most popular</option>
            <option value="featured">Featured first</option>
          </select>
        </div>

        {/* Grid */}
        {initialListings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {initialListings.map(listing => (
              <AdCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                image={listing.profile_image || "/placeholder.jpg"}
                verified={listing.premium_tier === "vip" || listing.premium_tier === "featured"}
                description={listing.about || ""}
                hasVoice={!!listing.voice_message_url}
                voiceUrl={listing.voice_message_url}
                hasVideo={!!listing.video_url}
                videoUrl={listing.video_url || undefined}
                age={listing.age || 0}
                gender={listing.gender || ""}
                category={listing.category || ""}
                country={listing.country || undefined}
                city={listing.city || undefined}
                location={listing.location || undefined}
                language={listing.languages?.[0] || ""}
                premium_tier={listing.premium_tier}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              No results found{q ? ` for "${q}"` : ""}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Try searching with different keywords or filters
            </p>
            {suggested.length > 0 && (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-4">You might also like</p>
                <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
                  {suggested.map(listing => (
                    <AdCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      image={listing.profile_image || "/placeholder.jpg"}
                      verified={listing.premium_tier === "vip" || listing.premium_tier === "featured"}
                      description={listing.about || ""}
                      hasVoice={!!listing.voice_message_url}
                      voiceUrl={listing.voice_message_url}
                      hasVideo={!!listing.video_url}
                      videoUrl={listing.video_url || undefined}
                      age={listing.age || 0}
                      gender={listing.gender || ""}
                      category={listing.category || ""}
                      country={listing.country || undefined}
                      city={listing.city || undefined}
                      location={listing.location || undefined}
                      language={listing.languages?.[0] || ""}
                      premium_tier={listing.premium_tier}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => updateSearch({ page: String(page - 1) })}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-white transition-colors"
            >
              Previous
            </button>
            {pageNumbers.map(n => (
              <button
                key={n}
                onClick={() => updateSearch({ page: String(n) })}
                className={`w-9 h-9 rounded-xl text-sm ${
                  n === page
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 hover:bg-white"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => updateSearch({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
