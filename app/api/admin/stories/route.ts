import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.slice(7);
  const supabase = getClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  
  return profile?.is_admin ? user : null;
}

// GET: Fetch all stories (including expired for moderation)
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getClient();
    
    // Fetch all active stories with listing info
    const { data: stories, error } = await supabase
      .from("stories")
      .select(`
        id,
        listing_id,
        media_url,
        media_type,
        caption,
        views,
        created_at,
        expires_at,
        listings!inner (
          id,
          display_name,
          profile_image,
          city,
          country
        )
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
    }

    // Transform data
    const transformed = (stories || []).map(s => ({
      ...s,
      listing: s.listings,
    }));

    return NextResponse.json({ stories: transformed });
  } catch (err) {
    console.error("Admin stories API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a story
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing story ID" }, { status: 400 });
    }

    const supabase = getClient();
    
    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting story:", error);
      return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin stories delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
