"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price: 0,
    priceLabel: "FREE",
    features: [
      "Basic listing visible on site",
      "Up to 5 photos",
      "Standard placement",
    ],
    recommended: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 29,
    priceLabel: "€29/month",
    features: [
      "Everything in Standard",
      "Up to 15 photos",
      "Featured badge",
      "Priority placement",
      "1 video",
    ],
    recommended: true,
  },
  {
    id: "vip",
    name: "VIP",
    price: 79,
    priceLabel: "€79/month",
    features: [
      "Everything in Basic",
      "Unlimited photos + videos",
      "VIP gold badge",
      "Top placement",
      "Voice messages",
      "Live cam feature",
    ],
    recommended: false,
  },
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
      // Free plan - go directly to dashboard
      router.push("/dashboard");
    } else {
      // Paid plans - go to payment page
      router.push(`/choose-plan/payment?plan=${planId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center">
          {[1, 2, 3, 4].map((num, i) => (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    num < 4
                      ? "bg-red-100 text-red-600"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {num < 4 ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    num
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-500">
                  {num === 1 && "Basic Info"}
                  {num === 2 && "Details"}
                  {num === 3 && "Contact & Photos"}
                  {num === 4 && "Choose Plan"}
                </span>
              </div>
              {i < 3 && (
                <div className={`mx-1.5 sm:mx-3 mb-5 h-0.5 w-8 sm:w-16 ${num < 4 ? "bg-red-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose your plan</h1>
          <p className="text-gray-600">
            Select the plan that best fits your needs. You can upgrade anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white p-8 shadow-md border-2 transition-all ${
                plan.recommended
                  ? "border-red-500 scale-105"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-red-600 mb-1">{plan.priceLabel}</div>
                {plan.price > 0 && (
                  <p className="text-xs text-gray-500">Billed monthly</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={selecting !== null}
                className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                  plan.recommended
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selecting === plan.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  plan.price === 0 ? "Start with Free" : "Choose Plan"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Skip link */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now and start with Standard (free)
          </Link>
        </div>
      </div>
    </div>
  );
}
