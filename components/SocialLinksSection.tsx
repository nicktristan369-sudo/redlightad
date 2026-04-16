"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Lock, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export type SocialPlatform = "snapchat" | "instagram" | "onlyfans" | "telegram" | "whatsapp" | "twitter_x" | "tiktok" | "fansly";

export interface SocialLinkConfig {
  url: string;
  locked?: boolean;
  price_coins?: number;
}

export type SocialLinks = Partial<Record<SocialPlatform, SocialLinkConfig>>;

// Platform metadata with brand colors
const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; hoverBg: string }> = {
  onlyfans:  { label: "OnlyFans",    color: "#00AFF0", hoverBg: "#00AFF0" },
  fansly:    { label: "Fansly",      color: "#00AFF0", hoverBg: "#00AFF0" },
  snapchat:  { label: "Snapchat",    color: "#FFFC00", hoverBg: "#FFFC00" },
  instagram: { label: "Instagram",   color: "#E1306C", hoverBg: "#E1306C" },
  telegram:  { label: "Telegram",    color: "#0088CC", hoverBg: "#0088CC" },
  whatsapp:  { label: "WhatsApp",    color: "#25D366", hoverBg: "#25D366" },
  twitter_x: { label: "X",           color: "#000000", hoverBg: "#000000" },
  tiktok:    { label: "TikTok",      color: "#000000", hoverBg: "#000000" },
};

// Clean SVG icons
const Icons: Record<SocialPlatform, React.ReactElement> = {
  onlyfans: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm0-14c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
    </svg>
  ),
  fansly: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
      <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 10.5l3.5-.5z"/>
    </svg>
  ),
  snapchat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.166 3c.796 0 3.495.223 4.769 3.073.426.954.322 2.584.24 3.87l-.012.197c-.009.135-.017.267-.023.389.12.062.291.109.5.109.182 0 .381-.038.591-.12.088-.035.179-.052.272-.052.218 0 .413.088.534.246.157.207.159.484.003.701-.298.416-.896.642-1.312.778-.1.033-.189.063-.251.088-.043.015-.18.068-.18.18 0 .063.027.123.051.168.269.509.656 1.02 1.151 1.52.604.609 1.313 1.09 2.106 1.43.118.051.384.169.423.434.051.351-.249.614-.628.839-.598.354-1.254.5-1.664.58-.05.009-.164.034-.189.075-.037.06-.006.203.014.302l.005.02c.038.18.082.382-.019.563-.104.189-.316.299-.565.299h-.001c-.202 0-.434-.051-.698-.111-.343-.078-.728-.166-1.196-.166-.168 0-.342.013-.518.039-.642.096-1.112.46-1.65.871-.653.498-1.393 1.063-2.507 1.063h-.062c-1.115 0-1.855-.565-2.508-1.064-.538-.41-1.007-.774-1.649-.87-.177-.026-.351-.039-.519-.039-.467 0-.852.088-1.195.166-.265.06-.497.111-.698.111h-.001c-.25 0-.462-.11-.566-.299-.1-.181-.056-.383-.018-.563l.005-.02c.02-.099.051-.242.014-.302-.025-.041-.139-.066-.189-.075-.41-.08-1.066-.226-1.664-.58-.378-.225-.679-.488-.627-.839.038-.265.304-.383.423-.434.792-.34 1.501-.821 2.106-1.43.494-.5.882-1.011 1.15-1.52.025-.045.052-.105.052-.168 0-.112-.137-.165-.18-.18-.062-.025-.151-.055-.251-.088-.416-.136-1.014-.362-1.312-.778-.156-.217-.154-.494.003-.701.121-.158.316-.246.534-.246.093 0 .184.017.272.052.21.082.409.12.591.12.209 0 .38-.047.5-.109-.006-.122-.014-.254-.023-.389l-.012-.197c-.082-1.286-.186-2.916.24-3.87C8.505 3.223 11.204 3 12 3h.166z"/>
    </svg>
  ),
  instagram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  telegram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  whatsapp: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  twitter_x: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  tiktok: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
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
      setResult({ platform, ok: false, msg: data?.error ?? error?.message ?? "Error" });
    } else {
      setUnlocked(prev => ({ ...prev, [platform]: data.url }));
      setResult({ platform, ok: true, msg: `${PLATFORM_META[platform].label} unlocked!` });
    }
    setBusy(null);
  };

  const openUrl = (url: string) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-lg bg-white p-5" style={{ border: "1px solid #E5E7EB" }}>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Social Media</h3>

      <div className="space-y-2">
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
              className="group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                background: "#FAFAFA",
                cursor: canClick ? "pointer" : "default",
              }}
              onMouseEnter={e => {
                if (canClick) {
                  (e.currentTarget as HTMLDivElement).style.background = meta.hoverBg;
                  (e.currentTarget as HTMLDivElement).style.color = platform === "snapchat" ? "#000" : "#fff";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA";
                (e.currentTarget as HTMLDivElement).style.color = "";
              }}
            >
              {/* Icon */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ 
                  background: meta.color,
                  color: platform === "snapchat" ? "#000" : "#fff",
                }}
              >
                {Icons[platform]}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span className="text-[14px] font-medium text-gray-900 group-hover:text-inherit transition-colors">
                  {meta.label}
                </span>
              </div>

              {/* Action */}
              {isOwnListing || isUnlocked || !cfg.locked ? (
                <ExternalLink size={16} className="text-gray-400 group-hover:text-inherit transition-colors" />
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); handleUnlock(platform, cfg.price_coins || 0); }}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isBusy ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={12} />
                      {cfg.price_coins} coins
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {result && (
        <div 
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{
            background: result.ok ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${result.ok ? "#BBF7D0" : "#FECACA"}`,
            color: result.ok ? "#14532D" : "#DC2626",
          }}
        >
          {result.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
