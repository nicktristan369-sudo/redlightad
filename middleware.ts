import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

export const config = {
  matcher: ["/admin/:path*"],
};

const COOKIE_NAME = "admin_session";
const SESSION_SECONDS = 8 * 60 * 60; // 8h inactivity window

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET not configured");
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page through
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret());

    // Must have admin role
    if (payload.role !== "admin") {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }

    // Slide session: re-sign with new expiry on every request
    const refreshed = await new SignJWT({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_SECONDS}s`)
      .sign(secret());

    const res = NextResponse.next();
    res.cookies.set(COOKIE_NAME, refreshed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_SECONDS,
      path: "/",
    });
    return res;
  } catch {
    // Invalid or expired token — redirect silently
    const res = NextResponse.redirect(new URL("/admin/login", req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}
