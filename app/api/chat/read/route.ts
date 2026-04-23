import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// POST - Mark messages as read
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

  const { conversation_id, message_ids } = await req.json();

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

  // Mark messages as read
  // Only mark messages that weren't sent by this user
  if (message_ids && message_ids.length > 0) {
    await db
      .from("messages")
      .update({ 
        read_at: new Date().toISOString(),
        read_by: user.id,
      })
      .in("id", message_ids)
      .neq("sender_id", user.id)
      .is("read_at", null);
  } else {
    // Mark all unread messages in conversation as read
    await db
      .from("messages")
      .update({ 
        read_at: new Date().toISOString(),
        read_by: user.id,
      })
      .eq("conversation_id", conversation_id)
      .neq("sender_id", user.id)
      .is("read_at", null);
  }

  // Also reset unread counter
  const unreadField = user.id === conv.provider_id ? "provider_unread" : "customer_unread";
  await db
    .from("conversations")
    .update({ [unreadField]: 0 })
    .eq("id", conversation_id);

  return NextResponse.json({ success: true });
}
