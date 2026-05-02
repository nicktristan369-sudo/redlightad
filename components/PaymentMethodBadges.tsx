"use client";

/**
 * PaymentMethodBadges — Unified payment logos for all checkout pages
 * All logos max 22-24px height
 * Supports both dark and light themes
 */

// ─── Card Payment Badges (Visa + Mastercard) ──────────────────────────────────

export function CardBadges() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Visa */}
      <svg height="22" viewBox="0 0 50 16" fill="none">
        <rect width="50" height="16" rx="2" fill="#1A1F71"/>
        <path d="M19.5 11.5L21 4.5h2l-1.5 7h-2zm8.5-7l-1.8 4.8-.8-4c-.1-.5-.5-.8-1-.8h-3.2l-.1.3c.8.2 1.5.4 2 .7l1.7 6h2.1l3.2-7h-2.1zm5.5 7c.7 0 1.2-.2 1.6-.5l.4 1.6c-.5.2-1.2.4-2 .4-2.2 0-3.6-1.2-3.6-3 0-2.4 2.2-3.7 4.2-3.7.7 0 1.3.1 1.8.4l-.5 1.5c-.3-.1-.8-.3-1.4-.3-1.2 0-2.1.6-2.1 1.6 0 1.1.9 1.5 1.9 1.5l-.3.5zm6-5c.5 0 .9.3 1.1.8l2.4 6.2h-2l-.4-1.1h-2.4l-.4 1.1h-2l2.4-6.2c.2-.5.6-.8 1.1-.8h.2zm-.1 2.2l-.7 2.2h1.5l-.7-2.2h-.1z" fill="white"/>
      </svg>
      {/* Mastercard - two overlapping circles */}
      <svg height="22" viewBox="0 0 36 22" fill="none">
        <circle cx="13" cy="11" r="10" fill="#EB001B"/>
        <circle cx="23" cy="11" r="10" fill="#F79E1B"/>
        <path d="M18 3.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z" fill="#FF5F00"/>
      </svg>
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
      {/* Revolut */}
      <svg height="22" viewBox="0 0 22 22" fill="none">
        <rect width="22" height="22" rx="4" fill="#191C1F"/>
        <text x="6" y="16" fontFamily="Arial Black, sans-serif" fontSize="13" fontWeight="900" fill="white">R</text>
      </svg>
      {/* N26 */}
      <svg height="22" viewBox="0 0 36 22" fill="none">
        <rect width="36" height="22" rx="4" fill="#36A18B"/>
        <text x="5" y="16" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="white">N26</text>
      </svg>
      {/* Wise */}
      <svg height="22" viewBox="0 0 46 22" fill="none">
        <rect width="46" height="22" rx="4" fill="#9FE870"/>
        <text x="6" y="15" fontFamily="Arial Black, sans-serif" fontSize="11" fontWeight="900" fill="#163300">WISE</text>
      </svg>
    </div>
  );
}

// ─── Paysafecard Badge ────────────────────────────────────────────────────────

export function PaysafeBadge() {
  return (
    <svg height="22" viewBox="0 0 85 22" fill="none">
      <rect width="85" height="22" rx="4" fill="#003087"/>
      <text x="6" y="15" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="white">paysafe</text>
      <text x="48" y="15" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#00AEEF">card</text>
    </svg>
  );
}

// ─── Crypto Badges (Bitcoin + Tether) ─────────────────────────────────────────

export function CryptoBadges() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Bitcoin */}
      <svg height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#F7931A"/>
        <text x="6" y="16" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="white">₿</text>
      </svg>
      {/* Tether */}
      <svg height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#26A17B"/>
        <text x="6" y="16" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="white">T</text>
      </svg>
    </div>
  );
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
