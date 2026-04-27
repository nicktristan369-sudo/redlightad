"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";

// ─── Pricing: Standard 150 DKK/md · Premium 300 DKK/md ───────────────────────
const MONTHLY: Record<"standard" | "premium", number> = {
  standard: 150,
  premium: 300,
};

const DURATIONS = [
  { months: 12, label: "12 months", discountPct: 50, popular: true },
  { months: 3,  label: "3 months",  discountPct: 30, popular: false },
  { months: 1,  label: "1 month",   discountPct: 25, popular: false },
];

function pricePerMonth(plan: "standard" | "premium", discountPct: number) {
  return Math.round(MONTHLY[plan] * (1 - discountPct / 100));
}

function totalPrice(plan: "standard" | "premium", months: number, discountPct: number) {
  return pricePerMonth(plan, discountPct) * months;
}

// ─── Feature table ────────────────────────────────────────────────────────────
const FEATURES: { label: string; icon: string; standard: string | boolean; premium: string | boolean }[] = [
  { icon: "📸", label: "Profile photos",           standard: "4 photos",    premium: "Unlimited" },
  { icon: "🎬", label: "Video on profile",          standard: false,         premium: true },
  { icon: "🎥", label: "Video profile picture",     standard: false,         premium: true },
  { icon: "🎙️", label: "Voice message",             standard: false,         premium: true },
  { icon: "⭐", label: "Reviews",                   standard: "All clients", premium: "You decide" },
  { icon: "🔝", label: "Search placement",          standard: "Standard",    premium: "Always Top" },
  { icon: "💎", label: "Premium carousel",          standard: false,         premium: true },
  { icon: "🌍", label: "Change location",           standard: "1 location",  premium: "Any country" },
  { icon: "🔗", label: "Social media links",        standard: false,         premium: true },
  { icon: "🔥", label: "OnlyFans promotion",        standard: false,         premium: true },
  { icon: "📖", label: "Post stories",              standard: false,         premium: true },
  { icon: "🛒", label: "Sell on marketplace",       standard: false,         premium: "Global" },
  { icon: "🪙", label: "Receive RedCoins",          standard: false,         premium: true },
  { icon: "💳", label: "Pay Me section",            standard: false,         premium: "Coins/Revolut/Crypto" },
  { icon: "🛡️", label: "Block geolocation",        standard: false,         premium: true },
  { icon: "✉️", label: "Private messages",          standard: true,          premium: true },
  { icon: "📹", label: "50+ videos",                standard: false,         premium: true },
];

type Plan = "standard" | "premium";

