import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ONE-TIME route — opretter test customer account
// Beskyttet med secret query param
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== 'rlad-test-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const email = 'test.kunde@redlightad.com'
  const password = 'TestKunde2026!'

  // Slet gammel bruger hvis den findes
  const { data: existing } = await supabase.auth.admin.listUsers()
  const old = existing?.users?.find(u => u.email === email)
  if (old) {
    await supabase.auth.admin.deleteUser(old.id)
  }

  // Opret ny customer bruger
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_type: 'customer',
      display_name: 'Test Kunde',
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Opret customer_profiles record
  await supabase.from('customer_profiles').upsert({
    user_id: data.user.id,
    username: 'testkunde',
    age: 30,
    bio: 'Test customer account',
    redcoins: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({
    success: true,
    email,
    password,
    userId: data.user.id,
    message: 'Log ind på /login med disse credentials — du lander på /kunde dashboard',
  })
}
