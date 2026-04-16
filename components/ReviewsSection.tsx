"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp, User, MessageSquare, ChevronDown, ChevronUp, MapPin, Calendar, Lock } from "lucide-react";
import Link from "next/link";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  reviewer_location: string | null;
  is_verified: boolean;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  time_spent: string | null;
  ambience: string | null;
  photos_accurate: string | null;
  would_recommend: string | null;
  meeting_country: string | null;
  meeting_date: string | null;
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
  listingName?: string;
  listingImage?: string | null;
  listingAge?: number;
  listingCity?: string;
  listingCountry?: string;
};

const TIME_SPENT_OPTIONS = ["30 minutes", "1 hour", "2 hours", "3 hours", "4+ hours", "Overnight", "Weekend"];
const AMBIENCE_OPTIONS = ["Very relaxing", "Relaxing", "Professional", "Rushed", "Uncomfortable"];
const PHOTOS_OPTIONS = ["Yes, they are", "Yes, but they are outdated", "Somewhat", "No, not at all"];
const RECOMMEND_OPTIONS = ["Yes, definitely", "Yes, probably", "Not sure", "Probably not", "No"];

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
            className={`w-8 h-8 transition-colors ${
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
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function ReviewsSection({ 
  listingId, 
  isLoggedIn, 
  isOwnListing,
  listingName,
  listingImage,
  listingAge,
  listingCity,
  listingCountry,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "helpful">("newest");
  const [showAll, setShowAll] = useState(false);
  const [requireLogin, setRequireLogin] = useState(true);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formBody, setFormBody] = useState("");
  const [formTimeSpent, setFormTimeSpent] = useState("");
  const [formAmbience, setFormAmbience] = useState("");
  const [formPhotos, setFormPhotos] = useState("");
  const [formRecommend, setFormRecommend] = useState("");
  const [formMeetingCountry, setFormMeetingCountry] = useState("");
  const [formMeetingDate, setFormMeetingDate] = useState("");
  const [formAnonymous, setFormAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}/reviews`);
        if (res.status === 403) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
        setRequireLogin(data.requireLoginToRead ?? true);
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
    if (formRating === 0) {
      setSubmitError("Please select a rating");
      return;
    }
    if (formBody.length < 20) {
      setSubmitError("Review must be at least 20 characters");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          review_body: formBody,
          time_spent: formTimeSpent || null,
          ambience: formAmbience || null,
          photos_accurate: formPhotos || null,
          would_recommend: formRecommend || null,
          meeting_country: formMeetingCountry || null,
          meeting_date: formMeetingDate || null,
          is_anonymous: formAnonymous,
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
              avgRating: Math.round(((prev.avgRating * prev.count + formRating) / (prev.count + 1)) * 10) / 10,
            }
          : null
      );
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormRating(0);
    setFormBody("");
    setFormTimeSpent("");
    setFormAmbience("");
    setFormPhotos("");
    setFormRecommend("");
    setFormMeetingCountry("");
    setFormMeetingDate("");
    setFormAnonymous(true);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "helpful") return b.helpful_count - a.helpful_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visibleReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  // Login required overlay
  const LoginOverlay = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg">
      <Lock className="w-8 h-8 text-gray-400 mb-3" />
      <h4 className="text-[15px] font-semibold text-gray-900 mb-1">Login Required</h4>
      <p className="text-[13px] text-gray-500 mb-4 text-center px-6">
        Create a free account to read and write reviews
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="px-5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign Up Free
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-32" />
          <div className="h-20 bg-gray-50 rounded" />
        </div>
      </div>
    );
  }

  if (error || !stats) return null;

  return (
    <div id="reviews" className="rounded-lg bg-white p-6 shadow-sm relative" style={{ border: "1px solid #E5E7EB" }}>
      {/* Login overlay for non-logged in users */}
      {!isLoggedIn && requireLogin && <LoginOverlay />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[17px] font-semibold text-gray-900">
          Reviews
          <span className="text-[14px] font-normal text-gray-400 ml-2">({stats.count})</span>
        </h3>
        {!isOwnListing && isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition-colors"
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
            <div className="text-[12px] text-gray-400 mt-1">{stats.count} reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1];
              const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 text-gray-500">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
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
        <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-gray-900">Write Your Review</h4>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-[13px] text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rating */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <StarInput value={formRating} onChange={setFormRating} />
            </div>

            {/* Quick Questions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Time Spent</label>
                <select
                  value={formTimeSpent}
                  onChange={(e) => setFormTimeSpent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300 bg-white"
                >
                  <option value="">Select...</option>
                  {TIME_SPENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Ambience</label>
                <select
                  value={formAmbience}
                  onChange={(e) => setFormAmbience(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300 bg-white"
                >
                  <option value="">Select...</option>
                  {AMBIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Are Photos Accurate?</label>
                <select
                  value={formPhotos}
                  onChange={(e) => setFormPhotos(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300 bg-white"
                >
                  <option value="">Select...</option>
                  {PHOTOS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Would You Recommend?</label>
                <select
                  value={formRecommend}
                  onChange={(e) => setFormRecommend(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300 bg-white"
                >
                  <option value="">Select...</option>
                  {RECOMMEND_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Meeting Country</label>
                <input
                  type="text"
                  value={formMeetingCountry}
                  onChange={(e) => setFormMeetingCountry(e.target.value)}
                  placeholder="e.g. Denmark"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Meeting Date</label>
                <input
                  type="date"
                  value={formMeetingDate}
                  onChange={(e) => setFormMeetingDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Share details of your experience... (minimum 20 characters)"
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-gray-300 resize-none"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-gray-400">
                  {formBody.length < 20 ? `${20 - formBody.length} more characters needed` : "✓ Ready"}
                </span>
                <span className="text-[11px] text-gray-400">{formBody.length}/2000</span>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formAnonymous}
                onChange={(e) => setFormAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-[13px] text-gray-700">Post anonymously (your profile won't be shown)</span>
            </label>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-600">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={formRating === 0 || formBody.length < 20 || submitting}
              className="w-full py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {/* Sort */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-gray-300"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {visibleReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-[14px] font-medium">No reviews yet</p>
          {!isOwnListing && isLoggedIn && (
            <p className="text-[12px] mt-1">Be the first to share your experience!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-gray-50 rounded-xl"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {!review.is_anonymous && review.reviewer_avatar ? (
                    <img src={review.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-[14px]">
                        {review.is_anonymous ? "Anonymous" : (review.reviewer_name || "Anonymous")}
                      </span>
                      {review.is_verified && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded uppercase">
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-gray-400">{timeAgo(review.created_at)}</span>
                  </div>
                  
                  {!review.is_anonymous && review.reviewer_location && (
                    <p className="text-[12px] text-gray-400 mt-0.5">{review.reviewer_location}</p>
                  )}
                  
                  <div className="mt-1">
                    <StarRating rating={review.rating} />
                  </div>
                </div>
              </div>

              {/* Review Text */}
              {review.body && (
                <div className="mb-3">
                  <p
                    className={`text-[14px] text-gray-700 leading-relaxed ${
                      !expanded.has(review.id) && review.body.length > 250 ? "line-clamp-3" : ""
                    }`}
                  >
                    {review.body}
                  </p>
                  {review.body.length > 250 && (
                    <button
                      onClick={() => toggleExpanded(review.id)}
                      className="text-[12px] text-gray-500 hover:text-gray-700 mt-1 font-medium"
                    >
                      {expanded.has(review.id) ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {/* Quick Stats Grid */}
              {(review.time_spent || review.ambience || review.photos_accurate || review.would_recommend) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-gray-200 mt-3">
                  {review.time_spent && (
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Time Spent</div>
                      <div className="text-[13px] font-medium text-gray-800 mt-0.5">{review.time_spent}</div>
                    </div>
                  )}
                  {review.ambience && (
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Ambience</div>
                      <div className="text-[13px] font-medium text-gray-800 mt-0.5">{review.ambience}</div>
                    </div>
                  )}
                  {review.photos_accurate && (
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Photos Accurate?</div>
                      <div className="text-[13px] font-medium text-gray-800 mt-0.5">{review.photos_accurate}</div>
                    </div>
                  )}
                  {review.would_recommend && (
                    <div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Recommend?</div>
                      <div className="text-[13px] font-medium text-gray-800 mt-0.5">{review.would_recommend}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Meeting Info */}
              {(review.meeting_country || review.meeting_date) && (
                <div className="flex items-center gap-4 text-[12px] text-gray-500 mt-3 pt-3 border-t border-gray-200">
                  {review.meeting_country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Met in {review.meeting_country}
                    </span>
                  )}
                  {review.meeting_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(review.meeting_date)}
                    </span>
                  )}
                </div>
              )}

              {/* Helpful */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More */}
      {sortedReviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show All {sortedReviews.length} Reviews <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
