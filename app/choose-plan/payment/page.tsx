"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

// ─── Logo Components (all strict 24px height) ─────────────────────────────────
const CDN = "https://cdn.jsdelivr.net/npm/payment-icons/min/flat";

// White rounded pill badge
function Badge({ children, w = "auto" }: { children: React.ReactNode; w?: string | number }) {
  return (
    <span
      className="inline-flex items-center justify-center bg-white rounded"
      style={{ height: 24, padding: "0 6px", width: w, flexShrink: 0 }}
    >
      {children}
    </span>
  );
}

// CDN image badge (Visa, Mastercard)
function ImgBadge({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} style={{ height: 24, width: "auto", borderRadius: 4, flexShrink: 0 }} />;
}

// Circle icon badge (Bitcoin, USDT)
function CircleBadge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: 24, height: 24, background: bg, flexShrink: 0 }}
    >
      {children}
    </span>
  );
}

// ─── Payment Method Logos ─────────────────────────────────────────────────────
function CardLogos() {
  return (
    <div className="flex items-center gap-1.5">
      <ImgBadge src={`${CDN}/visa.svg`} alt="Visa" />
      <ImgBadge src={`${CDN}/mastercard.svg`} alt="Mastercard" />
    </div>
  );
}

function PayPalLogo() {
  return (
    <Badge w={60}>
      <svg height="14" viewBox="0 0 60 16" fill="none">
        <text y="13" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="#003087">Pay</text>
        <text x="24" y="13" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="#009CDE">Pal</text>
      </svg>
    </Badge>
  );
}

function BankLogos() {
  return (
    <div className="flex flex-wrap items-center gap-1 justify-end max-w-[140px]">
      {/* Instant Bank */}
      <Badge w={56}>
        <svg height="10" viewBox="0 0 40 10"><text y="9" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" fill="#0065FF">Instant</text></svg>
      </Badge>
      {/* Revolut R */}
      <Badge w={24}>
        <svg height="12" viewBox="0 0 10 12"><text y="11" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="#191C1F">R</text></svg>
      </Badge>
      {/* N26 */}
      <Badge w={32}>
        <svg height="10" viewBox="0 0 22 10"><text y="9" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#36A18B">N26</text></svg>
      </Badge>
      {/* Wise */}
      <span className="inline-flex items-center justify-center rounded" style={{ height: 24, padding: "0 6px", background: "#9FE870", flexShrink: 0 }}>
        <svg height="10" viewBox="0 0 28 10"><text y="9" fontFamily="Arial Black, sans-serif" fontSize="9" fontWeight="900" fill="#163300">WISE</text></svg>
      </span>
    </div>
  );
}

function PaysafeLogo() {
  return (
    <Badge w={72}>
      <svg height="10" viewBox="0 0 55 10">
        <text y="9" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#003082">paysafe</text>
        <text x="38" y="9" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" fill="#009EE2">card</text>
      </svg>
    </Badge>
  );
}

function CryptoLogos() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Bitcoin */}
      <CircleBadge bg="#F7931A">
        <svg height="12" viewBox="0 0 12 12"><text x="2" y="10" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="900" fill="white">₿</text></svg>
      </CircleBadge>
      {/* USDT */}
      <CircleBadge bg="#26A17B">
        <svg height="12" viewBox="0 0 12 12"><text x="2" y="10" fontFamily="Arial Black, sans-serif" fontSize="10" fontWeight="900" fill="white">T</text></svg>
      </CircleBadge>
    </div>
  );
}

// ─── Payment Methods Config ───────────────────────────────────────────────────
type MethodId = "card" | "paypal" | "bank" | "paysafe" | "crypto";

const METHODS: { id: MethodId; label: string; sub?: string; Logo: () => React.ReactNode }[] = [
  { id: "card",    label: "Credit or debit card",    Logo: CardLogos },
  { id: "paypal",  label: "PayPal",                  Logo: PayPalLogo },
  { id: "bank",    label: "Instant Bank Transfer",   sub: "Revolut, N26, Wise and more", Logo: BankLogos },
  { id: "paysafe", label: "PaysafeCard",             Logo: PaysafeLogo },
  { id: "crypto",  label: "CryptoCoins",             sub: "Bitcoin, Ethereum & more", Logo: CryptoLogos },
];

// ─── Main Content ─────────────────────────────────────────────────────────────
function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();

  const plan   = params.get("plan")              || "premium";
  const months = parseInt(params.get("months")   || "12", 10);
  const amount = parseFloat(params.get("amount") || "0");

  const [method, setMethod]         = useState<MethodId>("card");
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

  const planLabel  = plan === "premium" ? "Premium" : "Standard";
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
    <div className="min-h-screen bg-[#111] text-white">

      {/* Hero */}
      <div
        className="h-20 flex flex-col items-center justify-center gap-0.5"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
      >
        <Logo variant="dark" height={22} />
        <p className="text-xs font-bold text-[#f5a623]">50% OFF for You!</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Order summary */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-3.5 border border-[#2a2a2a]">
          <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <p className="flex-1 text-sm font-black">{monthLabel} {planLabel}</p>
          <p className="text-sm font-black tabular-nums">
            ${ppm}<span className="text-xs font-normal text-gray-500">/month</span>
          </p>
        </div>

        {/* Payment methods */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
          {METHODS.map((m, i) => {
            const isSel = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                  i > 0 ? "border-t border-[#222]" : ""
                } ${isSel ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSel ? "border-black bg-black" : "border-[#555]"
                  }`}>
                    {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${isSel ? "text-black" : "text-white"}`}>{m.label}</p>
                    {m.sub && <p className={`text-xs leading-tight mt-0.5 ${isSel ? "text-gray-500" : "text-gray-500"}`}>{m.sub}</p>}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2" style={{ opacity: isSel ? 1 : 0.7 }}>
                  <m.Logo />
                </div>
              </button>
            );
          })}
        </div>

        {/* Card form */}
        {method === "card" && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
            <input
              type="text" inputMode="numeric" placeholder="Card number"
              value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono tracking-widest"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" inputMode="numeric" placeholder="MM/YY"
                value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
              <input
                type="text" inputMode="numeric" placeholder="CVC"
                value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
            </div>
            <input
              type="text" placeholder="Name on card"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623]"
            />
          </div>
        )}

        {/* Promo code */}
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
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
                className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] uppercase tracking-widest"
              />
              <button onClick={applyPromo} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex-shrink-0">Apply</button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* CTA */}
        <button
          onClick={handlePay} disabled={processing}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#f5a623]/20"
        >
          {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "GET MEMBERSHIP"}
        </button>

        {/* Trust footer */}
        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-gray-500">
            {planLabel} · {monthLabel} ·{" "}
            {discount > 0 ? (
              <><span className="line-through">${amount}</span> <strong className="text-green-400">${finalAmount}</strong></>
            ) : (
              <strong className="text-white">${amount}</strong>
            )}
          </p>
          <p className="text-[10px] text-gray-600">Test card: 4242 4242 4242 4242 · 12/34 · 123</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">No adult-related transaction in your bank statement</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
