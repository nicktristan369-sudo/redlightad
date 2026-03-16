import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/* ─── GET: list all active users ─── */
export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, account_type, country, is_admin, is_banned, is_verified, phone, phone_verified, whatsapp, avatar_url, subscription_tier, created_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ─── POST: mutate a user ─── */
type Action = "ban" | "unban" | "verify" | "delete" | "set_premium";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { userId: string; action: Action; tier?: string | null };
    const { userId, action, tier } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    const supabase = getClient();

    switch (action) {
      case "ban":
        await supabase.from("profiles").update({ is_banned: true  }).eq("id", userId);
        return NextResponse.json({ success: true });

      case "unban":
        await supabase.from("profiles").update({ is_banned: false }).eq("id", userId);
        return NextResponse.json({ success: true });

      case "verify":
        await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
        return NextResponse.json({ success: true });

      case "delete": {
        // 1. Fetch user data before deletion for archive
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, whatsapp, country, account_type, subscription_tier, is_verified, avatar_url, created_at")
          .eq("id", userId)
          .single();

        if (profile) {
          // 2. Archive the user
          await supabase.from("archived_users").insert({
            original_id:       profile.id,
            full_name:         profile.full_name,
            email:             profile.email,
            phone:             profile.phone,
            whatsapp:          profile.whatsapp,
            country:           profile.country,
            account_type:      profile.account_type,
            subscription_tier: profile.subscription_tier,
            is_verified:       profile.is_verified,
            avatar_url:        profile.avatar_url,
            registered_at:     profile.created_at,
            deleted_at:        new Date().toISOString(),
            deleted_by:        "admin",
          });
        }

        // 3. Delete profile
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "set_premium": {
        const validTiers = ["basic", "featured", "vip", null];
        if (!validTiers.includes(tier ?? null)) {
          return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: tier ?? null })
          .eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, subscription_tier: tier ?? null });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
