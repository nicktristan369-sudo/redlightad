"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { Star, CheckCircle, XCircle, Eye, Trash2, Shield, Settings, Ban } from "lucide-react";
import Link from "next/link";

type Review = {
  id: string;
  listing_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string | null;
  is_approved: boolean;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  listings: {
    title: string;
    short_id: number | null;
  } | null;
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
      />
    ))}
  </div>
);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "I dag";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} dage siden`;
  return new Date(dateStr).toLocaleDateString("da-DK");
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("listing_reviews")
      .select(`
        id, listing_id, rating, title, body, reviewer_name,
        is_approved, is_verified, helpful_count, created_at,
        listings (title, short_id)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      // Normalize listings from array to single object
      const normalized = data.map((r: any) => ({
        ...r,
        listings: Array.isArray(r.listings) ? r.listings[0] : r.listings,
      }));
      setReviews(normalized as Review[]);
      setStats({
        total: data.length,
        approved: data.filter((r) => r.is_approved).length,
        pending: data.filter((r) => !r.is_approved).length,
      });
    }
    setLoading(false);
  };

  const toggleApproval = async (reviewId: string, approved: boolean) => {
    const supabase = createClient();
    await supabase
      .from("listing_reviews")
      .update({ is_approved: approved })
      .eq("id", reviewId);

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, is_approved: approved } : r))
    );
    setStats((prev) => ({
      ...prev,
      approved: approved ? prev.approved + 1 : prev.approved - 1,
      pending: approved ? prev.pending - 1 : prev.pending + 1,
    }));
  };

  const toggleVerified = async (reviewId: string, verified: boolean) => {
    const supabase = createClient();
    await supabase
      .from("listing_reviews")
      .update({ is_verified: verified })
      .eq("id", reviewId);

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, is_verified: verified } : r))
    );
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const supabase = createClient();
    const review = reviews.find((r) => r.id === reviewId);
    await supabase.from("listing_reviews").delete().eq("id", reviewId);

    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setStats((prev) => ({
      total: prev.total - 1,
      approved: review?.is_approved ? prev.approved - 1 : prev.approved,
      pending: !review?.is_approved ? prev.pending - 1 : prev.pending,
    }));
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "approved") return r.is_approved;
    if (filter === "pending") return !r.is_approved;
    return true;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500">Administrer brugeranmeldelser</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/reviews/banned-words"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Banned Words
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400">Total reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-400">Godkendt</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-gray-400">Afventer</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: "Alle" },
            { key: "pending", label: "Afventer" },
            { key: "approved", label: "Godkendt" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">Ingen anmeldelser fundet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl border p-5 ${
                  review.is_approved ? "border-gray-100" : "border-amber-200 bg-amber-50/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">
                        {timeAgo(review.created_at)}
                      </span>
                      {review.is_verified && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded uppercase">
                          Verificeret
                        </span>
                      )}
                      {!review.is_approved && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase">
                          Afventer
                        </span>
                      )}
                    </div>

                    {/* Listing info */}
                    <p className="text-xs text-gray-400 mb-2">
                      Profil:{" "}
                      <a
                        href={`/ads/${review.listing_id}`}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {review.listings?.title || "Ukendt"}{" "}
                        {review.listings?.short_id && `#${review.listings.short_id}`}
                      </a>
                    </p>

                    {/* Reviewer */}
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {review.reviewer_name || "Anonym"}
                    </p>

                    {/* Title & body */}
                    {review.title && (
                      <p className="font-semibold text-gray-900 mb-1">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-sm text-gray-600 line-clamp-3">{review.body}</p>
                    )}

                    {/* Helpful count */}
                    {review.helpful_count > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {review.helpful_count} fandt dette nyttigt
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleApproval(review.id, !review.is_approved)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        review.is_approved
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {review.is_approved ? (
                        <>
                          <XCircle size={14} /> Afvis
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} /> Godkend
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleVerified(review.id, !review.is_verified)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        review.is_verified
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      <Shield size={14} />
                      {review.is_verified ? "Fjern verificering" : "Verificér"}
                    </button>

                    <button
                      onClick={() =>
                        window.open(`/ads/${review.listing_id}#reviews`, "_blank")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={14} /> View profile
                    </button>

                    <button
                      onClick={() => deleteReview(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} /> Slet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
