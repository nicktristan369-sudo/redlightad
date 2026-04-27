"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit or debit card",
    sub: null,
    icons: [
      { label: "VISA",    bg: "#1a1f71", color: "#fff",     text: "VISA" },
      { label: "MC",      bg: "#eb001b", color: "#fff",     text: "MC" },
    ],
  },
  {
    id: "paypal",
    label: "PayPal",
    sub: null,
    icons: [
      { label: "PayPal",  bg: "#003087", color: "#009cde", text: "PayPal" },
    ],
  },
  {
    id: "bank",
    label: "Instant Bank Transfer",
    sub: "Revolut, N26, Wise and more",
    icons: [
      { label: "IBP",     bg: "#0070f3", color: "#fff",    text: "Bank" },
      { label: "RV",      bg: "#191c1f", color: "#fff",    text: "Revolut" },
      { label: "N26",     bg: "#111",    color: "#00d4b4", text: "N26" },
      { label: "WISE",    bg: "#9fe870", color: "#163300", text: "7WISE" },
    ],
  },
  {
    id: "paysafe",
    label: "PaysafeCard",
    sub: null,
    icons: [
      { label: "PSC",     bg: "#003082", color: "#fff",    text: "paysafe" },
    ],
  },
  {
    id: "crypto",
    label: "CryptoCoins",
    sub: "Bitcoin, Ethereum & more",
    icons: [
      { label: "BTC",     bg: "#f7931a", color: "#fff",    text: "₿" },
      { label: "ETH",     bg: "#627eea", color: "#fff",    text: "Ξ" },
    ],
  },
];

function PaymentBadge({ icon }: { icon: { label: string; bg: string; color: string; text: string } }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md text-[10px] font-black px-1.5 py-0.5 leading-none border"
      style={{ backgroundColor: icon.bg, color: icon.color, borderColor: icon.bg, minWidth: 32 }}
    >
      {icon.text}
    </span>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan    = searchParams.get("plan")   || "premium";
  const months  = parseInt(searchParams.get("months") || "12", 10);
  const amount  = parseInt(searchParams.get("amount") || "0",  10);
  const uid     = searchParams.get("userId") || "";

  const [selectedMethod, setSelectedMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card fields
  const [cardNum,  setCardNum]  = useState("");
  const [expiry,   setExpiry]   = useState("");
  const [cvc,      setCvc]      = useState("");
  const [name,     setName]     = useState("");

  const planLabel  = plan === "premium" ? "Premium" : "Standard";
  const monthLabel = months === 1 ? "1 month" : `${months} months`;
  const ppm        = Math.round(amount / months);

  const fmtCard = (v: string) =>
    v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = (v: string) => {
    const d = v.replace(/\D/g,"").slice(0,4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (selectedMethod === "crypto") {
        const res  = await fetch("/api/payment/crypto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount, userId: uid }),
        });
        const data = await res.json();
        if (data.payment_url) { window.location.href = data.payment_url; return; }
        throw new Error(data.error || "Crypto payment failed");
      }
      if (selectedMethod === "card") {
        const res  = await fetch("/api/payment/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, months, amount, userId: uid }),
        });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
        throw new Error(data.error || "Card payment failed");
      }
      // Other methods — not yet live
      setError(`${PAYMENT_METHODS.find(m=>m.id===selectedMethod)?.label} coming soon. Use card or crypto.`);
      setProcessing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* ── Hero banner ── */}
      <div className="relative h-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-black">
            RedLightAD <span className="text-[#f5a623]">50% OFF for You!</span>
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Order header ── */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-3.5 border border-[#2a2a2a]">
          <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-black text-white">{months} {monthLabel} {planLabel} membership</p>
          </div>
          <p className="text-sm font-black text-white tabular-nums">
            {ppm} DKK<span className="text-xs font-normal text-gray-500">/mo</span>
          </p>
        </div>

        {/* ── Payment method list ── */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
          {PAYMENT_METHODS.map((m, i) => {
            const isSelected = selectedMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                  i > 0 ? "border-t border-[#222]" : ""
                } ${isSelected ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-black bg-black" : "border-[#555]"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>
                      {m.label}
                    </p>
                    {m.sub && (
                      <p className={`text-xs ${isSelected ? "text-gray-600" : "text-gray-500"}`}>{m.sub}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end max-w-[140px]">
                  {m.icons.map(ic => <PaymentBadge key={ic.label} icon={ic} />)}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Card form ── */}
        {selectedMethod === "card" && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
            <input
              type="text" inputMode="numeric"
              placeholder="Card number"
              value={cardNum}
              onChange={e => setCardNum(fmtCard(e.target.value))}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono tracking-widest"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" inputMode="numeric"
                placeholder="MM / YY"
                value={expiry}
                onChange={e => setExpiry(fmtExp(e.target.value))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
              <input
                type="text" inputMode="numeric"
                placeholder="CVC"
                value={cvc}
                onChange={e => setCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Name on card"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623]"
            />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── CTA button ── */}
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#f5a623]/20"
        >
          {processing
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            : `GET MEMBERSHIP`
          }
        </button>

        {/* ── Price breakdown ── */}
        <div className="text-center space-y-1 pb-2">
          <p className="text-xs text-gray-500">
            {planLabel} · {monthLabel} · <strong className="text-white">{amount} DKK total</strong>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-500">No adult-related transaction in your bank statement</p>
          </div>
        </div>

      </div>
    </div>
  );
}

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
