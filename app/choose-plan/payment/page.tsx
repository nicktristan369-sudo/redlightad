"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { 
  PaymentMethodsList, 
  SecurePaymentFooter,
  type PaymentMethodId 
} from "@/components/PaymentMethodBadges";

// ─── Main Content ─────────────────────────────────────────────────────────────
function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();

  const plan   = params.get("plan")              || "premium";
  const months = parseInt(params.get("months")   || "12", 10);
  const amount = parseFloat(params.get("amount") || "0");

  const [method, setMethod]         = useState<PaymentMethodId>("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Card form
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvc, setCvc]         = useState("");
  const [name, setName]       = useState("");

  // Promo
  const [promoCode, setPromoCode]       = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount]         = useState(0);
  const finalAmount = discount > 0 ? Math.round(amount * (1 - discount / 100)) : amount;
  const ppm = months > 0 ? Math.round(finalAmount / months) : 0;

  const planLabel  = plan === "premium" ? "Premium" : plan === "vip" ? "VIP" : "Standard";
  const monthLabel = months === 1 ? "1 month" : `${months} months`;

  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (method === "crypto") {
        const res = await fetch("/api/payment/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount: finalAmount, currency: "USD" }),
        });
        const data = await res.json();
        if (data.payment_url) { window.location.href = data.payment_url; return; }
        throw new Error(data.error || "Crypto payment failed");
      }
      if (method === "card") {
        const res = await fetch("/api/payment/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount: finalAmount, currency: "dkk" }),
        });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
        throw new Error(data.error || "Card payment failed");
      }
      setError(`${method} coming soon. Use card or crypto.`);
      setProcessing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Try again.");
      setProcessing(false);
    }
  };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, plan, months }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount_percent || 0);
        setPromoApplied(true);
      } else {
        setError(data.error || "Invalid promo code");
      }
    } catch {
      setError("Could not validate code");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Hero */}
      <div
        className="h-20 flex flex-col items-center justify-center gap-0.5"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)" }}
      >
        <Logo variant="dark" height={22} />
        <p className="text-xs font-bold text-[#E8192C]">50% OFF for You!</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Order summary */}
        <div className="flex items-center gap-3 bg-[#141414] rounded-xl px-4 py-3.5 border border-[#222]">
          <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <p className="flex-1 text-sm font-black">{monthLabel} {planLabel}</p>
          <p className="text-sm font-black tabular-nums">
            ${ppm}<span className="text-xs font-normal text-gray-500">/month</span>
          </p>
        </div>

        {/* Payment methods */}
        <PaymentMethodsList selected={method} onSelect={setMethod} />

        {/* Card form */}
        {method === "card" && (
          <div className="rounded-xl border border-[#222] bg-[#141414] p-4 space-y-3">
            <input
              type="text" inputMode="numeric" placeholder="Card number"
              value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#E8192C] font-mono tracking-widest"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" inputMode="numeric" placeholder="MM/YY"
                value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#E8192C] font-mono"
              />
              <input
                type="text" inputMode="numeric" placeholder="CVC"
                value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#E8192C] font-mono"
              />
            </div>
            <input
              type="text" placeholder="Name on card"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#E8192C]"
            />
          </div>
        )}

        {/* Promo code */}
        <div className="rounded-xl border border-[#222] bg-[#141414] p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">Promo code</p>
          {promoApplied ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span>✓ {promoCode.toUpperCase()} — {discount}% off</span>
              <button onClick={() => { setPromoApplied(false); setDiscount(0); setPromoCode(""); }} className="ml-auto text-gray-500 hover:text-white text-xs">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text" placeholder="Enter promo code"
                value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && applyPromo()}
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#E8192C] uppercase tracking-widest"
              />
              <button onClick={applyPromo} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex-shrink-0">Apply</button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* CTA */}
        <button
          onClick={handlePay} disabled={processing}
          className="w-full py-4 rounded-xl bg-[#E8192C] hover:bg-[#c71526] text-white font-black text-base tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#E8192C]/20 transition-colors"
        >
          {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "GET MEMBERSHIP"}
        </button>

        {/* Secure footer */}
        <SecurePaymentFooter 
          amount={amount} 
          discountedAmount={discount > 0 ? finalAmount : undefined} 
        />

        {/* Test card hint */}
        <p className="text-center text-[10px] text-gray-600">Test card: 4242 4242 4242 4242 · 12/34 · 123</p>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
