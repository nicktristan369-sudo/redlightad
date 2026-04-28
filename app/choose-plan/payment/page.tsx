"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

// ─── Logo badge component ─────────────────────────────────────────────────────
// All logos: h-[28px], auto width, white bg rounded pill — exactly like Faphouse
function LogoBadge({ src, alt, bg = "white", h = 28, px = 8 }: {
  src: string; alt: string; bg?: string; h?: number; px?: number;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <span
      className="inline-flex items-center justify-center rounded flex-shrink-0"
      style={{ background: bg, padding: `4px ${px}px`, height: h }}
    >
      <img src={src} alt={alt} style={{ height: h - 10, width: "auto", display: "block" }} />
    </span>
  );
}

// Simple-icons are monochrome paths — wrap with colored bg circle
function SimpleIconBadge({ src, alt, bg, size = 28 }: {
  src: string; alt: string; bg: string; size?: number;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <span
      className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{ background: bg, width: size, height: size, padding: 5 }}
    >
      <img src={src} alt={alt} style={{ height: "100%", width: "100%", filter: "invert(1)", display: "block" }} />
    </span>
  );
}

// Text badge for brands without good CDN icons
function TextBadge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded flex-shrink-0 text-[10px] font-black tracking-tight px-2"
      style={{ background: bg, color, height: 28 }}
    >
      {text}
    </span>
  );
}

// ─── CDN URLs ─────────────────────────────────────────────────────────────────
const CDN_FLAT = "https://cdn.jsdelivr.net/npm/payment-icons/svg/flat";
const CDN_SI   = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

// ─── Payment method definitions ───────────────────────────────────────────────
type MethodId = "card" | "paypal" | "bank" | "paysafe" | "crypto";

