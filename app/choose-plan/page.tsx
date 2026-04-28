"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Logo from "@/components/Logo";
import { Check, X, Camera, Video, Mic, Star, Search, Gem, Globe, Link, Flame, BookOpen, ShoppingCart, Coins, CreditCard, ShieldOff, MessageCircle, Film } from "lucide-react";

// ─── Pricing in USD ───────────────────────────────────────────────────────────
const MONTHLY_USD: Record<"standard" | "premium", number> = {
  standard: 21, // ~150 DKK
  premium:  42, // ~300 DKK
};

const DURATIONS = [
  { months: 12, discountPct: 50, popular: true  },
  { months: 3,  discountPct: 30, popular: false },
  { months: 1,  discountPct: 25, popular: false },
];

function pricePerMonth(plan: "standard" | "premium", discountPct: number) {
  return Math.round(MONTHLY_USD[plan] * (1 - discountPct / 100) * 100) / 100;
}
function totalPrice(plan: "standard" | "premium", months: number, discountPct: number) {
  return Math.round(pricePerMonth(plan, discountPct) * months * 100) / 100;
}

type Plan = "standard" | "premium";

function FeatureCell({ val }: { val: string | boolean }) {
  if (val === true)  return <Check className="w-5 h-5 text-green-400 mx-auto" strokeWidth={2.5} />;
  if (val === false) return <X     className="w-4 h-4 text-red-500  mx-auto" strokeWidth={2.5} />;
  return <span className="text-xs text-gray-300 leading-tight">{val}</span>;
}

function ChoosePlanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const uid = params?.get("uid") || "";
  const { t } = useLanguage();

  const [activePlan, setActivePlan]   = useState<Plan>("premium");
  const [activeMonths, setActiveMonths] = useState(12);

  const dur    = DURATIONS.find(d => d.months === activeMonths)!;
  const ppm    = pricePerMonth(activePlan, dur.discountPct);
  const total  = totalPrice(activePlan, activeMonths, dur.discountPct);
  const normal = Math.round(MONTHLY_USD[activePlan] * activeMonths * 100) / 100;

  // Feature table — uses translation keys for labels
  const FEATURES: { icon: React.ReactNode; label: string; standard: string | boolean; premium: string | boolean }[] = [
    { icon: <Camera  size={15}/>, label: t.cp_f_photos,     standard: t.cp_f_photos_standard,  premium: t.cp_f_photos_premium },
    { icon: <Video   size={15}/>, label: t.cp_f_video,      standard: false,                    premium: true },
    { icon: <Film    size={15}/>, label: t.cp_f_videopfp,   standard: false,                    premium: true },
    { icon: <Mic     size={15}/>, label: t.cp_f_voice,      standard: false,                    premium: true },
    { icon: <Star    size={15}/>, label: t.cp_f_reviews,    standard: t.cp_f_reviews_standard,  premium: t.cp_f_reviews_premium },
    { icon: <Search  size={15}/>, label: t.cp_f_search,     standard: t.cp_f_search_standard,   premium: "Always Top" },
    { icon: <Gem     size={15}/>, label: t.cp_f_carousel,   standard: false,                    premium: true },
    { icon: <Globe   size={15}/>, label: t.cp_f_location,   standard: t.cp_f_location_standard, premium: t.cp_f_location_premium },
    { icon: <Link    size={15}/>, label: t.cp_f_social,     standard: false,                    premium: true },
    { icon: <Flame   size={15}/>, label: t.cp_f_onlyfans,   standard: false,                    premium: true },
    { icon: <BookOpen size={15}/>, label: t.cp_f_stories,   standard: false,                    premium: true },
    { icon: <ShoppingCart size={15}/>, label: t.cp_f_marketplace, standard: false,              premium: t.cp_f_marketplace_premium },
    { icon: <Coins   size={15}/>, label: t.cp_f_redcoins,   standard: false,                    premium: true },
    { icon: <CreditCard size={15}/>, label: t.cp_f_payme,   standard: false,                    premium: t.cp_f_payme_premium },
    { icon: <ShieldOff size={15}/>, label: t.cp_f_geo,      standard: false,                    premium: true },
    { icon: <MessageCircle size={15}/>, label: t.cp_f_messages, standard: true,                 premium: true },
    { icon: <Video   size={15}/>, label: t.cp_f_videos50,   standard: false,                    premium: true },
  ];

  const durationLabel = (months: number) =>
    months === 1 ? t.cp_months_1 : months === 3 ? t.cp_months_3 : t.cp_months_12;

  const handleGetMembership = () => {
    const p = new URLSearchParams({
      plan: activePlan,
      months: String(activeMonths),
      amount: String(total),
      currency: "usd",
      ...(uid ? { userId: uid } : {}),
    });
    router.push(`/choose-plan/payment?${p}`);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">

      {/* ── Hero ── */}
      <div
        className="relative h-24 flex flex-col items-center justify-center gap-1.5"
        style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
      >
        <Logo variant="dark" height={26} />
        <p className="text-sm font-bold text-[#f5a623]">{t.cp_banner}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16 pt-5">

        {/* ── Plan toggle ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["standard", "premium"] as Plan[]).map((plan) => {
            const isActive = activePlan === plan;
            return (
              <button
                key={plan}
                onClick={() => setActivePlan(plan)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? plan === "premium"
                      ? "border-[#f5a623] bg-[#f5a623]/10"
                      : "border-white bg-white/10"
                    : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#444]"
                }`}
              >
                {plan === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#f5a623] text-black text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wide">
                    {t.cp_recommended}
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <p className={`text-sm font-black uppercase ${isActive ? "text-white" : "text-gray-500"}`}>
                    {plan === "premium" ? t.cp_premium : t.cp_standard}
                  </p>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isActive
                      ? plan === "premium" ? "border-[#f5a623] bg-[#f5a623]" : "border-white bg-white"
                      : "border-[#555]"
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {plan === "premium" ? t.cp_max_exposure : t.cp_basic_plan}
                </p>
                <p className="text-xl font-black text-white">
                  ${pricePerMonth(plan, dur.discountPct)}
                  <span className="text-xs font-normal text-gray-500">/month</span>
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Duration list ── */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] mb-4">
          {DURATIONS.map((d, i) => {
            const p2 = pricePerMonth(activePlan, d.discountPct);
            const isSel = activeMonths === d.months;
            return (
              <button
                key={d.months}
                onClick={() => setActiveMonths(d.months)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                  i > 0 ? "border-t border-[#222]" : ""
                } ${isSel ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSel ? "border-black bg-black" : "border-[#555]"
                  }`}>
                    {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm font-bold ${isSel ? "text-black" : "text-white"}`}>
                    {durationLabel(d.months)}
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                    {d.discountPct}% {t.cp_off}
                  </span>
                  {d.popular && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSel ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"}`}>
                      {t.cp_best}
                    </span>
                  )}
                </div>
                <span className={`text-base font-black ${isSel ? "text-black" : "text-white"}`}>
                  ${p2}<span className={`text-xs font-normal ${isSel ? "text-black/60" : "text-gray-500"}`}>/month</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <button
          onClick={handleGetMembership}
          className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase mb-3 shadow-lg shadow-[#f5a623]/20"
        >
          {t.cp_get_membership}
        </button>

        {/* Summary */}
        <p className="text-center text-xs text-gray-500 mb-6">
          {t.cp_total}: <strong className="text-white">${total}</strong> ·{" "}
          {t.cp_normal_price}: <span className="line-through">${normal}</span> ·{" "}
          <span className="text-green-400">{t.cp_you_save} ${Math.round((normal - total) * 100) / 100}</span>
        </p>

        {/* ── Feature table ── */}
        <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
          <div className="grid grid-cols-[1fr_80px_80px] bg-[#1a1a1a] border-b border-[#2a2a2a]">
            <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.cp_compare}</div>
            <button onClick={() => setActivePlan("standard")}
              className={`py-3 text-xs font-black text-center transition-colors ${activePlan === "standard" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-gray-500 hover:text-white"}`}>
              {t.cp_standard}
            </button>
            <button onClick={() => setActivePlan("premium")}
              className={`py-3 text-xs font-black text-center rounded-t-lg transition-colors ${activePlan === "premium" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-gray-500 hover:text-white"}`}>
              {t.cp_premium} ★
            </button>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className={`grid grid-cols-[1fr_80px_80px] items-center border-b border-[#1e1e1e] ${i % 2 === 0 ? "bg-[#161616]" : "bg-[#111]"}`}>
              <div className="flex items-center gap-2 px-4 py-3">
                <span className={`flex-shrink-0 ${activePlan === "premium" ? "text-[#f5a623]" : "text-gray-500"}`}>{f.icon}</span>
                <span className="text-xs text-gray-400 leading-tight">{f.label}</span>
              </div>
              <div className={`py-3 text-center ${activePlan === "standard" ? "bg-[#f5a623]/5" : ""}`}><FeatureCell val={f.standard} /></div>
              <div className={`py-3 text-center ${activePlan === "premium"  ? "bg-[#f5a623]/5" : ""}`}><FeatureCell val={f.premium}  /></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <button onClick={handleGetMembership}
          className="w-full mt-5 py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase shadow-lg shadow-[#f5a623]/20">
          {t.cp_get_membership}
        </button>

        {/* Trust */}
        <div className="mt-4 space-y-1.5">
          {[t.cp_no_adult, t.cp_instant, t.cp_ssl].map(txt => (
            <p key={txt} className="text-[11px] text-gray-600 text-center">🔒 {txt}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChoosePlanContent />
    </Suspense>
  );
}
