import { NextRequest, NextResponse } from "next/server"

// ── Site lock cache (60 sek TTL) ─────────────────────────────────────────────
let lockCache: { enabled: boolean; ts: number } | null = null
const LOCK_CACHE_TTL = 60_000

async function isSiteLocked(): Promise<boolean> {
  const now = Date.now()
  if (lockCache && now - lockCache.ts < LOCK_CACHE_TTL) return lockCache.enabled
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const res = await fetch(
      `${url}/rest/v1/site_settings?key=eq.site_lock_enabled&select=value&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 0 } }
    )
    const data = await res.json()
    const enabled = data?.[0]?.value === "true"
    lockCache = { enabled, ts: now }
    return enabled
  } catch {
    return lockCache?.enabled ?? false
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Paths that are always public (no password required)
const PUBLIC_PATHS = ["/unlock", "/api/", "/_next", "/favicon", "/maintenance"]

// Admin email — kun denne bruger må tilgå /admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tristan369@protonmail.com"

// Paths to skip tracking
const SKIP_TRACKING = ["/api/", "/_next/", "/admin/", "/favicon.ico", "/opengraph-image"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Site lock — styret fra admin panel ──────────────────────────────────
  const locked = await isSiteLocked()
  if (locked) {
    const unlocked = req.cookies.get("site_unlocked")?.value
    if (unlocked !== "1") {
      const url = req.nextUrl.clone()
      url.pathname = "/unlock"
      return NextResponse.redirect(url)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
