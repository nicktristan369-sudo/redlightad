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

// ─── CDN ─────────────────────────────────────────────────────────────────────
const CDN_FLAT = "https://cdn.jsdelivr.net/npm/payment-icons/min/flat";

// ─── Inline SVG brand badges ─────────────────────────────────────────────────
// White pill badge with brand icon inside — exactly like Faphouse
function WBadge({ children, w = 56 }: { children: React.ReactNode; w?: number }) {
  return (
    <span className="inline-flex items-center justify-center bg-white rounded flex-shrink-0"
      style={{ width: w, height: 28, padding: "3px 6px" }}>
      {children}
    </span>
  );
}

// Revolut "R" badge — white pill, black R
function RevolutBadge() {
  return (
    <WBadge w={52}>
      <svg height="16" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#191C1F" d="M0 0h5.6c2.8 0 4.4 1.4 4.4 3.7 0 1.7-.9 2.9-2.2 3.4L10.4 11H7L5 7.5H3V11H0V0zm3 5H5.3c1 0 1.5-.5 1.5-1.4S6.3 2.1 5.3 2.1H3V5z"/>
        <path fill="#191C1F" d="M14 0h3v11h-3V0z"/>
        <text x="19" y="10.5" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#191C1F">Pay</text>
      </svg>
    </WBadge>
  );
}

// N26 badge — dark teal
function N26Badge() {
  return (
    <WBadge w={44}>
      <svg height="14" viewBox="0 0 36 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0E2A3B" d="M0 0h3.2L9 8.2V0h3.2v14H9L3.2 5.8V14H0V0z"/>
        <path fill="#0E2A3B" d="M15 14V0h3.2v14H15z"/>
        <path fill="#0E2A3B" d="M21 7c0-4 2.7-7 6.5-7 1.8 0 3.4.7 4.5 1.9l-2 1.8a2.9 2.9 0 0 0-2.5-1c-2 0-3.2 1.4-3.2 3.3s1.2 3.3 3.2 3.3c.8 0 1.4-.2 1.9-.7V7.6h-2.6V5.5H35v5C33.7 11.8 32 12.9 29.9 12.9 24.5 13 21 9.8 21 7z"/>
      </svg>
    </WBadge>
  );
}

// Wise badge — green bg, dark arrow+WISE
function WiseBadge() {
  return (
    <span className="inline-flex items-center justify-center rounded flex-shrink-0"
      style={{ background: "#9FE870", height: 28, padding: "3px 8px", minWidth: 52 }}>
      <svg height="14" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#163300" d="M0 2h3l3 8.5L9 2h2.5L15 10.5 18 2h3L16 14h-3L9.5 5.5 7 14H4L0 2z"/>
        <path fill="#163300" d="M22.5 2H25v12h-2.5V2z"/>
        <path fill="#163300" d="M27.5 2h8.8c2 0 3.2 1 3.2 2.7 0 1-.5 1.8-1.4 2.2 1 .4 1.7 1.3 1.7 2.5 0 1.9-1.3 3.1-3.3 3.1H27.5V2zm2.5 4h4.7c.6 0 .9-.3.9-.9s-.3-.9-.9-.9H30v1.8zm0 5.2h4.8c.7 0 1-.3 1-.9 0-.7-.3-1-.9-1H30v1.9z"/>
      </svg>
    </span>
  );
}

// Paysafecard badge — blue pill
function PaysafeBadge() {
  return (
    <span className="inline-flex items-center justify-center rounded flex-shrink-0"
      style={{ background: "#003082", height: 28, padding: "3px 8px" }}>
      <svg height="13" viewBox="0 0 80 13" xmlns="http://www.w3.org/2000/svg">
        <text y="11" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="11" fontWeight="800" fill="white">paysafe</text>
        <text x="49" y="11" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="11" fontWeight="800" fill="#009EE2">card</text>
      </svg>
    </span>
  );
}

// Bitcoin circle badge
function BtcBadge() {
  return (
    <span className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{ background: "#F7931A", width: 28, height: 28 }}>
      <svg height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M11.1 6.9c.1-1-.6-1.5-1.7-1.9l.3-1.3-.8-.2-.3 1.3-.6-.1.3-1.4-.9-.2-.3 1.4-1.5-.4-.2.9.6.1c.3.1.4.3.3.5L5.3 9.8c-.1.2-.2.3-.5.3l-.6-.2-.4.9 1.5.4.2.1-.3 1.4.9.2.3-1.4.6.2-.3 1.3.9.2.3-1.4c1.4.3 2.4.1 2.8-1.1.3-.9 0-1.5-.7-1.8.5-.1.8-.5.9-1.1zm-1.6 2.2c-.3 1-2 .5-2.5.3l.4-1.7c.5.1 2.2.4 2.1 1.4zm.3-2.2c-.3.9-1.6.4-2 .3l.4-1.6c.4.1 1.8.4 1.6 1.3z"/>
      </svg>
    </span>
  );
}

// USDT circle badge
function UsdtBadge() {
  return (
    <span className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{ background: "#26A17B", width: 28, height: 28 }}>
      <svg height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M9 6.9V5.4h2.3V4H4.7v1.4H7v1.5C4.7 7.2 3 7.9 3 8.9c0 1.3 2 2.3 5 2.3s5-1 5-2.3c0-1-1.7-1.7-4-2zm-1 3c-1.9 0-3-.6-3-1.5s1.1-1.5 3-1.5 3 .6 3 1.5-1.1 1.5-3 1.5z"/>
      </svg>
    </span>
  );
}

// ─── Payment method definitions ───────────────────────────────────────────────
type MethodId = "card" | "paypal" | "bank" | "paysafe" | "crypto";

function MethodLogos({ id, selected }: { id: MethodId; selected: boolean }) {
  const opacity = selected ? 1 : 0.7;

  if (id === "card") return (
    <div className="flex items-center gap-1.5" style={{ opacity }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${CDN_FLAT}/visa.svg`}       alt="Visa"       height={28} style={{ borderRadius: 4 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${CDN_FLAT}/mastercard.svg`} alt="Mastercard" height={28} style={{ borderRadius: 4 }} />
    </div>
  );

  if (id === "paypal") return (
    <div className="flex items-center" style={{ opacity }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pay/paypal-white.png" alt="PayPal" height={28}
        style={{ borderRadius: 4, background: "#003087", padding: "4px 8px", boxSizing: "content-box" }} />
    </div>
  );

  if (id === "bank") return (
    <div className="flex flex-wrap items-center gap-1.5 justify-end max-w-[150px]" style={{ opacity }}>
      <RevolutBadge />
      <N26Badge />
      <WiseBadge />
    </div>
  );

  if (id === "paysafe") return (
    <div className="flex items-center" style={{ opacity }}>
      <PaysafeBadge />
    </div>
  );

  if (id === "crypto") return (
    <div className="flex items-center gap-1.5" style={{ opacity }}>
      <BtcBadge />
      <UsdtBadge />
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
