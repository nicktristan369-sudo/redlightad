"use client";

import { Turnstile } from "@marsidev/react-turnstile";

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

  if (!siteKey) {
    // No site key - auto-verify and return nothing visible
    // This makes CAPTCHA optional when not configured
    if (typeof window !== 'undefined') {
      setTimeout(() => onVerify('no-captcha-configured'), 100);
    }
    return null;
  }

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
}
