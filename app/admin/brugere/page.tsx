"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"
import Link from "next/link"

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
}

export default function AdminBrugerePage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, is_admin, is_banned, created_at")
          .order("created_at", { ascending: false })

        setProfiles(data || [])
      } catch (err) {
        console.error("Failed to fetch profiles:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  const handleBanToggle = async (id: string, currentlyBanned: boolean) => {
    setActionLoading(id)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({ is_banned: !currentlyBanned })
        .eq("id", id)

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_banned: !currentlyBanned } : p
        )
      )
    } catch (err) {
      console.error("Ban toggle failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = profiles.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.full_name && p.full_name.toLowerCase().includes(q))
    )
  })

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Brugere</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="S\u00F8g efter navn eller email..."
              className="w-full max-w-md rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Ingen brugere fundet
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {filtered.map((profile) => (
                    <div key={profile.id} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {(profile.full_name || profile.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{profile.full_name || "Ingen navn"}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.email || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {profile.is_banned ? (
                            <span className="inline-block rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">Banned</span>
                          ) : (
                            <span className="inline-block rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">Aktiv</span>
                          )}
                          {profile.is_admin && (
                            <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">Admin</span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <Link href={`/admin/annoncer?user_id=${profile.id}`} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Se annoncer</Link>
                          <button onClick={() => handleBanToggle(profile.id, profile.is_banned)} disabled={actionLoading === profile.id} className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${profile.is_banned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>{profile.is_banned ? "Unban" : "Ban"}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">Bruger</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium">Oprettet</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((profile) => (
                        <tr
                          key={profile.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                                {(profile.full_name || profile.email || "?")[0].toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">
                                {profile.full_name || "Ingen navn"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {profile.email || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(profile.created_at).toLocaleDateString("da-DK")}
                          </td>
                          <td className="px-6 py-4">
                            {profile.is_banned ? (
                              <span className="inline-block rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                                Banned
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                                Aktiv
                              </span>
                            )}
                            {profile.is_admin && (
                              <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium ml-1.5">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Link
                                href={`/admin/annoncer?user_id=${profile.id}`}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Se annoncer
                              </Link>
                              <button
                                onClick={() =>
                                  handleBanToggle(profile.id, profile.is_banned)
                                }
                                disabled={actionLoading === profile.id}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 ${
                                  profile.is_banned
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                                }`}
                              >
                                {profile.is_banned ? "Unban" : "Ban"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
