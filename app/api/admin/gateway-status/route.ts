export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const configured = !!process.env.GATEWAYAPI_TOKEN?.trim();
  return NextResponse.json({ configured });
}
