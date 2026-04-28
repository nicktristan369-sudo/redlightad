/**
 * Payment brand logos — pixel-accurate SVG recreations.
 * Optimized for dark backgrounds at h-6 (24px).
 */

// ─── Visa — blue wordmark ─────────────────────────────────────────────────────
export function VisaIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 80 26" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <path fill="#1A1F71" d="M35.3 1.7L23.7 24.3H16L10.4 7.4c-.3-1.2-.6-1.7-1.7-2.2C7 4.2 4 3.4 1.5 2.9L1.7 1.7h12.7c1.6 0 3.1 1.1 3.5 3l3.2 17L28.5 1.7h6.8zm26.9 15.1c0-6.6-9.1-7-9-9.4 0-.9.9-1.8 2.7-2 1.3-.2 4.9.2 6.3 1.1L63.4 1.7c-1.6-.6-3.6-1.2-6.1-1.2-6.5 0-11 3.5-11.1 8.4-.1 3.7 3.3 5.7 5.8 6.9 2.6 1.3 3.4 2.1 3.4 3.2-.1 1.7-2.1 2.5-3.9 2.5-3.3.1-5.2-.9-6.7-1.6L43.4 25c1.5.7 4.4 1.3 7.3 1.3 6.9.1 11.5-3.4 11.5-8.5zm17 7.5H85L80.2 1.7H74.6c-1.5 0-2.7.9-3.2 2.2L62.7 24.3h6.9l1.4-3.8h8.4l.8 3.8zm-7.3-9l3.5-9.5 2 9.5h-5.5zM44.9 1.7L39.3 24.3h-6.6L38.3 1.7h6.6z"/>
    </svg>
  );
}

// ─── Mastercard — red/orange circles ─────────────────────────────────────────
export function MastercardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 50 32" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <circle cx="18" cy="16" r="14" fill="#EB001B"/>
      <circle cx="32" cy="16" r="14" fill="#F79E1B"/>
      <path fill="#FF5F00" d="M25 4.8a14 14 0 0 1 0 22.4A14 14 0 0 1 25 4.8z"/>
    </svg>
  );
}

// ─── PayPal — official white PNG (horizontal one color) ─────────────────────
export function PayPalIcon({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/pay/paypal-white.png" alt="PayPal" height={22} className={className} style={{ objectFit: "contain" }} />;
}

// ─── Revolut Pay — R logo + "Pay" wordmark ────────────────────────────────────
export function RevolutIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 90 32" xmlns="http://www.w3.org/2000/svg" aria-label="Revolut Pay">
      <rect width="90" height="32" rx="6" fill="white"/>
      {/* R icon */}
      <path fill="#191C1F" d="M12 8h7c3 0 4.8 1.6 4.8 4.2 0 1.9-.9 3.3-2.4 4l2.6 4.8H20l-2.4-4.4H15V21h-3V8zm3 6h3.8c1.2 0 1.9-.6 1.9-1.7 0-1.1-.7-1.7-1.9-1.7H15v3.4z"/>
      {/* "Pay" text */}
      <path fill="#191C1F" d="M31 21V8h5.5c3 0 4.7 1.5 4.7 4 0 2.6-1.8 4.1-4.8 4.1H34V21h-3zm3-7h2.3c1.3 0 2-.6 2-1.9s-.7-1.9-2-1.9H34v3.8z"/>
      <path fill="#191C1F" d="M46 21l-4.8-13h3.2l3.1 9.4 3.1-9.4H54L49.2 21H46z"/>
      <path fill="#191C1F" d="M55 21V8h9.5v2.4H58v2.9h6v2.4h-6v2.9h6.5V21H55z"/>
    </svg>
  );
}

// ─── N26 — white wordmark ─────────────────────────────────────────────────────
export function N26Icon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 60 22" xmlns="http://www.w3.org/2000/svg" aria-label="N26">
      <path fill="white" d="M0 0h5.5L16 14V0h5.5v22H16L5.5 8V22H0V0z"/>
      <path fill="white" d="M26 22V0h5.5v22H26z"/>
      <path fill="white" d="M35 11c0-6.4 4.7-11 11.5-11 3.3 0 6 1.2 7.8 3.2l-3.5 3.2c-1-.9-2.5-1.5-4.1-1.5-3.2 0-5.5 2.3-5.5 6 0 3.6 2.3 6 5.5 6 1.4 0 2.5-.4 3.3-1.1V14h-4v-4h9.5v7.5C53.3 19.8 50.2 22 46.5 22 39.7 22 35 17.4 35 11z"/>
    </svg>
  );
}

