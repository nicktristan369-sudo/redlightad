import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { itemId, action, reason } = await req.json() as {
      itemId: string;
      action: "approve" | "reject" | "delete";
      reason?: string;
    };

    if (!itemId || !["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Handle delete
    if (action === "delete") {
      const supabase = getClient();
      const { error } = await supabase.from("marketplace_items").delete().eq("id", itemId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const supabase = getClient();
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Fetch item (no join to avoid schema cache issues)
    const { data: item, error: fetchErr } = await supabase
      .from("marketplace_items")
      .select("id, title, seller_id")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update status
    const { error: updateErr } = await supabase
      .from("marketplace_items")
      .update({ status: newStatus })
      .eq("id", itemId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Get seller name from profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", item.seller_id)
      .single();
    const sellerName = profileData?.full_name ?? "Seller";

    // Get seller email from auth.users via service role
    const { data: userData } = await supabase.auth.admin.getUserById(item.seller_id);
    const sellerEmail = userData?.user?.email;

    // Send email notification to seller
    if (sellerEmail && process.env.RESEND_API_KEY) {
      const subject = action === "approve"
        ? `Your marketplace item has been approved!`
        : `Your marketplace item was not approved.`;

      const html = action === "approve"
        ? `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#000">Good news, ${sellerName}!</h2>
            <p>Your marketplace item <strong>${item.title}</strong> has been <strong style="color:#16A34A">approved</strong> and is now live on RedLightAD Marketplace.</p>
            <a href="https://redlightad.com/marketplace" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px">View Marketplace →</a>
            <p style="color:#9CA3AF;font-size:12px;margin-top:24px">RedLightAD · <a href="https://redlightad.com" style="color:#9CA3AF">redlightad.com</a></p>
          </div>`
        : `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#000">Item not approved</h2>
            <p>Hi ${sellerName}, your marketplace item <strong>${item.title}</strong> was <strong style="color:#DC2626">not approved</strong>.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Please review our marketplace guidelines and resubmit. If you have questions, contact us at <a href="mailto:contact@redlightad.com">contact@redlightad.com</a>.</p>
            <a href="https://redlightad.com/dashboard/marketplace" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px">Manage My Items →</a>
            <p style="color:#9CA3AF;font-size:12px;margin-top:24px">RedLightAD · <a href="https://redlightad.com" style="color:#9CA3AF">redlightad.com</a></p>
          </div>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "RedLightAD <noreply@redlightad.com>",
          to: [sellerEmail],
          subject,
          html,
        }),
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
