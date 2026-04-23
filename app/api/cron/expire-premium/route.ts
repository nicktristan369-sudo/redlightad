import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended: Run every hour

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getClient();
  const now = new Date().toISOString();

  // Find all listings with expired premium
  const { data: expiredListings, error: fetchError } = await db
    .from("listings")
    .select("id, user_id, title, premium_tier, premium_expires_at")
    .not("premium_tier", "eq", "basic")
    .not("premium_tier", "is", null)
    .lt("premium_expires_at", now);

  if (fetchError) {
    console.error("[Cron] Error fetching expired listings:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!expiredListings || expiredListings.length === 0) {
    return NextResponse.json({ 
      success: true, 
      message: "No expired premium listings found",
      processed: 0 
    });
  }

  // Downgrade each expired listing to basic
  const results = [];
  for (const listing of expiredListings) {
    const { error: updateError } = await db
      .from("listings")
      .update({ 
        premium_tier: "basic",
        premium_expires_at: null,
      })
      .eq("id", listing.id);

    if (updateError) {
      results.push({ id: listing.id, status: "error", error: updateError.message });
      continue;
    }

    // Log the expiration
    try {
      await db.from("premium_history").insert({
        listing_id: listing.id,
        user_id: listing.user_id,
        action: "expired",
        previous_tier: listing.premium_tier,
        new_tier: "basic",
        expired_at: listing.premium_expires_at,
      });
    } catch { /* Don't fail if history insert fails */ }

    // Optionally send notification email
    try {
      const { data: profile } = await db
        .from("profiles")
        .select("email_notifications")
        .eq("id", listing.user_id)
        .single();

      if (profile?.email_notifications !== false) {
        const { data: user } = await db.auth.admin.getUserById(listing.user_id);
        if (user?.user?.email) {
          // Send expiration email (fire and forget)
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"}/api/email/premium-expired`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.user.email,
              listingTitle: listing.title,
              previousTier: listing.premium_tier,
            }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Don't fail the cron if email fails
    }

    results.push({ id: listing.id, status: "downgraded", previousTier: listing.premium_tier });
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.length} expired premium listings`,
    processed: results.length,
    results,
  });
}
