'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AnnouncersPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let query = supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })

        if (filter === 'published') {
          query = query.eq('status', 'published')
        } else if (filter === 'pending') {
          query = query.eq('status', 'draft')
        }

        const { data, error } = await query.limit(100)

        if (error) {
          console.error('Error:', error)
          return
        }

        setListings(data || [])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [filter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Provider Profiles</h1>
        <p className="text-gray-600 mt-2">Manage and moderate provider listings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'published', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-pink-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <p className="text-gray-600 mt-4">Loading listings...</p>
        </div>
      )}

      {/* Listings Table */}
      {!loading && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Age</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map(listing => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {listing.profile_image && (
                          <img
                            src={listing.profile_image}
                            alt={listing.title}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium text-gray-900">{listing.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {listing.location}, {listing.country}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{listing.age}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${listing.rate_1hour}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {listing.premium_tier && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          listing.premium_tier === 'vip'
                            ? 'bg-pink-100 text-pink-800'
                            : listing.premium_tier === 'featured'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {listing.premium_tier}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {listing.rating ? `${listing.rating}⭐` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <a
                        href={`/listing/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-900 font-medium"
                      >
                        View
                      </a>
                      <button className="text-gray-600 hover:text-gray-900 font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {listings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No listings found</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Total Listings</p>
                <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {listings.filter(l => l.status === 'published').length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Premium</p>
                <p className="text-2xl font-bold text-pink-600">
                  {listings.filter(l => l.premium_tier).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {listings.length > 0
                    ? (listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length).toFixed(1)
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
