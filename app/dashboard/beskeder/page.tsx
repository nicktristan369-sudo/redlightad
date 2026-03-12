"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"

interface Conversation {
  id: string
  listing_id: string | null
  provider_id: string
  customer_id: string
  last_message: string | null
  last_message_at: string
  provider_unread: number
  customer_unread: number
  listings?: { title: string } | null
}

export default function BeskederPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const { data } = await supabase
        .from("conversations")
        .select("*, listings(title)")
        .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false })

      setConversations(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const getUnread = (conv: Conversation) => {
    if (!userId) return 0
    return userId === conv.provider_id ? conv.provider_unread : conv.customer_unread
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diffH = (now.getTime() - d.getTime()) / 3600000
    if (diffH < 24) return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" })
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Beskeder</h1>
        <p className="text-gray-500 text-sm mb-6">{conversations.length} samtale{conversations.length !== 1 ? "r" : ""}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-5xl mb-4">💬</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen beskeder endnu</h2>
            <p className="text-gray-500">Samtaler med brugere vises her</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {conversations.map((conv) => {
              const unread = getUnread(conv)
              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/beskeder/${conv.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold flex-shrink-0">
                    💬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {conv.listings?.title || "Annonce slettet"}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.last_message || "Ingen beskeder endnu"}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
