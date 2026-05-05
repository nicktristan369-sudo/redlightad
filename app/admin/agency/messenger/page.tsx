"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import {
  ArrowLeft, Plus, Settings, Search, Send, Trash2, X,
  MessageCircle, QrCode, Wifi, WifiOff, Loader2, Phone,
  Check, CheckCheck, Clock, Smile, Paperclip, MoreVertical,
  MessageSquare, Bot, Volume2, VolumeX, Pin, Archive,
  Users, ChevronDown
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────
interface WhatsAppAccount {
  id: string
  name: string
  phone_number: string | null
  status: "disconnected" | "connecting" | "connected" | "qr_required"
  qr_code: string | null
  avatar_url: string | null
  auto_reply_enabled: boolean
  auto_reply_message: string | null
  created_at: string
  updated_at: string
}

interface WhatsAppChat {
  id: string
  account_id: string
  chat_jid: string
  chat_name: string | null
  chat_avatar: string | null
  is_group: boolean
  unread_count: number
  last_message: string | null
  last_message_at: string | null
  is_pinned: boolean
  is_muted: boolean
  is_archived: boolean
}

interface WhatsAppMessage {
  id: string
  chat_id: string
  account_id: string
  message_id: string | null
  from_me: boolean
  from_jid: string | null
  from_name: string | null
  content: string | null
  message_type: string
  media_url: string | null
  status: string
  quoted_message_id: string | null
  quoted_content: string | null
  timestamp: string
}

type TabFilter = "all" | "whatsapp" | "telegram"

