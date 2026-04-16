"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp, User, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  reviewer_name: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
};

type Stats = {
  count: number;
  avgRating: number;
  distribution: number[];
};

type Props = {
  listingId: string;
  isLoggedIn: boolean;
  isOwnListing: boolean;
};

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
  const s = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
};

const StarInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5 focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
};

export default function ReviewsSection({ listingId, isLoggedIn, isOwnListing }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "helpful">("newest");
  const [showAll, setShowAll] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}/reviews`);
        if (res.status === 403) {
          // Reviews disabled
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
      } catch (err) {
        setError("Could not load reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle || null,
          review_body: formBody || null,
          reviewer_name: formName || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      const { review } = await res.json();
      setReviews((prev) => [review, ...prev]);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              count: prev.count + 1,
              avgRating:
                Math.round(
                  ((prev.avgRating * prev.count + formRating) / (prev.count + 1)) * 10
                ) / 10,
            }
          : null
      );
      setShowForm(false);
      setFormRating(0);
      setFormTitle("");
      setFormBody("");
      setFormName("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "helpful") return b.helpful_count - a.helpful_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visibleReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  if (loading) {
    return (
      <div className="rounded bg-white p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-32" />
          <div className="h-20 bg-gray-50 rounded" />
        </div>
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div id="reviews" className="rounded bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">
          Reviews{" "}
          <span className="text-sm font-normal text-gray-400">({stats.count})</span>
        </h3>
        {!isOwnListing && isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats.count > 0 && (
        <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{stats.avgRating}</div>
            <StarRating rating={Math.round(stats.avgRating)} size="lg" />
            <div className="text-xs text-gray-400 mt-1">{stats.count} reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1];
              const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-500">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-gray-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Write Your Review</h4>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Your Rating *</label>
            <StarInput value={formRating} onChange={setFormRating} />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Display Name (optional)</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Anonymous"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Title (optional)</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Your Review (optional)</label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              placeholder="Share details of your experience..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={formRating === 0 || submitting}
              className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sort & Filter */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-300"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {visibleReviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reviews yet</p>
          {!isOwnListing && isLoggedIn && (
            <p className="text-xs mt-1">Be the first to leave a review!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {review.reviewer_name || "Anonymous"}
                      </span>
                      {review.is_verified && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded uppercase">
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
                  </div>

                  <StarRating rating={review.rating} />

                  {review.title && (
                    <p className="font-medium text-gray-900 mt-2">{review.title}</p>
                  )}

                  {review.body && (
                    <div className="mt-2">
                      <p
                        className={`text-sm text-gray-600 ${
                          !expanded.has(review.id) && review.body.length > 200
                            ? "line-clamp-3"
                            : ""
                        }`}
                      >
                        {review.body}
                      </p>
                      {review.body.length > 200 && (
                        <button
                          onClick={() => toggleExpanded(review.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 mt-1 flex items-center gap-1"
                        >
                          {expanded.has(review.id) ? (
                            <>
                              Show less <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful button */}
                  <div className="mt-3 flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More / Less */}
      {sortedReviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show All {sortedReviews.length} Reviews <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
