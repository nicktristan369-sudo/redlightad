/**
 * Official payment brand logos as inline SVGs.
 * White/mono version for dark backgrounds.
 * All icons render at height=24px, preserving aspect ratio.
 */

export function VisaIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <path d="M31.8 0.9L20.7 25.1H13.4L7.9 6.4C7.6 5.2 7.3 4.8 6.3 4.2 4.7 3.3 2 2.5 0 2L0.2 0.9H12C13.6 0.9 15 2 15.4 3.8L18.2 18.3 25.5 0.9H31.8ZM57.2 17C57.2 10.8 48.7 10.4 48.8 7.6 48.8 6.8 49.5 5.9 51.1 5.7 51.9 5.6 54.1 5.5 56.6 6.7L57.7 1.5C56.2 0.9 54.3 0.4 51.9 0.4 46.1 0.4 41.9 3.4 41.9 7.9 41.9 11.2 44.8 13.1 47.1 14.2 49.4 15.3 50.2 16.1 50.2 17.2 50.2 18.9 48.2 19.7 46.3 19.7 43.5 19.7 41.8 18.9 40.5 18.3L39.4 23.7C40.7 24.3 43.2 24.8 45.8 24.8 52 24.8 56.1 21.8 57.2 17ZM72.7 25.1H78.3L73.4 0.9H68.3C66.9 0.9 65.7 1.7 65.2 2.9L56.3 25.1H62.5L63.7 21.7H71.3L72.7 25.1ZM65.5 16.8L68.5 8.2 70.2 16.8H65.5ZM40.1 0.9L34.9 25.1H29L34.2 0.9H40.1Z" fill="white"/>
    </svg>
  );
}

export function MastercardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <rect width="38" height="24" rx="3" fill="#252525"/>
      <circle cx="15" cy="12" r="7" fill="#EB001B"/>
      <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
      <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
    </svg>
  );
}

export function RevolutIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Revolut">
      <path d="M12.5 0H6v24h6.5v-8.6h2.6l4.3 8.6H26l-5-9.8C23.4 13 25 10.5 25 7.5 25 3.4 22 0 17.3 0H12.5zm0 10.4V5h4.3c1.8 0 2.9 1 2.9 2.6s-1 2.8-2.9 2.8h-4.3z" fill="white"/>
      <path d="M30 0v24h17v-5H36.5V0H30z" fill="white"/>
      <path d="M80 12c0 6.6-5.4 12-12 12S56 18.6 56 12 61.4 0 68 0s12 5.4 12 12zm-6.5 0c0-3-2.5-5.5-5.5-5.5S62.5 9 62.5 12s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5z" fill="white"/>
      <path d="M50.5 24c-4.7 0-8.5-3.8-8.5-8.5V0H48v15c0 1.5 1 2.5 2.5 2.5S53 16.5 53 15V0h6v15.5C59 20.2 55.2 24 50.5 24z" fill="white"/>
    </svg>
  );
}

export function N26Icon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="N26">
      <path d="M0 0h6.5l10 14.5V0H23v24h-6.5L6.5 9.5V24H0V0z" fill="white"/>
      <path d="M26 24l8-12-8-12h7l4.5 7 4.5-7h7l-8 12 8 12h-7l-4.5-7-4.5 7H26z" fill="white"/>
      <path d="M50 12.5C50 9 52.5 6.5 56 6.5c2 0 3.5.8 4.5 2l-3 2c-.5-.6-1-.9-1.5-.9-1.2 0-2 1-2 2.9s.8 2.9 2 2.9c.8 0 1.4-.4 1.8-1.1H55v-2h5.5c.1.4.1.9.1 1.3 0 3.3-2.2 5.5-5.6 5.5C52.5 18.5 50 16 50 12.5z" fill="white"/>
    </svg>
  );
}

export function WiseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Wise">
      <path d="M0 4l4 16h5L13 7l4 13h5l4-16h-5L18 17 14 4H9L5 17 1 4H0z" fill="#9FE870"/>
      <path d="M30 4h5v16h-5V4zM37 4h14c3.3 0 5 1.6 5 4.2 0 1.7-.8 3-2.1 3.7 1.6.6 2.6 2 2.6 3.9C56.5 18.5 54.5 20 51 20H37V4zm5 6.5h7.5c1 0 1.6-.5 1.6-1.4S50.5 7.5 49.5 7.5H42v3zm0 6h8c1.1 0 1.7-.6 1.7-1.5s-.6-1.5-1.7-1.5H42v3z" fill="#9FE870"/>
    </svg>
  );
}

export function PaysafecardIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Paysafecard">
      <rect width="100" height="24" rx="3" fill="#003082"/>
      <text x="7" y="17" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="white">paysafe</text>
      <text x="56" y="17" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#00a0e0">card</text>
    </svg>
  );
}

export function BitcoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Bitcoin">
      <circle cx="12" cy="12" r="12" fill="#F7931A"/>
      <path d="M16.7 10.3c.2-1.5-.9-2.3-2.5-2.8l.5-2-1.2-.3-.5 2-.9-.2.5-2-1.2-.3-.5 2-2.3-.6-.3 1.3s.9.2.9.3c.5.1.5.4.5.6l-1.3 5.2c-.1.2-.3.5-.7.4-.1 0-.9-.2-.9-.2l-.6 1.4 2.2.5.4.1-.5 2.1 1.2.3.5-2.1.9.2-.5 2 1.2.3.5-2c2 .4 3.5.2 4.1-1.6.5-1.4 0-2.2-1-2.7.7-.2 1.2-.7 1.3-1.7zm-2.3 3.2c-.4 1.5-2.8.7-3.6.5l.6-2.6c.8.2 3.4.6 3 2.1zm.4-3.2c-.3 1.3-2.4.7-3 .5l.6-2.3c.6.2 2.7.5 2.4 1.8z" fill="white"/>
    </svg>
  );
}

export function USDTIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="USDT Tether">
      <circle cx="12" cy="12" r="12" fill="#26A17B"/>
      <path d="M13.5 10.5V8h3.5V6H7V8h3.5v2.5C7 11 5 12 5 13.5c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5c0-1.5-2-2.5-5.5-3zm-1.5 4.5c-2.8 0-5-1-5-2.5s2.2-2.5 5-2.5 5 1 5 2.5-2.2 2.5-5 2.5z" fill="white"/>
    </svg>
  );
}

export function BankTransferIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Instant Bank Transfer">
      <rect width="60" height="24" rx="3" fill="#0070f3"/>
      <path d="M8 7l7-4 7 4v1H8V7zM9 9h12v8H9V9zm2 2v4h2v-4h-2zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2zM7 18h16v2H7v-2z" fill="white" transform="scale(0.85) translate(2,1)"/>
      <text x="24" y="15" fontFamily="Arial, sans-serif" fontSize="7.5" fontWeight="700" fill="white">INSTANT</text>
      <text x="24" y="23" fontFamily="Arial, sans-serif" fontSize="7" fill="rgba(255,255,255,0.7)">BANK</text>
    </svg>
  );
}