// ─── Wise — green wordmark ───────────────────────────────────────────────────
export function WiseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 72 22" xmlns="http://www.w3.org/2000/svg" aria-label="Wise">
      <path fill="#9FE870" d="M0 3h5l5 14.5L14.5 3H19l4.5 14.5L28 3h5L26 22h-5l-4-13-4 13h-5L0 3z"/>
      <path fill="#9FE870" d="M35 3h5v19h-5V3z"/>
      <path fill="#9FE870" d="M43 3h14.5c3.5 0 5.5 1.8 5.5 4.7 0 1.9-1 3.2-2.5 3.9 1.8.7 3 2.2 3 4.4 0 3.3-2.3 5.5-5.8 5.5H43V3zm5 7h8.2c1 0 1.6-.5 1.6-1.5 0-.9-.6-1.5-1.6-1.5H48v3zm0 8.5h8.5c1.1 0 1.8-.6 1.8-1.6s-.7-1.6-1.8-1.6H48v3.2z"/>
    </svg>
  );
}

// ─── Paysafecard — exact brand logo ──────────────────────────────────────────
export function PaysafecardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="26" viewBox="0 0 160 30" xmlns="http://www.w3.org/2000/svg" aria-label="paysafecard">
      {/* Red padlock icon */}
      <rect x="3" y="13" width="14" height="12" rx="1.5" fill="#E2001A"/>
      <path d="M6 13v-3.5a4 4 0 0 1 8 0V13" stroke="#E2001A" strokeWidth="2.5" fill="none"/>
      {/* "paysafe" in blue */}
      <text x="21" y="23" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="13" fontWeight="800" fill="#009EE2" letterSpacing="-0.2">paysafe</text>
      {/* "card" in blue lighter */}
      <text x="88" y="23" fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fontSize="13" fontWeight="800" fill="#009EE2" letterSpacing="-0.2">card</text>
    </svg>
  );
}

// ─── Bitcoin ──────────────────────────────────────────────────────────────────
export function BitcoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Bitcoin">
      <circle cx="12" cy="12" r="12" fill="#F7931A"/>
      <path fill="white" d="M16.7 10.3c.2-1.5-.9-2.3-2.5-2.8l.5-2-1.3-.3-.5 2-.9-.2.5-2-1.3-.3-.5 2-2.3-.6-.3 1.4.9.2c.5.1.6.4.5.7L8 14.6c-.1.2-.3.5-.8.4l-.9-.2-.6 1.4 2.2.5.4.1-.5 2.1 1.3.3.5-2.1 1 .2-.5 2 1.3.3.5-2.1c2 .4 3.5.2 4.2-1.6.5-1.4 0-2.2-1.1-2.7.7-.1 1.2-.7 1.3-1.6zm-2.4 3.3c-.4 1.5-2.8.7-3.6.5l.6-2.6c.8.2 3.3.6 3 2.1zm.4-3.3c-.3 1.3-2.4.7-3 .5l.6-2.3c.6.2 2.7.5 2.4 1.8z"/>
    </svg>
  );
}

// ─── USDT / Tether ────────────────────────────────────────────────────────────
export function USDTIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="USDT">
      <circle cx="12" cy="12" r="12" fill="#26A17B"/>
      <path fill="white" d="M13.5 10.5V8.2h3.4V6.1H7.1v2.1h3.4v2.3C7.1 10.9 5 12 5 13.5c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5c0-1.5-2.1-2.6-5.5-3zm-1.5 4.5c-2.8 0-5-1-5-2.5s2.2-2.5 5-2.5 5 1.1 5 2.5-2.2 2.5-5 2.5z"/>
    </svg>
  );
}

// ─── Bank Transfer — bold lines + text ───────────────────────────────────────
export function BankIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="26" viewBox="0 0 110 30" xmlns="http://www.w3.org/2000/svg" aria-label="Bank Transfer">
      <rect width="110" height="30" rx="5" fill="#E8E8E8"/>
      {/* Three horizontal lines */}
      <rect x="6" y="8" width="16" height="3.5" rx="1" fill="#111"/>
      <rect x="6" y="13.5" width="16" height="3.5" rx="1" fill="#111"/>
      <rect x="6" y="19" width="16" height="3.5" rx="1" fill="#111"/>
      {/* BANK TRANSFER text */}
      <text x="27" y="14" fontFamily="Arial Black, Arial, sans-serif" fontSize="8.5" fontWeight="900" fill="#111" letterSpacing="0.3">BANK</text>
      <text x="27" y="24" fontFamily="Arial Black, Arial, sans-serif" fontSize="8.5" fontWeight="900" fill="#111" letterSpacing="0.3">TRANSFER</text>
    </svg>
  );
}
