"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"

export default function AdminIndstillingerPage() {
  const [currentEmail, setCurrentEmail] = useState("")
  const [grantEmail, setGrantEmail] = useState("")
  const [revokeEmail, setRevokeEmail] = useState("")
  const [grantMsg, setGrantMsg] = useState("")
  const [revokeMsg, setRevokeMsg] = useState("")
  const [grantError, setGrantError] = useState("")
  const [revokeError, setRevokeError] = useState("")
  const [grantLoading, setGrantLoading] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [hasEmailColumn, setHasEmailColumn] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentEmail(user.email || "")
    })

    // Check if profiles table has email column by trying a query
    supabase
      .from("profiles")
      .select("email")
      .limit(1)
      .then(({ error }) => {
        if (error) setHasEmailColumn(false)
      })
  }, [])

  const handleGrant = async () => {
    setGrantError("")
    setGrantMsg("")
    if (!grantEmail.trim()) {
      setGrantError("Indtast en email")
      return
    }
    setGrantLoading(true)
    try {
      const supabase = createClient()
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", grantEmail.trim())
        .single()

      if (findError || !profile) {
        setGrantError("Ingen bruger fundet med den email")
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", profile.id)

      if (updateError) throw updateError
      setGrantMsg(`Admin adgang givet til ${grantEmail}`)
      setGrantEmail("")
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Noget gik galt")
    } finally {
      setGrantLoading(false)
    }
  }

  const handleRevoke = async () => {
    setRevokeError("")
    setRevokeMsg("")
    if (!revokeEmail.trim()) {
      setRevokeError("Indtast en email")
      return
    }
    if (revokeEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setRevokeError("Du kan ikke fjerne din egen admin-adgang via denne side")
      return
    }
    setRevokeLoading(true)
    try {
      const supabase = createClient()
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", revokeEmail.trim())
        .single()

      if (findError || !profile) {
        setRevokeError("Ingen bruger fundet med den email")
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: false })
        .eq("id", profile.id)

      if (updateError) throw updateError
      setRevokeMsg(`Admin adgang fjernet fra ${revokeEmail}`)
      setRevokeEmail("")
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Noget gik galt")
    } finally {
      setRevokeLoading(false)
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Indstillinger</h1>

      <div className="space-y-6 max-w-xl">
        {/* Current status */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Din status</h2>
          <p className="text-sm text-gray-600">
            {currentEmail} &mdash; Du er admin {"\u2705"}
          </p>
        </div>

        {!hasEmailColumn && (
          <div className="rounded-2xl bg-yellow-50 p-6 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Tilf\u00F8j email-kolonne til profiles tabel for at bruge admin-tildeling via email.
            </p>
          </div>
        )}

        {/* Grant admin */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Tildel admin-rolle</h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="bruger@email.dk"
              disabled={!hasEmailColumn}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
            <button
              onClick={handleGrant}
              disabled={grantLoading || !hasEmailColumn}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {grantLoading ? "Gemmer..." : "Giv admin adgang"}
            </button>
          </div>
          {grantError && (
            <p className="mt-2 text-sm text-red-600">{grantError}</p>
          )}
          {grantMsg && (
            <p className="mt-2 text-sm text-green-600">{grantMsg}</p>
          )}
        </div>

        {/* Revoke admin */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Fjern admin-rolle</h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={revokeEmail}
              onChange={(e) => setRevokeEmail(e.target.value)}
              placeholder="bruger@email.dk"
              disabled={!hasEmailColumn}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
            <button
              onClick={handleRevoke}
              disabled={revokeLoading || !hasEmailColumn}
              className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {revokeLoading ? "Gemmer..." : "Fjern admin adgang"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Du kan ikke fjerne din egen admin-adgang via denne side.
          </p>
          {revokeError && (
            <p className="mt-2 text-sm text-red-600">{revokeError}</p>
          )}
          {revokeMsg && (
            <p className="mt-2 text-sm text-green-600">{revokeMsg}</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
