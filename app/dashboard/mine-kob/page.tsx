"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase";
import { CATEGORY_LABELS, coinsToEur, type MarketplaceItem } from "@/lib/marketplace";
import { ShoppingBag, Download, Eye, Lock } from "lucide-react";
import Link from "next/link";

interface Purchase {
  id: string;
  coins_paid: number;
  created_at: string;
  marketplace_items: MarketplaceItem;
}

export default function MinePurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("marketplace_purchases")
        .select("id, coins_paid, created_at, marketplace_items(*)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      setPurchases((data ?? []) as unknown as Purchase[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">My Purchases</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">{purchases.length} purchased items</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E5E5E5] text-center">
          <ShoppingBag size={32} color="#D1D5DB" className="mb-3" />
          <p className="text-[16px] font-semibold text-gray-900">No purchases yet</p>
          <p className="text-[13px] text-gray-500 mt-1 mb-5">Browse marketplace for exclusive content</p>
          <Link href="/marketplace"
            className="px-5 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors"
            style={{ background: "#000" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#CC0000")}
            onMouseLeave={e => (e.currentTarget.style.background = "#000")}>
            Go to Marketplace →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(p => {
            const item = p.marketplace_items;
            if (!item) return null;
            const isOpen = activeItem === p.id;
            return (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid #E5E5E5" }}>
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Lock size={16} color="#9CA3AF" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {p.coins_paid} coins · ≈€{coinsToEur(p.coins_paid)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(p.created_at).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>

                  {/* Unlock button */}
                  <button
                    onClick={() => setActiveItem(isOpen ? null : p.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg transition-colors flex-shrink-0"
                    style={{ background: isOpen ? "#000" : "#F3F4F6", color: isOpen ? "#fff" : "#374151" }}>
                    {isOpen ? <Lock size={13} /> : <Eye size={13} />}
                    {isOpen ? "Hide" : "View content"}
                  </button>
                </div>

                {/* Unlocked content */}
                {isOpen && item.full_content_urls && item.full_content_urls.length > 0 && (
                  <div className="px-4 pb-4 border-t border-[#F3F4F6] pt-4">
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Unlocked content ({item.full_content_urls.length} files)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {item.full_content_urls.map((url, i) => {
                        const isVid = /\.(mp4|mov|webm)(\?|$)/i.test(url);
                        return (
                          <div key={i} className="relative group">
                            <div className="w-full rounded-xl overflow-hidden bg-gray-100"
                              style={{ aspectRatio: "1/1" }}>
                              {isVid ? (
                                <video src={url} controls className="w-full h-full object-cover" />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={url} alt={`Content ${i + 1}`} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <a href={url} download target="_blank" rel="noopener noreferrer"
                              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.7)" }}>
                              <Download size={12} color="#fff" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isOpen && (!item.full_content_urls || item.full_content_urls.length === 0) && (
                  <div className="px-4 pb-4 pt-3 border-t border-[#F3F4F6] text-center text-[13px] text-gray-400">
                    Content will be available shortly
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
