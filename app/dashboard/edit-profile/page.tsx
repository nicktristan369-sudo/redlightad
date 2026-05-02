"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { ArrowLeft, Phone, MessageCircle, Send, MapPin, Clock, Zap, Image as ImageIcon, Video, Mic, Lock, Plus, X } from "lucide-react"

interface FormData {
  id?: string
  // Basic info
  title: string
  age: number
  gender: string
  category: string
  country: string
  city: string
  about: string
  languages: string[]

  // Photos & Media
  profile_image: string | null
  images: string[] | null
  video_url: string | null
  voice_message_url: string | null

  // Contact
  phone: string | null
  whatsapp: string | null
  telegram: string | null
  snapchat: string | null
  wechat: string | null
  viber: string | null
  signal: string | null
  line_app: string | null
  email: string | null

  // Services & Rates
  services: string[]
  rate_1hour: string | null
  rate_2hours: string | null
  rate_overnight: string | null
  rate_weekend: string | null

  // Hours
  opening_hours: string | null

  // Social
  onlyfans_username: string | null

  // Premium features
  locked_images: string[] | null
  payment_methods: string[]
}

const COUNTRY_CODES: { [key: string]: string } = {
  DK: "+45",
  SE: "+46",
  NO: "+47",
  DE: "+49",
  NL: "+31",
  BE: "+32",
  FR: "+33",
  IT: "+39",
  ES: "+34",
  UK: "+44",
  US: "+1",
}

const LANGUAGES = ["Danish", "English", "Swedish", "Norwegian", "German", "French", "Spanish", "Italian", "Dutch"]
const SERVICES = ["Escort", "Cam", "Massage", "Phone", "Video call"]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData | null>(null)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }

      const { data: listing } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (listing) {
        setForm(listing as FormData)
        setPremium(!!listing.premium_tier)
      }
      setLoading(false)
    })
  }, [router])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("listings")
        .update(form)
        .eq("id", form.id || "")

      if (error) throw error
      alert("✓ Profile saved!")
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

  if (!form) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-12">
            <h1 className="text-4xl font-bold text-white mb-2">Edit my profile</h1>
            <p className="text-gray-300">Manage all aspects of your listing in one place</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-12">
            {/* Section 1: Basic Information */}
            <Section title="Basic Information" icon={Zap}>
              <div className="space-y-4">
                <Input label="Profile name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Age" type="number" value={String(form.age)} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })} />
                  <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="trans">Trans</option>
                  </Select>
                  <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select</option>
                    <option value="escort">Escort</option>
                    <option value="cam">Cam</option>
                    <option value="massage">Massage</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <TextArea label="About me" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} maxLength={500} />
              </div>
            </Section>

            {/* Section 2: Photos & Media */}
            <Section title="Photos & Media" icon={ImageIcon}>
              <InfoBox>
                Upload high-quality photos. First photo will be your profile picture.
              </InfoBox>
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl text-center hover:border-gray-900 transition cursor-pointer">
                  <Plus size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Upload photos</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                </div>
                {premium && (
                  <>
                    <Input label="Video URL" value={form.video_url || ""} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
                    <Input label="Voice message URL" value={form.voice_message_url || ""} onChange={(e) => setForm({ ...form, voice_message_url: e.target.value })} />
                  </>
                )}
              </div>
            </Section>

            {/* Section 3: Contact Information */}
            <Section title="Contact Information" icon={Phone}>
              <InfoBox>
                Add multiple contact methods. Visitors can reach you through their preferred app.
              </InfoBox>
              <ContactField label="Phone" icon={Phone} placeholder="+45 XXXX XXXX" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <ContactField label="WhatsApp" icon={MessageCircle} placeholder="+45 XXXX XXXX" value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              <ContactField label="Telegram" icon={Send} placeholder="@username" value={form.telegram || ""} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
              
              {premium && (
                <>
                  <ContactField label="Snapchat" placeholder="@username" value={form.snapchat || ""} onChange={(e) => setForm({ ...form, snapchat: e.target.value })} />
                  <ContactField label="WeChat" placeholder="WeChat ID" value={form.wechat || ""} onChange={(e) => setForm({ ...form, wechat: e.target.value })} />
                  <ContactField label="Viber" placeholder="+45 XXXX XXXX" value={form.viber || ""} onChange={(e) => setForm({ ...form, viber: e.target.value })} />
                  <ContactField label="Signal" placeholder="+45 XXXX XXXX" value={form.signal || ""} onChange={(e) => setForm({ ...form, signal: e.target.value })} />
                  <ContactField label="Line" placeholder="Line ID" value={form.line_app || ""} onChange={(e) => setForm({ ...form, line_app: e.target.value })} />
                  <Input label="Email" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}
            </Section>

            {/* Section 4: Services & Rates */}
            <Section title="Services & Rates" icon={Zap}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((service) => (
                      <button key={service} className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:border-gray-900 transition">
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="1 hour" type="number" value={form.rate_1hour || ""} onChange={(e) => setForm({ ...form, rate_1hour: e.target.value })} />
                  <Input label="2 hours" type="number" value={form.rate_2hours || ""} onChange={(e) => setForm({ ...form, rate_2hours: e.target.value })} />
                  {premium && (
                    <>
                      <Input label="Overnight" type="number" value={form.rate_overnight || ""} onChange={(e) => setForm({ ...form, rate_overnight: e.target.value })} />
                      <Input label="Weekend" type="number" value={form.rate_weekend || ""} onChange={(e) => setForm({ ...form, rate_weekend: e.target.value })} />
                    </>
                  )}
                </div>
              </div>
            </Section>

            {/* Section 5: Hours & Availability */}
            {premium && (
              <Section title="Hours & Availability" icon={Clock}>
                <TextArea label="Opening hours" value={form.opening_hours || ""} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} placeholder="Mon-Fri: 10:00 - 22:00" />
              </Section>
            )}

            {/* Section 6: Social Media & Pay Me */}
            {premium && (
              <Section title="Social Media" icon={MessageCircle}>
                <Input label="OnlyFans username" value={form.onlyfans_username || ""} onChange={(e) => setForm({ ...form, onlyfans_username: e.target.value })} />
              </Section>
            )}

            {/* Premium Features Lock */}
            {!premium && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
                <Lock size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Unlock Premium Features</h3>
                  <p className="text-sm text-blue-800 mb-4">Video, voice messages, more contact methods, custom hours, and more.</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

/* Components */

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Icon size={24} className="text-gray-900" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 mb-4">
      {children}
    </div>
  )
}

function Input({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  )
}

function Select({ label, value, onChange, children }: { label: string; value: any; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        {children}
      </select>
    </div>
  )
}

function TextArea({ label, value, onChange, maxLength, placeholder }: { label: string; value: any; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; maxLength?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={5}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {maxLength && <p className="text-xs text-gray-500 mt-1">{value?.length || 0} / {maxLength} characters</p>}
    </div>
  )
}

function ContactField({ label, icon: Icon, placeholder, value, onChange }: { label: string; icon?: React.ComponentType<any>; placeholder?: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  )
}
