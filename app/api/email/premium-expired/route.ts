import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  try {
    const { email, listingTitle, previousTier } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const tierName = previousTier === "vip" ? "VIP" : "Premium";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RedLightAD <noreply@send.redlightad.com>",
        to: email,
        subject: `Your ${tierName} subscription has expired`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;">
            <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
              <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                
                <div style="text-align:center;margin-bottom:24px;">
                  <div style="font-size:28px;font-weight:800;color:#DC2626;">RedLightAD</div>
                </div>

                <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px;text-align:center;">
                  Your ${tierName} Has Expired
                </h1>

                <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px;">
                  Your ${tierName} subscription for <strong>"${listingTitle}"</strong> has expired. 
                  Your listing has been downgraded to the Basic tier.
                </p>

                <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
                  Renew your subscription to get back these benefits:
                </p>

                <ul style="font-size:14px;color:#555;line-height:1.8;margin:0 0 24px;padding-left:20px;">
                  <li>Priority placement in search results</li>
                  <li>Featured in Premium carousel</li>
                  <li>${previousTier === "vip" ? "VIP badge and top placement" : "Premium badge"}</li>
                  <li>More visibility and messages</li>
                </ul>

                <div style="text-align:center;">
                  <a href="https://redlightad.com/upgrade" 
                     style="display:inline-block;padding:14px 32px;background:#DC2626;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
                    Renew ${tierName}
                  </a>
                </div>

                <p style="font-size:12px;color:#999;margin:24px 0 0;text-align:center;">
                  Questions? Contact us at support@redlightad.com
                </p>
              </div>

              <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
                © ${new Date().getFullYear()} RedLightAD. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[Premium Expired Email] Error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Premium Expired Email] Error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
