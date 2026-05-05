"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface FavoriteButtonProps {
  listingId: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function FavoriteButton({
  listingId,
  size = 20,
  className = "",
  showText = false,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const res = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const favIds = new Set((data.favorites || []).map((f: { listing_id: string }) => f.listing_id));
          setIsFavorite(favIds.has(listingId));
        }
      } catch (err) {
        console.error("Failed to check favorite:", err);
      }
    };

    checkFavorite();
  }, [listingId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      // Redirect to login
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      if (isFavorite) {
        // Remove
        await fetch(`/api/favorites?listing_id=${listingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        setIsFavorite(false);
      } else {
        // Add
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ listing_id: listingId }),
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        flex items-center gap-1.5 transition-all duration-200
        ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}
        ${className}
      `}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={`
          transition-all duration-200
          ${isFavorite 
            ? "fill-red-500 text-red-500" 
            : "text-gray-500 hover:text-red-400"
          }
        `}
      />
      {showText && (
        <span className={`text-sm ${isFavorite ? "text-red-500" : "text-gray-500"}`}>
          {isFavorite ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
