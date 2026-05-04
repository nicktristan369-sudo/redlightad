"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Smartphone, Plus, Settings, MessageSquare, Send, Search, X, ChevronLeft,
  Wifi, WifiOff, Bot, Hand, MoreVertical, RefreshCw, Trash2, QrCode,
  Bell, BellOff, Volume2, Filter, Check, CheckCheck, AlertTriangle,
  Zap, Clock, Hash, Brain, ToggleLeft, ToggleRight, ArrowLeft
} from "lucide-react"
import Link from "next/link"

const API_BASE = "/api/messenger"
// All backend routes start with /api/ which maps to /api/messenger/api/ via proxy
const WS_URL = "wss://redlightad.com/api/messenger/ws"  // WebSocket needs direct connection for now
const DIRECT_WS_URL = "ws://76.13.154.9:3001/ws"  // Fallback

// Types
interface Account {
  id: string
  phone_number: string
  platform: "whatsapp" | "telegram"
  display_name: string | null
  status: "online" | "connecting" | "disconnected" | "banned" | "qr_pending"
  is_active: boolean
  created_at: string
}

interface Conversation {
  id: string
  account_id: string
  contact_id: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  is_muted: boolean
  auto_reply_enabled: boolean
  contact?: {
    display_name: string | null
    phone_number: string | null
    avatar_url: string | null
  }
}

interface Message {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  message_type: string
  body: string | null
  media_url: string | null
  status: string
  is_auto_reply: boolean
  timestamp: string
}

interface AutoReplyRule {
  id: string
  name: string
  enabled: boolean
  priority: number
  trigger_type: string
  trigger_config: Record<string, unknown>
  response_text: string | null
  delay_seconds: number
  delay_randomize: boolean
  platforms: string[]
  max_per_contact: number
  cooldown_minutes: number
  stats_sent: number
  stats_last_used: string | null
}

// Platform icon
function PlatformIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  if (platform === "whatsapp") return <span style={{ fontSize: size }}>💬</span>
  if (platform === "telegram") return <span style={{ fontSize: size }}>✈️</span>
  return <Smartphone size={size} />
}

// Status dot
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    qr_pending: "bg-blue-500 animate-pulse",
    disconnected: "bg-gray-500",
    banned: "bg-red-500",
  }
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-500"}`} />
}

