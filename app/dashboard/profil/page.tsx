"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { CreditCard, Banknote, Coins, Zap } from "lucide-react"

const PAYMENT_OPTIONS = [
  { id: "revolut",   label: "Revolut",    icon: CreditCard },
  { id: "cash",      label: "Cash",       icon: Banknote },
  { id: "redcoins",  label: "Red Coins",  icon: Coins },
  { id: "crypto",    label: "Crypto",     icon: Zap },
]

export default function ProfilPage() {
  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState("")
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [listingId, setListingId] = useState<string | null>(null)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setEmail(user.email || "")
      setAccountType(user.user_metadata?.account_type || "")

      // Fetch listing payment_methods
      const { data: listing } = await supabase
        .from("listings")
        .select("id, payment_methods")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (listing) {
        setListingId(listing.id)
        setPaymentMethods(listing.payment_methods || [])
      }

      setLoading(false)
    })
  }, [router])

  const handlePasswordReset = async () => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const togglePayment = (id: string) => {
    setPaymentMethods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const savePaymentMethods = async () => {
    if (!listingId) return
    setPaymentSaving(true)
    const supabase = createClient()
    await supabase
      .from("listings")
      .update({ payment_methods: paymentMethods })
      .eq("id", listingId)
    setPaymentSaving(false)
    setPaymentSaved(true)
    setTimeout(() => setPaymentSaved(false), 3000)
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-500 mb-8">Manage your account</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm border border-gray-200">{email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm border border-gray-200 capitalize">
              {accountType === "provider" ? "Provider" : accountType === "customer" ? "Customer" : "—"}
            </div>
          </div>

          {/* Payment Methods */}
          {listingId && (
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Methods</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {PAYMENT_OPTIONS.map(opt => {
                  const active = paymentMethods.includes(opt.id)
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => togglePayment(opt.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        active
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={savePaymentMethods}
                disabled={paymentSaving}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {paymentSaving ? "Saving..." : "Save payment methods"}
              </button>
              {paymentSaved && <p className="text-green-600 text-sm mt-2">Payment methods saved!</p>}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Password</h3>
            <button
              onClick={handlePasswordReset}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              Send password reset email
            </button>
            {saved && <p className="text-green-600 text-sm mt-2">Email sent!</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
