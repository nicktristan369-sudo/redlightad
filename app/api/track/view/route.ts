import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// POST - Track a profile view
export async function POST(req: NextRequest) {
  try {
    const { listing_id } = await req.json();

    if (!listing_id) {
      return NextResponse.json({ error: "listing_id required" }, { status: 400 });
    }

    const db = getClient();

    // Get viewer info (optional - could be anonymous)
    let viewerId: string | null = null;
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    
    if (token) {
      const { data: { user } } = await db.auth.getUser(token);
      viewerId = user?.id || null;
    }

    // Get IP and user agent for deduplication
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    // Check for recent view from same IP (prevent spam, 1 hour cooldown)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentView } = await db
      .from("profile_views")
      .select("id")
      .eq("listing_id", listing_id)
      .eq("ip_address", ip)
      .gte("viewed_at", oneHourAgo)
      .maybeSingle();

    if (recentView) {
      // Already counted this view recently
      return NextResponse.json({ success: true, deduplicated: true });
    }

    // Record the view
    await db.from("profile_views").insert({
      listing_id,
      viewer_id: viewerId,
      ip_address: ip,
      user_agent: userAgent.slice(0, 500), // Truncate long user agents
      viewed_at: new Date().toISOString(),
    });

    // Also increment view count on listing (for quick access)
    await db.rpc("increment_listing_views", { lid: listing_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Track View] Error:", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
