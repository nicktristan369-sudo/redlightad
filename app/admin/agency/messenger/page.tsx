"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import {
  ArrowLeft, Plus, Search, Send, Trash2, X,
  MessageCircle, QrCode, Loader2, Phone,
  Check, CheckCheck, Clock, Smile, Paperclip, MoreVertical,
  MessageSquare, Bot, Users, RefreshCw, Wifi, WifiOff,
  LogIn, LogOut, Image as ImageIcon
} from "lucide-react"

// ─── Constants ──────────────────────────────────────────────────────────
const API = "/api/messenger/api"

// ─── Types (matching VPS backend) ───────────────────────────────────────
interface Account {
  id: string
  user_id: string | null
  platform: "whatsapp" | "telegram"
  phone_number: string | null
  display_name: string | null
  session_data: Record<string, unknown>
  status: string // disconnected, connecting, connected, error, qr_required
  last_connected_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  live_status?: {
    accountId: string
    platform: string
    status: string
    uptime: number
    messageCount: { sent: number; received: number }
    reconnectAttempts: number
  }
}

interface Contact {
  id: string
  account_id: string
  platform_contact_id: string
  display_name: string | null
  phone_number: string | null
}

interface Conversation {
  id: string
  account_id: string
  contact_id: string | null
  platform_chat_id: string
  chat_name: string | null
  is_group: boolean
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  contact?: Contact | null
}

interface Message {
  id: string
  conversation_id: string
  account_id: string
  platform_message_id: string | null
  direction: "inbound" | "outbound"
  message_type: string
  content: string | null
  status: string
  is_auto_reply: boolean
  created_at: string
}

type TabFilter = "all" | "whatsapp" | "telegram"

