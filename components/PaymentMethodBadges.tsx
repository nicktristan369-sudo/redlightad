"use client";

/**
 * PaymentMethodBadges — Unified payment logos for all checkout pages
 * All logos max 24px height, optimized for dark backgrounds
 * 
 * Usage:
 *   <CardBadges />         — Visa + Mastercard
 *   <PayPalBadge />        — PayPal logo
 *   <BankBadges />         — Revolut, N26, Wise
 *   <PaysafeBadge />       — Paysafecard
 *   <CryptoBadges />       — Bitcoin + USDT/Tether
 */

// CDN for official payment brand SVGs
const CDN = "https://cdn.jsdelivr.net/npm/payment-icons@1.1.1/min/flat";

// ─── Base Badge Components ────────────────────────────────────────────────────

function Badge({ children, bg = "white" }: { children: React.ReactNode; bg?: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded"
      style={{ height: 24, padding: "0 6px", background: bg, flexShrink: 0 }}
    >
      {children}
    </span>
  );
}

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

// ─── Card Payment Badges (Visa + Mastercard) ──────────────────────────────────

export function CardBadges() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Visa - white on blue */}
      <svg height="24" viewBox="0 0 50 16" fill="none">
        <rect width="50" height="16" rx="2" fill="#1A1F71"/>
        <path d="M19.5 11.5L21 4.5h2l-1.5 7h-2zm8.5-7l-1.8 4.8-.8-4c-.1-.5-.5-.8-1-.8h-3.2l-.1.3c.8.2 1.5.4 2 .7l1.7 6h2.1l3.2-7h-2.1zm5.5 7c.7 0 1.2-.2 1.6-.5l.4 1.6c-.5.2-1.2.4-2 .4-2.2 0-3.6-1.2-3.6-3 0-2.4 2.2-3.7 4.2-3.7.7 0 1.3.1 1.8.4l-.5 1.5c-.3-.1-.8-.3-1.4-.3-1.2 0-2.1.6-2.1 1.6 0 1.1.9 1.5 1.9 1.5l-.3.5zm6-5c.5 0 .9.3 1.1.8l2.4 6.2h-2l-.4-1.1h-2.4l-.4 1.1h-2l2.4-6.2c.2-.5.6-.8 1.1-.8h.2zm-.1 2.2l-.7 2.2h1.5l-.7-2.2h-.1z" fill="white"/>
      </svg>
      {/* Mastercard - official circles */}
      <svg height="24" viewBox="0 0 38 24" fill="none">
        <rect width="38" height="24" rx="4" fill="#1A1A1A"/>
        <circle cx="15" cy="12" r="7" fill="#EB001B"/>
        <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
        <path d="M19 6.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z" fill="#FF5F00"/>
      </svg>
    </div>
  );
}

// ─── PayPal Badge ─────────────────────────────────────────────────────────────

export function PayPalBadge() {
  return (
    <svg height="24" viewBox="0 0 60 24" fill="none">
      <rect width="60" height="24" rx="4" fill="#003087"/>
      <text x="8" y="16" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="white">Pay</text>
      <text x="28" y="16" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#009CDE">Pal</text>
    </svg>
  );
}

// ─── Bank Transfer Badges (Revolut, N26, Wise) ────────────────────────────────

export function BankBadges() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Revolut */}
      <svg height="24" viewBox="0 0 28 24" fill="none">
        <rect width="28" height="24" rx="4" fill="#191C1F"/>
        <text x="8" y="17" fontFamily="Arial Black, sans-serif" fontSize="14" fontWeight="900" fill="white">R</text>
      </svg>
      {/* N26 */}
      <svg height="24" viewBox="0 0 40 24" fill="none">
        <rect width="40" height="24" rx="4" fill="#36A18B"/>
        <text x="6" y="17" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="800" fill="white">N26</text>
      </svg>
      {/* Wise */}
      <svg height="24" viewBox="0 0 50 24" fill="none">
        <rect width="50" height="24" rx="4" fill="#9FE870"/>
        <text x="8" y="17" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="#163300">WISE</text>
      </svg>
    </div>
  );
}

