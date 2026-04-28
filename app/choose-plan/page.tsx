"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Logo from "@/components/Logo";
import {
  Crown, Camera, Video, Mic, MapPin, Globe, Link2, Star,
  ShoppingBag, Coins, CreditCard, ShieldOff, MessageSquare,
  Image, X, Check
} from "lucide-react";

// ─── Pricing Config ───────────────────────────────────────────────────────────
const PRICES = {
  standard: 150, // DKK per month (normal)
  premium: 300,  // DKK per month (normal)
};

const DURATIONS = [
  { months: 12, discount: 50, label: "12 months", badge: "50% OFF" },
  { months: 6,  discount: 40, label: "6 months",  badge: "40% OFF" },
  { months: 3,  discount: 30, label: "3 months",  badge: "30% OFF" },
  { months: 1,  discount: 25, label: "1 month",   badge: "25% OFF" },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES: { icon: React.ElementType; label: string; standard: string | boolean; premium: string | boolean }[] = [
  { icon: Crown,        label: "Always in top section",         standard: false,       premium: true },
  { icon: Star,         label: "Premium carousel placement",    standard: false,       premium: true },
  { icon: Image,        label: "Profile pictures",              standard: "4 only",    premium: "Unlimited" },
  { icon: Video,        label: "Video profile picture",         standard: false,       premium: true },
  { icon: Camera,       label: "Videos on profile",             standard: false,       premium: "50+" },
  { icon: Mic,          label: "Voice messages",                standard: false,       premium: true },
  { icon: Star,         label: "Control your reviews",          standard: false,       premium: true },
  { icon: MapPin,       label: "Locations",                     standard: "1 only",    premium: "Multiple countries" },
  { icon: Globe,        label: "Change location anytime",       standard: false,       premium: true },
  { icon: Link2,        label: "Social media links",            standard: false,       premium: true },
  { icon: Star,         label: "OnlyFans promotion",            standard: false,       premium: true },
  { icon: Camera,       label: "Post stories",                  standard: false,       premium: true },
  { icon: ShoppingBag,  label: "Sell on Marketplace",           standard: false,       premium: "Global" },
  { icon: Coins,        label: "Receive RedCoins",              standard: false,       premium: true },
  { icon: CreditCard,   label: "Pay Me section",                standard: false,       premium: "Coins, Revolut, Crypto" },
  { icon: ShieldOff,    label: "Block geolocation",             standard: false,       premium: true },
  { icon: MessageSquare,label: "Private messages",              standard: true,        premium: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChoosePlanPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [plan, setPlan] = useState<"standard" | "premium">("premium");
  const [duration, setDuration] = useState(12);

  const basePrice = PRICES[plan];
  const dur = DURATIONS.find(d => d.months === duration) || DURATIONS[0];
  const discountedPrice = Math.round(basePrice * (1 - dur.discount / 100));
  const totalPrice = discountedPrice * dur.months;

  const handleContinue = () => {
    router.push(`/choose-plan/payment?plan=${plan}&months=${duration}&amount=${totalPrice}`);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* ─── Hero Banner ─────────────────────────────────────────────────────── */}
      <div
        className="relative py-8 flex flex-col items-center justify-center gap-2 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
        <Logo variant="dark" height={32} />
        <p className="text-lg md:text-xl font-black tracking-wide">
          <span className="text-white">REDLIGHT DISCOUNT</span>{" "}
          <span className="text-[#f5a623]">50% OFF for You!</span>
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ─── Plan Toggle ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Standard */}
          <button
            onClick={() => setPlan("standard")}
            className={`relative rounded-2xl p-4 text-left transition-all ${
              plan === "standard"
                ? "bg-white text-black"
                : "bg-[#1a1a1a] border border-[#333] hover:border-[#555]"
            }`}
          >
            <p className="font-bold text-base">Standard</p>
            <p className={`text-xs mt-0.5 ${plan === "standard" ? "text-gray-600" : "text-gray-500"}`}>
              4 pictures · 1 location
            </p>
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              plan === "standard" ? "border-black bg-black" : "border-[#555]"
            }`}>
              {plan === "standard" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* Premium */}
          <button
            onClick={() => setPlan("premium")}
            className={`relative rounded-2xl p-4 text-left transition-all ${
              plan === "premium"
                ? "bg-[#f5a623] text-black ring-2 ring-[#f5a623] ring-offset-2 ring-offset-[#111]"
                : "bg-[#1a1a1a] border border-[#333] hover:border-[#555]"
            }`}
          >
            {/* Recommended badge */}
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f5a623] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Recommended
            </span>
            <p className="font-bold text-base flex items-center gap-1.5">
              Premium <Crown className="w-4 h-4" />
            </p>
            <p className={`text-xs mt-0.5 ${plan === "premium" ? "text-black/70" : "text-gray-500"}`}>
              Unlimited · All features
            </p>
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              plan === "premium" ? "border-black bg-black" : "border-[#555]"
            }`}>
              {plan === "premium" && <div className="w-2 h-2 rounded-full bg-[#f5a623]" />}
            </div>
          </button>
        </div>

        {/* ─── Duration Selector ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#2a2a2a] overflow-hidden">
          {DURATIONS.map((d, i) => {
            const isActive = duration === d.months;
            const price = Math.round(PRICES[plan] * (1 - d.discount / 100));
            return (
              <button
                key={d.months}
                onClick={() => setDuration(d.months)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                  i > 0 ? "border-t border-[#222]" : ""
                } ${isActive ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isActive ? "border-black bg-black" : "border-[#555]"
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {/* Label */}
                  <span className={`font-semibold ${isActive ? "text-black" : "text-white"}`}>
                    {d.label}
                  </span>
                  {/* Discount badge */}
                  <span className="bg-[#e53935] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {d.badge}
                  </span>
                </div>
                {/* Price */}
                <span className={`font-bold tabular-nums ${isActive ? "text-black" : "text-white"}`}>
                  {price} kr<span className="text-xs font-normal opacity-60">/month</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── CTA Button ────────────────────────────────────────────────────── */}
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base uppercase tracking-widest shadow-lg shadow-[#f5a623]/20 transition-colors"
        >
          GET MEMBERSHIP
        </button>

        {/* ─── Price Summary ─────────────────────────────────────────────────── */}
        <p className="text-center text-sm text-gray-500">
          {plan === "premium" ? "Premium" : "Standard"} · {dur.label} ·{" "}
          <span className="line-through opacity-50">{PRICES[plan] * dur.months} kr</span>{" "}
          <strong className="text-[#f5a623]">{totalPrice} kr</strong>
        </p>

        {/* ─── Compare Plans Table ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#2a2a2a] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_90px] bg-[#1a1a1a]">
            <div className="px-4 py-3 text-sm font-semibold text-gray-400">Compare plans</div>
            <div className={`px-2 py-3 text-center text-sm font-bold ${plan === "standard" ? "bg-[#f5a623]/10 text-[#f5a623] border-t-2 border-[#f5a623]" : "text-white"}`}>
              Standard
            </div>
            <div className={`px-2 py-3 text-center text-sm font-bold ${plan === "premium" ? "bg-[#f5a623]/10 text-[#f5a623] border-t-2 border-[#f5a623]" : "text-white"}`}>
              Premium <Crown className="inline w-3.5 h-3.5 ml-0.5" />
            </div>
          </div>

          {/* Rows */}
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`grid grid-cols-[1fr_90px_90px] border-t border-[#222] ${i % 2 === 0 ? "bg-[#151515]" : "bg-[#1a1a1a]"}`}
              >
                {/* Feature label */}
                <div className="flex items-center gap-2.5 px-4 py-2.5">
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{f.label}</span>
                </div>
                {/* Standard value */}
                <div className={`flex items-center justify-center text-sm ${plan === "standard" ? "bg-[#f5a623]/5" : ""}`}>
                  {f.standard === true ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : f.standard === false ? (
                    <X className="w-4 h-4 text-red-500/70" />
                  ) : (
                    <span className="text-gray-400 text-xs">{f.standard}</span>
                  )}
                </div>
                {/* Premium value */}
                <div className={`flex items-center justify-center text-sm ${plan === "premium" ? "bg-[#f5a623]/5" : ""}`}>
                  {f.premium === true ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : f.premium === false ? (
                    <X className="w-4 h-4 text-red-500/70" />
                  ) : (
                    <span className="text-[#f5a623] text-xs font-medium">{f.premium}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Trust Footer ──────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-600 pb-4">
          Secure payment · Cancel anytime · No adult-related transaction in your bank statement
        </p>
      </div>
    </div>
  );
}
