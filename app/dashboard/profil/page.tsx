"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"

export default function ProfilPage() {
  const [email, setEmail] = useState("")
  const [accountType, setAccountType] = useState("")
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setEmail(user.email || "")
      setAccountType(user.user_metadata?.account_type || "")
      setLoading(false)
    })
  }, [router])

  const handlePasswordReset = async () => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil indstillinger</h1>
        <p className="text-gray-500 mb-8">Administrer din konto</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm border border-gray-200">{email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kontotype</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 text-sm border border-gray-200 capitalize">
              {accountType === "provider" ? "Udbyder" : accountType === "customer" ? "Kunde" : "—"}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Adgangskode</h3>
            <button
              onClick={handlePasswordReset}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              Send nulstil adgangskode email
            </button>
            {saved && <p className="text-green-600 text-sm mt-2">Email sendt!</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
