"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import KundeLayout from "@/components/KundeLayout";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Trash2, Loader2, ExternalLink } from "lucide-react";

interface FavoriteListing {
  id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    profile_image: string | null;
    premium_tier: string | null;
    status: string;
    slug: string | null;
  };
}

export default function FavoritterPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    const res = await fetch("/api/favorites", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setFavorites(data.favorites || []);
    }
    setLoading(false);
  };

  const removeFavorite = async (listingId: string) => {
    setRemoving(listingId);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    const res = await fetch("/api/favorites", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });

    if (res.ok) {
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
    }
    setRemoving(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <KundeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </KundeLayout>
    );
  }

  return (
    <KundeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="text-red-500" fill="#ef4444" />
            My Favorites
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {favorites.length} saved {favorites.length === 1 ? "profile" : "profiles"}
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Save profiles you like by clicking the heart icon
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse Profiles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => {
              const listing = fav.listings;
              const isActive = listing.status === "active";
              const profileUrl = listing.slug 
                ? `/profile/${listing.slug}` 
                : `/ads/${listing.id}`;

              return (
                <div
                  key={fav.id}
                  className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-lg ${
                    !isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* Image */}
                  <Link href={profileUrl} className="block relative aspect-[4/5] bg-gray-200 dark:bg-gray-800">
                    {listing.profile_image ? (
                      <Image
                        src={listing.profile_image}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-400 dark:text-gray-600">
                          {listing.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Premium badge */}
                    {listing.premium_tier && listing.premium_tier !== "basic" && (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
                        listing.premium_tier === "vip"
                          ? "bg-yellow-400 text-yellow-900"
                          : "bg-blue-500 text-white"
                      }`}>
                        {listing.premium_tier.toUpperCase()}
                      </div>
                    )}

                    {/* Inactive badge */}
                    {!isActive && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold bg-gray-800 text-white">
                        Inactive
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={profileUrl}>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-red-600 transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin size={14} />
                      <span>{listing.city || listing.country}</span>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Saved {formatDate(fav.created_at)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        href={profileUrl}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <ExternalLink size={14} />
                        View Profile
                      </Link>
                      <button
                        onClick={() => removeFavorite(listing.id)}
                        disabled={removing === listing.id}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        title="Remove from favorites"
                      >
                        {removing === listing.id ? (
                          <Loader2 size={16} className="animate-spin text-gray-400" />
                        ) : (
                          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KundeLayout>
  );
}