function MethodLogos({ id, selected }: { id: MethodId; selected: boolean }) {
  const opacity = selected ? 1 : 0.65;
  const style   = { opacity };

  if (id === "card") return (
    <div className="flex items-center gap-1.5" style={style}>
      <LogoBadge src={`${CDN_FLAT}/visa.svg`}       alt="Visa"       />
      <LogoBadge src={`${CDN_FLAT}/mastercard.svg`} alt="Mastercard" />
    </div>
  );

  if (id === "paypal") return (
    <div className="flex items-center gap-1.5" style={style}>
      <LogoBadge src="/pay/paypal-white.png" alt="PayPal" bg="#003087" />
    </div>
  );

  if (id === "bank") return (
    <div className="flex flex-wrap items-center gap-1.5 justify-end max-w-[160px]" style={style}>
      <TextBadge text="Instant Bank" bg="#0065FF" color="white" />
      <SimpleIconBadge src={`${CDN_SI}/revolut.svg`} alt="Revolut" bg="#191C1F" />
      <TextBadge text="N26" bg="#111" color="#00d4b4" />
      <SimpleIconBadge src={`${CDN_SI}/wise.svg`} alt="Wise" bg="#9FE870" size={28} />
    </div>
  );

  if (id === "paysafe") return (
    <div className="flex items-center gap-1.5" style={style}>
      <TextBadge text="paysafe" bg="#003082" color="white" />
      <TextBadge text="card" bg="#003082" color="#00a0e0" />
    </div>
  );

  if (id === "crypto") return (
    <div className="flex items-center gap-1.5" style={style}>
      <SimpleIconBadge src={`${CDN_SI}/bitcoin.svg`}  alt="Bitcoin" bg="#F7931A" />
      <SimpleIconBadge src={`${CDN_SI}/tether.svg`}   alt="USDT"    bg="#26A17B" />
    </div>
  );

  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const METHODS: { id: MethodId; labelKey: string; subKey: string | null }[] = [
  { id: "card",    labelKey: "pay_card",    subKey: null           },
  { id: "paypal",  labelKey: "pay_paypal",  subKey: null           },
  { id: "bank",    labelKey: "pay_bank",    subKey: "pay_bank_sub" },
  { id: "paysafe", labelKey: "pay_paysafe", subKey: null           },
  { id: "crypto",  labelKey: "pay_crypto",  subKey: "pay_crypto_sub" },
];

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { t }  = useLanguage();

  const plan   = params.get("plan")              || "premium";
  const months = parseInt(params.get("months")   || "12", 10);
  const amount = parseFloat(params.get("amount") || "0");
  const uid    = params.get("userId")            || "";

  const [method,     setMethod]     = useState<MethodId>("card");
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [cardNum,    setCardNum]    = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvc,        setCvc]        = useState("");
  const [name,       setName]       = useState("");

  const planLabel  = plan === "premium" ? t.cp_premium : t.cp_standard;
  const monthLabel = months === 1 ? t.cp_months_1 : months === 3 ? t.cp_months_3 : t.cp_months_12;
  const ppm        = Math.round(amount / months * 100) / 100;

  const fmtCard = (v: string) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (method === "crypto") {
        const res  = await fetch("/api/payment/crypto", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({plan,months,amount,userId:uid}) });
        const data = await res.json();
        if (data.payment_url) { window.location.href = data.payment_url; return; }
        throw new Error(data.error || "Crypto payment failed");
      }
      if (method === "card") {
        const res  = await fetch("/api/payment/stripe", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({plan,months,amount,currency:"usd",userId:uid}) });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
        throw new Error(data.error || "Card payment failed");
      }
      const m = METHODS.find(m => m.id === method);
      setError(`${m ? (t as Record<string,string>)[m.labelKey] : method} coming soon. Use card or crypto.`);
      setProcessing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* Hero */}
      <div className="h-20 flex flex-col items-center justify-center gap-0.5"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}>
        <Logo variant="dark" height={22} />
        <p className="text-xs font-bold text-[#f5a623]">{t.cp_banner}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Order summary */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-3.5 border border-[#2a2a2a]">
          <button onClick={() => router.back()} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <p className="flex-1 text-sm font-black">{months} {monthLabel} {planLabel}</p>
          <p className="text-sm font-black tabular-nums">
            ${ppm}<span className="text-xs font-normal text-gray-500">/month</span>
          </p>
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase px-1 mb-2">{t.pay_method}</p>
          <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
            {METHODS.map((m, i) => {
              const isSel = method === m.id;
              const label = (t as Record<string,string>)[m.labelKey];
              const sub   = m.subKey ? (t as Record<string,string>)[m.subKey] : null;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${i > 0 ? "border-t border-[#222]" : ""} ${isSel ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
                >
                  {/* Left: radio + label */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSel ? "border-black bg-black" : "border-[#555]"}`}>
                      {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isSel ? "text-black" : "text-white"}`}>{label}</p>
                      {sub && <p className={`text-xs leading-tight mt-0.5 ${isSel ? "text-gray-500" : "text-gray-500"}`}>{sub}</p>}
                    </div>
                  </div>
                  {/* Right: logos */}
                  <div className="flex-shrink-0 ml-2">
                    <MethodLogos id={m.id} selected={isSel} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card form */}
        {method === "card" && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
            <input type="text" inputMode="numeric" placeholder={t.pay_card_number} value={cardNum}
              onChange={e => setCardNum(fmtCard(e.target.value))}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono tracking-widest" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" inputMode="numeric" placeholder={t.pay_expiry} value={expiry}
                onChange={e => setExpiry(fmtExp(e.target.value))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono" />
              <input type="text" inputMode="numeric" placeholder="CVC" value={cvc}
                onChange={e => setCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono" />
            </div>
            <input type="text" placeholder={t.pay_name} value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623]" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* CTA */}
        <button onClick={handlePay} disabled={processing}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#f5a623]/20">
          {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.pay_processing}</> : t.pay_get_membership}
        </button>

        {/* Trust */}
        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-gray-500">
            {planLabel} · {monthLabel} · <strong className="text-white">${amount} USD</strong>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-gray-500">{t.pay_no_adult}</p>
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