function FeatureCell({ val }: { val: string | boolean }) {
  if (val === true)  return <Check className="w-5 h-5 text-green-400 mx-auto" strokeWidth={2.5} />;
  if (val === false) return <X className="w-4 h-4 text-red-500 mx-auto" strokeWidth={2.5} />;
  return <span className="text-xs text-gray-300 leading-tight">{val}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────
function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams?.get("uid") || "";

  const [activePlan, setActivePlan] = useState<Plan>("premium");
  const [activeMonths, setActiveMonths] = useState(12);

  const dur = DURATIONS.find(d => d.months === activeMonths)!;
  const ppm = pricePerMonth(activePlan, dur.discountPct);
  const total = totalPrice(activePlan, activeMonths, dur.discountPct);

  const handleGetMembership = () => {
    const params = new URLSearchParams({
      plan: activePlan,
      months: String(activeMonths),
      amount: String(total),
      ...(uid ? { userId: uid } : {}),
    });
    router.push(`/choose-plan/payment?${params}`);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden">
        <div
          className="w-full h-28 bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(17,17,17,1)), linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xl font-black text-white tracking-tight">
            RedLightAD <span className="text-[#f5a623]">50% OFF for You!</span>
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* ── Plan toggle ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(["standard", "premium"] as Plan[]).map((plan) => {
            const isActive = activePlan === plan;
            const isRecommended = plan === "premium";
            return (
              <button
                key={plan}
                onClick={() => setActivePlan(plan)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? plan === "premium"
                      ? "border-[#f5a623] bg-[#f5a623]/10"
                      : "border-white bg-white/10"
                    : "border-[#333] bg-[#1a1a1a] hover:border-[#555]"
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#f5a623] text-black text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wide">
                    Recommended
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <p className={`text-sm font-black uppercase tracking-wide ${isActive ? "text-white" : "text-gray-400"}`}>
                    {plan === "premium" ? "Premium" : "Standard"}
                  </p>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? plan === "premium" ? "border-[#f5a623] bg-[#f5a623]" : "border-white bg-white"
                      : "border-[#555]"
                  }`}>
                    {isActive && <div className={`w-2 h-2 rounded-full ${plan === "premium" ? "bg-black" : "bg-black"}`} />}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {plan === "premium" ? "Max exposure · Top placement" : "Basic · 4 photos only"}
                </p>
                <p className="text-lg font-black text-white">
                  {pricePerMonth(plan, dur.discountPct)}
                  <span className="text-xs font-normal text-gray-400"> DKK/mo</span>
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Duration list ── */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] mb-5">
          {DURATIONS.map((d, i) => {
            const ppm2 = pricePerMonth(activePlan, d.discountPct);
            const isSelected = activeMonths === d.months;
            return (
              <button
                key={d.months}
                onClick={() => setActiveMonths(d.months)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                  i > 0 ? "border-t border-[#222]" : ""
                } ${isSelected ? "bg-white text-black" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-black bg-black" : "border-[#555]"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>
                    {d.label}
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-red-600 text-white" : "bg-red-600/80 text-white"
                  }`}>
                    {d.discountPct}% OFF
                  </span>
                  {d.popular && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                    }`}>
                      BEST
                    </span>
                  )}
                </div>
                <span className={`text-base font-black ${isSelected ? "text-black" : "text-white"}`}>
                  {ppm2} <span className={`text-xs font-normal ${isSelected ? "text-black/60" : "text-gray-500"}`}>DKK/mo</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── GET MEMBERSHIP button ── */}
        <button
          onClick={handleGetMembership}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase transition-colors shadow-lg shadow-[#f5a623]/20 mb-3"
        >
          GET MEMBERSHIP
        </button>

        {/* ── Total summary ── */}
        <p className="text-center text-xs text-gray-500 mb-6">
          Total: <strong className="text-white">{total} DKK</strong> for {activeMonths} {activeMonths === 1 ? "month" : "months"} ·{" "}
          Normal price: <span className="line-through">{MONTHLY[activePlan] * activeMonths} DKK</span> ·{" "}
          <span className="text-green-400">You save {MONTHLY[activePlan] * activeMonths - total} DKK</span>
        </p>

        {/* ── Compare plans table ── */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_90px_90px] bg-[#1a1a1a] border-b border-[#2a2a2a]">
            <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Compare plans
            </div>
            <button
              onClick={() => setActivePlan("standard")}
              className={`py-3 text-xs font-black text-center transition-colors ${
                activePlan === "standard" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-gray-500 hover:text-white"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setActivePlan("premium")}
              className={`py-3 text-xs font-black text-center rounded-t-lg transition-colors ${
                activePlan === "premium" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-gray-500 hover:text-white"
              }`}
            >
              Premium ★
            </button>
          </div>

          {/* Rows */}
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-[1fr_90px_90px] items-center border-b border-[#1e1e1e] ${
                i % 2 === 0 ? "bg-[#161616]" : "bg-[#111]"
              }`}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-base leading-none">{f.icon}</span>
                <span className="text-xs text-gray-400 leading-tight">{f.label}</span>
              </div>
              <div className={`py-3 text-center ${activePlan === "standard" ? "bg-[#f5a623]/5" : ""}`}>
                <FeatureCell val={f.standard} />
              </div>
              <div className={`py-3 text-center ${activePlan === "premium" ? "bg-[#f5a623]/5" : ""}`}>
                <FeatureCell val={f.premium} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <button
          onClick={handleGetMembership}
          className="w-full mt-5 py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase transition-colors shadow-lg shadow-[#f5a623]/20"
        >
          GET MEMBERSHIP
        </button>

        {/* Trust */}
        <div className="mt-4 space-y-1.5">
          {[
            "🔒 No adult-related transaction in your bank statement",
            "⚡ Profile activated instantly after payment",
            "🔒 SSL encrypted · Secure payment",
          ].map(t => (
            <p key={t} className="text-[11px] text-gray-600 text-center">{t}</p>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChoosePlanContent />
    </Suspense>
  );
}
