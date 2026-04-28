"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import {
  VisaIcon, MastercardIcon, RevolutIcon, N26Icon, WiseIcon,
  PaysafecardIcon, BitcoinIcon, USDTIcon, BankTransferIcon,
} from "@/components/PaymentIcons";

// ─── Payment method definitions ───────────────────────────────────────────────
type MethodId = "card" | "paypal" | "bank" | "paysafe" | "crypto";

const METHODS: {
  id: MethodId;
  labelKey: string;
  subKey: string | null;
  icons: React.ReactNode[];
}[] = [
  {
    id: "card",
    labelKey: "pay_card",
    subKey: null,
    icons: [<VisaIcon key="visa" className="h-6 opacity-90" />, <MastercardIcon key="mc" className="h-6 opacity-90" />],
  },
  {
    id: "paypal",
    labelKey: "pay_paypal",
    subKey: null,
    icons: [
      // PayPal inline SVG (no simple-icons)
      <svg key="pp" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal">
        <path d="M20.1 3H13.4L9 20h5.3l1-4.3h3c4.5 0 7.6-2.3 7.6-6.4C25.9 5.8 23.7 3 20.1 3zm-.7 6.3c0 1.8-1.2 2.8-3.3 2.8h-2.2l.9-4h2.3c1.5 0 2.3.6 2.3 1.8zM34.5 9c-3.8 0-6.4 2.8-6.4 6.5 0 2.6 1.7 4.2 4.5 4.2 1.7 0 3.1-.6 4-1.8l-.3 1.6h4.8l2.2-10.2H39l-.3 1.4C37.8 9.6 36.3 9 34.5 9zm1.2 7.2c-1.2 0-1.9-.7-1.9-1.9 0-1.7 1-2.9 2.6-2.9 1.2 0 1.9.7 1.9 1.9 0 1.7-1 2.9-2.6 2.9zM52 9c-3.8 0-6.4 2.8-6.4 6.5 0 2.6 1.7 4.2 4.5 4.2 1.7 0 3.1-.6 4-1.8L53.8 19h4.8L60.8 9H56l-.3 1.4C54.8 9.6 53.3 9 52 9zm1.2 7.2c-1.2 0-1.9-.7-1.9-1.9 0-1.7 1-2.9 2.6-2.9 1.2 0 1.9.7 1.9 1.9 0 1.7-1 2.9-2.6 2.9z" fill="white"/>
        <path d="M65 3l-4 16h5.3l4-16H65z" fill="#009cde"/>
      </svg>,
    ],
  },
  {
    id: "bank",
    labelKey: "pay_bank",
    subKey: "pay_bank_sub",
    icons: [
      <BankTransferIcon key="bank" className="h-6 opacity-90" />,
      <RevolutIcon key="revolut" className="h-5 opacity-90" />,
      <N26Icon key="n26" className="h-5 opacity-90" />,
      <WiseIcon key="wise" className="h-5 opacity-90" />,
    ],
  },
  {
    id: "paysafe",
    labelKey: "pay_paysafe",
    subKey: null,
    icons: [<PaysafecardIcon key="psc" className="h-6 opacity-90" />],
  },
  {
    id: "crypto",
    labelKey: "pay_crypto",
    subKey: "pay_crypto_sub",
    icons: [
      <BitcoinIcon key="btc" className="h-6 opacity-90" />,
      <USDTIcon    key="usdt" className="h-6 opacity-90" />,
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
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
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d; };

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
      // PayPal / Bank / Paysafe — coming soon
      const m = METHODS.find(m=>m.id===method);
      setError(`${m ? (t as Record<string,string>)[m.labelKey] : method} coming soon. Use card or crypto.`);
      setProcessing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* ── Hero ── */}
      <div
        className="relative h-20 flex flex-col items-center justify-center gap-0.5"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
      >
        <Logo variant="dark" height={22} />
        <p className="text-xs font-bold text-[#f5a623]">{t.cp_banner}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Order summary ── */}
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-3.5 border border-[#2a2a2a]">
          <button onClick={()=>router.back()} className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-black">{months} {monthLabel} {planLabel}</p>
          </div>
          <p className="text-sm font-black tabular-nums">
            ${ppm}<span className="text-xs font-normal text-gray-500">/month</span>
          </p>
        </div>

        {/* ── Payment methods ── */}
        <div>
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase px-1 mb-2">{t.pay_method}</p>
          <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
            {METHODS.map((m, i) => {
              const isSel  = method === m.id;
              const label  = (t as Record<string,string>)[m.labelKey];
              const sub    = m.subKey ? (t as Record<string,string>)[m.subKey] : null;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${i>0?"border-t border-[#222]":""} ${isSel?"bg-white":"bg-[#1a1a1a] hover:bg-[#222]"}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio */}
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSel?"border-black bg-black":"border-[#555]"}`}>
                      {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${isSel?"text-black":"text-white"}`}>{label}</p>
                      {sub && <p className={`text-xs ${isSel?"text-gray-600":"text-gray-500"}`}>{sub}</p>}
                    </div>
                  </div>
                  {/* Logos */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[160px]">
                    {m.icons.map((icon, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center ${isSel ? "" : "brightness-75 saturate-50"}`}
                        style={{ filter: isSel ? "none" : "brightness(0.6) saturate(0.4)" }}
                      >
                        {icon}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Card form ── */}
        {method === "card" && (
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
            <input
              type="text" inputMode="numeric" placeholder={t.pay_card_number} value={cardNum}
              onChange={e=>setCardNum(fmtCard(e.target.value))}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono tracking-widest"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" inputMode="numeric" placeholder={t.pay_expiry} value={expiry}
                onChange={e=>setExpiry(fmtExp(e.target.value))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
              <input
                type="text" inputMode="numeric" placeholder="CVC" value={cvc}
                onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
              />
            </div>
            <input
              type="text" placeholder={t.pay_name} value={name}
              onChange={e=>setName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623]"
            />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#f5a623]/20"
        >
          {processing
            ? <><Loader2 className="w-5 h-5 animate-spin"/> {t.pay_processing}</>
            : t.pay_get_membership}
        </button>

        {/* ── Trust ── */}
        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-gray-500">
            {planLabel} · {monthLabel} · <strong className="text-white">${amount} USD</strong>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
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
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <PaymentContent/>
    </Suspense>
  );
}
