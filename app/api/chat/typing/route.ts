import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// POST - Broadcast typing status
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getClient();
  const { data: { user }, error: authErr } = await db.auth.getUser(token);

  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { conversation_id, is_typing } = await req.json();

  if (!conversation_id) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  // Verify user is part of this conversation
  const { data: conv } = await db
    .from("conversations")
    .select("provider_id, customer_id")
    .eq("id", conversation_id)
    .single();

  if (!conv || (conv.provider_id !== user.id && conv.customer_id !== user.id)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Broadcast typing status via Supabase Realtime
  // We use the presence feature by updating a temp record
  // For now, we'll use a simple approach - store in a typing_status table
  
  await db
    .from("typing_status")
    .upsert({
      conversation_id,
      user_id: user.id,
      is_typing: is_typing ?? true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "conversation_id,user_id",
    });

  return NextResponse.json({ success: true });
}
