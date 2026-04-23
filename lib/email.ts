// Email utility using Resend
// Requires RESEND_API_KEY in environment

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "noreply@send.redlightad.com";
const SITE_NAME = "RedLightAD";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Failed to send:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Email Templates
// ────────────────────────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .logo { font-size: 24px; font-weight: 700; color: #DC2626; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
    .text { color: #4a4a4a; margin-bottom: 16px; }
    .button { display: inline-block; background: #DC2626; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .button:hover { background: #b91c1c; }
    .footer { text-align: center; color: #9a9a9a; font-size: 12px; margin-top: 32px; }
    .divider { border-top: 1px solid #e5e5e5; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">RedLightAD</div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RedLightAD. All rights reserved.</p>
      <p>You received this email because you have an account on RedLightAD.</p>
    </div>
  </div>
</body>
</html>
`;

// ── New Message Notification ──
export function newMessageEmail(params: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}): { subject: string; html: string } {
  const { recipientName, senderName, messagePreview, conversationUrl } = params;
  
  return {
    subject: `New message from ${senderName}`,
    html: baseTemplate(`
      <h2 class="title">You have a new message</h2>
      <p class="text">Hi ${recipientName},</p>
      <p class="text"><strong>${senderName}</strong> sent you a message:</p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #DC2626;">
        <p style="margin: 0; color: #4a4a4a; font-style: italic;">"${messagePreview.slice(0, 200)}${messagePreview.length > 200 ? '...' : ''}"</p>
      </div>
      <a href="${conversationUrl}" class="button">View Conversation</a>
      <div class="divider"></div>
      <p class="text" style="font-size: 13px; color: #6a6a6a;">Reply directly on RedLightAD to keep your conversation private and secure.</p>
    `),
  };
}

// ── Profile Approved ──
export function profileApprovedEmail(params: {
  providerName: string;
  profileUrl: string;
}): { subject: string; html: string } {
  const { providerName, profileUrl } = params;
  
  return {
    subject: `Your profile has been approved! 🎉`,
    html: baseTemplate(`
      <h2 class="title">Congratulations! Your profile is now live</h2>
      <p class="text">Hi ${providerName},</p>
      <p class="text">Great news! Your profile has been reviewed and <strong>approved</strong>. It's now visible to customers on RedLightAD.</p>
      <a href="${profileUrl}" class="button">View Your Profile</a>
      <div class="divider"></div>
      <p class="text"><strong>Tips to get more visibility:</strong></p>
      <ul class="text">
        <li>Add high-quality photos</li>
        <li>Complete all profile sections</li>
        <li>Consider upgrading to Premium for top placement</li>
      </ul>
    `),
  };
}

// ── Profile Rejected ──
export function profileRejectedEmail(params: {
  providerName: string;
  reason?: string;
}): { subject: string; html: string } {
  const { providerName, reason } = params;
  
  return {
    subject: `Action required: Profile not approved`,
    html: baseTemplate(`
      <h2 class="title">Your profile needs attention</h2>
      <p class="text">Hi ${providerName},</p>
      <p class="text">We've reviewed your profile submission and unfortunately it wasn't approved at this time.</p>
      ${reason ? `
      <div style="background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #DC2626;">
        <p style="margin: 0; color: #7F1D1D;"><strong>Reason:</strong> ${reason}</p>
      </div>
      ` : ''}
      <p class="text">Please review our guidelines and update your profile. You can resubmit for approval once changes are made.</p>
      <a href="${SITE_URL}/dashboard" class="button">Edit Your Profile</a>
      <div class="divider"></div>
      <p class="text" style="font-size: 13px; color: #6a6a6a;">If you have questions, please contact our support team.</p>
    `),
  };
}

// ── Welcome Email (Provider) ──
export function welcomeProviderEmail(params: {
  providerName: string;
}): { subject: string; html: string } {
  const { providerName } = params;
  
  return {
    subject: `Welcome to RedLightAD! 👋`,
    html: baseTemplate(`
      <h2 class="title">Welcome to RedLightAD</h2>
      <p class="text">Hi ${providerName},</p>
      <p class="text">Thank you for joining RedLightAD! Your account has been created successfully.</p>
      <p class="text"><strong>Next steps:</strong></p>
      <ol class="text">
        <li>Complete your profile with photos and description</li>
        <li>Set your rates and services</li>
        <li>Submit for approval</li>
        <li>Start receiving inquiries!</li>
      </ol>
      <a href="${SITE_URL}/dashboard" class="button">Complete Your Profile</a>
      <div class="divider"></div>
      <p class="text" style="font-size: 13px; color: #6a6a6a;">Need help? Check our FAQ or contact support.</p>
    `),
  };
}

// ── Welcome Email (Customer) ──
export function welcomeCustomerEmail(params: {
  customerName: string;
}): { subject: string; html: string } {
  const { customerName } = params;
  
  return {
    subject: `Welcome to RedLightAD! 👋`,
    html: baseTemplate(`
      <h2 class="title">Welcome to RedLightAD</h2>
      <p class="text">Hi ${customerName || 'there'},</p>
      <p class="text">Thank you for joining RedLightAD! Your account is ready to use.</p>
      <p class="text">You can now:</p>
      <ul class="text">
        <li>Browse profiles in your area</li>
        <li>Contact providers directly</li>
        <li>Save favorites for later</li>
      </ul>
      <a href="${SITE_URL}" class="button">Start Browsing</a>
      <div class="divider"></div>
      <p class="text" style="font-size: 13px; color: #6a6a6a;">Please treat all providers with respect. We have a zero-tolerance policy for harassment.</p>
    `),
  };
}

// ── New Inquiry Notification (for providers) ──
export function newInquiryEmail(params: {
  providerName: string;
  customerName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const { providerName, customerName, dashboardUrl } = params;
  
  return {
    subject: `New inquiry from ${customerName}`,
    html: baseTemplate(`
      <h2 class="title">You have a new inquiry!</h2>
      <p class="text">Hi ${providerName},</p>
      <p class="text">Great news! <strong>${customerName}</strong> is interested in your services and has sent you a message.</p>
      <a href="${dashboardUrl}" class="button">View & Respond</a>
      <div class="divider"></div>
      <p class="text" style="font-size: 13px; color: #6a6a6a;">Quick response times lead to more bookings!</p>
    `),
  };
}
