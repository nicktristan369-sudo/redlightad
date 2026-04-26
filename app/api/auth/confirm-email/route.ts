import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint to confirm email for testing
// In production, this should only be available for authenticated users confirming their own email
export async function POST(req: Request) {
  try {
    const { email, token } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (token) {
      // If token is provided, use it to verify (from email link)
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Email confirmed',
        user: data.user,
      })
    }

    // Alternative: If no token, just confirm email directly (admin only in production)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmed for user',
      user: data.user,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