// ─── Paysafecard Badge ────────────────────────────────────────────────────────

export function PaysafeBadge() {
  return (
    <svg height="24" viewBox="0 0 90 24" fill="none">
      <rect width="90" height="24" rx="4" fill="#003087"/>
      <text x="8" y="16" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="white">paysafe</text>
      <text x="52" y="16" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#00AEEF">card</text>
    </svg>
  );
}

// ─── Crypto Badges (Bitcoin + USDT) ───────────────────────────────────────────

export function CryptoBadges() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Bitcoin */}
      <svg height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="12" fill="#F7931A"/>
        <text x="7" y="17" fontFamily="Arial Black, sans-serif" fontSize="13" fontWeight="900" fill="white">₿</text>
      </svg>
      {/* USDT / Tether */}
      <svg height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="12" fill="#26A17B"/>
        <text x="7" y="17" fontFamily="Arial Black, sans-serif" fontSize="13" fontWeight="900" fill="white">T</text>
      </svg>
    </div>
  );
}

// ─── Payment Method Row Component ─────────────────────────────────────────────

interface PaymentMethodProps {
  id: string;
  label: string;
  sublabel?: string;
  badges: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  isFirst?: boolean;
}

export function PaymentMethodRow({ id, label, sublabel, badges, selected, onSelect, isFirst }: PaymentMethodProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-3.5 transition-all ${
        !isFirst ? "border-t border-[#2a2a2a]" : ""
      } ${selected 
        ? "bg-[#1a0000] border-l-2 border-l-[#E8192C]" 
        : "bg-[#141414] hover:bg-[#1a1a1a]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Radio */}
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          selected ? "border-[#E8192C] bg-[#E8192C]" : "border-[#444]"
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        {/* Label */}
        <div className="text-left min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{label}</p>
          {sublabel && <p className="text-xs text-gray-500 leading-tight mt-0.5">{sublabel}</p>}
        </div>
      </div>
      {/* Badges */}
      <div className="flex-shrink-0 ml-3">
        {badges}
      </div>
    </button>
  );
}

// ─── All Payment Methods Config ───────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { id: "card", label: "Credit or debit card", sublabel: undefined, Badges: CardBadges },
  { id: "paypal", label: "PayPal", sublabel: undefined, Badges: PayPalBadge },
  { id: "bank", label: "Instant Bank Transfer", sublabel: "Revolut, N26, Wise and more", Badges: BankBadges },
  { id: "paysafe", label: "PaysafeCard", sublabel: undefined, Badges: PaysafeBadge },
  { id: "crypto", label: "Cryptocurrency", sublabel: "Bitcoin, Tether & more", Badges: CryptoBadges },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"];

// ─── Payment Methods List ─────────────────────────────────────────────────────

interface PaymentMethodsListProps {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

export function PaymentMethodsList({ selected, onSelect }: PaymentMethodsListProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
      {PAYMENT_METHODS.map((m, i) => (
        <PaymentMethodRow
          key={m.id}
          id={m.id}
          label={m.label}
          sublabel={m.sublabel}
          badges={<m.Badges />}
          selected={selected === m.id}
          onSelect={() => onSelect(m.id)}
          isFirst={i === 0}
        />
      ))}
    </div>
  );
}

// ─── Secure Payment Footer ────────────────────────────────────────────────────

export function SecurePaymentFooter({ amount, discountedAmount }: { amount?: number; discountedAmount?: number }) {
  return (
    <div className="text-center space-y-2 pt-2">
      {amount !== undefined && (
        <p className="text-xs text-gray-500">
          {discountedAmount && discountedAmount < amount ? (
            <>
              <span className="line-through">${amount}</span>{" "}
              <span className="text-green-400 font-semibold">${discountedAmount}</span>
            </>
          ) : (
            <span className="text-white font-semibold">${amount}</span>
          )}
        </p>
      )}
      <div className="flex items-center justify-center gap-1.5">
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-gray-500">Secure payment · No adult-related transaction on your statement</p>
      </div>
    </div>
  );
}
