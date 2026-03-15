"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  MARKETPLACE_CATEGORIES,
  SORT_OPTIONS,
  CATEGORY_LABELS,
  coinsToEur,
  type MarketplaceItem,
  type MarketplaceCategory,
  type SortOption,
} from "@/lib/marketplace";
import { Globe, SlidersHorizontal } from "lucide-react";

function CoinBadge({ coins }: { coins: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white"
      style={{ background: "#CC0000" }}>
      🔴 {coins} coins
    </span>
  );
}

function CategoryBadge({ category }: { category: MarketplaceCategory }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (hovering) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovering]);

  // Prefer teaser_url for hover preview; fallback to preview_url
  const hasVideo = !!(item.teaser_url || (item.content_type === "video" && item.preview_url));
  const videoSrc = item.teaser_url ?? item.preview_url;
  const [btnHov, setBtnHov] = useState(false);

  return (
    <Link href={`/marketplace/${item.id}`}
      className="group block bg-white overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderRadius: "12px", border: "1px solid #E5E5E5" }}>

      {/* Thumbnail */}
      <div
        className="relative w-full bg-gray-100"
        style={{ aspectRatio: "16/10" }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {item.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {hasVideo && (
          <video
            ref={videoRef}
            src={videoSrc!}
            muted
            loop={false}
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? "opacity-100" : "opacity-0"}`}
            onEnded={() => { if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } setHovering(false); }}
          />
        )}

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <CategoryBadge category={item.category} />
        </div>
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
          <CoinBadge coins={item.coin_price} />
          <span className="text-[11px] font-semibold text-white/80" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            ≈ €{coinsToEur(item.coin_price)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-[14px] font-semibold text-gray-900 line-clamp-1">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-[12px] text-gray-500 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-gray-200 overflow-hidden">
              {item.seller_avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.seller_avatar} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-[12px] text-gray-500">{item.seller_name ?? "Seller"}</span>
          </div>
          <button
            className="text-[12px] font-semibold text-white px-3 py-1.5 transition-colors duration-200"
            style={{ background: btnHov ? "#CC0000" : "#000", borderRadius: "6px" }}
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
          >
            Unlock
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const params = new URLSearchParams({ sort });
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/marketplace/items?${params}`);
      const json = await res.json();
      setItems((json.items ?? []) as MarketplaceItem[]);
      setLoading(false);
    };
    fetchItems();
  }, [activeCategory, sort]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: "#F5F5F7" }}>
        {/* Hero */}
        <div className="bg-white border-b border-[#E5E5E5]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-600">
                    <Globe size={12} /> Global
                  </span>
                </div>
                <h1 className="text-[28px] font-black text-gray-900">Marketplace</h1>
                <p className="text-[14px] text-gray-500 mt-1">Buy exclusive content from verified creators worldwide</p>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className="px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                style={{
                  borderRadius: "8px",
                  background: activeCategory === "all" ? "#000" : "#fff",
                  color: activeCategory === "all" ? "#fff" : "#374151",
                  border: `1px solid ${activeCategory === "all" ? "#000" : "#E5E5E5"}`,
                }}
              >
                All
              </button>
              {MARKETPLACE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="px-4 py-2 text-[13px] font-medium transition-colors duration-150"
                  style={{
                    borderRadius: "8px",
                    background: activeCategory === cat.value ? "#000" : "#fff",
                    color: activeCategory === cat.value ? "#fff" : "#374151",
                    border: `1px solid ${activeCategory === cat.value ? "#000" : "#E5E5E5"}`,
                  }}
                >
                  {cat.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <SlidersHorizontal size={14} color="#6B7280" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="text-[13px] font-medium text-gray-700 bg-white border border-[#E5E5E5] px-3 py-2 outline-none"
                  style={{ borderRadius: "8px" }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white animate-pulse" style={{ borderRadius: "12px", border: "1px solid #E5E5E5" }}>
                  <div className="bg-gray-200 w-full" style={{ aspectRatio: "16/10", borderRadius: "12px 12px 0 0" }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[18px] font-semibold text-gray-900">No items available</p>
              <p className="text-[14px] text-gray-500 mt-1">Check back soon — new content is added daily</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
