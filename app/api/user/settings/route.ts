import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// GET - fetch user settings
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = admin();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data: profile } = await db
    .from("profiles")
    .select("email_notifications")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    email_notifications: profile?.email_notifications ?? true,
  });
}

// POST - update user settings
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = admin();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow updating specific fields
  const updates: Record<string, unknown> = {};
  
  if (typeof body.email_notifications === "boolean") {
    updates.email_notifications = body.email_notifications;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid settings to update" }, { status: 400 });
  }

  const { error } = await db
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...updates });
}
