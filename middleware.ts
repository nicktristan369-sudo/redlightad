import { NextRequest, NextResponse } from "next/server"

// Paths that are always public (no password required)
const PUBLIC_PATHS = ["/unlock", "/api/", "/_next", "/favicon"]

// Admin email — kun denne bruger må tilgå /admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tristan369@protonmail.com"

// Paths to skip tracking
const SKIP_TRACKING = ["/api/", "/_next/", "/admin/", "/favicon.ico", "/opengraph-image"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for access cookie
  const unlocked = req.cookies.get("site_unlocked")?.value
  if (unlocked !== "1") {
    const url = req.nextUrl.clone()
    url.pathname = "/unlock"
    return NextResponse.redirect(url)
  }

  // Beskyt /admin — tjek admin cookie sat ved login
  if (pathname.startsWith("/admin")) {
    const adminSession = req.cookies.get("admin_verified")?.value
    if (adminSession !== ADMIN_EMAIL) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
  }

  // --- Traffic tracking ---
  const response = NextResponse.next()

  if (!SKIP_TRACKING.some(p => pathname.startsWith(p))) {
    // Ensure session cookie
    let sessionId = req.cookies.get("rlad_sid")?.value
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      response.cookies.set("rlad_sid", sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    // Fire-and-forget tracking call
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
    try {
      fetch(`${siteUrl}/api/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: req.headers.get("referer") || null,
          user_agent: req.headers.get("user-agent") || null,
          session_id: sessionId,
        }),
      }).catch(() => {})
    } catch {
      // Never block page delivery
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
