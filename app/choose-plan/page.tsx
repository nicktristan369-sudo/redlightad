"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Check, X, Zap, Shield, Star, ChevronRight } from "lucide-react";

// ─── Pricing ─────────────────────────────────────────────────────────────────
// Normal prices: Standard 150 DKK/md, Premium 300 DKK/md
// Discounts applied to total

const PLANS = {
  standard: {
    id: "standard",
    name: "Standard",
    normalMonthly: 150, // DKK
    currency: "DKK",
  },
  premium: {
    id: "premium",
    name: "Premium",
    badge: "RECOMMENDED",
    normalMonthly: 300, // DKK
    currency: "DKK",
  },
};

const DURATIONS = [
  { months: 1,  label: "1 Month",   discount: 0.25, tag: "25% OFF" },
  { months: 3,  label: "3 Months",  discount: 0.30, tag: "30% OFF" },
  { months: 6,  label: "6 Months",  discount: 0.40, tag: "40% OFF" },
  { months: 12, label: "12 Months", discount: 0.50, tag: "50% OFF", popular: true },
];

function getPrice(normalMonthly: number, months: number, discount: number) {
  const total = normalMonthly * months;
  const discounted = Math.round(total * (1 - discount));
  const perMonth = Math.round(discounted / months);
  return { total: discounted, perMonth, original: total };
}

// ─── Features comparison ──────────────────────────────────────────────────────
const FEATURES = [
  { label: "Profile Photos",            standard: "4 photos",   premium: "Unlimited" },
  { label: "Video on Profile",          standard: false,         premium: true },
  { label: "Video Profile Picture",     standard: false,         premium: true },
  { label: "Voice Message",             standard: false,         premium: true },
  { label: "Reviews",                   standard: "All clients", premium: "You decide" },
  { label: "Placement in Search",       standard: "Standard",    premium: "Always Top" },
  { label: "Premium Carousel",          standard: false,         premium: true },
  { label: "Change Location",           standard: "1 only",      premium: "Any country" },
  { label: "Social Media Links",        standard: false,         premium: true },
  { label: "OnlyFans Promotion",        standard: false,         premium: true },
  { label: "Post Stories",              standard: false,         premium: true },
  { label: "Sell on Marketplace",       standard: false,         premium: "Global" },
  { label: "Receive RedCoins",          standard: false,         premium: true },
  { label: "Pay Me Section",            standard: false,         premium: "Coins/Revolut/Crypto" },
  { label: "Block Geolocation",         standard: false,         premium: true },
  { label: "Private Messages",          standard: true,          premium: true },
  { label: "50+ Videos",               standard: false,         premium: true },
];

