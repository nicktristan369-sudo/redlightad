/**
 * Cloudflare Turnstile CAPTCHA verification
 * Server-side token validation
 */

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY!;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token server-side
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIP?: string
): Promise<TurnstileVerifyResult> {
  if (!TURNSTILE_SECRET) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    // In development, allow bypass
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    return { success: false, error: "CAPTCHA not configured" };
  }

  if (!token) {
    return { success: false, error: "Missing CAPTCHA token" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET);
    formData.append("response", token);
    if (remoteIP) {
      formData.append("remoteip", remoteIP);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        challenge_ts: result.challenge_ts,
        hostname: result.hostname,
      };
    } else {
      return {
        success: false,
        error: result["error-codes"]?.join(", ") || "Verification failed",
      };
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Verification request failed" };
  }
}
