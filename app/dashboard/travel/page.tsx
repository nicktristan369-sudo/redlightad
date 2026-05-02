"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { 
  Plane, MapPin, Plus, Trash2, AlertCircle, CheckCircle, 
  ArrowLeft, Crown, Calendar, Globe, Clock, X 
} from "lucide-react"

interface Travel {
  id: string
  city: string
  country: string
  country_code: string
  arrival_date: string
  departure_date: string
  is_current?: boolean
}

interface Listing {
  id: string
  title: string
  city: string
  country: string
  is_premium: boolean
}

const COUNTRIES = [
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
]

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString('da-DK', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

export default function TravelPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [travels, setTravels] = useState<Travel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [arrivalDate, setArrivalDate] = useState("")
  const [departureDate, setDepartureDate] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login")
      return
    }

    // Get user's listing
    const { data: listingData } = await supabase
      .from("listings")
      .select("id, title, city, country, is_premium")
      .eq("user_id", session.user.id)
      .single()

    if (listingData) {
      setListing(listingData)
      
      // Get travels via API
      const res = await fetch(`/api/travel?listing_id=${listingData.id}`)
      const data = await res.json()
      if (data.entries) {
        const today = new Date().toISOString().split('T')[0]
        const processed = data.entries.map((e: Travel) => ({
          ...e,
          is_current: e.arrival_date <= today && e.departure_date >= today
        }))
        setTravels(processed)
      }
    }
    setLoading(false)
  }

  async function addTravel() {
    if (!listing || !city || !country || !arrivalDate || !departureDate) return
    
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        city,
        country,
        country_code: countryCode,
        arrival_date: arrivalDate,
        departure_date: departureDate,
      })
    })

    const data = await res.json()
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Fejl' })
    } else {
      setMessage({ type: 'success', text: 'Rejse tilføjet!' })
      setShowForm(false)
      setCity("")
      setCountry("")
      setCountryCode("")
      setArrivalDate("")
      setDepartureDate("")
      loadData()
    }
    setSaving(false)
  }

  async function deleteTravel(id: string) {
    if (!confirm("Er du sikker på du vil slette denne rejse?")) return
    
    const res = await fetch('/api/travel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ travel_id: id })
    })

    if (res.ok) {
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Not premium - show upgrade prompt
  if (listing && !listing.is_premium) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm">
            <ArrowLeft size={16} /> Tilbage til Dashboard
          </Link>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Crown size={28} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Travel er en Premium Feature</h1>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Med Premium kan du planlægge rejser, så kunder kan se hvornår du besøger deres by.
            </p>
            <Link 
              href="/upgrade"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Crown size={18} /> Opgrader til Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeTravel = travels.find(t => t.is_current)

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 text-sm">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Plane className="text-gray-400" /> Travel
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Tilføj rejse
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Current Location Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeTravel ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <MapPin size={22} className={activeTravel ? 'text-red-500' : 'text-green-500'} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {activeTravel ? 'Nuværende rejse-lokation' : 'Din hjem-lokation'}
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {activeTravel ? `${activeTravel.city}, ${activeTravel.country}` : `${listing?.city}, ${listing?.country}`}
              </p>
              {activeTravel && (
                <p className="text-sm text-gray-500 mt-1">
                  Hjem: {listing?.city}, {listing?.country}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Travels List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Planlagte rejser</h2>
            <p className="text-sm text-gray-500 mt-1">
              Rejser vises på din profil, så kunder ved hvornår du besøger deres by
            </p>
          </div>

          {travels.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Globe size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">Ingen rejser planlagt endnu</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Tilføj din første rejse →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {travels
                .sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime())
                .map(travel => {
                  const isPast = new Date(travel.departure_date) < new Date()
                  
                  return (
                    <div key={travel.id} className={`p-5 ${isPast ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          travel.is_current ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {travel.is_current 
                            ? <MapPin size={18} className="text-red-500" />
                            : <Plane size={18} className="text-gray-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {travel.city}, {travel.country}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar size={12} />
                            {formatDate(travel.arrival_date)} – {formatDate(travel.departure_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {travel.is_current && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              Nu
                            </span>
                          )}
                          <button
                            onClick={() => deleteTravel(travel.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Add Travel Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Tilføj ny rejse</h3>
                <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Country Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Land</label>
                  <select
                    value={countryCode}
                    onChange={e => {
                      const selected = COUNTRIES.find(c => c.code === e.target.value)
                      setCountryCode(e.target.value)
                      setCountry(selected?.name || "")
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Vælg land...</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">By</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="f.eks. København, Stockholm..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ankomst</label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={e => setArrivalDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Afrejse</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={e => setDepartureDate(e.target.value)}
                      min={arrivalDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                  <p>💡 Dine rejser vises på din profil, så kunder kan se hvornår du besøger deres by.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Annuller
                </button>
                <button
                  onClick={addTravel}
                  disabled={!city || !country || !arrivalDate || !departureDate || saving}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Gemmer...' : 'Tilføj rejse'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
