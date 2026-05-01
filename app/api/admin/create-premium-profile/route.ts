import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  
  if (secret !== 'rlad-test-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Generate random email and password
  const timestamp = Date.now()
  const email = `premium_model_${timestamp}@redlightad.com`
  const password = `Premium${timestamp}!`

  try {
    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_type: 'provider',
        display_name: 'Scarlett Premium',
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Create premium listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: userId,
        title: 'Scarlett - Premium VIP Model',
        category: 'Escort',
        gender: 'Woman',
        age: 24,
        location: 'Copenhagen, Denmark',
        country: 'Denmark',
        city: 'Copenhagen',
        about: '🌟 Premium VIP Model - Scarlett\n\nHi! I\'m Scarlett, your ultimate premium experience. Professional, discrete, and always available for unforgettable moments.\n\n✨ Premium Features:\n• Private shows & bookings\n• Verified & featured profile\n• 24/7 availability\n• Custom requests welcome\n• Professional discretion guaranteed\n\nResponse time: <1 hour\nRating: 4.9⭐ (89 reviews)',
        services: ['Private Shows', 'Bookings', 'Premium Content', 'Video Calls', 'Professional Services'],
        languages: ['English', 'Danish', 'Swedish', 'German'],
        rate_1hour: '200',
        phone: '+45 XX XXX XXX',
        email: email,
        images: [
          'https://via.placeholder.com/600x800/FF1493/FFFFFF?text=Scarlett+Photo+1',
          'https://via.placeholder.com/600x800/FF1493/FFFFFF?text=Scarlett+Photo+2',
          'https://via.placeholder.com/600x800/FF1493/FFFFFF?text=Scarlett+Photo+3',
          'https://via.placeholder.com/600x800/FF1493/FFFFFF?text=Scarlett+Photo+4',
        ],
        profile_image: 'https://via.placeholder.com/400x500/FF69B4/FFFFFF?text=Scarlett+Premium',
        video_url: 'https://via.placeholder.com/640x480/FF1493/FFFFFF?text=Scarlett+Video+Demo',
        premium_tier: 'featured',
        status: 'active',
        display_name: 'Scarlett',
      })
      .select()

    if (listingError || !listing?.length) {
      return NextResponse.json({ error: listingError?.message || 'Failed to create listing' }, { status: 500 })
    }

    const listingId = listing[0].id

    return NextResponse.json({
      success: true,
      message: 'Premium profile created and published',
      profile: {
        userId,
        email,
        password,
        listingId,
        url: `https://redlightad.com/listing/${listingId}`,
        title: 'Scarlett - Premium VIP Model',
        tier: 'VIP',
        status: 'PUBLISHED',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
