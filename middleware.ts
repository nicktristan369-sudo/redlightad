import { NextRequest, NextResponse } from "next/server"

// Paths that are always public (no password required)
const PUBLIC_PATHS = ["/unlock", "/api/unlock", "/_next", "/favicon"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for access cookie
  const unlocked = req.cookies.get("site_unlocked")?.value
  if (unlocked === "1") return NextResponse.next()

  // Redirect to unlock page
  const url = req.nextUrl.clone()
  url.pathname = "/unlock"
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
