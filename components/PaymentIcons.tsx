/**
 * Payment brand logos — styled to match Faphouse design:
 * White/brand-colored logos on dark background, all h-6 (24px).
 */

// ─── Visa ─────────────────────────────────────────────────────────────────────
export function VisaIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <path fill="#fff" d="M22.8 1.6l-4.2 16.8h-4.3L18.5 1.6h4.3zm18 10.9c0-4.2-5.8-4.4-5.8-6.3 0-.6.6-1.2 1.7-1.4 1.9-.2 3.8.5 4.9 1l.9-4.2A13 13 0 0038 1c-4.8 0-8.2 2.5-8.2 6.2 0 2.7 2.4 4.2 4.3 5.1 1.9.9 2.5 1.5 2.5 2.3 0 1.2-1.5 1.8-2.9 1.8-2.4 0-3.8-.6-5-1.2l-.9 4.1c1.1.5 3.2 1 5.4 1 5.1 0 8.5-2.5 8.5-6.8zm12.7 5.9H58L54 1.6h-3.8c-1 0-1.8.5-2.2 1.4L41 18.4h5.1l1-2.8h6.2l.6 2.8zM48.4 12l2.5-7 1.5 7h-4zm-20.5-10.4l-5.1 16.8H18l-4-13.3c-.2-.9-.4-1.3-1.2-1.7C11.5 3 9.6 2.5 8 2.2l.1-.6h8.3c1 0 1.9.7 2.2 1.9l2 10.8 5-12.7h4.3z"/>
    </svg>
  );
}

// ─── Mastercard ───────────────────────────────────────────────────────────────
export function MastercardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 50 32" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <circle cx="18" cy="16" r="14" fill="#EB001B"/>
      <circle cx="32" cy="16" r="14" fill="#F79E1B"/>
      <path fill="#FF5F00" d="M25 4.9a14 14 0 000 22.2A14 14 0 0025 4.9z"/>
    </svg>
  );
}

// ─── PayPal ───────────────────────────────────────────────────────────────────
export function PayPalIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="22" viewBox="0 0 86 24" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal">
      <path fill="#009CDE" d="M9.3 22.5H5.5L8 8h3.8L9.3 22.5zM29.6 8.3c-.8-.3-2-.6-3.5-.6-3.8 0-6.5 2-6.5 4.8 0 2.1 1.9 3.2 3.3 3.9 1.4.7 1.9 1.2 1.9 1.8 0 1-1.2 1.4-2.3 1.4-1.5 0-2.4-.2-3.6-.8l-.5-.2-.5 3.2c.9.4 2.5.8 4.2.8 4 0 6.6-2 6.6-5-.1-1.6-1-2.9-3.2-3.9-1.3-.7-2.1-1.1-2.1-1.8 0-.6.7-1.2 2.2-1.2 1.2 0 2.1.3 2.8.5l.3.2.9-3.1zM39.5 8h-3c-.9 0-1.6.3-2 1.2L28.6 22.5h4s.7-1.8.8-2.2h4.9c.1.5.5 2.2.5 2.2h3.5L39.5 8zm-4.7 9.4c.3-.8 1.5-4.1 1.5-4.1s.3-.9.5-1.4l.3 1.3s.7 3.5.9 4.2h-3.2zM5.4 8L1.7 17.8l-.4-2C.6 13.6-1 10.9-2.8 9.3L.6 22.5H4.7L11 8H5.4z"/>
      <path fill="#003087" d="M-0.7 8H-7l-.1.3C-2 9.6 1.3 13.3 2.6 17.5L1.3 9.3C1 8.4.3 8.1-.7 8z"/>
    </svg>
  );
}

// ─── Revolut ──────────────────────────────────────────────────────────────────
export function RevolutIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 100 24" xmlns="http://www.w3.org/2000/svg" aria-label="Revolut">
      <path fill="#fff" d="M0 0h8.4C13.8 0 17 2.9 17 7.8c0 3.1-1.4 5.4-3.8 6.5L17.5 22H8.9L5.6 15H5.4V22H0V0zm5.4 11.2h2.3c2.1 0 3.3-1.1 3.3-3.2 0-2-1.2-3-3.3-3H5.4v6.2zM21.5 0H27v22h-5.5V0zm11.3 0h5.8l4.7 13.7L47.9 0h5.5L46.2 22h-5.7L32.8 0zm17.8 0h15.1v4.7H55.9v4h10.1V13H55.9v4.3h9.8V22H50.6V0zm18.2 0h5.5v17.3H84v4.7H68.8V0zM85.5 11c0-6.4 4.7-11.3 11.5-11 6.7 0 11.4 4.9 11.4 11.3C108.4 17.5 103.5 22 96.8 22c-6.5 0-11.3-4.5-11.3-11zm5.6.1c0 3.6 2.4 6.3 5.8 6.3 3.4 0 5.8-2.7 5.8-6.2 0-3.6-2.4-6.3-5.8-6.3-3.3 0-5.8 2.7-5.8 6.2z"/>
    </svg>
  );
}

