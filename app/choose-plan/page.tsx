"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Check, Zap, Shield, Star, Camera, Mic, TrendingUp, Video, MessageCircle, Globe, Tag, X } from "lucide-react";

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    badge: "MOST POPULAR",
    description: "More visibility. More bookings.",
    color: "red",
    features: [
      "Up to 15 photos",
      "1 video on your profile",
      "Featured badge — stand out instantly",
      "Priority placement",
      "Appear in search & category pages",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    badge: "MAXIMUM EXPOSURE",
    description: "Dominate the platform. Be impossible to ignore.",
    color: "dark",
    features: [
      "Everything in Basic",
      "Unlimited photos + videos",
      "VIP gold badge",
      "Top placement — always first",
      "Voice message",
      "Live cam feature",
      "Country blocking",
      "Stories & animated pics",
      "My Tour — appear internationally",
    ],
  },
];

// ── Durations ─────────────────────────────────────────────────────────────────
const DURATIONS: Record<string, { label: string; months: number; prices: Record<string, number>; saving: string | null; popular: boolean }[]> = {
  basic: [
    { label: "1 Month",   months: 1,  prices: { basic: 29  }, saving: null,    popular: false },
    { label: "3 Months",  months: 3,  prices: { basic: 69  }, saving: "21% off", popular: false },
    { label: "6 Months",  months: 6,  prices: { basic: 119 }, saving: "32% off", popular: true  },
    { label: "12 Months", months: 12, prices: { basic: 199 }, saving: "43% off", popular: false },
  ],
  vip: [
    { label: "1 Month",   months: 1,  prices: { vip: 79  }, saving: null,    popular: false },
    { label: "3 Months",  months: 3,  prices: { vip: 189 }, saving: "21% off", popular: false },
    { label: "6 Months",  months: 6,  prices: { vip: 319 }, saving: "33% off", popular: true  },
    { label: "12 Months", months: 12, prices: { vip: 529 }, saving: "44% off", popular: false },
  ],
};

const STATS = [
  { value: "3x", label: "More profile views" },
  { value: "5x", label: "More client inquiries" },
  { value: "Top", label: "Search placement" },
];

