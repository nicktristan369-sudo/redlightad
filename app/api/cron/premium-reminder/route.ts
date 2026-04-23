import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Run daily - sends reminder 1 day before premium expires

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getClient();
  
  // Find listings expiring in 24-48 hours (to catch the 1-day-before window)
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: expiringListings, error } = await db
    .from("listings")
    .select("id, user_id, title, premium_tier, premium_expires_at")
    .not("premium_tier", "eq", "basic")
    .not("premium_tier", "is", null)
    .gte("premium_expires_at", in24Hours.toISOString())
    .lt("premium_expires_at", in48Hours.toISOString());

  if (error) {
    console.error("[Premium Reminder] Error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!expiringListings || expiringListings.length === 0) {
    return NextResponse.json({ 
      success: true, 
      message: "No expiring subscriptions to remind",
      sent: 0 
    });
  }

  const results = [];
  
  for (const listing of expiringListings) {
    try {
      // Check if user wants email notifications
      const { data: profile } = await db
        .from("profiles")
        .select("email_notifications")
        .eq("id", listing.user_id)
        .single();

      if (profile?.email_notifications === false) {
        results.push({ id: listing.id, status: "skipped", reason: "notifications_disabled" });
        continue;
      }

      // Check if we already sent a reminder for this listing
      const { data: existingReminder } = await db
        .from("email_logs")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("email_type", "premium_reminder")
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingReminder) {
        results.push({ id: listing.id, status: "skipped", reason: "already_sent" });
        continue;
      }

      // Get user email
      const { data: userData } = await db.auth.admin.getUserById(listing.user_id);
      if (!userData?.user?.email) {
        results.push({ id: listing.id, status: "skipped", reason: "no_email" });
        continue;
      }

      // Calculate days remaining
      const expiresAt = new Date(listing.premium_expires_at);
      const hoursRemaining = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Send reminder email
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"}/api/email/premium-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.user.email,
          listingTitle: listing.title,
          listingId: listing.id,
          premiumTier: listing.premium_tier,
          expiresAt: listing.premium_expires_at,
          hoursRemaining,
        }),
      });

      if (res.ok) {
        // Log that we sent the reminder
        await db.from("email_logs").insert({
          user_id: listing.user_id,
          listing_id: listing.id,
          email_type: "premium_reminder",
          recipient: userData.user.email,
        });
        results.push({ id: listing.id, status: "sent" });
      } else {
        results.push({ id: listing.id, status: "failed", reason: "email_error" });
      }
    } catch (e) {
      results.push({ id: listing.id, status: "error", reason: String(e) });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.length} expiring subscriptions`,
    sent: results.filter(r => r.status === "sent").length,
    results,
  });
}
