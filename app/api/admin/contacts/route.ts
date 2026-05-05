import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    const supabase = getClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    // Check admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all listings with contact info
    const { data: listings, error } = await supabase
      .from("listings")
      .select(`
        id,
        user_id,
        display_name,
        profile_image,
        phone,
        whatsapp,
        telegram,
        city,
        country,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    // Get emails from auth users
    const userIds = [...new Set(listings?.map(l => l.user_id).filter(Boolean) || [])];
    
    // Fetch user emails
    const { data: users } = await supabase.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    users?.users?.forEach(u => {
      if (u.email) emailMap[u.id] = u.email;
    });

    // Combine data
    const contacts = (listings || []).map(l => ({
      id: l.id,
      listing_id: l.id,
      display_name: l.display_name,
      profile_image: l.profile_image,
      email: l.user_id ? emailMap[l.user_id] : null,
      phone: l.phone,
      whatsapp: l.whatsapp,
      telegram: l.telegram,
      city: l.city,
      country: l.country,
      created_at: l.created_at,
    }));

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error("Contacts API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
