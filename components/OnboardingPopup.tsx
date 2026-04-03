'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function OnboardingPopup() {
  const [show, setShow] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    checkProfile()
  }, [])

  async function checkProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!listing?.needs_completion) return
    // Skip popup for admin-oprettede brugere der er admin selv
    if (listing?.created_by_admin && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) return

    const missingFields: string[] = []
    if (!listing.email || listing.email?.includes('@redlightad.com'))
      missingFields.push('Din rigtige email')
    if (!listing.photos || listing.photos?.length === 0)
      missingFields.push('Profilbilleder')
    if (!listing.description)
      missingFields.push('Beskrivelse')

    if (missingFields.length > 0) {
      setMissing(missingFields)
      setShow(true)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-2">Tillykke med din profil!</h2>
        <p className="text-gray-500 mb-4">Tilføj de manglende informationer for at få flere kunder.</p>
        <div className="space-y-2 mb-6">
          {missing.map((item, i) => (
            <div key={i} className="p-3 bg-amber-50 rounded-lg text-sm">{item}</div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShow(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Senere</button>
          <a href="/dashboard/profile" className="flex-1 bg-black text-white py-2.5 rounded-xl text-center text-sm">Udfyld nu →</a>
        </div>
      </div>
    </div>
  )
}
