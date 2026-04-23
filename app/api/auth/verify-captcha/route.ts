import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { authRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per minute
  const ip = getClientIP(req);
  const { success: rateLimitOk } = await authRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please wait." },
      { status: 429 }
    );
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing CAPTCHA token" },
        { status: 400 }
      );
    }

    const result = await verifyTurnstileToken(token, ip);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
