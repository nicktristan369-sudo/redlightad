export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sms";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const { tokens, message_template } = await req.json();
    if (!tokens?.length || !message_template) {
      return NextResponse.json(
        { error: "Missing tokens or message_template" },
        { status: 400 }
      );
    }

    const supabase = db();
    const { data: invites, error } = await supabase
      .from("invite_links")
      .select("token, phone, name")
      .in("token", tokens);

    if (error) throw error;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const invite of invites || []) {
      if (!invite.phone) {
        failed++;
        errors.push(`No phone for token ${invite.token}`);
        continue;
      }

      const message = message_template
        .replace(/\[navn\]/gi, invite.name || "")
        .replace(/\[token\]/gi, invite.token);

      const result = await sendSMS({ to: invite.phone, message, sender: 'REDLIGHTAD' });

      if (result.success) {
        sent++;
        await supabase.from("sms_log").insert({
          phone_number: invite.phone,
          message,
          status: "sent",
          direction: "outbound",
          recipients: 1,
        });
      } else {
        failed++;
        errors.push(`${invite.phone}: ${result.error}`);
      }
    }

    return NextResponse.json({ sent, failed, errors });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send SMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
