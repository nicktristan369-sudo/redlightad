import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  try {
    const { email, listingTitle, listingId, premiumTier, expiresAt, hoursRemaining } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const tierName = premiumTier === "vip" ? "VIP" : "Premium";
    const tierColor = premiumTier === "vip" ? "#F59E0B" : "#3B82F6";
    const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const benefits = premiumTier === "vip" 
      ? [
          "🥇 #1 placement in search results",
          "⭐ Featured in VIP showcase",
          "🏆 Exclusive VIP badge",
          "📈 5x more profile views",
          "💬 Priority in customer searches",
          "🔔 Instant message notifications",
        ]
      : [
          "📍 Top placement in search results",
          "⭐ Featured in Premium carousel",
          "🏅 Premium badge on profile",
          "📈 3x more profile views",
          "💬 Higher visibility to customers",
        ];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RedLightAD <noreply@send.redlightad.com>",
        to: email,
        subject: `⏰ Your ${tierName} expires tomorrow — Don't lose your visibility!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f8f9fa;-webkit-font-smoothing:antialiased;">
            
            <!-- Preheader text (hidden) -->
            <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
              Your ${tierName} subscription for "${listingTitle}" expires in ${hoursRemaining} hours. Renew now to keep your top placement!
            </div>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fa;">
              <tr>
                <td align="center" style="padding:40px 20px;">
                  
                  <!-- Main Card -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
                    
                    <!-- Header Banner -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#DC2626 0%,#991B1B 100%);padding:32px 32px 28px;text-align:center;">
                        <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">RedLightAD</div>
                        <div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.85);">Premium Membership</div>
                      </td>
                    </tr>
                    
                    <!-- Urgency Badge -->
                    <tr>
                      <td align="center" style="padding:24px 32px 0;">
                        <div style="display:inline-block;background:#FEF3C7;border:1px solid #F59E0B;border-radius:30px;padding:8px 20px;">
                          <span style="font-size:13px;font-weight:600;color:#92400E;">⏰ Expires in ${hoursRemaining} hours</span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding:24px 32px 0;">
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.3;text-align:center;">
                          Your ${tierName} is About to Expire
                        </h1>
                        <p style="margin:16px 0 0;font-size:15px;color:#4B5563;line-height:1.6;text-align:center;">
                          The ${tierName} subscription for <strong style="color:#111827;">"${listingTitle}"</strong> will expire on:
                        </p>
                        <div style="margin:20px 0;padding:16px;background:#F9FAFB;border-radius:12px;text-align:center;">
                          <div style="font-size:17px;font-weight:700;color:#111827;">${expiryDate}</div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- What You'll Lose -->
                    <tr>
                      <td style="padding:8px 32px 0;">
                        <div style="background:linear-gradient(135deg,${tierColor}15 0%,${tierColor}05 100%);border:1px solid ${tierColor}30;border-radius:14px;padding:20px 24px;">
                          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:14px;">
                            Don't lose these ${tierName} benefits:
                          </div>
                          ${benefits.map(b => `
                            <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
                              <span style="font-size:14px;color:#374151;line-height:1.5;">${b}</span>
                            </div>
                          `).join("")}
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Stats Impact -->
                    <tr>
                      <td style="padding:24px 32px 0;">
                        <div style="display:flex;gap:12px;">
                          <div style="flex:1;background:#FEE2E2;border-radius:12px;padding:16px;text-align:center;">
                            <div style="font-size:11px;font-weight:600;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;">Without ${tierName}</div>
                            <div style="font-size:24px;font-weight:800;color:#DC2626;margin-top:4px;">-70%</div>
                            <div style="font-size:12px;color:#7F1D1D;margin-top:2px;">less visibility</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td align="center" style="padding:28px 32px;">
                        <a href="https://redlightad.com/dashboard/boost?renew=${listingId}" 
                           style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#DC2626 0%,#B91C1C 100%);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(220,38,38,0.4);transition:all 0.2s;">
                          Renew ${tierName} Now →
                        </a>
                        <p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
                          Renew before expiry to keep your ranking
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Discount Offer (if applicable) -->
                    <tr>
                      <td style="padding:0 32px 28px;">
                        <div style="background:#ECFDF5;border:1px dashed #10B981;border-radius:12px;padding:16px 20px;text-align:center;">
                          <div style="font-size:13px;font-weight:600;color:#065F46;">
                            🎁 Special Offer: Renew today and get <strong>10% off</strong> your next month!
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                      <td style="padding:0 32px;">
                        <div style="height:1px;background:#E5E7EB;"></div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding:24px 32px 28px;">
                        <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;line-height:1.6;">
                          You're receiving this because you have an active ${tierName} subscription.<br>
                          <a href="https://redlightad.com/dashboard/profil" style="color:#6B7280;text-decoration:underline;">Manage email preferences</a>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                  
                  <!-- Sub-footer -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
                    <tr>
                      <td style="padding:24px 20px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9CA3AF;">
                          © ${new Date().getFullYear()} RedLightAD. All rights reserved.<br>
                          <a href="https://redlightad.com" style="color:#6B7280;">www.redlightad.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
            
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Premium Reminder Email] Error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Premium Reminder Email] Error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
