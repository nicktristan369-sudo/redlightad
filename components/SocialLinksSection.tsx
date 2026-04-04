"use client";

import React from "react";

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

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────
const Icons: Record<SocialPlatform, React.ReactElement> = {
  onlyfans: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#00AFF0"/>
      <path d="M12 6.5C8.96 6.5 6.5 8.96 6.5 12C6.5 15.04 8.96 17.5 12 17.5C15.04 17.5 17.5 15.04 17.5 12H14.8C14.8 13.55 13.55 14.8 12 14.8C10.45 14.8 9.2 13.55 9.2 12C9.2 10.45 10.45 9.2 12 9.2C12.73 9.2 13.4 9.48 13.9 9.94L15.9 7.94C14.87 7 13.5 6.5 12 6.5Z" fill="white"/>
    </svg>
  ),
  snapchat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#FFFC00"/>
      <path d="M12 5C10.07 5 8.5 6.6 8.5 8.56V10.1C8.14 10.22 7.5 10.44 7.5 10.83C7.5 11.15 7.77 11.4 8.08 11.4C8.21 11.4 8.34 11.37 8.46 11.3C8.35 11.62 8.29 11.97 8.29 12.32C8.29 13.97 9.86 15.5 12 15.5C14.14 15.5 15.71 13.97 15.71 12.32C15.71 11.97 15.65 11.62 15.54 11.3C15.66 11.37 15.79 11.4 15.92 11.4C16.23 11.4 16.5 11.15 16.5 10.83C16.5 10.44 15.86 10.22 15.5 10.1V8.56C15.5 6.6 13.93 5 12 5ZM9.5 14.85C9.15 14.93 7.97 15.14 7.5 15.36C7.19 15.5 7 15.72 7 16C7 16.55 8.1 17 9.04 17.3C9.15 17.7 9.29 18.5 9.97 18.5C10.3 18.5 10.58 18.37 10.84 18.26C11.17 18.12 11.56 18 12 18C12.44 18 12.83 18.12 13.16 18.26C13.42 18.37 13.7 18.5 14.03 18.5C14.71 18.5 14.85 17.7 14.96 17.3C15.9 17 17 16.55 17 16C17 15.72 16.81 15.5 16.5 15.36C16.03 15.14 14.85 14.93 14.5 14.85" fill="#000" stroke="none"/>
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F9A825"/>
          <stop offset="40%" stopColor="#E1306C"/>
          <stop offset="100%" stopColor="#833AB4"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#ig-grad)"/>
      <rect x="7.5" y="7.5" width="9" height="9" rx="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2.3" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="15.2" cy="8.8" r="0.7" fill="white"/>
    </svg>
  ),
  telegram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#0088CC"/>
      <path d="M5.5 11.8L17.5 7L14.5 18L11.5 15L9 17V13.5L16 8.5L8.5 12.8L5.5 11.8Z" fill="white"/>
    </svg>
  ),
  whatsapp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366"/>
      <path d="M17 14.8C16.8 15.7 15.8 16.4 14.8 16.6C14.2 16.7 13.4 16.8 10.8 15.7C7.7 14.4 5.8 11.2 5.6 11C5.4 10.7 4.5 9.5 4.5 8.2C4.5 6.9 5.2 6.3 5.5 6C5.8 5.7 6.1 5.6 6.3 5.6C6.5 5.6 6.7 5.6 6.9 5.6C7.1 5.6 7.4 5.5 7.7 6.2C8 6.9 8.7 8.2 8.8 8.4C8.9 8.6 8.9 8.8 8.8 9C8.7 9.2 8.6 9.4 8.4 9.6C8.2 9.8 8 10 8.1 10.2C8.7 11.2 9.5 12 10.4 12.6C10.9 12.9 11.1 12.9 11.3 12.7C11.5 12.5 12.1 11.8 12.4 11.6C12.6 11.4 12.8 11.4 13 11.5C13.2 11.6 14.5 12.2 14.7 12.4C14.9 12.6 15.1 12.7 15.1 12.9C15.2 13.1 15.2 13.8 17 14.8Z" fill="white"/>
    </svg>
  ),
  twitter_x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#000"/>
      <path d="M13.2 10.9L17.5 6H16.4L12.7 10.2L9.7 6H6.5L11 12.8L6.5 18H7.6L11.5 13.6L14.7 18H17.9L13.2 10.9ZM12.1 12.9L11.6 12.2L7.9 6.8H9.2L12.5 11.2L13 11.9L16.9 17.3H15.6L12.1 12.9Z" fill="white"/>
    </svg>
  ),
};

const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; bg: string }> = {
  onlyfans:  { label: "OnlyFans",   color: "#00AFF0", bg: "#E8F7FF" },
  snapchat:  { label: "Snapchat",   color: "#F9A825", bg: "#FFFDE7" },
  instagram: { label: "Instagram",  color: "#E1306C", bg: "#FDE8F0" },
  telegram:  { label: "Telegram",   color: "#0088CC", bg: "#E3F2FD" },
  whatsapp:  { label: "WhatsApp",   color: "#25D366", bg: "#E8F5E9" },
  twitter_x: { label: "X (Twitter)",color: "#000000", bg: "#F3F4F6" },
};

interface Props {
  listingId: string;
  socialLinks: SocialLinks;
  isPremium: boolean;
  isOwnListing: boolean;
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {platforms.map(([platform, cfg]) => {
          const meta = PLATFORM_META[platform];
          const isUnlocked = !!unlocked[platform];
          const isBusy = busy === platform;
          const isLocked = cfg.locked && !isUnlocked && !isOwnListing;

          if (isLocked && !isPremium) return null;

          const url = isOwnListing ? cfg.url : (isUnlocked ? unlocked[platform]! : cfg.url);
          const canClick = isOwnListing || !cfg.locked || isUnlocked;

          return (
            <div
              key={platform}
              onClick={() => canClick ? openUrl(url!) : undefined}
              className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-3 transition-all"
              style={{
                background: meta.bg,
                border: `1.5px solid ${meta.color}22`,
                cursor: canClick ? "pointer" : "default",
                minHeight: 88,
              }}
              onMouseEnter={e => { if (canClick) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 14px ${meta.color}33`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
            >
              {/* Brand icon */}
              <div className="flex-shrink-0">{Icons[platform]}</div>

              {/* Label */}
              <span className="text-[12px] font-bold" style={{ color: meta.color }}>{meta.label}</span>

              {/* State indicator */}
              {isOwnListing ? (
                <ExternalLink size={11} color={meta.color} className="absolute top-2.5 right-2.5 opacity-60" />
              ) : isUnlocked ? (
                <CheckCircle size={11} color="#16A34A" className="absolute top-2.5 right-2.5" />
              ) : cfg.locked ? (
                <button
                  onClick={e => { e.stopPropagation(); handleUnlock(platform, cfg.price_coins); }}
                  disabled={isBusy}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                  style={{ background: meta.color, color: "#fff", opacity: isBusy ? 0.6 : 1 }}
                >
                  {isBusy
                    ? <div className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Lock size={9} /> {cfg.price_coins} coins</>
                  }
                </button>
              ) : (
                <ExternalLink size={11} color={meta.color} className="absolute top-2.5 right-2.5 opacity-60" />
              )}
            </div>
          );
        })}
      </div>

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
