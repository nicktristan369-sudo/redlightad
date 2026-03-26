export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "Twilio not configured" },
      { status: 503 }
    );
  }

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

      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization:
                "Basic " +
                Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: fromNumber,
              To: invite.phone,
              Body: message,
            }),
          }
        );

        if (res.ok) {
          sent++;
          // Log to sms_log
          await supabase.from("sms_log").insert({
            phone_number: invite.phone,
            message,
            status: "sent",
            direction: "outbound",
            recipients: 1,
          });
        } else {
          const errData = await res.json();
          failed++;
          errors.push(
            `${invite.phone}: ${errData.message || res.statusText}`
          );
        }
      } catch (e: unknown) {
        failed++;
        errors.push(
          `${invite.phone}: ${e instanceof Error ? e.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({ sent, failed, errors });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send SMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
