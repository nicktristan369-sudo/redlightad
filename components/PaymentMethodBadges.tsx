"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * PaymentMethodBadges — Unified payment logos for all checkout pages
 * All logos max 22-24px height
 * Uses official SVG logos from /public/pay/
 */

// ─── Card Payment Badges (Visa + Mastercard) ──────────────────────────────────

export function CardBadges() {
  return (
    <div className="flex items-center gap-1.5">
      <img src="/pay/visa.svg" alt="Visa" style={{ height: 22 }} />
      <img src="/pay/mastercard.svg" alt="Mastercard" style={{ height: 22 }} />
    </div>
  );
}

// ─── PayPal Badge ─────────────────────────────────────────────────────────────

export function PayPalBadge() {
  return (
    <svg height="22" viewBox="0 0 70 22" fill="none">
      <text x="0" y="17" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#253B80">Pay</text>
      <text x="30" y="17" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#179BD7">Pal</text>
    </svg>
  );
}

// ─── Bank Transfer Badges (Revolut, N26, Wise) ────────────────────────────────

export function BankBadges() {
  return (
    <div className="flex items-center gap-1.5">
      <img src="/pay/revolut.svg" alt="Revolut" style={{ height: 22 }} />
      <img src="/pay/n26.svg" alt="N26" style={{ height: 22 }} />
      <img src="/pay/wise.svg" alt="Wise" style={{ height: 22 }} />
    </div>
  );
}

// ─── Paysafecard Badge ────────────────────────────────────────────────────────

export function PaysafeBadge() {
  return <img src="/pay/paysafecard.svg" alt="Paysafecard" style={{ height: 22 }} />;
}

// ─── Crypto Badges ────────────────────────────────────────────────────────────

export function CryptoBadges() {
  return <img src="/pay/crypto.svg" alt="Cryptocurrency" style={{ height: 22 }} />;
}

// ─── Payment Methods Config ───────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { id: "card", label: "Credit or debit card", sublabel: undefined, Badges: CardBadges },
  { id: "paypal", label: "PayPal", sublabel: undefined, Badges: PayPalBadge },
  { id: "bank", label: "Instant Bank Transfer", sublabel: "Revolut, N26, Wise and more", Badges: BankBadges },
  { id: "paysafe", label: "PaysafeCard", sublabel: undefined, Badges: PaysafeBadge },
  { id: "crypto", label: "Cryptocurrency", sublabel: "Bitcoin, Tether & more", Badges: CryptoBadges },
] as const;

export type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"];

// ─── Light Theme Payment Methods List ─────────────────────────────────────────

interface PaymentMethodsListProps {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

export function PaymentMethodsList({ selected, onSelect }: PaymentMethodsListProps) {
  return (
    <div className="space-y-2">
      {PAYMENT_METHODS.map((m) => {
        const isActive = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
              isActive 
                ? "border-2 border-[#E63946] bg-[#FFF5F5]" 
                : "border-2 border-transparent bg-white hover:bg-[#FAFAFA]"
            }`}
            style={{ boxShadow: isActive ? "none" : "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Radio */}
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                isActive ? "border-[#E63946] bg-[#E63946]" : "border-[#CCC]"
              }`}>
                {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {/* Label */}
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-[#222] leading-tight">{m.label}</p>
                {m.sublabel && <p className="text-xs text-[#999] leading-tight mt-0.5">{m.sublabel}</p>}
              </div>
            </div>
            {/* Badges */}
            <div className="flex-shrink-0 ml-3">
              <m.Badges />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Secure Payment Footer (Light Theme) ──────────────────────────────────────

interface SecurePaymentFooterProps {
  amount?: number;
  discountedAmount?: number;
}

export function SecurePaymentFooter({ amount, discountedAmount }: SecurePaymentFooterProps = {}) {
  return (
    <div className="pt-3 border-t border-[#F0F0F0] space-y-2">
      {amount !== undefined && (
        <p className="text-center text-xs text-[#999]">
          {discountedAmount && discountedAmount < amount ? (
            <>
              <span className="line-through">€{amount}</span>{" "}
              <span className="text-green-600 font-semibold">€{discountedAmount}</span>
            </>
          ) : (
            <span className="text-[#222] font-semibold">€{amount}</span>
          )}
        </p>
      )}
      <div className="flex items-center justify-center gap-1.5">
        {/* Shield with checkmark */}
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-[11px] text-[#BBB]">Secure payment · No subscription · Points added instantly</p>
      </div>
    </div>
  );
}
