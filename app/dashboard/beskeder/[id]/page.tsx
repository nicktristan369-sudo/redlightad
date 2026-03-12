"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface Conversation {
  id: string
  provider_id: string
  customer_id: string
  listings?: { title: string } | null
}

export default function ChatPage() {
  const params = useParams()
  const convId = params.id as string
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel>

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      // Load conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("*, listings(title)")
        .eq("id", convId)
        .single()

      if (!conv || (conv.provider_id !== user.id && conv.customer_id !== user.id)) {
        router.replace("/dashboard/beskeder")
        return
      }
      setConversation(conv)

      // Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })

      setMessages(msgs || [])
      setLoading(false)

      // Mark as read
      const unreadField = user.id === conv.provider_id ? "provider_unread" : "customer_unread"
      await supabase.from("conversations").update({ [unreadField]: 0 }).eq("id", convId)

      // Subscribe to realtime
      channel = supabase
        .channel(`messages:${convId}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()
    }

    init()
    return () => { channel?.unsubscribe() }
  }, [convId, router])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !userId || !conversation) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage("")

    const supabase = createClient()
    const { error } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: userId,
      content,
    })

    if (!error) {
      // Update conversation last message
      const otherUnreadField = userId === conversation.provider_id ? "customer_unread" : "provider_unread"
      const currentUnread = userId === conversation.provider_id
        ? (conversation as Conversation & { customer_unread?: number }).customer_unread ?? 0
        : (conversation as Conversation & { provider_unread?: number }).provider_unread ?? 0

      await supabase.from("conversations").update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        [otherUnreadField]: currentUnread + 1,
      }).eq("id", convId)
    }
    setSending(false)
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push("/dashboard/beskeder")} className="text-gray-400 hover:text-gray-600">
            ← Tilbage
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {conversation?.listings?.title || "Samtale"}
          </h1>
        </div>

        {/* Messages area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Ingen beskeder endnu — start samtalen!</div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === userId
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-red-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-red-200" : "text-gray-400"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Skriv en besked..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