// ─── N26 ──────────────────────────────────────────────────────────────────────
export function N26Icon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 70 24" xmlns="http://www.w3.org/2000/svg" aria-label="N26">
      <path fill="#fff" d="M0 0h5.6L16.3 14V0H22v22H16.4L5.7 8V22H0V0zm27 22V0h5.6v22H27zm9-22h14.4c3.4 0 5.5 1.8 5.5 4.7 0 1.9-.9 3.3-2.4 4.1 1.8.7 3 2.3 3 4.4 0 3.3-2.3 5.4-5.8 5.4H36V0zm5.6 7.6h7.7c.9 0 1.5-.5 1.5-1.4s-.6-1.4-1.5-1.4h-7.7v2.8zm0 9.6h8.2c1.1 0 1.7-.6 1.7-1.6s-.6-1.6-1.7-1.6h-8.2v3.2z"/>
    </svg>
  );
}

// ─── Wise ─────────────────────────────────────────────────────────────────────
export function WiseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="20" viewBox="0 0 80 24" xmlns="http://www.w3.org/2000/svg" aria-label="Wise">
      <path fill="#9FE870" d="M0 3.6h4.8L9.6 18 14 3.6h4.4l4.3 14.4 4.8-14.4H32L24.2 24h-4.7l-4.2-13.6L11.1 24H6.4L0 3.6zM35.5 3.6h5.3V24h-5.3V3.6zm8.5 0h14.7c3.7 0 5.6 1.8 5.6 4.7 0 1.9-.9 3.2-2.4 3.9 1.8.7 3 2.2 3 4.3 0 3.4-2.3 5.5-5.9 5.5H44V3.6zm5.3 7h8c1 0 1.6-.5 1.6-1.5 0-.9-.6-1.5-1.6-1.5H49.3v3zm0 9.4h8.3c1.1 0 1.8-.6 1.8-1.6s-.7-1.6-1.8-1.6H49.3v3.2zm17-16.4h5.3V24h-5.3V3.6z"/>
    </svg>
  );
}

// ─── Paysafecard ──────────────────────────────────────────────────────────────
export function PaysafecardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="22" viewBox="0 0 130 26" xmlns="http://www.w3.org/2000/svg" aria-label="Paysafecard">
      <rect width="130" height="26" rx="4" fill="#003082"/>
      <text x="8" y="18" fontFamily="Arial Black, Arial, sans-serif" fontSize="12" fontWeight="900" fill="white" letterSpacing="-0.3">paysafe</text>
      <text x="72" y="18" fontFamily="Arial Black, Arial, sans-serif" fontSize="12" fontWeight="900" fill="#00a0e0" letterSpacing="-0.3">card</text>
    </svg>
  );
}

// ─── Bitcoin ──────────────────────────────────────────────────────────────────
export function BitcoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Bitcoin">
      <circle cx="12" cy="12" r="12" fill="#F7931A"/>
      <path fill="#fff" d="M16.7 10.3c.2-1.5-.9-2.3-2.5-2.8l.5-2-1.3-.3-.5 2-.9-.2.5-2-1.3-.3-.5 2-2.3-.6-.3 1.4.9.2c.5.1.6.4.5.7L8 14.6c-.1.2-.3.5-.8.4l-.9-.2-.6 1.4 2.2.5.4.1-.5 2.1 1.3.3.5-2.1 1 .2-.5 2 1.3.3.5-2.1c2 .4 3.5.2 4.2-1.6.5-1.4 0-2.2-1.1-2.7.7-.1 1.2-.7 1.3-1.6zm-2.4 3.3c-.4 1.5-2.8.7-3.6.5l.6-2.6c.8.2 3.3.6 3 2.1zm.4-3.3c-.3 1.3-2.4.7-3 .5l.6-2.3c.6.2 2.7.5 2.4 1.8z"/>
    </svg>
  );
}

// ─── USDT / Tether ────────────────────────────────────────────────────────────
export function USDTIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="USDT">
      <circle cx="12" cy="12" r="12" fill="#26A17B"/>
      <path fill="#fff" d="M13.5 10.5V8.2h3.4V6.1H7.1v2.1h3.4v2.3C7.1 10.9 5 12 5 13.5c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5c0-1.5-2.1-2.6-5.5-3zm-1.5 4.5c-2.8 0-5-1-5-2.5s2.2-2.5 5-2.5 5 1.1 5 2.5-2.2 2.5-5 2.5z"/>
    </svg>
  );
}

// ─── Instant Bank Transfer ────────────────────────────────────────────────────
export function BankIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="22" viewBox="0 0 80 24" xmlns="http://www.w3.org/2000/svg" aria-label="Instant Bank Transfer">
      <rect width="80" height="24" rx="4" fill="#0065FF"/>
      <path fill="#fff" d="M7 6l6-3 6 3v1.5H7V6zm1 2h10v8H8V8zm2 1.5v5h2v-5h-2zm4 0v5h2v-5h-2zM6.5 17h11v1.5h-11z" transform="scale(0.9) translate(1,1)"/>
      <text x="23" y="10" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="700" fill="white">INSTANT</text>
      <text x="23" y="18" fontFamily="Arial, sans-serif" fontSize="6.5" fontWeight="700" fill="rgba(255,255,255,0.8)">BANK TRANSFER</text>
    </svg>
  );
}
