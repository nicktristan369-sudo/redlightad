export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
import { generateSecret, generateOTPAuthURL } from "@/lib/totp";

const COOKIE_NAME = "admin_session";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

function secret() {
  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);
}

// GET - Get current 2FA status or generate new secret for setup
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string;
    const email = payload.email as string;

    const db = getClient();

    // Check current 2FA status
    const { data: profile } = await db
      .from("profiles")
      .select("totp_secret, totp_enabled")
      .eq("id", userId)
      .single();

    if (profile?.totp_enabled) {
      return NextResponse.json({
        enabled: true,
        message: "2FA is already enabled",
      });
    }

    // Generate new secret for setup
    const newSecret = generateSecret();
    const otpauthUrl = generateOTPAuthURL(newSecret, email);

    // Store pending secret (not enabled yet until verified)
    await db
      .from("profiles")
      .update({ totp_secret: newSecret, totp_enabled: false })
      .eq("id", userId);

    return NextResponse.json({
      enabled: false,
      secret: newSecret,
      otpauthUrl,
      message: "Scan QR code with authenticator app, then verify with a code",
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}

// POST - Verify code and enable 2FA
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string;

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    const db = getClient();

    // Get pending secret
    const { data: profile } = await db
      .from("profiles")
      .select("totp_secret")
      .eq("id", userId)
      .single();

    if (!profile?.totp_secret) {
      return NextResponse.json({ error: "No pending 2FA setup" }, { status: 400 });
    }

    // Verify the code
    const { verifyTOTP } = await import("@/lib/totp");
    const isValid = verifyTOTP(profile.totp_secret, code);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Enable 2FA
    await db
      .from("profiles")
      .update({ totp_enabled: true })
      .eq("id", userId);

    // Log in audit
    await db.from("admin_audit_log").insert({
      user_id: userId,
      action: "2fa_enabled",
      detail: "TOTP 2FA enabled",
    });

    return NextResponse.json({ success: true, message: "2FA enabled successfully" });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}

// DELETE - Disable 2FA
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string;

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "Code required to disable 2FA" }, { status: 400 });
    }

    const db = getClient();

    // Get current secret
    const { data: profile } = await db
      .from("profiles")
      .select("totp_secret, totp_enabled")
      .eq("id", userId)
      .single();

    if (!profile?.totp_enabled || !profile.totp_secret) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
    }

    // Verify the code before disabling
    const { verifyTOTP } = await import("@/lib/totp");
    const isValid = verifyTOTP(profile.totp_secret, code);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Disable 2FA
    await db
      .from("profiles")
      .update({ totp_secret: null, totp_enabled: false })
      .eq("id", userId);

    // Log in audit
    await db.from("admin_audit_log").insert({
      user_id: userId,
      action: "2fa_disabled",
      detail: "TOTP 2FA disabled",
    });

    return NextResponse.json({ success: true, message: "2FA disabled" });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