function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromWelcome = searchParams?.get("from") === "welcome";
  const uid = searchParams?.get("uid") || "";
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"plan" | "duration">("plan");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean; code?: string; id?: string;
    discount_type?: string; trial_days?: number;
    discount_percent?: number; discount_fixed?: number;
    description?: string; error?: string;
  } | null>(null);

  useEffect(() => {
    // If coming from welcome page, allow access without confirmed session
    if (fromWelcome) { setLoading(false); return; }
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
      else setLoading(false);
    });
  }, [router, fromWelcome]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedDuration(null);
    setPromoResult(null);
    setPromoInput("");
    setStep("duration");
  };

  const validatePromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoResult(null);
    const res = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoInput, plan: selectedPlan, months: selectedDuration }),
    });
    const d = await res.json();
    setPromoResult(d);
    setPromoLoading(false);
  };

  const getFinalPrice = () => {
    if (!selectedPlan || !selectedDuration || !selectedPrice) return selectedPrice;
    if (!promoResult?.valid) return selectedPrice;
    if (promoResult.discount_type === "percent" && promoResult.discount_percent) {
      return Math.max(0, Math.round(selectedPrice * (1 - promoResult.discount_percent / 100)));
    }
    if (promoResult.discount_type === "fixed" && promoResult.discount_fixed) {
      return Math.max(0, selectedPrice - promoResult.discount_fixed);
    }
    if (promoResult.discount_type === "trial") return 0;
    return selectedPrice;
  };

  const handleProceed = async () => {
    if (!selectedPlan || selectedDuration === null) return;
    setSelecting(true);
    if (selectedPlan === "standard") {
      router.push("/dashboard");
      return;
    }
    const finalPrice = getFinalPrice();
    const promoCode = promoResult?.valid ? promoResult.code : "";
    if (promoResult?.valid && promoResult.discount_type === "trial") {
      // Free trial — activate directly
      router.push(`/dashboard?plan_activated=true&plan=${selectedPlan}&promo=${promoCode}`);
      return;
    }
    router.push(`/choose-plan/payment?plan=${selectedPlan}&months=${selectedDuration}&amount=${finalPrice}&promo=${promoCode || ""}${uid ? `&userId=${uid}` : ""}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const durations = selectedPlan ? DURATIONS[selectedPlan] ?? [] : [];
  const selectedDurationObj = durations.find(d => d.months === selectedDuration);
  const selectedPrice = selectedPlan && selectedDurationObj ? selectedDurationObj.prices[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress */}
      <div className="border-b border-gray-100 py-5">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-center gap-0">
            {["Basic Info", "Details", "Contact & Photos", "Choose Plan"].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
                    {i < 3 ? <Check className="h-4 w-4" /> : "4"}
                  </div>
                  <span className={`mt-1 text-[11px] font-medium ${i === 3 ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                </div>
                {i < 3 && <div className="mx-2 mb-5 h-px w-12 bg-red-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white pt-12 pb-8 text-center px-4">
        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap className="h-3.5 w-3.5" />
          {step === "plan" ? "STEP 1 — CHOOSE YOUR PLAN" : "STEP 2 — CHOOSE YOUR DURATION"}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          {step === "plan" ? "Choose your visibility" : `${selectedPlan === "vip" ? "VIP" : "Basic"} — Choose your period`}
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          {step === "plan"
            ? "Premium profiles receive dramatically more views. Upgrade now."
            : "The longer you commit, the more you save. One-time payment — no subscription."}
        </p>

        {step === "plan" && (
          <div className="flex items-center justify-center gap-10 mt-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20">

        {/* ── STEP 1: Plan selection ── */}
        {step === "plan" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Standard free */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">STANDARD</p>
                <div className="text-5xl font-black text-gray-900 mb-1">FREE</div>
                <p className="text-sm text-gray-500 mb-6">Get started and test the platform</p>
                <button
                  onClick={() => { setSelectedPlan("standard"); router.push("/dashboard"); }}
                  className="w-full rounded-xl py-3.5 text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors mb-7"
                >
                  Start for Free
                </button>
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  {["Profile visible on site", "Up to 5 photos", "Standard placement", "Basic contact info"].map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic */}
              <div className="relative rounded-2xl border-2 border-red-500 bg-white p-8 shadow-2xl ring-1 ring-red-500">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-[11px] font-black tracking-widest bg-red-600 text-white shadow-md">
                  MOST POPULAR
                </div>
                <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">BASIC</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-red-600">€29</span>
                  <span className="text-base text-gray-400 mb-1.5">/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">More visibility. More bookings.</p>
                <button
                  onClick={() => handleSelectPlan("basic")}
                  className="w-full rounded-xl py-3.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors mb-7"
                >
                  Get Basic →
                </button>
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  {PLANS[0].features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-red-600 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* VIP */}
              <div className="relative rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-2xl">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-[11px] font-black tracking-widest bg-gray-900 text-yellow-400 border border-yellow-500/30 shadow-md">
                  MAXIMUM EXPOSURE
                </div>
                <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">VIP</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">€79</span>
                  <span className="text-base text-gray-400 mb-1.5">/month</span>
                </div>
                <p className="text-sm text-gray-400 mb-6">Dominate the platform.</p>
                <button
                  onClick={() => handleSelectPlan("vip")}
                  className="w-full rounded-xl py-3.5 text-sm font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors mb-7"
                >
                  Get VIP →
                </button>
                <div className="border-t border-gray-800 pt-6 space-y-3">
                  {PLANS[1].features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>One-time payment — no subscription</span></div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2"><Check className="h-4 w-4" /><span>Anonymous crypto payment accepted</span></div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2"><Zap className="h-4 w-4" /><span>Instant activation after payment</span></div>
            </div>

            <div className="text-center mt-8">
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
                Skip for now — start with Standard (free)
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 2: Duration selection ── */}
        {step === "duration" && selectedPlan && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {durations.map((d) => {
                const price = d.prices[selectedPlan];
                const perMonth = Math.round(price / d.months);
                const isSelected = selectedDuration === d.months;
                return (
                  <button
                    key={d.months}
                    onClick={() => setSelectedDuration(d.months)}
                    className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                      isSelected
                        ? selectedPlan === "vip"
                          ? "border-yellow-400 bg-gray-950 shadow-xl"
                          : "border-red-500 bg-white shadow-xl ring-1 ring-red-500"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {d.popular && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest ${
                        selectedPlan === "vip" ? "bg-yellow-400 text-gray-900" : "bg-red-600 text-white"
                      }`}>
                        BEST VALUE
                      </div>
                    )}
                    <p className={`text-xs font-bold tracking-widest mb-3 ${isSelected && selectedPlan === "vip" ? "text-gray-400" : "text-gray-400"}`}>
                      {d.label.toUpperCase()}
                    </p>
                    <div className={`text-4xl font-black mb-1 ${isSelected && selectedPlan === "vip" ? "text-white" : "text-gray-900"}`}>
                      €{price}
                    </div>
                    <p className={`text-sm mb-3 ${isSelected && selectedPlan === "vip" ? "text-gray-400" : "text-gray-500"}`}>
                      €{perMonth}/month
                    </p>
                    {d.saving ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedPlan === "vip"
                          ? "bg-yellow-400/20 text-yellow-400"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {d.saving}
                      </span>
                    ) : (
                      <span className="inline-block text-xs text-gray-400">Standard price</span>
                    )}
                    {isSelected && (
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center ${
                        selectedPlan === "vip" ? "bg-yellow-400" : "bg-red-600"
                      }`}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Savings table */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-8">
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-4">PRICE COMPARISON</p>
              <div className="space-y-2">
                {durations.map((d) => {
                  const price = d.prices[selectedPlan];
                  const perMonth = Math.round(price / d.months);
                  const isSelected = selectedDuration === d.months;
                  return (
                    <div key={d.months} className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${isSelected ? "bg-white shadow-sm" : ""}`}>
                      <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-500"}`}>{d.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">€{perMonth}/mo</span>
                        <span className={`text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-600"}`}>€{price} total</span>
                        {d.saving && (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{d.saving}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Promo code */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">PROMO CODE</p>
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoResult(null); }}
                  onKeyDown={e => e.key === "Enter" && validatePromo()}
                  placeholder="Enter code (optional)"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={validatePromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {promoResult && (
                <div className={`mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
                  promoResult.valid
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {promoResult.valid ? (
                    <>
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Code applied: <strong>{promoResult.code}</strong>
                        {promoResult.discount_type === "percent" && ` — ${promoResult.discount_percent}% discount`}
                        {promoResult.discount_type === "fixed" && ` — €${promoResult.discount_fixed} off`}
                        {promoResult.discount_type === "trial" && ` — Free trial activated!`}
                      </span>
                      <button onClick={() => { setPromoResult(null); setPromoInput(""); }} className="ml-auto">
                        <X className="w-4 h-4 text-green-500" />
                      </button>
                    </>
                  ) : (
                    <><Tag className="w-4 h-4 flex-shrink-0" /><span>{promoResult.error}</span></>
                  )}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setStep("plan")}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← Back to plans
              </button>
              <button
                onClick={handleProceed}
                disabled={selectedDuration === null || selecting}
                className={`w-full sm:flex-1 py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedPlan === "vip"
                    ? "bg-gray-900 text-white hover:bg-black"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25"
                }`}
              >
                {selecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : selectedDuration && selectedPrice ? (
                  getFinalPrice() === 0
                    ? `Activate Free Trial — ${selectedPlan === "vip" ? "VIP" : "Basic"} ${selectedDurationObj?.label} →`
                    : getFinalPrice() !== selectedPrice
                    ? `Pay €${getFinalPrice()} (was €${selectedPrice}) — ${selectedPlan === "vip" ? "VIP" : "Basic"} ${selectedDurationObj?.label} →`
                    : `Pay €${selectedPrice} — ${selectedPlan === "vip" ? "VIP" : "Basic"} ${selectedDurationObj?.label} →`
                ) : (
                  "Select a duration to continue"
                )}
              </button>
            </div>

            {/* Trust */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>One-time payment — no auto-renewal</span></div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2"><Check className="h-4 w-4" /><span>Crypto payment — anonymous & instant</span></div>
              <div className="hidden md:block w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2"><Zap className="h-4 w-4" /><span>Profile goes live immediately</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>}>
      <ChoosePlanContent />
    </Suspense>
  );
}
