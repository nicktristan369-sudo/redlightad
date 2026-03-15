export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;
const SESSION_SECONDS = 8 * 60 * 60; // 8h
const COOKIE_NAME = "admin_session";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

function secret() {
  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Generic error — never reveal whether user exists or password is wrong
const INVALID_CREDS = { error: "Invalid credentials" };

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const ua = req.headers.get("user-agent") ?? "";
  const db = getClient();

  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
    password = body.password ?? "";
  } catch {
    return NextResponse.json(INVALID_CREDS, { status: 401 });
  }

  // ── Rate limit check ────────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000).toISOString();
  const { count: recentFails } = await db
    .from("admin_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("attempted_at", windowStart);

  if ((recentFails ?? 0) >= MAX_ATTEMPTS) {
    await db.from("admin_audit_log").insert({
      email,
      ip,
      user_agent: ua,
      action: "login_blocked",
      detail: `Rate limited after ${recentFails} failed attempts`,
    });
    // Return generic error — don't reveal rate limiting
    return NextResponse.json(INVALID_CREDS, { status: 401 });
  }

  // ── Supabase auth ───────────────────────────────────────────────────────
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Log failed attempt
    await db.from("admin_login_attempts").insert({ ip, success: false });
    await db.from("admin_audit_log").insert({
      email,
      ip,
      user_agent: ua,
      action: "login_failed",
      detail: authError?.message ?? "unknown",
    });
    return NextResponse.json(INVALID_CREDS, { status: 401 });
  }

  // ── Role check ──────────────────────────────────────────────────────────
  const { data: profile } = await db
    .from("profiles")
    .select("role, is_admin")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role !== "admin") {
    // Valid user, not an admin — log as failed, same generic error
    await db.from("admin_login_attempts").insert({ ip, success: false });
    await db.from("admin_audit_log").insert({
      user_id: authData.user.id,
      email,
      ip,
      user_agent: ua,
      action: "login_unauthorized",
      detail: `role=${profile?.role ?? "null"}`,
    });
    return NextResponse.json(INVALID_CREDS, { status: 401 });
  }

  // ── Success ─────────────────────────────────────────────────────────────
  // Clear failed attempts for this IP
  await db.from("admin_login_attempts").delete().eq("ip", ip).eq("success", false);

  // Log success
  await db.from("admin_login_attempts").insert({ ip, success: true });
  await db.from("admin_audit_log").insert({
    user_id: authData.user.id,
    email,
    ip,
    user_agent: ua,
    action: "login_success",
  });

  // Sign session JWT
  const token = await new SignJWT({
    sub: authData.user.id,
    email,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
  return res;
}
