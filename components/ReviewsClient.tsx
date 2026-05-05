"use client"

import { useState } from "react"
import { Star, MessageSquare, User } from "lucide-react"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"

type Review = {
  id: string
  listing_id: string
  rating: number
  text: string | null
  reviewer_name: string | null
  created_at: string
  listings: {
    name: string
    city: string | null
    country: string | null
    slug: string
    images: string[] | null
  }
}

type Props = { reviews: Review[] }

function getCountryCode(countryName: string | null): string | null {
  if (!countryName) return null
  const c = SUPPORTED_COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  )
  return c?.code || null
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`}
      />
    ))}
  </div>
)

export default function ReviewsClient({ reviews }: Props) {
  const [sort, setSort] = useState<"newest" | "highest" | "most_helpful">("newest")
  const [minRating, setMinRating] = useState(1)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const count = reviews.length
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "\u2014"

  const filtered = reviews
    .filter((r) => r.rating >= minRating)
    .sort((a, b) => {
      if (sort === "highest") return b.rating - a.rating
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const visible = filtered.slice(0, page * 20)

  return (
    <>
      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">{avg}</span>
        <StarRating rating={parseFloat(avg) || 0} />
        <span className="text-gray-500 text-sm">{count.toLocaleString()} reviews</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:border-gray-300 focus:outline-none transition-all"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest rated</option>
          <option value="most_helpful">Most helpful</option>
        </select>

        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white focus:border-gray-300 focus:outline-none transition-all"
        >
          <option value={1}>All ratings</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={5}>5</option>
        </select>
      </div>

      {/* Review list */}
      <div className="flex flex-col gap-4">
        {visible.map((review) => {
          const countryCode = getCountryCode(review.listings.country)
          return (
            <div
              key={review.id}
              className="flex gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors cursor-pointer"
              onClick={() => (window.location.href = `/ads/${review.listings.slug}#reviews`)}
            >
              {/* Profile image */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                {review.listings.images?.[0] ? (
                  <img
                    src={review.listings.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">
                      {review.listings.name}
                    </span>
                    {countryCode && (
                      <span
                        className={`ml-1.5 fi fi-${countryCode}`}
                        style={{ width: 16, height: 11, display: "inline-block", verticalAlign: "middle" }}
                      />
                    )}
                    <span className="text-xs text-gray-500 ml-2">
                      {[review.listings.city, review.listings.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {timeAgo(review.created_at)}
                  </span>
                </div>

                <StarRating rating={review.rating} />

                {review.reviewer_name && (
                  <p className="text-xs text-gray-500 mt-1">by {review.reviewer_name}</p>
                )}

                {review.text && (
                  <div className="mt-2">
                    <p
                      className={`text-sm text-gray-600 ${!expanded.has(review.id) ? "line-clamp-3" : ""}`}
                    >
                      {review.text}
                    </p>
                    {review.text.length > 200 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(review.id)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-600 mt-1 transition-colors"
                      >
                        {expanded.has(review.id) ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Load more */}
      {visible.length < filtered.length && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full py-3 mt-6 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Load more ({filtered.length - visible.length} remaining)
        </button>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reviews found</p>
        </div>
      )}
    </>
  )
}
