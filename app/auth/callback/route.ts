import { createServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has a listing or customer profile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check for existing listing
        const { data: listing } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", user.id)
          .single();

        // Check for customer profile
        const { data: customerProfile } = await supabase
          .from("customer_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .single();

        if (listing) {
          // Existing provider - go to dashboard
          return NextResponse.redirect(`${origin}/dashboard`);
        } else if (customerProfile) {
          // Existing customer - go to kunde
          return NextResponse.redirect(`${origin}/kunde`);
        } else {
          // New user - go to registration flow to complete profile
          return NextResponse.redirect(`${origin}/register/complete`);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