// ─── Helpers ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: WhatsAppAccount["status"] }) {
  const colors: Record<string, string> = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-gray-500",
    qr_required: "bg-orange-500 animate-pulse",
  }
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-500"}`} />
  )
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function MessengerHubPage() {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null)
  const [chats, setChats] = useState<WhatsAppChat[]>([])
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [tabFilter, setTabFilter] = useState<TabFilter>("all")
  const [loading, setLoading] = useState(true)

  // Modals
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAutoReply, setShowAutoReply] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountPhone, setNewAccountPhone] = useState("")
  const [addingAccount, setAddingAccount] = useState(false)

  // Auto-reply state
  const [autoReplyAccountId, setAutoReplyAccountId] = useState<string | null>(null)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState("")
  const [savingAutoReply, setSavingAutoReply] = useState(false)

  // ─── Data Fetching ──────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setAccounts(data)
    setLoading(false)
  }, [])

  const fetchChats = useCallback(async (accountId: string) => {
    const { data } = await supabase
      .from("whatsapp_chats")
      .select("*")
      .eq("account_id", accountId)
      .order("is_pinned", { ascending: false })
      .order("last_message_at", { ascending: false })
    if (data) setChats(data)
  }, [])

  const fetchMessages = useCallback(async (chatId: string) => {
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: true })
    if (data) setMessages(data)
  }, [])

  // ─── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (selectedAccount) {
      fetchChats(selectedAccount.id)
    } else {
      setChats([])
      setSelectedChat(null)
    }
  }, [selectedAccount, fetchChats])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
    } else {
      setMessages([])
    }
  }, [selectedChat, fetchMessages])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime subscriptions
  useEffect(() => {
    const accountSub = supabase
      .channel("whatsapp_accounts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_accounts" }, () => {
        fetchAccounts()
      })
      .subscribe()

    return () => { supabase.removeChannel(accountSub) }
  }, [fetchAccounts])

  useEffect(() => {
    if (!selectedAccount) return

    const chatSub = supabase
      .channel("whatsapp_chats_changes")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "whatsapp_chats",
        filter: `account_id=eq.${selectedAccount.id}`
      }, () => {
        fetchChats(selectedAccount.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(chatSub) }
  }, [selectedAccount, fetchChats])

  useEffect(() => {
    if (!selectedChat) return

    const msgSub = supabase
      .channel("whatsapp_messages_changes")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "whatsapp_messages",
        filter: `chat_id=eq.${selectedChat.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as WhatsAppMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(msgSub) }
  }, [selectedChat])

  // ─── Actions ────────────────────────────────────────────────────────
  async function addAccount() {
    if (!newAccountName.trim()) return
    setAddingAccount(true)
    try {
      const res = await fetch("/api/whatsapp/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAccountName, phone_number: newAccountPhone || null }),
      })
      if (res.ok) {
        const account = await res.json()
        setAccounts(prev => [account, ...prev])
        setShowAddAccount(false)
        setNewAccountName("")
        setNewAccountPhone("")
        setSelectedAccount(account)
      }
    } finally {
      setAddingAccount(false)
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm("Delete this WhatsApp account? All chats and messages will be lost.")) return
    await fetch(`/api/whatsapp/accounts/${id}`, { method: "DELETE" })
    setAccounts(prev => prev.filter(a => a.id !== id))
    if (selectedAccount?.id === id) {
      setSelectedAccount(null)
      setSelectedChat(null)
    }
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedChat || !selectedAccount) return
    const content = messageInput.trim()
    setMessageInput("")

    // Optimistic add
    const optimistic: WhatsAppMessage = {
      id: crypto.randomUUID(),
      chat_id: selectedChat.id,
      account_id: selectedAccount.id,
      message_id: null,
      from_me: true,
      from_jid: null,
      from_name: selectedAccount.name,
      content,
      message_type: "text",
      media_url: null,
      status: "pending",
      quoted_message_id: null,
      quoted_content: null,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    await fetch("/api/whatsapp/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: selectedChat.id,
        account_id: selectedAccount.id,
        content,
      }),
    })
  }

  async function saveAutoReply() {
    if (!autoReplyAccountId) return
    setSavingAutoReply(true)
    try {
      await fetch(`/api/whatsapp/accounts/${autoReplyAccountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_reply_enabled: autoReplyEnabled,
          auto_reply_message: autoReplyMessage,
        }),
      })
      setAccounts(prev =>
        prev.map(a =>
          a.id === autoReplyAccountId
            ? { ...a, auto_reply_enabled: autoReplyEnabled, auto_reply_message: autoReplyMessage }
            : a
        )
      )
      setShowAutoReply(false)
    } finally {
      setSavingAutoReply(false)
    }
  }

  function openAutoReply(account: WhatsAppAccount) {
    setAutoReplyAccountId(account.id)
    setAutoReplyEnabled(account.auto_reply_enabled)
    setAutoReplyMessage(account.auto_reply_message || "")
    setShowAutoReply(true)
  }

  // Filter chats by search
  const filteredChats = chats.filter(c => {
    if (!searchQuery) return !c.is_archived
    const q = searchQuery.toLowerCase()
    return (
      (c.chat_name?.toLowerCase().includes(q) || c.chat_jid.includes(q) || c.last_message?.toLowerCase().includes(q)) &&
      !c.is_archived
    )
  })

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* ═══ Header ═══ */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <a href="/admin/agency" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </a>
          <h1 className="text-lg font-bold tracking-tight">MessengerHub</h1>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-1">
          <button
            onClick={() => setTabFilter("all")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabFilter === "all" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTabFilter("whatsapp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabFilter === "whatsapp" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            WhatsApp
          </button>
          <button
            onClick={() => setTabFilter("telegram")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabFilter === "telegram" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Send size={12} className="text-blue-400" />
            Telegram
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedAccount) openAutoReply(selectedAccount)
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Auto-Reply Settings"
          >
            <Bot size={18} />
          </button>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </header>

      {/* ═══ Body (3-panel layout) ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ──── Left: Accounts Panel ──── */}
        <aside className="w-[220px] shrink-0 border-r border-gray-800 bg-gray-900/50 flex flex-col">
          <div className="px-3 py-3 border-b border-gray-800">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {accounts.length} Account{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-gray-500" size={20} />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-10 px-3">
                <Phone size={28} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No accounts yet</p>
                <p className="text-xs text-gray-600 mt-1">Click &quot;+ Add Account&quot; to start</p>
              </div>
            ) : (
              accounts.map(account => (
                <div
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account)
                    setSelectedChat(null)
                  }}
                  className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-gray-800/50 transition-colors group ${
                    selectedAccount?.id === account.id
                      ? "bg-gray-800/80"
                      : "hover:bg-gray-800/40"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-sm font-bold">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusBadge status={account.status} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {account.phone_number || "No phone"}
                    </p>
                    <p className="text-[10px] text-gray-600 capitalize mt-0.5">
                      {account.status.replace("_", " ")}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteAccount(account.id)
                    }}
                    className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ──── Middle: Conversations Panel ──── */}
        <div className="w-[320px] shrink-0 border-r border-gray-800 flex flex-col bg-gray-950">
          {selectedAccount ? (
            <>
              {/* Search */}
              <div className="px-3 py-3 border-b border-gray-800">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <MessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Messages will appear here when the account receives them
                    </p>
                  </div>
                ) : (
                  filteredChats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-gray-800/30 transition-colors ${
                        selectedChat?.id === chat.id
                          ? "bg-gray-800/60"
                          : "hover:bg-gray-800/30"
                      }`}
                    >
                      {/* Chat Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium shrink-0">
                        {chat.is_group ? (
                          <Users size={16} />
                        ) : (
                          (chat.chat_name || chat.chat_jid).charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {chat.chat_name || chat.chat_jid.split("@")[0]}
                          </p>
                          <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                            {timeAgo(chat.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 truncate">
                            {chat.last_message || "No messages"}
                          </p>
                          {chat.unread_count > 0 && (
                            <span className="ml-2 shrink-0 bg-green-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {chat.unread_count > 99 ? "99+" : chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <MessageSquare size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Select an account</p>
                <p className="text-xs text-gray-600 mt-1">Choose an account from the left panel</p>
              </div>
            </div>
          )}
        </div>

        {/* ──── Right: Chat View ──── */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium">
                    {selectedChat.is_group ? (
                      <Users size={16} />
                    ) : (
                      (selectedChat.chat_name || selectedChat.chat_jid).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedChat.chat_name || selectedChat.chat_jid.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {selectedChat.chat_jid}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedChat.is_muted && <VolumeX size={14} className="text-gray-500" />}
                  {selectedChat.is_pinned && <Pin size={14} className="text-gray-500" />}
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-600">No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from_me ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[65%] rounded-2xl px-3.5 py-2 ${
                          msg.from_me
                            ? "bg-green-800/60 rounded-br-md"
                            : "bg-gray-800 rounded-bl-md"
                        }`}
                      >
                        {/* Quoted message */}
                        {msg.quoted_content && (
                          <div className="border-l-2 border-green-500 pl-2 mb-1.5 text-xs text-gray-400 truncate">
                            {msg.quoted_content}
                          </div>
                        )}

                        {/* Sender name (group chats) */}
                        {!msg.from_me && selectedChat.is_group && msg.from_name && (
                          <p className="text-xs font-medium text-green-400 mb-0.5">
                            {msg.from_name}
                          </p>
                        )}

                        {/* Content */}
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>

                        {/* Time & Status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.from_me && (
                            <span className="text-gray-400">
                              {msg.status === "read" ? (
                                <CheckCheck size={12} className="text-blue-400" />
                              ) : msg.status === "delivered" ? (
                                <CheckCheck size={12} />
                              ) : msg.status === "sent" ? (
                                <Check size={12} />
                              ) : (
                                <Clock size={10} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 shrink-0">
                <div className="flex items-end gap-2">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0 mb-0.5">
                    <Paperclip size={18} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none transition-colors"
                    />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0 mb-0.5">
                    <Smile size={18} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors shrink-0 mb-0.5"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/60 flex items-center justify-center">
                  <MessageCircle size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Select a conversation</p>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a chat from the middle panel to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Add Account Modal ═══ */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold">Add WhatsApp Account</h2>
              <button
                onClick={() => setShowAddAccount(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Account Name *</label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  placeholder="e.g. Business Phone"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={newAccountPhone}
                  onChange={e => setNewAccountPhone(e.target.value)}
                  placeholder="+45 53 71 03 69"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                />
              </div>

              {/* QR Code placeholder */}
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 text-center">
                <QrCode size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">QR Code Pairing</p>
                <p className="text-xs text-gray-600 mt-1">
                  QR code will appear here after connecting to WAHA bridge
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <StatusBadge status="disconnected" />
                  <span className="text-xs text-gray-500">Waiting for bridge connection</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                onClick={() => setShowAddAccount(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAccount}
                disabled={!newAccountName.trim() || addingAccount}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {addingAccount && <Loader2 size={14} className="animate-spin" />}
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Auto-Reply Modal ═══ */}
      {showAutoReply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold">Auto-Reply Settings</h2>
              <button
                onClick={() => setShowAutoReply(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Auto-Reply</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Automatically respond to incoming messages
                  </p>
                </div>
                <button
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    autoReplyEnabled ? "bg-green-600" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      autoReplyEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Auto-Reply Message</label>
                <textarea
                  value={autoReplyMessage}
                  onChange={e => setAutoReplyMessage(e.target.value)}
                  placeholder="Hi! Thanks for reaching out. We'll get back to you shortly..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                onClick={() => setShowAutoReply(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAutoReply}
                disabled={savingAutoReply}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {savingAutoReply && <Loader2 size={14} className="animate-spin" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
