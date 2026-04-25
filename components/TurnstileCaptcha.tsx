"use client";

// import { Turnstile } from "@marsidev/react-turnstile"; // Temporarily disabled

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

/**
 * Cloudflare Turnstile CAPTCHA component
 * Privacy-friendly alternative to reCAPTCHA
 */
export default function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  theme = "dark",
  size = "normal",
}: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // TEMPORARILY DISABLED - Turnstile is causing signup issues
  // Auto-verify to allow signup to proceed
  if (typeof window !== 'undefined') {
    setTimeout(() => onVerify('captcha-disabled-temporary'), 100);
  }
  return null;
  
  /* Original code - re-enable when Turnstile is fixed
  if (!siteKey) {
    // No site key - auto-verify and return nothing visible
    if (typeof window !== 'undefined') {
      setTimeout(() => onVerify('no-captcha-configured'), 100);
    }
    return null;
  }
  */

  /* Original component - disabled
  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme,
        size,
      }}
    />
  );
  */
}
