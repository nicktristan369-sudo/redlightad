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
    // In development without key, show placeholder
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded p-4 text-center text-sm text-zinc-400">
          CAPTCHA disabled in development
          <button
            type="button"
            onClick={() => onVerify("dev-bypass-token")}
            className="block mx-auto mt-2 text-red-500 underline"
          >
            Bypass for testing
          </button>
        </div>
      );
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
