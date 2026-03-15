"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Lock, ExternalLink, CheckCircle, AlertCircle, Coins } from "lucide-react";

export type SocialPlatform = "snapchat" | "instagram" | "onlyfans" | "telegram" | "whatsapp" | "twitter_x";

export interface SocialLinkConfig {
  url: string;
  locked: boolean;
  price_coins: number;
}

export type SocialLinks = Partial<Record<SocialPlatform, SocialLinkConfig>>;

const PLATFORM_META: Record<SocialPlatform, { label: string; icon: string; color: string; prefix?: string }> = {
  snapchat:  { label: "Snapchat",  icon: "👻", color: "#FFFC00", prefix: "snapchat.com/add/" },
  instagram: { label: "Instagram", icon: "📷", color: "#E1306C" },
  onlyfans:  { label: "OnlyFans",  icon: "🔞", color: "#00AFF0" },
  telegram:  { label: "Telegram",  icon: "✈️", color: "#0088CC" },
  whatsapp:  { label: "WhatsApp",  icon: "💬", color: "#25D366" },
  twitter_x: { label: "X (Twitter)", icon: "𝕏", color: "#000" },
};

interface Props {
  listingId: string;
  socialLinks: SocialLinks;
  isPremium: boolean;         // listing has premium_tier set
  isOwnListing: boolean;      // viewer is the owner
}

export default function SocialLinksSection({ listingId, socialLinks, isPremium, isOwnListing }: Props) {
  const platforms = Object.entries(socialLinks ?? {}).filter(
    ([, cfg]) => cfg?.url
  ) as [SocialPlatform, SocialLinkConfig][];

  const [unlocked, setUnlocked] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [busy, setBusy] = useState<SocialPlatform | null>(null);
  const [result, setResult] = useState<{ platform: SocialPlatform; ok: boolean; msg: string } | null>(null);

  if (platforms.length === 0) return null;

  const handleUnlock = async (platform: SocialPlatform, price: number) => {
    setBusy(platform);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("unlock_social_link", {
      p_listing_id: listingId,
      p_platform: platform,
    });
    if (error || !data?.success) {
      setResult({ platform, ok: false, msg: data?.error ?? error?.message ?? "Fejl" });
    } else {
      setUnlocked(prev => ({ ...prev, [platform]: data.url }));
      setResult({ platform, ok: true, msg: `${PLATFORM_META[platform].label} låst op!` });
    }
    setBusy(null);
  };

  const openUrl = (url: string) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: "1px solid #E5E5E5" }}>
      <h3 className="text-[15px] font-bold text-gray-900 mb-4">Social Media</h3>

      <div className="space-y-2.5">
        {platforms.map(([platform, cfg]) => {
          const meta = PLATFORM_META[platform];
          const isUnlocked = !!unlocked[platform];
          const isBusy = busy === platform;
          const isLocked = cfg.locked && !isUnlocked && !isOwnListing;

          if (isLocked && !isPremium) return null; // non-premium can't lock

          return (
            <div key={platform} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              {/* Icon */}
              <span className="text-[18px] flex-shrink-0">{meta.icon}</span>

              {/* Label */}
              <span className="text-[13px] font-semibold text-gray-700 w-24 flex-shrink-0">{meta.label}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Own listing — show URL always */}
                {isOwnListing ? (
                  <button onClick={() => openUrl(cfg.url)}
                    className="text-[13px] text-red-600 hover:underline flex items-center gap-1 truncate max-w-full">
                    <span className="truncate">{cfg.url}</span>
                    <ExternalLink size={11} className="flex-shrink-0" />
                  </button>
                ) : isUnlocked ? (
                  <button onClick={() => openUrl(unlocked[platform]!)}
                    className="text-[13px] text-red-600 hover:underline flex items-center gap-1 truncate max-w-full">
                    <CheckCircle size={12} color="#16A34A" className="flex-shrink-0" />
                    <span className="truncate">{unlocked[platform]}</span>
                    <ExternalLink size={11} className="flex-shrink-0" />
                  </button>
                ) : !cfg.locked ? (
                  // Free link — show directly
                  <button onClick={() => openUrl(cfg.url)}
                    className="text-[13px] text-red-600 hover:underline flex items-center gap-1 truncate max-w-full">
                    <span className="truncate">{cfg.url}</span>
                    <ExternalLink size={11} className="flex-shrink-0" />
                  </button>
                ) : (
                  // Locked
                  <div className="flex items-center gap-2">
                    <Lock size={13} color="#9CA3AF" />
                    <span className="text-[12px] text-gray-400">Låst</span>
                  </div>
                )}
              </div>

              {/* Locked badge / unlock button */}
              {!isOwnListing && cfg.locked && !isUnlocked && (
                <button
                  onClick={() => handleUnlock(platform, cfg.price_coins)}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-50 flex-shrink-0 transition-colors"
                  style={{ background: "#000", color: "#fff" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#CC0000")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#000")}>
                  {isBusy
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Coins size={11} /> {cfg.price_coins} coins</>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Result feedback */}
      {result && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{
            background: result.ok ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${result.ok ? "#BBF7D0" : "#FECACA"}`,
            color: result.ok ? "#14532D" : "#DC2626",
          }}>
          {result.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
