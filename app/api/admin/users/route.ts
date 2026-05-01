import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/* ─── GET: list active users with server-side filtering + pagination ─── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
    const country = searchParams.get("country");
    const search  = searchParams.get("search");
    const tab     = searchParams.get("tab") ?? "all";

    const supabase = getClient();
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    // Fetch profiles with their listings (for premium info)
    let query = supabase
      .from("profiles")
      .select(
        `id, email, full_name, account_type, country, is_admin, is_banned, is_verified, 
         phone, phone_verified, whatsapp, avatar_url, subscription_tier, created_at,
         listings(id, premium_tier, premium_until, status)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (country && country !== "all") query = query.eq("country", country);
    if (tab === "providers") query = query.eq("account_type", "provider");
    if (tab === "customers") query = query.eq("account_type", "customer");
    if (tab === "banned")    query = query.eq("is_banned", true);
    if (tab === "verified")  query = query.eq("is_verified", true);
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%,country.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Transform data to include listing premium info
    const users = (data ?? []).map((u: any) => {
      const listing = Array.isArray(u.listings) ? u.listings[0] : u.listings;
      return {
        ...u,
        listings: undefined, // Remove raw listings array
        listing_id: listing?.id ?? null,
        premium_tier: listing?.premium_tier ?? null,
        premium_until: listing?.premium_until ?? null,
        listing_status: listing?.status ?? null,
      };
    });

    // Unique countries for filter dropdown
    const { data: countryRows } = await supabase
      .from("profiles")
      .select("country")
      .not("country", "is", null)
      .order("country");

    const uniqueCountries = Array.from(
      new Set((countryRows ?? []).map((r: { country: string }) => r.country).filter(Boolean))
    ).sort();

    return NextResponse.json({
      users,
      total: count ?? 0,
      page,
      limit,
      countries: uniqueCountries,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ─── POST: mutate a user ─── */
type Action = "ban" | "unban" | "verify" | "delete" | "set_premium";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { 
      userId: string; 
      action: Action; 
      tier?: string | null;
      months?: number;
      listingId?: string;
    };
    const { userId, action, tier, months, listingId } = body;

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, whatsapp, country, account_type, subscription_tier, is_verified, avatar_url, created_at")
          .eq("id", userId)
          .single();

        if (profile) {
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

        await supabase.from("listings").delete().eq("user_id", userId);
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json({ success: true });
      }

      case "set_premium": {
        const validTiers = ["basic", "featured", "vip", null];
        if (!validTiers.includes(tier ?? null)) {
          return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        // Find or use provided listing ID
        let targetListingId = listingId;
        if (!targetListingId) {
          const { data: listing } = await supabase
            .from("listings")
            .select("id")
            .eq("user_id", userId)
            .limit(1)
            .single();
          targetListingId = listing?.id;
        }

        if (!targetListingId) {
          return NextResponse.json({ error: "No listing found for user" }, { status: 404 });
        }

        // Calculate premium_until based on months
        let premiumUntil: string | null = null;
        if (tier && months && months > 0) {
          const until = new Date();
          until.setMonth(until.getMonth() + months);
          premiumUntil = until.toISOString();
        }

        // Update listing
        const { error } = await supabase
          .from("listings")
          .update({ 
            premium_tier: tier ?? null,
            premium_until: premiumUntil,
            status: tier ? "active" : "active", // Keep active either way
          })
          .eq("id", targetListingId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Also update profiles.subscription_tier for backwards compat
        await supabase
          .from("profiles")
          .update({ subscription_tier: tier ?? null })
          .eq("id", userId);

        return NextResponse.json({ 
          success: true, 
          premium_tier: tier ?? null,
          premium_until: premiumUntil,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
