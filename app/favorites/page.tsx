"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Crown, Trash2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Favorite {
  id: string;
  listing_id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    profile_image: string;
    premium_tier: string | null;
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login?redirect=/favorites");
        return;
      }

      try {
        const res = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleRemove = async (listingId: string) => {
    setRemoving(listingId);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    try {
      await fetch(`/api/favorites?listing_id=${listingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" size={24} />
                My Favorites
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {favorites.length} saved {favorites.length === 1 ? "profile" : "profiles"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No favorites yet
            </h2>
            <p className="text-gray-500 mb-6">
              Save profiles you like by clicking the heart icon
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse Profiles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(fav.listing_id);
                  }}
                  disabled={removing === fav.listing_id}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                >
                  {removing === fav.listing_id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-600" />
                  ) : (
                    <Trash2 size={16} className="text-red-500" />
                  )}
                </button>

                <Link href={`/profile/${fav.listing.id}`}>
                  {/* Image */}
                  <div className="aspect-[3/4] relative">
                    {fav.listing.profile_image ? (
                      <Image
                        src={fav.listing.profile_image}
                        alt={fav.listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">👤</span>
                      </div>
                    )}

                    {/* Premium badge */}
                    {fav.listing.premium_tier && fav.listing.premium_tier !== "basic" && (
                      <div className="absolute top-2 left-2">
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            fav.listing.premium_tier === "vip"
                              ? "bg-yellow-400 text-yellow-900"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          <Crown size={12} />
                          {fav.listing.premium_tier.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {fav.listing.title}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <MapPin size={14} />
                      <span className="truncate">
                        {fav.listing.city}, {fav.listing.country}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
