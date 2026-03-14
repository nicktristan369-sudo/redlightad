"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import { CATEGORY_LABELS, type MarketplaceItem } from "@/lib/marketplace";
import { Lock, ArrowLeft, ShoppingBag, CheckCircle } from "lucide-react";

function LockedOverlay({ coinPrice, onUnlock, loading }: { coinPrice: number; onUnlock: () => void; loading: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", borderRadius: "12px" }}>
      <Lock size={32} color="#fff" className="mb-3" />
      <p className="text-white font-bold text-[18px] mb-1">Locked Content</p>
      <p className="text-gray-300 text-[13px] mb-5">Unlock for {coinPrice} RedCoins</p>
      <button
        onClick={onUnlock}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 font-semibold text-white text-[14px] transition-colors duration-200 disabled:opacity-50"
        style={{ background: hov ? "#CC0000" : "#000", borderRadius: "8px" }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <ShoppingBag size={16} />
        {loading ? "Processing..." : `Unlock for 🔴 ${coinPrice} coins`}
      </button>
    </div>
  );
}

export default function MarketplaceItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data } = await supabase
        .from("marketplace_items")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .single();

      if (!data) { router.push("/marketplace"); return; }
      const mapped: MarketplaceItem = {
        ...data,
        seller_name: data.profiles?.full_name ?? undefined,
        seller_avatar: data.profiles?.avatar_url ?? undefined,
      };
      setItem(mapped);

      if (user) {
        const { data: purchase } = await supabase
          .from("marketplace_purchases")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("item_id", id)
          .maybeSingle();
        if (purchase) setPurchased(true);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleUnlock = async () => {
    if (!userId) { router.push("/login"); return; }
    setBuying(true);
    setError("");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("buy_marketplace_item", { p_item_id: id });
    if (rpcError || !data?.success) {
      setError(data?.error ?? rpcError?.message ?? "Purchase failed");
      setBuying(false);
      return;
    }
    setPurchased(true);
    setSuccess(true);
    setBuying(false);
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F5F7" }}>
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    </>
  );

  if (!item) return null;

  const isOwner = userId === item.seller_id;
  const canView = purchased || isOwner;

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-8" style={{ background: "#F5F5F7" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — preview */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main media */}
              <div className="relative w-full bg-gray-900 overflow-hidden" style={{ borderRadius: "12px", aspectRatio: "16/9" }}>
                {item.content_type === "video" ? (
                  <>
                    {item.preview_url && (
                      <video
                        ref={videoRef}
                        src={item.preview_url}
                        autoPlay muted playsInline
                        className={`absolute inset-0 w-full h-full object-cover ${canView ? "" : ""}`}
                        onEnded={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}
                      />
                    )}
                    {!canView && <LockedOverlay coinPrice={item.coin_price} onUnlock={handleUnlock} loading={buying} />}
                  </>
                ) : (
                  <>
                    {item.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={canView && item.full_content_urls?.[0] ? item.full_content_urls[0] : item.thumbnail_url}
                        alt={item.title}
                        className={`absolute inset-0 w-full h-full object-cover ${!canView ? "blur-xl scale-110" : ""} transition-all duration-500`}
                      />
                    )}
                    {!canView && <LockedOverlay coinPrice={item.coin_price} onUnlock={handleUnlock} loading={buying} />}
                  </>
                )}
              </div>

              {/* Unlocked full content grid */}
              {canView && item.full_content_urls && item.full_content_urls.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {item.full_content_urls.slice(1).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="w-full object-cover"
                      style={{ borderRadius: "8px", aspectRatio: "1" }} />
                  ))}
                </div>
              )}

              {/* Error / success */}
              {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>}
              {success && (
                <div className="flex items-center gap-2 text-[13px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  <CheckCircle size={16} /> Content unlocked! Enjoy.
                </div>
              )}
            </div>

            {/* Right — sidebar */}
            <div className="space-y-4">
              {/* Item info */}
              <div className="bg-white p-5" style={{ borderRadius: "12px", border: "1px solid #E5E5E5" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                    style={{ background: "#374151" }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ background: "#CC0000" }}>
                    🔴 {item.coin_price} coins
                  </span>
                </div>
                <h1 className="text-[20px] font-bold text-gray-900 mb-2">{item.title}</h1>
                {item.description && <p className="text-[14px] text-gray-600 leading-relaxed">{item.description}</p>}
                {item.stock !== null && (
                  <p className="mt-3 text-[13px] text-gray-500">{item.stock > 0 ? `${item.stock} left in stock` : "Out of stock"}</p>
                )}

                {/* Purchase button */}
                {!canView && !isOwner && (
                  <button
                    onClick={handleUnlock}
                    disabled={buying || (item.stock !== null && item.stock <= 0)}
                    className="mt-4 w-full py-3 font-semibold text-white text-[14px] flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50"
                    style={{ background: "#CC0000", borderRadius: "8px" }}
                  >
                    <ShoppingBag size={16} />
                    {buying ? "Processing..." : `Unlock for 🔴 ${item.coin_price} coins`}
                  </button>
                )}
                {purchased && !isOwner && (
                  <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-green-700 bg-green-50 rounded-lg px-4 py-3">
                    <CheckCircle size={16} /> You own this content
                  </div>
                )}
                {isOwner && (
                  <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                    This is your listing — {item.purchase_count} sale{item.purchase_count !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* Seller */}
              <div className="bg-white p-5" style={{ borderRadius: "12px", border: "1px solid #E5E5E5" }}>
                <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wider mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {item.seller_avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.seller_avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{item.seller_name ?? "Verified Seller"}</p>
                    <p className="text-[12px] text-gray-400">✓ Verified</p>
                  </div>
                </div>
              </div>

              {/* Need coins */}
              {!canView && !isOwner && (
                <div className="bg-white p-5" style={{ borderRadius: "12px", border: "1px solid #E5E5E5" }}>
                  <p className="text-[13px] text-gray-600 mb-3">Need more coins?</p>
                  <Link href="/dashboard/buy-coins"
                    className="block w-full text-center py-2.5 text-[13px] font-semibold text-white transition-colors"
                    style={{ background: "#000", borderRadius: "8px" }}>
                    Buy RedCoins
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
