'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function ListingPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', params.id)
          .single()

        if (fetchError) {
          setError('Listing not found')
          return
        }

        setListing(data)
      } catch (err) {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchListing()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-gray-600">{error || 'Listing not found'}</p>
        </div>
      </div>
    )
  }

  const images = listing.images || []
  const profileImage = listing.profile_image

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            {listing.premium_tier && (
              <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${
                listing.premium_tier === 'vip' ? 'bg-pink-600' :
                listing.premium_tier === 'featured' ? 'bg-purple-600' :
                'bg-blue-600'
              }`}>
                {listing.premium_tier.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Image */}
            {profileImage && (
              <div className="mb-6 rounded-lg overflow-hidden bg-gray-200 aspect-video">
                <img
                  src={profileImage}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Gallery Grid */}
            {images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img: string, idx: number) => (
                    <div key={idx} className="rounded-lg overflow-hidden bg-gray-200 aspect-square">
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover hover:opacity-80 transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {listing.video_url && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Video Preview</h2>
                <div className="rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img
                    src={listing.video_url}
                    alt="Video preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{listing.about}</p>
            </div>

            {/* Services */}
            {listing.services && listing.services.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.services.map((service: string, idx: number) => (
                    <span key={idx} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">${listing.rate_1hour}</h3>
              <p className="text-gray-600 text-sm mb-6">per hour</p>

              {/* Details */}
              <div className="space-y-4 mb-6 pb-6 border-b">
                {listing.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age</span>
                    <span className="font-semibold text-gray-900">{listing.age}</span>
                  </div>
                )}
                {listing.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold text-gray-900">{listing.location}</span>
                  </div>
                )}
                {listing.languages && listing.languages.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Languages</span>
                    <span className="font-semibold text-gray-900">{listing.languages.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Contact Buttons */}
              <div className="space-y-3">
                {listing.email && (
                  <a
                    href={`mailto:${listing.email}`}
                    className="block w-full bg-pink-600 text-white font-bold py-3 rounded-lg text-center hover:bg-pink-700 transition"
                  >
                    📧 Email
                  </a>
                )}
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    className="block w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-center hover:bg-blue-700 transition"
                  >
                    📞 Call
                  </a>
                )}
                {listing.whatsapp && (
                  <a
                    href={`https://wa.me/${listing.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 text-white font-bold py-3 rounded-lg text-center hover:bg-green-700 transition"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>

              {/* Rating */}
              {listing.rating && (
                <div className="mt-6 pt-6 border-t text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-xl font-bold text-gray-900">{listing.rating}</span>
                  </div>
                  <p className="text-gray-600 text-sm">({listing.review_count || 0} reviews)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
