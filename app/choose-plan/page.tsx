"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Check, Zap, Shield, Star, Camera, Mic, Globe, TrendingUp, Video, MessageCircle } from "lucide-react";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price: 0,
    priceLabel: "FREE",
    billing: null,
    badge: null,
    badgeColor: null,
    color: "gray",
    buttonStyle: "outline",
    description: "Get started and test the platform",
    features: [
      { icon: Check, text: "Profile visible on site" },
      { icon: Camera, text: "Up to 5 photos" },
      { icon: Check, text: "Standard placement in listings" },
      { icon: Check, text: "Basic contact info" },
    ],
    notIncluded: [
      "Featured badge",
      "Priority placement",
      "Videos",
      "Voice messages",
      "Live cam",
      "Country blocking",
      "Stories & animated pics",
    ],
    recommended: false,
    cta: "Start for Free",
  },
  {
    id: "basic",
    name: "Basic",
    price: 29,
    priceLabel: "€29",
    billing: "/month",
    badge: "MOST POPULAR",
    badgeColor: "red",
    color: "red",
    buttonStyle: "primary",
    description: "More visibility. More bookings.",
    features: [
      { icon: Check, text: "Everything in Standard" },
      { icon: Camera, text: "Up to 15 photos" },
      { icon: Video, text: "1 video on your profile" },
      { icon: Star, text: "Featured badge — stand out instantly" },
      { icon: TrendingUp, text: "Priority placement — shown before free profiles" },
      { icon: Globe, text: "Appear in search & category pages" },
    ],
    notIncluded: [
      "Unlimited photos + videos",
      "Voice messages",
      "Live cam",
      "VIP gold badge",
      "Top placement",
    ],
    recommended: true,
    cta: "Get Basic — €29/mo",
  },
  {
    id: "vip",
    name: "VIP",
    price: 79,
    priceLabel: "€79",
    billing: "/month",
    badge: "MAXIMUM EXPOSURE",
    badgeColor: "black",
    color: "black",
    buttonStyle: "dark",
    description: "Dominate the platform. Be impossible to ignore.",
    features: [
      { icon: Check, text: "Everything in Basic" },
      { icon: Camera, text: "Unlimited photos + videos" },
      { icon: Star, text: "VIP gold badge — premium status" },
      { icon: TrendingUp, text: "Top placement — always first" },
      { icon: Mic, text: "Voice message — personal first impression" },
      { icon: Video, text: "Live cam feature — real-time bookings" },
      { icon: Shield, text: "Country blocking — control your visibility" },
      { icon: MessageCircle, text: "Stories & animated pics — profile comes alive" },
      { icon: Globe, text: "My Tour — appear internationally" },
    ],
    notIncluded: [],
    recommended: false,
    cta: "Get VIP — €79/mo",
  },
];

const STATS = [
  { value: "3x", label: "More profile views" },
  { value: "5x", label: "More client inquiries" },
  { value: "Top", label: "Search placement" },
];

export default function ChoosePlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSelectPlan = async (planId: string) => {
    setSelecting(planId);
    if (planId === "standard") {
      router.push("/dashboard");
    } else {
      router.push(`/choose-plan/payment?plan=${planId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="border-b border-gray-100 py-5">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-center gap-0">
            {["Basic Info", "Details", "Contact & Photos", "Choose Plan"].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i < 3 ? "bg-red-600 text-white" : "bg-gray-900 text-white"
                  }`}>
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
      <div className="bg-white py-14 text-center px-4">
        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Zap className="h-3.5 w-3.5" />
          ONE LAST STEP
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Choose your visibility
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Premium profiles receive dramatically more views and inquiries.
          <br />Upgrade now — cancel anytime.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 mt-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border transition-all ${
                plan.id === "vip"
                  ? "bg-gray-950 border-gray-800 text-white shadow-2xl"
                  : plan.recommended
                  ? "bg-white border-red-500 shadow-2xl ring-1 ring-red-500"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-[11px] font-black tracking-widest shadow-md ${
                  plan.id === "vip"
                    ? "bg-gray-900 text-yellow-400 border border-yellow-500/30"
                    : "bg-red-600 text-white"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                {/* Plan name & price */}
                <div className="mb-6">
                  <p className={`text-xs font-bold tracking-widest mb-2 ${
                    plan.id === "vip" ? "text-gray-400" : "text-gray-400"
                  }`}>{plan.name.toUpperCase()}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-5xl font-black tracking-tight ${
                      plan.id === "vip" ? "text-white" : plan.price === 0 ? "text-gray-900" : "text-red-600"
                    }`}>{plan.priceLabel}</span>
                    {plan.billing && (
                      <span className={`text-base mb-1.5 ${plan.id === "vip" ? "text-gray-400" : "text-gray-400"}`}>
                        {plan.billing}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${plan.id === "vip" ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* CTA button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selecting !== null}
                  className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all mb-7 ${
                    plan.id === "vip"
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : plan.recommended
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {selecting === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : plan.cta}
                </button>

                {/* Divider */}
                <div className={`border-t mb-6 ${plan.id === "vip" ? "border-gray-800" : "border-gray-100"}`} />

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                        plan.id === "vip" ? "text-yellow-400" : "text-red-600"
                      }`}>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <span className={`text-sm ${plan.id === "vip" ? "text-gray-300" : "text-gray-700"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 opacity-30">
                      <div className="flex-shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center">
                        <div className={`w-3 h-px ${plan.id === "vip" ? "bg-gray-500" : "bg-gray-400"}`} />
                      </div>
                      <span className={`text-sm line-through ${plan.id === "vip" ? "text-gray-500" : "text-gray-400"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Cancel anytime — no contract</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Anonymous payment accepted</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Instant activation</span>
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
            Skip for now and start with Standard (free)
          </Link>
        </div>
      </div>
    </div>
  );
}