// ─── Helpers ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "nu"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}t`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getEffectiveStatus(account: Account): string {
  return account.live_status?.status || account.status || "disconnected"
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: "bg-green-500",
    online: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    qr_required: "bg-orange-500 animate-pulse",
    awaiting_code: "bg-orange-500 animate-pulse",
    disconnected: "bg-gray-500",
    error: "bg-red-500",
  }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-500"}`} />
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function MessengerHubPage() {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Core state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgInput, setMsgInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [tabFilter, setTabFilter] = useState<TabFilter>("all")
  const [loading, setLoading] = useState(true)
  const [sendingMsg, setSendingMsg] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAutoReply, setShowAutoReply] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPlatform, setNewPlatform] = useState<"whatsapp" | "telegram">("whatsapp")
  const [addingAccount, setAddingAccount] = useState(false)

  // QR code state
  const [qrAccountId, setQrAccountId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrPolling, setQrPolling] = useState(false)

  // Auto-reply
  const [arAccountId, setArAccountId] = useState<string | null>(null)
  const [arEnabled, setArEnabled] = useState(false)
  const [arMessage, setArMessage] = useState("")

  // Derived
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null
  const selectedConv = conversations.find(c => c.id === selectedConvId) || null

  // ─── API calls ──────────────────────────────────────────────────────
  async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...opts,
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  const loadAccounts = useCallback(async () => {
    const data = await apiFetch<Account[]>("/accounts")
    if (data) setAccounts(data)
    setLoading(false)
  }, [])

  const loadConversations = useCallback(async (accountId: string) => {
    const data = await apiFetch<Conversation[]>(`/conversations?account_id=${accountId}`)
    if (data) setConversations(data)
    else setConversations([])
  }, [])

  const loadMessages = useCallback(async (convId: string) => {
    const data = await apiFetch<Message[]>(`/conversations/${convId}/messages`)
    if (data) {
      // Backend returns newest first, we want oldest first
      setMessages([...data].reverse())
    }
  }, [])

  // ─── Effects ────────────────────────────────────────────────────────
  useEffect(() => { loadAccounts() }, [loadAccounts])

  // Poll accounts every 5s for status updates
  useEffect(() => {
    const iv = setInterval(loadAccounts, 5000)
    return () => clearInterval(iv)
  }, [loadAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      loadConversations(selectedAccountId)
      setSelectedConvId(null)
      setMessages([])
    } else {
      setConversations([])
      setSelectedConvId(null)
      setMessages([])
    }
  }, [selectedAccountId, loadConversations])

  useEffect(() => {
    if (selectedConvId) loadMessages(selectedConvId)
    else setMessages([])
  }, [selectedConvId, loadMessages])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime for new messages
  useEffect(() => {
    const msgSub = supabase
      .channel("messenger_messages_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messenger_messages" }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.conversation_id === selectedConvId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
        // Refresh conversation list for preview
        if (selectedAccountId) loadConversations(selectedAccountId)
      })
      .subscribe()

    const convSub = supabase
      .channel("messenger_conversations_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "messenger_conversations" }, () => {
        if (selectedAccountId) loadConversations(selectedAccountId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgSub)
      supabase.removeChannel(convSub)
    }
  }, [selectedAccountId, selectedConvId, loadConversations])

  // Poll conversations every 3s as backup
  useEffect(() => {
    if (!selectedAccountId) return
    const iv = setInterval(() => loadConversations(selectedAccountId), 3000)
    return () => clearInterval(iv)
  }, [selectedAccountId, loadConversations])

  // Poll messages every 3s as backup for active chat
  useEffect(() => {
    if (!selectedConvId) return
    const iv = setInterval(() => loadMessages(selectedConvId), 3000)
    return () => clearInterval(iv)
  }, [selectedConvId, loadMessages])

  // QR code polling
  useEffect(() => {
    if (!qrAccountId || !qrPolling) return
    const iv = setInterval(async () => {
      const data = await apiFetch<{ qr?: string; dataUrl?: string }>(`/accounts/${qrAccountId}/qr`)
      if (data?.dataUrl) {
        setQrDataUrl(data.dataUrl)
      }
      // Check if account connected
      const account = await apiFetch<Account>(`/accounts/${qrAccountId}`)
      if (account) {
        const eff = account.live_status?.status || account.status
        if (eff === "connected" || eff === "online") {
          setQrPolling(false)
          setQrDataUrl(null)
          setQrAccountId(null)
          setShowAddModal(false)
          loadAccounts()
        }
      }
    }, 2000)
    return () => clearInterval(iv)
  }, [qrAccountId, qrPolling, loadAccounts])

  // ─── Actions ────────────────────────────────────────────────────────
  async function createAccount() {
    if (!newName.trim()) return
    setAddingAccount(true)
    try {
      const account = await apiFetch<Account>("/accounts", {
        method: "POST",
        body: JSON.stringify({
          platform: newPlatform,
          display_name: newName.trim(),
          phone_number: newPhone.trim() || null,
        }),
      })
      if (account) {
        await loadAccounts()
        // Auto-connect
        await apiFetch(`/accounts/${account.id}/connect`, { method: "POST" })
        setQrAccountId(account.id)
        setQrPolling(true)
        setSelectedAccountId(account.id)
      }
    } finally {
      setAddingAccount(false)
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm("Slet denne konto? Alle samtaler og beskeder slettes.")) return
    await apiFetch(`/accounts/${id}`, { method: "DELETE" })
    if (selectedAccountId === id) {
      setSelectedAccountId(null)
    }
    loadAccounts()
  }

  async function connectAccount(id: string) {
    await apiFetch(`/accounts/${id}/connect`, { method: "POST" })
    setQrAccountId(id)
    setQrPolling(true)
    loadAccounts()
  }

  async function disconnectAccount(id: string) {
    await apiFetch(`/accounts/${id}/disconnect`, { method: "POST" })
    loadAccounts()
  }

  async function sendMessage() {
    if (!msgInput.trim() || !selectedConv || !selectedAccount) return
    const content = msgInput.trim()
    setMsgInput("")
    setSendingMsg(true)

    // Optimistic add
    const optimistic: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConv.id,
      account_id: selectedAccount.id,
      platform_message_id: null,
      direction: "outbound",
      message_type: "text",
      content,
      status: "pending",
      is_auto_reply: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    await apiFetch("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        account_id: selectedAccount.id,
        chat_id: selectedConv.platform_chat_id,
        content,
      }),
    })

    setSendingMsg(false)
    // Refresh messages to get real DB entry
    setTimeout(() => loadMessages(selectedConv.id), 1000)
  }

  // ─── Filters ────────────────────────────────────────────────────────
  const filteredAccounts = accounts.filter(a => {
    if (tabFilter === "all") return true
    return a.platform === tabFilter
  })

  const filteredConvs = conversations.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.chat_name?.toLowerCase().includes(q) ||
      c.platform_chat_id.toLowerCase().includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q) ||
      c.contact?.display_name?.toLowerCase().includes(q)
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
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">MessengerHub</h1>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-1">
          {(["all", "whatsapp", "telegram"] as TabFilter[]).map(tab => (
            <button
              key={tab}
              onClick={() => setTabFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tabFilter === tab ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "whatsapp" && <span className="w-2 h-2 rounded-full bg-green-500" />}
              {tab === "telegram" && <Send size={12} className="text-blue-400" />}
              {tab === "all" ? "All" : tab === "whatsapp" ? "WhatsApp" : "Telegram"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoReply(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
          >
            <Bot size={16} />
            <span className="hidden md:inline">Auto-Reply</span>
          </button>
          <button
            onClick={() => {
              setShowAddModal(true)
              setNewName("")
              setNewPhone("")
              setNewPlatform("whatsapp")
              setQrDataUrl(null)
              setQrAccountId(null)
              setQrPolling(false)
            }}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </header>

      {/* ═══ Body (3-panel) ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ──── Left: Accounts ──── */}
        <aside className="w-[220px] shrink-0 border-r border-gray-800 bg-gray-900/50 flex flex-col">
          <div className="px-3 py-3 border-b border-gray-800">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {filteredAccounts.length} Account{filteredAccounts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-gray-500" size={20} />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-10 px-3">
                <Phone size={28} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Ingen konti</p>
                <p className="text-xs text-gray-600 mt-1">Klik &quot;+ Add Account&quot;</p>
              </div>
            ) : (
              filteredAccounts.map(account => {
                const eff = getEffectiveStatus(account)
                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-gray-800/50 transition-colors group ${
                      selectedAccountId === account.id ? "bg-gray-800/80" : "hover:bg-gray-800/40"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        account.platform === "whatsapp"
                          ? "bg-gradient-to-br from-green-600 to-green-800"
                          : "bg-gradient-to-br from-blue-500 to-blue-700"
                      }`}>
                        {(account.display_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot status={eff} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{account.display_name || "Unnamed"}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {account.phone_number || account.platform}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-gray-600 capitalize">
                          {eff.replace("_", " ")}
                        </span>
                        {eff === "connected" && account.live_status && (
                          <span className="text-[10px] text-gray-700">
                            • {account.live_status.messageCount.received}↓ {account.live_status.messageCount.sent}↑
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {eff === "disconnected" || eff === "error" ? (
                        <button
                          onClick={e => { e.stopPropagation(); connectAccount(account.id) }}
                          className="p-1 text-green-500 hover:text-green-400"
                          title="Connect"
                        >
                          <LogIn size={13} />
                        </button>
                      ) : eff === "connected" ? (
                        <button
                          onClick={e => { e.stopPropagation(); disconnectAccount(account.id) }}
                          className="p-1 text-yellow-500 hover:text-yellow-400"
                          title="Disconnect"
                        >
                          <LogOut size={13} />
                        </button>
                      ) : null}
                      <button
                        onClick={e => { e.stopPropagation(); deleteAccount(account.id) }}
                        className="p-1 text-gray-600 hover:text-red-500"
                        title="Slet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ──── Middle: Conversations ──── */}
        <div className="w-[320px] shrink-0 border-r border-gray-800 flex flex-col bg-gray-950">
          {selectedAccount ? (
            <>
              {/* Search */}
              <div className="px-3 py-3 border-b border-gray-800">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Søg samtaler..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConvs.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <MessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Ingen samtaler endnu</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Beskeder vises her når kontoen modtager dem
                    </p>
                  </div>
                ) : (
                  filteredConvs.map(conv => {
                    const name = conv.chat_name || conv.contact?.display_name || conv.platform_chat_id.split("@")[0]
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-gray-800/30 transition-colors ${
                          selectedConvId === conv.id ? "bg-gray-800/60" : "hover:bg-gray-800/30"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium shrink-0">
                          {conv.is_group ? <Users size={16} /> : name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{name}</p>
                            <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                              {timeAgo(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-500 truncate">
                              {conv.last_message_preview || "Ingen beskeder"}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="ml-2 shrink-0 bg-green-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {conv.unread_count > 99 ? "99+" : conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <MessageSquare size={32} className="mx-auto text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Vælg en konto</p>
                <p className="text-xs text-gray-600 mt-1">Vælg en konto fra panelet til venstre</p>
              </div>
            </div>
          )}
        </div>

        {/* ──── Right: Chat View ──── */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium">
                    {selectedConv.is_group ? <Users size={16} /> : (selectedConv.chat_name || selectedConv.platform_chat_id).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {selectedConv.chat_name || selectedConv.contact?.display_name || selectedConv.platform_chat_id.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {selectedConv.contact?.phone_number || selectedConv.platform_chat_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => loadMessages(selectedConv.id)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-600">Ingen beskeder i denne samtale</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOutbound = msg.direction === "outbound"
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[65%] rounded-2xl px-3.5 py-2 ${
                          isOutbound
                            ? "bg-green-800/60 rounded-br-md"
                            : "bg-gray-800 rounded-bl-md"
                        }`}>
                          {/* Media indicator */}
                          {msg.message_type !== "text" && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                              <ImageIcon size={12} />
                              <span className="capitalize">{msg.message_type}</span>
                            </div>
                          )}

                          {/* Auto-reply badge */}
                          {msg.is_auto_reply && isOutbound && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-1">
                              <Bot size={10} />
                              <span>Auto-reply</span>
                            </div>
                          )}

                          {/* Content */}
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content || `[${msg.message_type}]`}
                          </p>

                          {/* Time & Status */}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-gray-500">
                              {formatTime(msg.created_at)}
                            </span>
                            {isOutbound && (
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
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 shrink-0">
                {getEffectiveStatus(selectedAccount!) !== "connected" ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-gray-500 text-sm">
                    <WifiOff size={16} />
                    <span>Konto er ikke forbundet — kan ikke sende beskeder</span>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0 mb-0.5">
                      <Paperclip size={18} />
                    </button>
                    <div className="flex-1">
                      <textarea
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Skriv en besked..."
                        rows={1}
                        className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!msgInput.trim() || sendingMsg}
                      className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors shrink-0 mb-0.5"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/60 flex items-center justify-center">
                  <MessageCircle size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Vælg en samtale</p>
                <p className="text-sm text-gray-600 mt-1">Vælg en chat for at begynde at skrive</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Add Account Modal ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { if (!qrPolling) setShowAddModal(false) }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold">Tilføj Konto</h2>
              <button onClick={() => { setShowAddModal(false); setQrPolling(false) }} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Platform selector */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Platform</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewPlatform("whatsapp")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      newPlatform === "whatsapp"
                        ? "border-green-600 bg-green-600/20 text-green-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setNewPlatform("telegram")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      newPlatform === "telegram"
                        ? "border-blue-600 bg-blue-600/20 text-blue-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    Telegram
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Konto Navn *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="f.eks. Business WhatsApp"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Telefonnummer (valgfrit)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+45 53 71 03 69"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>

              {/* QR Code area */}
              {qrPolling && (
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
                  {qrDataUrl ? (
                    <>
                      <img src={qrDataUrl} alt="QR Code" className="mx-auto w-[250px] h-[250px] rounded-lg" />
                      <p className="text-sm text-green-400 mt-3 font-medium">Scan QR-koden med WhatsApp</p>
                      <p className="text-xs text-gray-500 mt-1">Åbn WhatsApp → Indstillinger → Linked Devices → Link a Device</p>
                    </>
                  ) : (
                    <>
                      <Loader2 size={40} className="mx-auto text-gray-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-400">Venter på QR-kode...</p>
                      <p className="text-xs text-gray-600 mt-1">Forbinder til WhatsApp Web...</p>
                    </>
                  )}
                </div>
              )}

              {!qrPolling && (
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 text-center">
                  <QrCode size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">QR Code Pairing</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Tryk &quot;Tilføj&quot; for at oprette kontoen og begynde pairing
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                onClick={() => { setShowAddModal(false); setQrPolling(false) }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                {qrPolling ? "Luk" : "Annuller"}
              </button>
              {!qrPolling && (
                <button
                  onClick={createAccount}
                  disabled={!newName.trim() || addingAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg"
                >
                  {addingAccount && <Loader2 size={14} className="animate-spin" />}
                  Tilføj & Forbind
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Auto-Reply Modal ═══ */}
      {showAutoReply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAutoReply(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold">Auto-Reply Indstillinger</h2>
              <button onClick={() => setShowAutoReply(false)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-gray-400 mb-4">
                Auto-reply regler styres fra VPS backend. Brug API endpoint:
              </p>
              <code className="block bg-gray-800 px-3 py-2 rounded-lg text-xs text-green-400 mb-4">
                GET /api/messenger/api/autoreply/rules
              </code>
              <p className="text-xs text-gray-500">
                Fuld auto-reply UI kommer snart. I mellemtiden kan regler tilføjes via API.
              </p>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-800">
              <button onClick={() => setShowAutoReply(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                Luk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
