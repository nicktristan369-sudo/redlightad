export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

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

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Try to log the logout event
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      await getClient().from("admin_audit_log").insert({
        user_id: payload.sub,
        email: payload.email,
        ip,
        user_agent: req.headers.get("user-agent") ?? "",
        action: "logout",
      });
    } catch { /* session already invalid */ }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
