"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

interface SendMessageButtonProps {
  listingId: string
  providerId: string
}

export default function SendMessageButton({ listingId, providerId }: SendMessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      if (user.id === providerId) {
        setError("Du kan ikke sende en besked til dig selv")
        return
      }

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("customer_id", user.id)
        .single()

      if (existing) {
        router.push(`/dashboard/beskeder/${existing.id}`)
        return
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          provider_id: providerId,
          customer_id: user.id,
        })
        .select("id")
        .single()

      if (convError) throw convError
      router.push(`/dashboard/beskeder/${conv.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noget gik galt")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>💬 Send besked</>
        )}
      </button>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}
