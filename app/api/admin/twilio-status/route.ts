export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const configured =
    !!process.env.TWILIO_ACCOUNT_SID?.trim() &&
    !!process.env.TWILIO_AUTH_TOKEN?.trim() &&
    !!process.env.TWILIO_PHONE_NUMBER?.trim();

  return NextResponse.json({ configured });
}
