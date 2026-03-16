import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/* ─── GET: list all users ─── */
export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, account_type, country, is_admin, is_banned, is_verified, phone, phone_verified, subscription_tier, created_at")
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
        return NextResponse.json({ success: true, is_banned: true });

      case "unban":
        await supabase.from("profiles").update({ is_banned: false }).eq("id", userId);
        return NextResponse.json({ success: true, is_banned: false });

      case "verify":
        await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
        return NextResponse.json({ success: true, is_verified: true });

      case "delete": {
        // Delete profile first (FK cascade handles the rest where applicable)
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "set_premium": {
        // tier = 'basic' | 'featured' | 'vip' | null (remove)
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
