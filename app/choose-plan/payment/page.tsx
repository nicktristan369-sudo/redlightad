"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Check, Shield, Lock, Loader2 } from "lucide-react";

// Payment method icons as inline SVG/emoji for simplicity
const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit or Debit Card",
    icons: ["VISA", "MC"],
    description: null,
  },
  {
    id: "paypal",
    label: "PayPal",
    icons: ["PayPal"],
    description: null,
  },
  {
    id: "bank",
    label: "Instant Bank Transfer",
    icons: ["Revolut", "N26", "Wise"],
    description: "Revolut, N26, Wise",
  },
  {
    id: "paysafe",
    label: "PaysafeCard",
    icons: ["Paysafe"],
    description: null,
  },
  {
    id: "crypto",
    label: "CryptoCoins",
    icons: ["BTC", "ETH"],
    description: "Bitcoin, Ethereum & more",
  },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan") || "premium";
  const months = parseInt(searchParams.get("months") || "12", 10);
  const amount = parseInt(searchParams.get("amount") || "0", 10);
  const uid = searchParams.get("userId") || "";

  const [selectedMethod, setSelectedMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planLabel = plan === "premium" ? "Premium" : "Standard";
  const monthLabel = months === 1 ? "1 Month" : `${months} Months`;

  // Stripe card fields state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || uid;

      if (selectedMethod === "crypto") {
        // NowPayments crypto flow
        const res = await fetch("/api/payment/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount, userId }),
        });
        const data = await res.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          throw new Error(data.error || "Crypto payment failed");
        }
      } else if (selectedMethod === "card") {
        // Stripe card flow
        const res = await fetch("/api/payment/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount, userId }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || "Payment failed");
        }
      } else {
        // Other methods — show "coming soon" or redirect to info
        setError(`${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label} coming soon. Please use card or crypto.`);
        setProcessing(false);
        return;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base">Complete your order</h1>
            <p className="text-xs text-gray-500">{planLabel} · {monthLabel} · {amount} DKK</p>
          </div>
          <Lock className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Order summary */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">
                {planLabel} Profile · {monthLabel}
              </p>
              <p className="text-2xl font-black text-white">{amount} <span className="text-base font-normal text-gray-400">DKK</span></p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                50% OFF
              </span>
              <p className="text-xs text-gray-600 mt-1">One-time payment</p>
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase px-1">Payment Method</p>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 transition-all ${
                selectedMethod === method.id
                  ? "border-white bg-white/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === method.id ? "border-white bg-white" : "border-gray-600"
                }`}>
                  {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{method.label}</p>
                  {method.description && (
                    <p className="text-xs text-gray-500">{method.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {method.icons.map((icon) => (
                  <PaymentIcon key={icon} name={icon} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Card form — only when card is selected */}
        {selectedMethod === "card" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
            <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Card Details</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Card Number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={e => setCardNumber(formatCard(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors font-mono tracking-wider"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">CVC</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cardCvc}
                  onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cardholder Name</label>
              <input
                type="text"
                placeholder="Name on card"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base tracking-wide transition-colors shadow-lg shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><Lock className="w-4 h-4" /> PAY {amount} DKK</>
          )}
        </button>

        {/* Security */}
        <div className="space-y-2 pb-4">
          {[
            { icon: "🔒", text: "256-bit SSL encryption" },
            { icon: "🔕", text: "Discreet — no adult content on bank statement" },
            { icon: "⚡", text: "Profile activated instantly after payment" },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-xs text-gray-600">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// Payment method icon badges
function PaymentIcon({ name }: { name: string }) {
  const styles: Record<string, string> = {
    VISA:    "bg-blue-900/40 text-blue-400 border-blue-800/40",
    MC:      "bg-red-900/40 text-red-400 border-red-800/40",
    PayPal:  "bg-blue-900/40 text-blue-300 border-blue-800/40",
    Revolut: "bg-purple-900/40 text-purple-300 border-purple-800/40",
    N26:     "bg-green-900/40 text-green-300 border-green-800/40",
    Wise:    "bg-green-900/40 text-green-400 border-green-800/40",
    Paysafe: "bg-blue-900/40 text-blue-300 border-blue-800/40",
    BTC:     "bg-orange-900/40 text-orange-400 border-orange-800/40",
    ETH:     "bg-indigo-900/40 text-indigo-400 border-indigo-800/40",
  };
  const labels: Record<string, string> = {
    MC: "MC", VISA: "VISA", PayPal: "PP", Revolut: "RV",
    N26: "N26", Wise: "WISE", Paysafe: "PSC", BTC: "₿", ETH: "Ξ",
  };
  return (
    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${styles[name] || "bg-white/10 text-gray-400 border-white/10"}`}>
      {labels[name] || name}
    </span>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
