"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import {
  CATEGORY_LABELS,
  coinsToEur,
  type MarketplaceItem,
} from "@/lib/marketplace";
import { ShoppingCart, ArrowLeft, Play, Lock, CheckCircle, AlertCircle, Coins } from "lucide-react";

export default function MarketplaceItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Item
      const { data: itemData } = await supabase
        .from("marketplace_items")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (!itemData) { router.replace("/marketplace"); return; }

      const mapped: MarketplaceItem = {
        ...itemData,
        seller_name: (itemData.profiles as { full_name?: string })?.full_name ?? "Seller",
        seller_avatar: (itemData.profiles as { avatar_url?: string })?.avatar_url ?? null,
      };
      setItem(mapped);

      // Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Wallet
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
        setWalletBalance(wallet?.balance ?? 0);
        // Already owned?
        const { count } = await supabase.from("marketplace_purchases")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", user.id).eq("item_id", id);
        setAlreadyOwned((count ?? 0) > 0);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleBuy = async () => {
    if (!userId) { router.push("/login"); return; }
    setBuying(true);
    setBuyResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("buy_marketplace_item", { p_item_id: id });
    if (error || !data?.success) {
      setBuyResult({ ok: false, msg: data?.error ?? error?.message ?? "Purchase failed" });
    } else {
      setBuyResult({ ok: true, msg: "Purchase successful! Content unlocked." });
      setAlreadyOwned(true);
      setWalletBalance(prev => prev !== null ? prev - (item?.coin_price ?? 0) : null);
    }
    setBuying(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F8" }}>
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!item) return null;

  const teaserSrc = item.teaser_url ?? item.preview_url;
  const insufficientCoins = walletBalance !== null && walletBalance < item.coin_price;

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 px-4" style={{ background: "#F8F8F8" }}>
        <div className="max-w-4xl mx-auto">
          {/* Back */}
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — Media */}
            <div>
              {/* Teaser video / thumbnail */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900"
                style={{ aspectRatio: "16/10" }}>
                {item.thumbnail_url && !playing && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail_url} alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                {teaserSrc && (
                  <video
                    ref={videoRef}
                    src={teaserSrc}
                    muted
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity ${playing ? "opacity-100" : "opacity-0"}`}
                    onEnded={() => setPlaying(false)}
                  />
                )}
                {/* Play button overlay */}
                {teaserSrc && !playing && (
                  <button onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center group">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                      <Play size={22} color="#fff" className="ml-1" />
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: "rgba(0,0,0,0.55)" }}>
                      <Play size={9} fill="#fff" color="#fff" /> Free 9s teaser
                    </div>
                  </button>
                )}
                {/* Pause overlay when playing */}
                {playing && (
                  <button onClick={togglePlay}
                    className="absolute inset-0 flex items-end p-3">
                    <span className="text-[11px] text-white/70 font-medium">Tap to pause</span>
                  </button>
                )}
                {/* Lock overlay on thumbnail */}
                {!teaserSrc && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Lock size={28} color="rgba(255,255,255,0.5)" />
                    <span className="text-[12px] text-white/50">No preview available</span>
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "rgba(0,0,0,0.65)" }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </div>
              </div>

              {/* Seller */}
              <div className="flex items-center gap-3 mt-4 px-1">
                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {item.seller_avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.seller_avatar} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{item.seller_name}</p>
                  <p className="text-[11px] text-gray-400">{item.purchase_count} sales</p>
                </div>
              </div>
            </div>

            {/* Right — Info + Buy */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-[24px] font-bold text-gray-900 leading-tight">{item.title}</h1>
                {item.description && (
                  <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">{item.description}</p>
                )}
              </div>

              {/* Price card */}
              <div className="rounded-2xl p-5" style={{ border: "2px solid #E5E5E5" }}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[28px] font-bold text-gray-900">{item.coin_price}</span>
                  <span className="text-[14px] font-semibold text-gray-500">RedCoins</span>
                </div>
                <p className="text-[13px] text-gray-400 mb-4">≈ €{coinsToEur(item.coin_price)}</p>

                {walletBalance !== null && !alreadyOwned && (
                  <div className="flex items-center justify-between text-[12px] mb-4 px-3 py-2 rounded-lg"
                    style={{ background: "#F9FAFB", border: "1px solid #E5E5E5" }}>
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Coins size={13} /> Your balance
                    </span>
                    <span className="font-semibold" style={{ color: insufficientCoins ? "#DC2626" : "#16A34A" }}>
                      {walletBalance} coins
                    </span>
                  </div>
                )}

                {alreadyOwned ? (
                  <div className="flex items-center gap-2 justify-center py-3 rounded-xl text-[14px] font-semibold"
                    style={{ background: "#DCFCE7", color: "#14532D" }}>
                    <CheckCircle size={16} /> Content unlocked — view in My Purchases
                  </div>
                ) : !userId ? (
                  <Link href="/login"
                    className="flex items-center justify-center gap-2 w-full py-3 text-[14px] font-semibold text-white rounded-xl transition-colors"
                    style={{ background: "#000" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#CC0000")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#000")}>
                    <Lock size={15} /> Log in to purchase
                  </Link>
                ) : insufficientCoins ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-center py-2.5 rounded-xl text-[13px]"
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      <AlertCircle size={14} /> Insufficient coins
                    </div>
                    <Link href="/dashboard/buy-coins"
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-[13px] font-semibold text-white rounded-xl"
                      style={{ background: "#CC0000" }}>
                      Buy RedCoins →
                    </Link>
                  </div>
                ) : (
                  <button onClick={handleBuy} disabled={buying}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
                    style={{ background: "#000" }}
                    onMouseEnter={e => { if (!buying) e.currentTarget.style.background = "#CC0000"; }}
                    onMouseLeave={e => (e.currentTarget.style.background = "#000")}>
                    {buying
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                      : <><ShoppingCart size={16} /> Unlock for {item.coin_price} coins</>}
                  </button>
                )}

                {buyResult && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px]"
                    style={{
                      background: buyResult.ok ? "#F0FDF4" : "#FEF2F2",
                      border: `1px solid ${buyResult.ok ? "#BBF7D0" : "#FECACA"}`,
                      color: buyResult.ok ? "#14532D" : "#DC2626",
                    }}>
                    {buyResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {buyResult.msg}
                  </div>
                )}

                {alreadyOwned && (
                  <Link href="/dashboard/mine-kob" className="mt-3 flex items-center justify-center gap-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    View My Purchases →
                  </Link>
                )}
              </div>

              {/* Info pills */}
              <div className="flex flex-wrap gap-2 text-[12px]">
                <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  19% platform fee applies
                </span>
                <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  Instant delivery
                </span>
                {item.stock != null && (
                  <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    {item.stock} left in stock
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