function FeatureValue({ val }: { val: string | boolean }) {
  if (val === true) return <Check className="w-5 h-5 text-red-500 mx-auto" strokeWidth={2.5} />;
  if (val === false) return <X className="w-5 h-5 text-gray-300 mx-auto" strokeWidth={2} />;
  return <span className="text-sm text-gray-700 font-medium">{val}</span>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams?.get("uid") || "";

  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("premium");
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [loading, setLoading] = useState(false);

  const duration = DURATIONS.find(d => d.months === selectedMonths)!;
  const plan = PLANS[selectedPlan];
  const pricing = getPrice(plan.normalMonthly, duration.months, duration.discount);

  const handleContinue = () => {
    if (selectedPlan === "standard") {
      const params = new URLSearchParams({
        plan: "standard",
        months: String(selectedMonths),
        amount: String(pricing.total),
        ...(uid ? { userId: uid } : {}),
      });
      router.push(`/choose-plan/payment?${params}`);
    } else {
      const params = new URLSearchParams({
        plan: "premium",
        months: String(selectedMonths),
        amount: String(pricing.total),
        ...(uid ? { userId: uid } : {}),
      });
      router.push(`/choose-plan/payment?${params}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Header / Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 to-black pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            <Zap className="w-3.5 h-3.5" /> RedLightAD — 50% OFF for You
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Create your<br />
            <span className="text-red-500">Profile</span>
          </h1>
          <p className="text-gray-400 text-sm">Choose your plan and start getting clients today</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

        {/* ── Step: Plan selector ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Standard */}
          <button
            onClick={() => setSelectedPlan("standard")}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              selectedPlan === "standard"
                ? "border-white bg-white/5"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-1">Standard</p>
                <p className="text-xs text-gray-500">Basic visibility</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedPlan === "standard" ? "border-white bg-white" : "border-gray-600"
              }`}>
                {selectedPlan === "standard" && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
            </div>
            <div className="text-2xl font-black">
              {getPrice(PLANS.standard.normalMonthly, selectedMonths, duration.discount).perMonth}
              <span className="text-sm font-normal text-gray-500"> DKK/mo</span>
            </div>
          </button>

          {/* Premium */}
          <button
            onClick={() => setSelectedPlan("premium")}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              selectedPlan === "premium"
                ? "border-red-500 bg-red-950/30"
                : "border-white/10 bg-white/[0.03] hover:border-red-500/40"
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="bg-red-600 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                Recommended
              </span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-red-400 font-semibold tracking-widest uppercase mb-1">Premium</p>
                <p className="text-xs text-gray-500">Maximum exposure</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedPlan === "premium" ? "border-red-500 bg-red-500" : "border-gray-600"
              }`}>
                {selectedPlan === "premium" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {getPrice(PLANS.premium.normalMonthly, selectedMonths, duration.discount).perMonth}
              <span className="text-sm font-normal text-gray-500"> DKK/mo</span>
            </div>
          </button>
        </div>

        {/* ── Duration selector ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {DURATIONS.map((d, i) => {
            const p = getPrice(plan.normalMonthly, d.months, d.discount);
            const isSelected = selectedMonths === d.months;
            return (
              <button
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                  i > 0 ? "border-t border-white/5" : ""
                } ${isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-red-500 bg-red-500" : "border-gray-600"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-400"}`}>
                    {d.label}
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    d.popular
                      ? "bg-red-600 text-white"
                      : "bg-white/10 text-gray-400"
                  }`}>
                    {d.tag}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black ${isSelected ? "text-white" : "text-gray-400"}`}>
                    {p.perMonth} DKK<span className="text-xs font-normal text-gray-500">/mo</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base tracking-wide transition-colors shadow-lg shadow-red-900/40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              GET {selectedPlan === "premium" ? "PREMIUM" : "STANDARD"} — {pricing.total} DKK
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-600">
          Normal price: {plan.normalMonthly * selectedMonths} DKK · You save {pricing.original - pricing.total} DKK
        </p>

        {/* ── Feature comparison table ── */}
        <div className="rounded-2xl border border-white/10 overflow-hidden mt-6">
          <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-widest bg-white/[0.05] px-4 py-3">
            <span className="text-gray-500">Feature</span>
            <span className={`text-center ${selectedPlan === "standard" ? "text-white" : "text-gray-500"}`}>Standard</span>
            <span className={`text-center ${selectedPlan === "premium" ? "text-red-400" : "text-gray-500"}`}>Premium</span>
          </div>
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-3 items-center px-4 py-3 ${
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              } border-t border-white/5`}
            >
              <span className="text-xs text-gray-400">{f.label}</span>
              <div className="text-center"><FeatureValue val={f.standard} /></div>
              <div className="text-center"><FeatureValue val={f.premium} /></div>
            </div>
          ))}
        </div>

        {/* ── Trust badges ── */}
        <div className="flex flex-col gap-2 pt-2">
          {[
            "🔒 Secure payment — SSL encrypted",
            "⚡ Instant activation after payment",
            "🔕 Discreet billing — no adult content on statement",
          ].map(t => (
            <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
              <span>{t}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChoosePlanContent />
    </Suspense>
  );
}
