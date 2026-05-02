"use client";

import { useState } from "react";
import { Lock, Unlock, Plus, Trash2 } from "lucide-react";
import type { SocialPlatform, SocialLinks, SocialLinkConfig } from "./SocialLinksSection";

const PLATFORMS: { value: SocialPlatform; label: string; color: string; placeholder: string }[] = [
  { value: "snapchat",  label: "Snapchat",   color: "#FFFC00", placeholder: "snapchat brugernavn" },
  { value: "instagram", label: "Instagram",  color: "#E1306C", placeholder: "instagram.com/ditprofil" },
  { value: "onlyfans",  label: "OnlyFans",   color: "#00AFF0", placeholder: "onlyfans.com/ditprofil" },
  { value: "telegram",  label: "Telegram",   color: "#0088CC", placeholder: "@telegram_brugernavn" },
  { value: "whatsapp",  label: "WhatsApp",   color: "#25D366", placeholder: "+45 12345678" },
  { value: "twitter_x", label: "X (Twitter)", color: "#000",   placeholder: "@twitter_brugernavn" },
];

interface Props {
  value: SocialLinks;
  onChange: (links: SocialLinks) => void;
  isPremium: boolean;   // only premium listings can lock links
}

export default function SocialLinksEditor({ value, onChange, isPremium }: Props) {
  const [added, setAdded] = useState<SocialPlatform[]>(
    Object.entries(value ?? {})
      .filter(([, cfg]) => (cfg as SocialLinkConfig)?.url)
      .map(([p]) => p as SocialPlatform)
  );

  const availableToAdd = PLATFORMS.filter(p => !added.includes(p.value));

  const addPlatform = (platform: SocialPlatform) => {
    setAdded(prev => [...prev, platform]);
    onChange({ ...value, [platform]: { url: "", locked: false, price_coins: 0 } });
  };

  const removePlatform = (platform: SocialPlatform) => {
    setAdded(prev => prev.filter(p => p !== platform));
    const next = { ...value };
    delete next[platform];
    onChange(next);
  };

  const updateLink = (platform: SocialPlatform, field: keyof SocialLinkConfig, val: string | boolean | number) => {
    const current: SocialLinkConfig = value?.[platform] ?? { url: "", locked: false, price_coins: 0 };
    onChange({ ...value, [platform]: { ...current, [field]: val } });
  };

  return (
    <div className="space-y-3">
      {/* Added platforms */}
      {added.map(platform => {
        const meta = PLATFORMS.find(p => p.value === platform)!;
        const cfg: SocialLinkConfig = value?.[platform] ?? { url: "", locked: false, price_coins: 0 };

        return (
          <div key={platform} className="rounded-xl p-3 space-y-2" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-[13px] font-semibold text-gray-700 flex-1">{meta.label}</span>
              <button onClick={() => removePlatform(platform)}
                className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>

            {/* URL input */}
            <input
              type="text"
              value={cfg.url}
              onChange={e => updateLink(platform, "url", e.target.value)}
              placeholder={meta.placeholder}
              className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
              style={{ border: "1px solid #E5E5E5", background: "#FAFAFA" }}
            />

            {/* Lock toggle — only for premium */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isPremium) return;
                  updateLink(platform, "locked", !cfg.locked);
                }}
                title={!isPremium ? "Kræver premium annonce for at låse links" : ""}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${!isPremium ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                style={{
                  background: cfg.locked ? "#FEF3C7" : "#F3F4F6",
                  color: cfg.locked ? "#92400E" : "#6B7280",
                  border: `1px solid ${cfg.locked ? "#FDE68A" : "#E5E5E5"}`,
                }}>
                {cfg.locked ? <Lock size={11} /> : <Unlock size={11} />}
                {cfg.locked ? "Locked" : "Free"}
              </button>

              {!isPremium && (
                <span className="text-[11px] text-gray-400">Premium kræves for at låse</span>
              )}

              {cfg.locked && isPremium && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-gray-500">Pris:</span>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={cfg.price_coins || ""}
                    onChange={e => updateLink(platform, "price_coins", parseInt(e.target.value) || 0)}
                    placeholder="50"
                    className="w-16 text-[12px] px-2 py-1 rounded-lg text-center outline-none"
                    style={{ border: "1px solid #E5E5E5" }}
                  />
                  <span className="text-[12px] text-gray-500">coins</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add platform dropdown */}
      {availableToAdd.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableToAdd.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => addPlatform(p.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
              style={{ border: "1px dashed #D1D5DB", background: "#FAFAFA", color: "#6B7280" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#000"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#6B7280"; }}>
              <Plus size={11} /> <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} /> {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