export default function MessengerHubPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [rules, setRules] = useState<AutoReplyRule[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null)
  const [msgInput, setMsgInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"chat" | "autoreply">("chat")
  const [platformFilter, setPlatformFilter] = useState<"all" | "whatsapp" | "telegram">("all")
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [telegramCode, setTelegramCode] = useState("")
  const [showTelegramCode, setShowTelegramCode] = useState(false)
  const [pendingTelegramAccount, setPendingTelegramAccount] = useState<string | null>(null)
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch helpers
  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } })
    return res.json()
  }, [])

  // Load accounts
  const loadAccounts = useCallback(async () => {
    try { const data = await api("/api/accounts"); setAccounts(data || []) }
    catch (e) { console.error("Failed to load accounts:", e) }
  }, [api])

  // Load conversations for account
  const loadConversations = useCallback(async (accountId: string) => {
    try { const data = await api(`/api/conversations?account_id=${accountId}`); setConversations(data || []) }
    catch (e) { console.error(e) }
  }, [api])

  // Load messages for conversation
  const loadMessages = useCallback(async (convoId: string) => {
    try { const data = await api(`/api/conversations/${convoId}/messages`); setMessages(data || []) }
    catch (e) { console.error(e) }
  }, [api])

  // Load auto-reply rules
  const loadRules = useCallback(async () => {
    try { const data = await api("/api/autoreply/rules"); setRules(data || []) }
    catch (e) { console.error(e) }
  }, [api])

  // Initial load
  useEffect(() => {
    const init = async () => {
      await loadAccounts()
      await loadRules()
      setLoading(false)
    }
    init()
  }, [loadAccounts, loadRules])

  // WebSocket with fallback to polling
  useEffect(() => {
    let ws: WebSocket | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let wsConnected = false

    const handleEvent = (data: Record<string, unknown>) => {
      switch (data.type) {
        case "qr_code":
          setQrImage(data.qrImage as string)
          setShowQr(true)
          break
        case "account_ready":
          loadAccounts()
          setShowQr(false)
          setShowTelegramCode(false)
          break
        case "account_disconnected":
          loadAccounts()
          break
        case "new_message":
          if (data.conversationId === selectedConvo) loadMessages(data.conversationId as string)
          if (selectedAccount) loadConversations(selectedAccount)
          break
        case "message_status":
          setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status as string } : m))
          break
        case "auto_reply_sent":
          if (data.conversationId === selectedConvo) loadMessages(data.conversationId as string)
          break
        case "telegram_code_required":
          setPendingTelegramAccount(data.accountId as string)
          setShowTelegramCode(true)
          break
      }
    }

    const connectWs = () => {
      try {
        ws = new WebSocket(DIRECT_WS_URL)
        ws.onopen = () => {
          console.log("[WS] Connected")
          wsConnected = true
          if (accounts.length > 0) ws?.send(JSON.stringify({ type: "subscribe", accountIds: accounts.map(a => a.id) }))
        }
        ws.onmessage = (e) => { try { handleEvent(JSON.parse(e.data)) } catch {} }
        ws.onerror = () => { wsConnected = false }
        ws.onclose = () => { wsConnected = false; setTimeout(connectWs, 5000) }
        wsRef.current = ws
      } catch {
        // WebSocket blocked (mixed content) — use polling
        wsConnected = false
      }
    }

    // Polling fallback — refresh accounts + conversations periodically
    pollInterval = setInterval(() => {
      loadAccounts()
      if (selectedAccount) loadConversations(selectedAccount)
      if (selectedConvo) loadMessages(selectedConvo)
    }, 5000)

    connectWs()

    return () => {
      ws?.close()
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [accounts.length])

  // When account selected
  useEffect(() => {
    if (selectedAccount) {
      loadConversations(selectedAccount)
      setSelectedConvo(null)
      setMessages([])
    }
  }, [selectedAccount, loadConversations])

  // When conversation selected
  useEffect(() => {
    if (selectedConvo) loadMessages(selectedConvo)
  }, [selectedConvo, loadMessages])

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedConvo || !selectedAccount) return
    const convo = conversations.find(c => c.id === selectedConvo)
    if (!convo?.contact?.phone_number && !convo?.contact?.display_name) return

    try {
      await api("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({
          account_id: selectedAccount,
          remote_id: convo?.contact?.phone_number || "",
          text: msgInput.trim(),
          conversation_id: selectedConvo,
        }),
      })
      setMsgInput("")
      await loadMessages(selectedConvo)
    } catch (e) { console.error(e) }
  }

  // Add account
  const addAccount = async (platform: "whatsapp" | "telegram", phoneNumber: string) => {
    try {
      console.log("[MessengerHub] Adding account:", platform, phoneNumber)
      const acc = await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ platform, phone_number: phoneNumber }),
      })
      console.log("[MessengerHub] Account created:", acc)
      if (!acc?.id) { alert("Failed to create account"); return }
      await loadAccounts()
      setShowAddAccount(false)

      // Connect
      console.log("[MessengerHub] Connecting account:", acc.id)
      const res = await api(`/api/accounts/${acc.id}/connect`, { method: "POST" })
      console.log("[MessengerHub] Connect response:", res)
      if (platform === "whatsapp") {
        if (res.qrImage || res.dataUrl) {
          setQrImage(res.dataUrl || res.qrImage)
          setShowQr(true)
        } else {
          // QR may take a few seconds to generate
          setTimeout(async () => {
            try {
              const qrRes = await api(`/api/accounts/${acc.id}/qr`)
              if (qrRes.dataUrl) { setQrImage(qrRes.dataUrl); setShowQr(true) }
            } catch {}
          }, 5000)
        }
      }
      await loadAccounts()
    } catch (e) { console.error("[MessengerHub] Error:", e); alert("Connection failed: " + (e as Error).message) }
  }

  // Connect/disconnect
  const connectAccount = async (id: string) => {
    const res = await api(`/api/accounts/${id}/connect`, { method: "POST" })
    if (res.qrImage || res.dataUrl) { setQrImage(res.dataUrl || res.qrImage); setShowQr(true) }
    loadAccounts()
    // Poll for QR if not received immediately
    setTimeout(async () => {
      try {
        const qrRes = await api(`/api/accounts/${id}/qr`)
        if (qrRes.dataUrl) { setQrImage(qrRes.dataUrl); setShowQr(true) }
      } catch {}
    }, 3000)
  }

  const disconnectAccount = async (id: string) => {
    await api(`/api/accounts/${id}/disconnect`, { method: "POST" })
    loadAccounts()
  }

  const deleteAccount = async (id: string) => {
    if (!confirm("Delete this account?")) return
    await api(`/api/accounts/${id}`, { method: "DELETE" })
    if (selectedAccount === id) { setSelectedAccount(null); setConversations([]); setMessages([]) }
    loadAccounts()
  }

  // Submit Telegram code
  const submitTelegramCode = () => {
    if (pendingTelegramAccount && telegramCode) {
      // Try WebSocket first, then API
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "telegram_code", accountId: pendingTelegramAccount, code: telegramCode }))
      } else {
        api(`/accounts/${pendingTelegramAccount}/code`, { method: "POST", body: JSON.stringify({ code: telegramCode }) }).catch(console.error)
      }
      setTelegramCode("")
      setShowTelegramCode(false)
    }
  }

  // Toggle auto-reply rule
  const toggleRule = async (id: string) => {
    await api(`/api/autoreply/rules/${id}/toggle`, { method: "PATCH" })
    loadRules()
  }

  // Delete rule
  const deleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return
    await api(`/api/autoreply/rules/${id}`, { method: "DELETE" })
    loadRules()
  }

  // Filter accounts
  const filteredAccounts = accounts.filter(a => platformFilter === "all" || a.platform === platformFilter)

  // Filter conversations
  const filteredConvos = conversations.filter(c => {
    if (!searchQuery) return true
    const name = (c.contact?.display_name || c.contact?.phone_number || "").toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-gray-700 border-t-red-500 rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/agency" className="p-1 hover:bg-gray-800 rounded"><ArrowLeft className="w-5 h-5 text-gray-400" /></Link>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5" /></div>
          <h1 className="font-bold text-lg">MessengerHub</h1>
          <div className="flex gap-1 ml-2">
            {(["all", "whatsapp", "telegram"] as const).map(p => (
              <button key={p} onClick={() => setPlatformFilter(p)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${platformFilter === p ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
                {p === "all" ? "All" : p === "whatsapp" ? "💬 WhatsApp" : "✈️ Telegram"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab(tab === "chat" ? "autoreply" : "chat")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${tab === "autoreply" ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
            <Zap className="w-3.5 h-3.5 inline mr-1" /> Auto-Reply
          </button>
          <button onClick={() => setShowAddAccount(true)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition">
            <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Account
          </button>
        </div>
      </header>

      {tab === "chat" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Accounts */}
          <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 font-medium mb-2">{filteredAccounts.length} Accounts</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredAccounts.map(acc => (
                <div key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-gray-800/50 transition ${selectedAccount === acc.id ? "bg-gray-800" : "hover:bg-gray-800/50"}`}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <PlatformIcon platform={acc.platform} size={20} />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={acc.status} /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{acc.display_name || acc.phone_number}</p>
                    <p className="text-[10px] text-gray-500">{acc.phone_number} · {acc.status}</p>
                  </div>
                  <div className="flex gap-1">
                    {acc.status === "disconnected" ? (
                      <button onClick={(e) => { e.stopPropagation(); connectAccount(acc.id) }} className="p-1 hover:bg-gray-700 rounded" title="Connect"><Wifi className="w-3.5 h-3.5 text-green-400" /></button>
                    ) : acc.status === "online" ? (
                      <button onClick={(e) => { e.stopPropagation(); disconnectAccount(acc.id) }} className="p-1 hover:bg-gray-700 rounded" title="Disconnect"><WifiOff className="w-3.5 h-3.5 text-gray-400" /></button>
                    ) : null}
                    <button onClick={(e) => { e.stopPropagation(); deleteAccount(acc.id) }} className="p-1 hover:bg-gray-700 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              ))}
              {filteredAccounts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Smartphone className="w-8 h-8 mb-2" />
                  <p className="text-xs">No accounts yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Conversations */}
          <div className="w-80 bg-gray-900/50 border-r border-gray-800 flex flex-col flex-shrink-0">
            {selectedAccount ? (
              <>
                <div className="p-3 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-gray-600" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConvos.map(c => (
                    <div key={c.id} onClick={() => setSelectedConvo(c.id)}
                      className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-gray-800/30 transition ${selectedConvo === c.id ? "bg-gray-800" : "hover:bg-gray-800/30"}`}>
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-300 flex-shrink-0">
                        {(c.contact?.display_name || c.contact?.phone_number || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${c.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                            {c.contact?.display_name || c.contact?.phone_number || "Unknown"}
                          </p>
                          {c.last_message_at && <span className="text-[10px] text-gray-500 flex-shrink-0">{new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">{c.last_message || "No messages"}</p>
                          {c.unread_count > 0 && <span className="bg-red-600 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">{c.unread_count}</span>}
                        </div>
                      </div>
                      {c.auto_reply_enabled && <span title="Auto-reply on"><Bot className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /></span>}
                    </div>
                  ))}
                  {filteredConvos.length === 0 && selectedAccount && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <p className="text-xs">No conversations yet</p>
                      <p className="text-[10px] mt-1">Messages will appear when received</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                <p className="text-xs">Select an account</p>
              </div>
            )}
          </div>

          {/* Right: Chat */}
          <div className="flex-1 flex flex-col bg-gray-950">
            {selectedConvo ? (
              <>
                {/* Chat header */}
                <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold">
                      {(conversations.find(c => c.id === selectedConvo)?.contact?.display_name || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{conversations.find(c => c.id === selectedConvo)?.contact?.display_name || "Unknown"}</p>
                      <p className="text-[10px] text-gray-500">{conversations.find(c => c.id === selectedConvo)?.contact?.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversations.find(c => c.id === selectedConvo)?.auto_reply_enabled ? (
                      <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded"><Bot className="w-3 h-3" /> Auto-reply ON</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded"><Hand className="w-3 h-3" /> Manual</span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)" }}>
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                        m.direction === "outbound"
                          ? m.is_auto_reply
                            ? "bg-purple-600/80 text-white rounded-br-md"
                            : "bg-red-600 text-white rounded-br-md"
                          : "bg-gray-800 text-gray-100 rounded-bl-md"
                      }`}>
                        {m.is_auto_reply && <p className="text-[9px] text-purple-200 mb-0.5 flex items-center gap-1"><Bot className="w-2.5 h-2.5" /> Auto-reply</p>}
                        <p className="break-words whitespace-pre-wrap">{m.body}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[9px] opacity-60">{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {m.direction === "outbound" && (
                            m.status === "read" ? <CheckCheck className="w-3 h-3 text-blue-400" /> :
                            m.status === "delivered" ? <CheckCheck className="w-3 h-3 opacity-60" /> :
                            <Check className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-800 p-3 bg-gray-900">
                  <div className="flex gap-2 items-end">
                    <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-600" />
                    <button onClick={sendMessage} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AUTO-REPLY TAB */
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Auto-Reply Rules</h2>
                <p className="text-sm text-gray-500">{rules.length} rules · {rules.filter(r => r.enabled).length} active</p>
              </div>
              <button onClick={() => { setEditingRule(null); setShowRuleEditor(true) }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition">
                <Plus className="w-4 h-4 inline mr-1" /> New Rule
              </button>
            </div>

            <div className="space-y-3">
              {rules.sort((a, b) => a.priority - b.priority).map(rule => (
                <div key={rule.id} className={`bg-gray-900 border rounded-xl p-4 transition ${rule.enabled ? "border-purple-500/30" : "border-gray-800 opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleRule(rule.id)} className="flex-shrink-0">
                        {rule.enabled ? <ToggleRight className="w-6 h-6 text-purple-400" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                      </button>
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 flex items-center gap-1">
                            {rule.trigger_type === "keyword" && <><Hash className="w-2.5 h-2.5" /> Keyword</>}
                            {rule.trigger_type === "first_message" && <><MessageSquare className="w-2.5 h-2.5" /> First message</>}
                            {rule.trigger_type === "schedule" && <><Clock className="w-2.5 h-2.5" /> Schedule</>}
                            {rule.trigger_type === "ai_fallback" && <><Brain className="w-2.5 h-2.5" /> AI Fallback</>}
                            {rule.trigger_type === "regex" && <><Hash className="w-2.5 h-2.5" /> Regex</>}
                            {rule.trigger_type === "all_messages" && <><Zap className="w-2.5 h-2.5" /> All messages</>}
                          </span>
                          <span className="text-[10px] text-gray-500">Priority {rule.priority}</span>
                          <span className="text-[10px] text-gray-500">{rule.delay_seconds}s delay</span>
                          {rule.stats_sent > 0 && <span className="text-[10px] text-purple-400">{rule.stats_sent} sent</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingRule(rule); setShowRuleEditor(true) }} className="p-1.5 hover:bg-gray-800 rounded"><Settings className="w-3.5 h-3.5 text-gray-400" /></button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 hover:bg-gray-800 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  {rule.response_text && (
                    <div className="mt-2 ml-9 p-2 bg-gray-800/50 rounded text-xs text-gray-400 truncate">{rule.response_text}</div>
                  )}
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No auto-reply rules yet</p>
                  <p className="text-xs mt-1">Create rules to automatically respond to messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} onAdd={addAccount} />}

      {/* QR Code Modal */}
      {showQr && qrImage && (
        <Modal onClose={() => setShowQr(false)}>
          <div className="text-center">
            <QrCode className="w-8 h-8 mx-auto mb-3 text-green-400" />
            <h3 className="text-lg font-bold mb-1">Scan QR Code</h3>
            <p className="text-sm text-gray-400 mb-4">Open WhatsApp on your phone → Linked Devices → Scan this code</p>
            <img src={qrImage} alt="QR Code" className="mx-auto rounded-lg" style={{ width: 280, height: 280 }} />
            <p className="text-xs text-gray-500 mt-3">QR code expires in 60 seconds</p>
          </div>
        </Modal>
      )}

      {/* Telegram Code Modal */}
      {showTelegramCode && (
        <Modal onClose={() => setShowTelegramCode(false)}>
          <div className="text-center">
            <span className="text-4xl mb-3 block">✈️</span>
            <h3 className="text-lg font-bold mb-1">Enter Telegram Code</h3>
            <p className="text-sm text-gray-400 mb-4">A verification code was sent to your phone via SMS</p>
            <input type="text" value={telegramCode} onChange={e => setTelegramCode(e.target.value)} placeholder="Enter code..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500"
              onKeyDown={e => { if (e.key === "Enter") submitTelegramCode() }} />
            <button onClick={submitTelegramCode} className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">Verify</button>
          </div>
        </Modal>
      )}

      {/* Rule Editor Modal */}
      {showRuleEditor && <RuleEditorModal rule={editingRule} onClose={() => setShowRuleEditor(false)} onSave={async (data) => {
        if (editingRule) {
          await api(`/api/autoreply/rules/${editingRule.id}`, { method: "PUT", body: JSON.stringify(data) })
        } else {
          await api("/api/autoreply/rules", { method: "POST", body: JSON.stringify(data) })
        }
        loadRules()
        setShowRuleEditor(false)
      }} />}
    </div>
  )
}

// Modal wrapper
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// Add Account Modal
function AddAccountModal({ onClose, onAdd }: { onClose: () => void; onAdd: (platform: "whatsapp" | "telegram", phone: string) => void }) {
  const [platform, setPlatform] = useState<"whatsapp" | "telegram">("whatsapp")
  const [phone, setPhone] = useState("")

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold mb-4">Add Messenger Account</h3>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setPlatform("whatsapp")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition border ${platform === "whatsapp" ? "bg-green-600/20 border-green-500 text-green-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
          💬 WhatsApp
        </button>
        <button onClick={() => setPlatform("telegram")} className={`flex-1 py-3 rounded-lg text-sm font-medium transition border ${platform === "telegram" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
          ✈️ Telegram
        </button>
      </div>
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+45 XX XX XX XX"
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-600 mb-4" />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">Cancel</button>
        <button onClick={() => phone && onAdd(platform, phone)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition">Connect</button>
      </div>
    </Modal>
  )
}

// Rule Editor Modal
function RuleEditorModal({ rule, onClose, onSave }: { rule: AutoReplyRule | null; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    name: rule?.name || "",
    trigger_type: rule?.trigger_type || "keyword",
    trigger_config: rule?.trigger_config || {},
    response_text: rule?.response_text || "",
    delay_seconds: rule?.delay_seconds || 5,
    delay_randomize: rule?.delay_randomize ?? true,
    priority: rule?.priority || 10,
    platforms: rule?.platforms || ["whatsapp", "telegram"],
    max_per_contact: rule?.max_per_contact || 1,
    cooldown_minutes: rule?.cooldown_minutes || 60,
    enabled: rule?.enabled ?? true,
  })

  const [keywords, setKeywords] = useState<string>((form.trigger_config as any)?.keywords?.join(", ") || "")

  const save = () => {
    const config = { ...form.trigger_config } as Record<string, unknown>
    if (form.trigger_type === "keyword") config.keywords = keywords.split(",").map(k => k.trim()).filter(Boolean)
    onSave({ ...form, trigger_config: config })
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg font-bold mb-4">{rule ? "Edit Rule" : "New Auto-Reply Rule"}</h3>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Rule Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" placeholder="e.g. Welcome message" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Trigger Type</label>
          <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none">
            <option value="first_message">First Message</option>
            <option value="keyword">Keyword Match</option>
            <option value="all_messages">All Messages</option>
            <option value="schedule">Outside Hours</option>
            <option value="regex">Regex</option>
            <option value="ai_fallback">AI Fallback (Claude)</option>
          </select>
        </div>
        {form.trigger_type === "keyword" && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Keywords (comma-separated)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" placeholder="pris, koster, price" />
          </div>
        )}
        {form.trigger_type !== "ai_fallback" && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Response Text</label>
            <textarea value={form.response_text} onChange={e => setForm({ ...form, response_text: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none resize-none" placeholder="Hi! Thanks for your message..." />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Delay (seconds)</label>
            <input type="number" value={form.delay_seconds} onChange={e => setForm({ ...form, delay_seconds: parseInt(e.target.value) || 5 })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Priority</label>
            <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Max per contact/day</label>
            <input type="number" value={form.max_per_contact} onChange={e => setForm({ ...form, max_per_contact: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cooldown (minutes)</label>
            <input type="number" value={form.cooldown_minutes} onChange={e => setForm({ ...form, cooldown_minutes: parseInt(e.target.value) || 60 })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">Cancel</button>
        <button onClick={save} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition">Save Rule</button>
      </div>
    </Modal>
  )
}
