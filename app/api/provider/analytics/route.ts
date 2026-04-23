import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Get user's listings
  const { data: listings } = await db
    .from("listings")
    .select("id, title, profile_image, status, created_at, premium_tier")
    .eq("user_id", user.id);

  if (!listings || listings.length === 0) {
    return NextResponse.json({
      totalViews: 0,
      totalMessages: 0,
      totalConversations: 0,
      viewsChange: 0,
      messagesChange: 0,
      listings: [],
      viewsByDay: [],
      messagesByDay: [],
    });
  }

  const listingIds = listings.map(l => l.id);

  // Get profile views for this period
  const { data: views, count: totalViews } = await db
    .from("profile_views")
    .select("*", { count: "exact" })
    .in("listing_id", listingIds)
    .gte("viewed_at", startDateStr);

  // Get views from previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const { count: prevViews } = await db
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .in("listing_id", listingIds)
    .gte("viewed_at", prevStartDate.toISOString())
    .lt("viewed_at", startDateStr);

  // Get conversations
  const { data: conversations, count: totalConversations } = await db
    .from("conversations")
    .select("id, created_at, listing_id", { count: "exact" })
    .in("provider_id", [user.id])
    .gte("created_at", startDateStr);

  // Get messages received
  const { data: messages, count: totalMessages } = await db
    .from("messages")
    .select("id, created_at, conversation_id", { count: "exact" })
    .neq("sender_id", user.id)
    .gte("created_at", startDateStr);

  // Filter messages to only those in user's conversations
  const { data: userConvs } = await db
    .from("conversations")
    .select("id")
    .eq("provider_id", user.id);
  
  const userConvIds = new Set((userConvs || []).map(c => c.id));
  const filteredMessages = (messages || []).filter(m => userConvIds.has(m.conversation_id));

  // Get previous period messages for comparison
  const { data: prevMessages } = await db
    .from("messages")
    .select("id, conversation_id")
    .neq("sender_id", user.id)
    .gte("created_at", prevStartDate.toISOString())
    .lt("created_at", startDateStr);
  
  const filteredPrevMessages = (prevMessages || []).filter(m => userConvIds.has(m.conversation_id));

  // Calculate views by day
  const viewsByDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    viewsByDay[key] = 0;
  }
  
  for (const v of views || []) {
    const key = v.viewed_at.split("T")[0];
    if (viewsByDay[key] !== undefined) {
      viewsByDay[key]++;
    }
  }

  // Calculate messages by day
  const messagesByDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    messagesByDay[key] = 0;
  }
  
  for (const m of filteredMessages) {
    const key = m.created_at.split("T")[0];
    if (messagesByDay[key] !== undefined) {
      messagesByDay[key]++;
    }
  }

  // Calculate per-listing stats
  const listingStats = listings.map(listing => {
    const listingViews = (views || []).filter(v => v.listing_id === listing.id).length;
    const listingConvs = (conversations || []).filter(c => c.listing_id === listing.id).length;
    
    return {
      id: listing.id,
      title: listing.title,
      profile_image: listing.profile_image,
      status: listing.status,
      premium_tier: listing.premium_tier,
      views: listingViews,
      conversations: listingConvs,
    };
  });

  // Calculate percentage changes
  const viewsChange = prevViews && prevViews > 0 
    ? Math.round(((totalViews || 0) - prevViews) / prevViews * 100) 
    : 0;
  
  const messagesChange = filteredPrevMessages.length > 0
    ? Math.round((filteredMessages.length - filteredPrevMessages.length) / filteredPrevMessages.length * 100)
    : 0;

  return NextResponse.json({
    totalViews: totalViews || 0,
    totalMessages: filteredMessages.length,
    totalConversations: totalConversations || 0,
    viewsChange,
    messagesChange,
    listings: listingStats,
    viewsByDay: Object.entries(viewsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    messagesByDay: Object.entries(messagesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
}
