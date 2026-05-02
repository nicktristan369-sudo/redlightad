"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { ArrowLeft } from "lucide-react"

interface Listing {
  id: string
  title: string
  age: number
  gender: string
  category: string
  city: string
  country: string
  region: string | null
  about: string | null
  languages: string[]
  services: string[]
  profile_image: string | null
  phone: string | null
  whatsapp: string | null
  telegram: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [listing, setListing] = useState<Listing | null>(null)
  const [form, setForm] = useState<Listing | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setListing(data as Listing)
        setForm(data as Listing)
      }
      setLoading(false)
    })
  }, [router])

  const handleSave = async () => {
    if (!form || !listing) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("listings")
        .update({
          title: form.title,
          age: form.age,
          gender: form.gender,
          category: form.category,
          city: form.city,
          country: form.country,
          region: form.region,
          about: form.about,
          languages: form.languages,
          services: form.services,
          phone: form.phone,
          whatsapp: form.whatsapp,
          telegram: form.telegram,
        })
        .eq("id", listing.id)

      if (error) throw error
      alert("Profile updated!")
    } catch (e) {
      alert("Error saving profile")
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!form) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No profile found</h1>
            <p className="text-gray-500 mb-6">Create a profile first to edit it.</p>
            <a href="/create-profile" className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800">
              Create Profile
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit my profile</h1>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile name</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Your name or alias"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="trans">Trans</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select</option>
                <option value="escort">Escort</option>
                <option value="cam">Cam</option>
                <option value="massage">Massage</option>
              </select>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* About */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About me</label>
              <textarea
                value={form.about || ""}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                placeholder="Describe yourself..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">{form.about?.length || 0} / 500 characters</p>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+45 XXXX XXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp || ""}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+45 XXXX XXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                <input
                  type="text"
                  value={form.telegram || ""}
                  onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                  placeholder="@username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
