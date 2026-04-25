"use client";

import { Turnstile } from "@marsidev/react-turnstile";

/**
 * Props for TurnstileCaptcha component
 * onVerify: Called when CAPTCHA succeeds or is skipped
 * onError: Optional callback for CAPTCHA errors (signup still proceeds)
 * onExpire: Optional callback for CAPTCHA expiry
 * theme: Visual theme (light/dark/auto)
 * size: Widget size (normal/compact)
 */
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
 * 
 * CAPTCHA is optional with graceful degradation:
 * - If no site key configured: auto-verifies
 * - If CAPTCHA fails: still allows signup (won't block users)
 * - Rate limiting + other security measures should be used instead
 */
export default function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  theme = "dark",
  size = "normal",
}: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // CAPTCHA is optional - if not configured, auto-verify
  // If configured but fails, still allow signup (graceful degradation)
  if (!siteKey) {
    // No site key configured - auto-verify
    if (typeof window !== 'undefined') {
      setTimeout(() => onVerify('no-captcha-configured'), 100);
    }
    return null;
  }
  


  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onError={(errCode) => {
        // Gracefully handle CAPTCHA errors - still allow signup
        console.warn('CAPTCHA error:', errCode);
        // Auto-verify anyway for better UX
        onVerify(`captcha-error-${errCode}`);
        if (onError) onError();
      }}
      onExpire={onExpire}
      options={{
        theme,
        size,
      }}
    />
  );
}
