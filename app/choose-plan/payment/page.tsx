"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

const PLAN_INFO: Record<string, { name: string; price: number; priceLabel: string }> = {
  basic: { name: "Basic", price: 29, priceLabel: "€29/month" },
  vip: { name: "VIP", price: 79, priceLabel: "€79/month" },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "basic";
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planInfo = PLAN_INFO[plan];

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

  const handlePayWithCrypto = async () => {
    setCreating(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/payments/create-plan-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // Redirect to NOWPayments invoice page
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!planInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid plan selected</p>
          <Link href="/choose-plan" className="text-sm text-gray-600 hover:text-gray-900 underline">
            ← Back to plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        {/* Back button */}
        <Link
          href="/choose-plan"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to plans
        </Link>

        {/* Payment card */}
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your purchase</h1>
            <p className="text-gray-600">
              You're about to subscribe to the <span className="font-semibold text-red-600">{planInfo.name}</span> plan
            </p>
          </div>

          {/* Plan summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">{planInfo.name} Plan</span>
              <span className="text-2xl font-bold text-gray-900">{planInfo.priceLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-600" />
              <span>Monthly subscription, cancel anytime</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Payment button */}
          <button
            onClick={handlePayWithCrypto}
            disabled={creating}
            className="w-full rounded-xl bg-red-600 py-4 text-base font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {creating ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating payment...</span>
              </div>
            ) : (
              "Pay with Crypto"
            )}
          </button>

          {/* Skip link */}
          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip for now → go to dashboard (Standard plan)
            </Link>
          </div>

          {/* Payment info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 text-xs text-gray-500">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="font-medium text-gray-700 mb-1">Secure crypto payment via NOWPayments</p>
                <p>You'll be redirected to complete your payment with your preferred cryptocurrency. Your plan will be activated immediately after payment confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
