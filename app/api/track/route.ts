import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, user_agent, session_id, user_id } = body;

    if (!path) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    await db().from("page_views").insert({
      path,
      referrer: referrer || null,
      user_agent: user_agent || null,
      session_id: session_id || null,
      user_id: user_id || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
