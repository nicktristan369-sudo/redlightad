"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/favorites", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch favorites");
      }

      const data = await res.json();
      setFavorites(data.favorites || []);
      setFavoriteIds(new Set((data.favorites || []).map((f: Favorite) => f.listing_id)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(async (listingId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setError("Please log in to save favorites");
      return false;
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (res.status === 409) {
        // Already favorited
        return true;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add favorite");
      }

      // Optimistically update
      setFavoriteIds(prev => new Set([...prev, listingId]));
      
      // Refresh full list
      fetchFavorites();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, [fetchFavorites]);

  const removeFavorite = useCallback(async (listingId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return false;
    }

    try {
      const res = await fetch(`/api/favorites?listing_id=${listingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to remove favorite");
      }

      // Optimistically update
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
      setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(async (listingId: string): Promise<boolean> => {
    if (favoriteIds.has(listingId)) {
      return removeFavorite(listingId);
    } else {
      return addFavorite(listingId);
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  const isFavorite = useCallback((listingId: string): boolean => {
    return favoriteIds.has(listingId);
  }, [favoriteIds]);

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refresh: fetchFavorites,
  };
}
