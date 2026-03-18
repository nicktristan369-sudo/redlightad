import { NextRequest, NextResponse } from "next/server"

const SITE_PASSWORD = process.env.SITE_PASSWORD ?? "nick060403"

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (code !== SITE_PASSWORD) {
    return NextResponse.json({ error: "Forkert kode" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("site_unlocked", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dage
    path: "/",
  })
  return res
}
