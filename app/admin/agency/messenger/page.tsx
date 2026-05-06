"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import {
  ArrowLeft, Plus, Search, Send, Trash2, X,
  MessageCircle, QrCode, Loader2, Phone,
  Check, CheckCheck, Clock, Smile, Paperclip, MoreVertical,
  MessageSquare, Bot, Users, RefreshCw, Wifi, WifiOff,
  LogIn, LogOut, Image as ImageIcon, Zap, Settings,
  ToggleLeft, ToggleRight, Edit2, ChevronDown, Activity,
  AlertCircle, Hash, Type, Calendar, Brain, Radio
} from "lucide-react"

// ─── Constants ──────────────────────────────────────────────────────────
const API = "/api/messenger/api"

// ─── Types ──────────────────────────────────────────────────────────────
interface Account {
  id: string
  user_id: string | null
  platform: "whatsapp" | "telegram"
  phone_number: string | null
  display_name: string | null
  session_data: Record<string, unknown>
  status: string
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
  auto_reply_rule_id?: string | null
  created_at: string
}

interface AutoReplyRule {
  id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  response_text: string | null
  enabled: boolean
  priority: number
  delay_seconds: number
  delay_randomize: boolean
  platforms: string[]
  schedule_active: Record<string, unknown>
  max_per_contact: number
  cooldown_minutes: number
  stats_sent: number
  stats_last_used: string | null
  created_at: string
}

interface AutoReplyLogEntry {
  id: string
  rule_name: string
  contact_name: string
  platform: string
  response_sent: string
  trigger_message: string
  processing_time_ms: number
  created_at: string
}

interface AutoReplyStats {
  totalSent: number
  sentToday: number
  activeRules: number
  topRule: { name: string; count: number } | null
  avgResponseTime: number
}

type TabFilter = "all" | "whatsapp" | "telegram"
type MainView = "chat" | "autoreply"

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("da-DK", {
    day: "2-digit",
    month: "short",
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

const TRIGGER_ICONS: Record<string, typeof Bot> = {
  first_message: MessageCircle,
  keyword: Hash,
  regex: Type,
  schedule: Calendar,
  ai_fallback: Brain,
  all_messages: Radio,
}

const TRIGGER_LABELS: Record<string, string> = {
  first_message: "Første besked",
  keyword: "Nøgleord",
  regex: "Regex",
  schedule: "Tidsplan",
  ai_fallback: "AI Fallback",
  all_messages: "Alle beskeder",
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
  const [mainView, setMainView] = useState<MainView>("chat")

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPlatform, setNewPlatform] = useState<"whatsapp" | "telegram">("whatsapp")
  const [addingAccount, setAddingAccount] = useState(false)

  // QR code state
  const [qrAccountId, setQrAccountId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrPolling, setQrPolling] = useState(false)

  // Auto-reply state
  const [arRules, setArRules] = useState<AutoReplyRule[]>([])
  const [arLog, setArLog] = useState<AutoReplyLogEntry[]>([])
  const [arStats, setArStats] = useState<AutoReplyStats | null>(null)
  const [arEditRule, setArEditRule] = useState<AutoReplyRule | null>(null)
  const [arShowEditor, setArShowEditor] = useState(false)
  const [arSaving, setArSaving] = useState(false)

  // Editor form state
  const [edName, setEdName] = useState("")
  const [edTriggerType, setEdTriggerType] = useState("keyword")
  const [edKeywords, setEdKeywords] = useState<string[]>([])
  const [edKeywordInput, setEdKeywordInput] = useState("")
  const [edRegexPattern, setEdRegexPattern] = useState("")
  const [edAiPrompt, setEdAiPrompt] = useState("")
  const [edResponseText, setEdResponseText] = useState("")
  const [edDelay, setEdDelay] = useState(5)
  const [edPriority, setEdPriority] = useState(10)
  const [edPlatformWA, setEdPlatformWA] = useState(true)
  const [edPlatformTG, setEdPlatformTG] = useState(false)
  const [edScheduleAlways, setEdScheduleAlways] = useState(true)
  const [edScheduleFrom, setEdScheduleFrom] = useState("22:00")
  const [edScheduleTo, setEdScheduleTo] = useState("10:00")
  const [edCooldown, setEdCooldown] = useState(60)

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
    if (data) setMessages([...data].reverse())
  }, [])

  const loadAutoReply = useCallback(async () => {
    const [rules, log, stats] = await Promise.all([
      apiFetch<AutoReplyRule[]>("/autoreply/rules"),
      apiFetch<AutoReplyLogEntry[]>("/autoreply/log"),
      apiFetch<AutoReplyStats>("/autoreply/stats"),
    ])
    if (rules) setArRules(rules)
    if (log) setArLog(log)
    if (stats) setArStats(stats)
  }, [])

  // ─── Effects ────────────────────────────────────────────────────────
  useEffect(() => { loadAccounts() }, [loadAccounts])
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load auto-reply data when tab is active
  useEffect(() => {
    if (mainView === "autoreply") {
      loadAutoReply()
      const iv = setInterval(loadAutoReply, 10000)
      return () => clearInterval(iv)
    }
  }, [mainView, loadAutoReply])

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

  // Poll conversations
  useEffect(() => {
    if (!selectedAccountId) return
    const iv = setInterval(() => loadConversations(selectedAccountId), 3000)
    return () => clearInterval(iv)
  }, [selectedAccountId, loadConversations])

  // Poll messages
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
      if (data?.dataUrl) setQrDataUrl(data.dataUrl)
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

  // WebSocket for auto-reply events
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      const wsUrl = `ws://76.13.154.9:3001/ws`
      ws = new WebSocket(wsUrl)
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "auto_reply_sent") {
            // Refresh auto-reply data
            if (mainView === "autoreply") loadAutoReply()
            // Add to messages if viewing that conversation
            if (selectedConvId && data.data?.conversationId === selectedConvId) {
              loadMessages(selectedConvId)
            }
          }
          if (data.type === "new_message") {
            if (selectedConvId && data.data?.conversationId === selectedConvId) {
              loadMessages(selectedConvId)
            }
            if (selectedAccountId) loadConversations(selectedAccountId)
          }
        } catch { /* ignore parse errors */ }
      }
    } catch { /* WebSocket not available */ }
    return () => { ws?.close() }
  }, [mainView, selectedConvId, selectedAccountId])

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
    if (selectedAccountId === id) setSelectedAccountId(null)
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
    setTimeout(() => loadMessages(selectedConv.id), 1000)
  }

  // Auto-reply actions
  async function toggleRule(ruleId: string) {
    await apiFetch(`/autoreply/rules/${ruleId}/toggle`, { method: "PATCH" })
    loadAutoReply()
  }

  async function deleteRule(ruleId: string) {
    if (!confirm("Slet denne regel?")) return
    await apiFetch(`/autoreply/rules/${ruleId}`, { method: "DELETE" })
    loadAutoReply()
  }

  function openRuleEditor(rule?: AutoReplyRule) {
    if (rule) {
      setArEditRule(rule)
      setEdName(rule.name)
      setEdTriggerType(rule.trigger_type)
      setEdResponseText(rule.response_text || "")
      setEdDelay(rule.delay_seconds)
      setEdPriority(rule.priority)
      setEdPlatformWA((rule.platforms || []).includes("whatsapp"))
      setEdPlatformTG((rule.platforms || []).includes("telegram"))
      setEdCooldown(rule.cooldown_minutes)

      const config = rule.trigger_config || {}
      setEdKeywords((config.keywords as string[]) || [])
      setEdRegexPattern((config.pattern as string) || "")
      setEdAiPrompt((config.system_prompt as string) || "")
      setEdScheduleAlways(!(config.outside_hours))
      setEdScheduleFrom((config.from as string) || "22:00")
      setEdScheduleTo((config.to as string) || "10:00")
    } else {
      setArEditRule(null)
      setEdName("")
      setEdTriggerType("keyword")
      setEdResponseText("")
      setEdDelay(5)
      setEdPriority(10)
      setEdPlatformWA(true)
      setEdPlatformTG(false)
      setEdCooldown(60)
      setEdKeywords([])
      setEdKeywordInput("")
      setEdRegexPattern("")
      setEdAiPrompt("")
      setEdScheduleAlways(true)
      setEdScheduleFrom("22:00")
      setEdScheduleTo("10:00")
    }
    setArShowEditor(true)
  }

  async function saveRule() {
    if (!edName.trim()) return
    setArSaving(true)

    const platforms: string[] = []
    if (edPlatformWA) platforms.push("whatsapp")
    if (edPlatformTG) platforms.push("telegram")
    if (platforms.length === 0) platforms.push("whatsapp")

    let triggerConfig: Record<string, unknown> = {}
    if (edTriggerType === "keyword") triggerConfig = { keywords: edKeywords }
    else if (edTriggerType === "regex") triggerConfig = { pattern: edRegexPattern, flags: "i" }
    else if (edTriggerType === "ai_fallback") triggerConfig = { system_prompt: edAiPrompt, max_tokens: 150 }
    else if (edTriggerType === "schedule") triggerConfig = { outside_hours: !edScheduleAlways, from: edScheduleFrom, to: edScheduleTo }

    const body = {
      name: edName.trim(),
      trigger_type: edTriggerType,
      trigger_config: triggerConfig,
      response_text: edTriggerType === "ai_fallback" ? null : edResponseText,
      delay_seconds: edDelay,
      priority: edPriority,
      platforms,
      cooldown_minutes: edCooldown,
      schedule_active: edScheduleAlways ? { always: true } : { from: edScheduleFrom, to: edScheduleTo },
    }

    try {
      if (arEditRule) {
        await apiFetch(`/autoreply/rules/${arEditRule.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        })
      } else {
        await apiFetch("/autoreply/rules", {
          method: "POST",
          body: JSON.stringify(body),
        })
      }
      setArShowEditor(false)
      loadAutoReply()
    } finally {
      setArSaving(false)
    }
  }

  function addKeyword() {
    const kw = edKeywordInput.trim().toLowerCase()
    if (kw && !edKeywords.includes(kw)) {
      setEdKeywords([...edKeywords, kw])
    }
    setEdKeywordInput("")
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
    <div className="h-screen flex flex-col bg-[#0b141a] text-white">
      {/* ═══ Header ═══ */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942] shrink-0">
        <div className="flex items-center gap-3">
          <a href="/admin/agency" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </a>
          <div className="w-8 h-8 bg-[#00a884] rounded-lg flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">MessengerHub</h1>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-[#1f2c34] rounded-lg p-1">
          <button
            onClick={() => setMainView("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mainView === "chat" ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <MessageCircle size={14} /> Chat
          </button>
          <button
            onClick={() => setMainView("autoreply")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mainView === "autoreply" ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Bot size={14} /> Auto-Reply
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Platform filters (only in chat view) */}
          {mainView === "chat" && (
            <div className="flex items-center gap-1 bg-[#1f2c34] rounded-lg p-1 mr-2">
              {(["all", "whatsapp", "telegram"] as TabFilter[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTabFilter(tab)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    tabFilter === tab ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab === "whatsapp" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  {tab === "telegram" && <Send size={10} className="text-blue-400" />}
                  {tab === "all" ? "All" : tab === "whatsapp" ? "WA" : "TG"}
                </button>
              ))}
            </div>
          )}
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
            className="flex items-center gap-2 px-3 py-2 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Add Account</span>
          </button>
        </div>
      </header>

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {mainView === "chat" ? (
          /* ════ CHAT VIEW ════ */
          <>
            {/* Left: Accounts */}
            <aside className="w-[220px] shrink-0 border-r border-[#2a3942] bg-[#111b21]/50 flex flex-col">
              <div className="px-3 py-3 border-b border-[#2a3942]">
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
                  </div>
                ) : (
                  filteredAccounts.map(account => {
                    const eff = getEffectiveStatus(account)
                    return (
                      <div
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-[#2a3942]/50 transition-colors group ${
                          selectedAccountId === account.id ? "bg-[#2a3942]/80" : "hover:bg-[#2a3942]/40"
                        }`}
                      >
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{account.display_name || "Unnamed"}</p>
                          <p className="text-xs text-gray-500 truncate">{account.phone_number || account.platform}</p>
                          <span className="text-[10px] text-gray-600 capitalize">{eff.replace("_", " ")}</span>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {(eff === "disconnected" || eff === "error") ? (
                            <button onClick={e => { e.stopPropagation(); connectAccount(account.id) }} className="p-1 text-green-500 hover:text-green-400" title="Connect"><LogIn size={13} /></button>
                          ) : eff === "connected" ? (
                            <button onClick={e => { e.stopPropagation(); disconnectAccount(account.id) }} className="p-1 text-yellow-500 hover:text-yellow-400" title="Disconnect"><LogOut size={13} /></button>
                          ) : null}
                          <button onClick={e => { e.stopPropagation(); deleteAccount(account.id) }} className="p-1 text-gray-600 hover:text-red-500" title="Slet"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </aside>

            {/* Middle: Conversations */}
            <div className="w-[320px] shrink-0 border-r border-[#2a3942] flex flex-col bg-[#0b141a]">
              {selectedAccount ? (
                <>
                  <div className="px-3 py-3 border-b border-[#2a3942]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Søg samtaler..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredConvs.length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <MessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">Ingen samtaler endnu</p>
                      </div>
                    ) : (
                      filteredConvs.map(conv => {
                        const name = conv.chat_name || conv.contact?.display_name || conv.platform_chat_id.split("@")[0]
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-[#2a3942]/30 transition-colors ${
                              selectedConvId === conv.id ? "bg-[#2a3942]/60" : "hover:bg-[#2a3942]/30"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium shrink-0">
                              {conv.is_group ? <Users size={16} /> : name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{name}</p>
                                <span className="text-[10px] text-gray-500 shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-gray-500 truncate">{conv.last_message_preview || "Ingen beskeder"}</p>
                                {conv.unread_count > 0 && (
                                  <span className="ml-2 shrink-0 bg-[#00a884] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
                  </div>
                </div>
              )}
            </div>

            {/* Right: Chat View */}
            <div className="flex-1 flex flex-col bg-[#0b141a]">
              {selectedConv ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium">
                        {selectedConv.is_group ? <Users size={16} /> : (selectedConv.chat_name || selectedConv.platform_chat_id).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {selectedConv.chat_name || selectedConv.contact?.display_name || selectedConv.platform_chat_id.split("@")[0]}
                        </p>
                        <p className="text-[11px] text-gray-500">{selectedConv.contact?.phone_number || selectedConv.platform_chat_id}</p>
                      </div>
                    </div>
                    <button onClick={() => loadMessages(selectedConv.id)} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg transition-colors"><RefreshCw size={16} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-600">Ingen beskeder</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isOutbound = msg.direction === "outbound"
                        return (
                          <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[65%] rounded-2xl px-3.5 py-2 ${
                              isOutbound ? "bg-[#005c4b] rounded-br-md" : "bg-[#1f2c34] rounded-bl-md"
                            }`}>
                              {msg.message_type !== "text" && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1"><ImageIcon size={12} /><span className="capitalize">{msg.message_type}</span></div>
                              )}
                              {msg.is_auto_reply && isOutbound && (
                                <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-1"><Zap size={10} /><span>Auto-reply</span></div>
                              )}
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content || `[${msg.message_type}]`}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500">{formatTime(msg.created_at)}</span>
                                {isOutbound && (
                                  <span className="text-gray-400">
                                    {msg.status === "read" ? <CheckCheck size={12} className="text-blue-400" /> : msg.status === "delivered" ? <CheckCheck size={12} /> : msg.status === "sent" ? <Check size={12} /> : <Clock size={10} />}
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

                  <div className="px-4 py-3 bg-[#111b21] border-t border-[#2a3942] shrink-0">
                    {getEffectiveStatus(selectedAccount!) !== "connected" ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-gray-500 text-sm"><WifiOff size={16} /><span>Konto ikke forbundet</span></div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <textarea
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                            placeholder="Skriv en besked..."
                            rows={1}
                            className="w-full px-4 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none"
                          />
                        </div>
                        <button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg} className="p-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors shrink-0 mb-0.5">
                          <Send size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f2c34] flex items-center justify-center"><MessageCircle size={28} className="text-gray-600" /></div>
                    <p className="text-gray-400 font-medium">Vælg en samtale</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ════ AUTO-REPLY VIEW ════ */
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Rules (60%) */}
            <div className="w-[60%] flex flex-col border-r border-[#2a3942]">
              {/* Rules Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942]">
                <h2 className="text-sm font-semibold text-gray-300">Auto-Reply Regler</h2>
                <button
                  onClick={() => openRuleEditor()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={14} /> Ny regel
                </button>
              </div>

              {/* Rules List */}
              <div className="flex-1 overflow-y-auto">
                {arRules.length === 0 ? (
                  <div className="text-center py-16">
                    <Bot size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Ingen regler oprettet</p>
                  </div>
                ) : (
                  arRules.map(rule => {
                    const Icon = TRIGGER_ICONS[rule.trigger_type] || Bot
                    return (
                      <div key={rule.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2a3942]/50 hover:bg-[#1f2c34]/50 transition-colors group">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          rule.enabled ? "bg-[#00a884]/20 text-[#00a884]" : "bg-gray-800 text-gray-600"
                        }`}>
                          <Icon size={16} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${rule.enabled ? "text-white" : "text-gray-500"}`}>{rule.name}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2c34] text-gray-400">{TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-gray-600">P{rule.priority}</span>
                            <span className="text-[10px] text-gray-600">{rule.delay_seconds}s delay</span>
                            <span className="text-[10px] text-gray-600">{rule.stats_sent} sendt</span>
                            {(rule.platforms || []).map(p => (
                              <span key={p} className={`text-[10px] ${p === "whatsapp" ? "text-green-600" : "text-blue-500"}`}>
                                {p === "whatsapp" ? "WA" : "TG"}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Toggle + Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRule(rule.id)}
                            className={`p-1 rounded transition-colors ${rule.enabled ? "text-[#00a884]" : "text-gray-600"}`}
                            title={rule.enabled ? "Deaktivér" : "Aktivér"}
                          >
                            {rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                          <button
                            onClick={() => openRuleEditor(rule)}
                            className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            title="Rediger"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Slet"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right: Log + Stats (40%) */}
            <div className="w-[40%] flex flex-col bg-[#0b141a]">
              {/* Log Header */}
              <div className="px-4 py-3 bg-[#111b21] border-b border-[#2a3942]">
                <h2 className="text-sm font-semibold text-gray-300">Seneste auto-replies</h2>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto">
                {arLog.length === 0 ? (
                  <div className="text-center py-16">
                    <Activity size={24} className="mx-auto text-gray-700 mb-2" />
                    <p className="text-xs text-gray-600">Ingen auto-replies endnu</p>
                  </div>
                ) : (
                  arLog.slice(0, 50).map(entry => (
                    <div key={entry.id} className="px-4 py-2.5 border-b border-[#2a3942]/30 hover:bg-[#1f2c34]/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={12} className="text-[#00a884]" />
                          <span className="text-xs font-medium text-white">{entry.rule_name || "Regel"}</span>
                        </div>
                        <span className="text-[10px] text-gray-600">{formatDateTime(entry.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">→ {entry.contact_name || "Ukendt"}</span>
                        <span className={`text-[10px] ${entry.platform === "telegram" ? "text-blue-500" : "text-green-600"}`}>
                          {entry.platform === "telegram" ? "TG" : "WA"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Stats */}
              {arStats && (
                <div className="p-4 bg-[#111b21] border-t border-[#2a3942] shrink-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1f2c34] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Sendt i dag</p>
                      <p className="text-lg font-bold text-[#00a884]">{arStats.sentToday}</p>
                    </div>
                    <div className="bg-[#1f2c34] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Aktive regler</p>
                      <p className="text-lg font-bold text-white">{arStats.activeRules}</p>
                    </div>
                    <div className="bg-[#1f2c34] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Total sendt</p>
                      <p className="text-lg font-bold text-white">{arStats.totalSent}</p>
                    </div>
                    <div className="bg-[#1f2c34] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Avg responstid</p>
                      <p className="text-lg font-bold text-white">{arStats.avgResponseTime}ms</p>
                    </div>
                  </div>
                  {arStats.topRule && (
                    <div className="mt-3 bg-[#1f2c34] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase">Mest brugte regel</p>
                      <p className="text-sm font-medium text-white mt-0.5">{arStats.topRule.name} <span className="text-gray-500">({arStats.topRule.count}×)</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Rule Editor Modal ═══ */}
      {arShowEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setArShowEditor(false)}>
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3942] sticky top-0 bg-[#111b21] z-10">
              <h2 className="text-base font-bold">{arEditRule ? "Rediger regel" : "Ny regel"}</h2>
              <button onClick={() => setArShowEditor(false)} className="p-1 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg"><X size={18} /></button>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Regelnavn *</label>
                <input type="text" value={edName} onChange={e => setEdName(e.target.value)} placeholder="f.eks. Velkomstbesked"
                  className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Trigger type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => {
                    const Icon = TRIGGER_ICONS[key] || Bot
                    return (
                      <button key={key} onClick={() => setEdTriggerType(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          edTriggerType === key ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400 hover:border-gray-600"
                        }`}>
                        <Icon size={12} /> {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Keyword Input */}
              {edTriggerType === "keyword" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nøgleord</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={edKeywordInput} onChange={e => setEdKeywordInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword() } }}
                      placeholder="Tilføj nøgleord..."
                      className="flex-1 px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
                    <button onClick={addKeyword} className="px-3 py-2 bg-[#2a3942] hover:bg-[#3a4a52] text-white text-sm rounded-lg"><Plus size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {edKeywords.map(kw => (
                      <span key={kw} className="flex items-center gap-1 px-2 py-1 bg-[#1f2c34] text-xs text-gray-300 rounded-md">
                        {kw}
                        <button onClick={() => setEdKeywords(edKeywords.filter(k => k !== kw))} className="text-gray-500 hover:text-red-400"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regex */}
              {edTriggerType === "regex" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Regex pattern</label>
                  <input type="text" value={edRegexPattern} onChange={e => setEdRegexPattern(e.target.value)} placeholder="\\d{4}"
                    className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
                </div>
              )}

              {/* AI Prompt */}
              {edTriggerType === "ai_fallback" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">AI System Prompt</label>
                  <textarea value={edAiPrompt} onChange={e => setEdAiPrompt(e.target.value)} rows={3}
                    placeholder="Du er en venlig assistent..."
                    className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" />
                </div>
              )}

              {/* Schedule */}
              {edTriggerType === "schedule" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tidsplan</label>
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setEdScheduleAlways(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${edScheduleAlways ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400"}`}>
                      Altid aktiv
                    </button>
                    <button onClick={() => setEdScheduleAlways(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${!edScheduleAlways ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400"}`}>
                      Uden for timer
                    </button>
                  </div>
                  {!edScheduleAlways && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={edScheduleFrom} onChange={e => setEdScheduleFrom(e.target.value)}
                        className="px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none" />
                      <span className="text-gray-500 text-sm">til</span>
                      <input type="time" value={edScheduleTo} onChange={e => setEdScheduleTo(e.target.value)}
                        className="px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none" />
                    </div>
                  )}
                </div>
              )}

              {/* Response Text (hide for AI fallback) */}
              {edTriggerType !== "ai_fallback" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Svar-tekst</label>
                  <textarea value={edResponseText} onChange={e => setEdResponseText(e.target.value)} rows={3}
                    placeholder="Hej! Tak for din besked..."
                    className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" />
                </div>
              )}

              {/* Settings row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Forsinkelse (sek)</label>
                  <input type="number" value={edDelay} onChange={e => setEdDelay(parseInt(e.target.value) || 5)} min={1} max={60}
                    className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Prioritet</label>
                  <input type="number" value={edPriority} onChange={e => setEdPriority(parseInt(e.target.value) || 10)} min={1} max={999}
                    className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Cooldown (min)</label>
                  <input type="number" value={edCooldown} onChange={e => setEdCooldown(parseInt(e.target.value) || 60)} min={0}
                    className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" />
                </div>
              </div>

              {/* Platform toggles */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Platforme</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEdPlatformWA(!edPlatformWA)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      edPlatformWA ? "border-green-600 bg-green-600/20 text-green-400" : "border-[#2a3942] text-gray-500"
                    }`}>
                    <span className="w-2 h-2 rounded-full bg-green-500" /> WhatsApp
                  </button>
                  <button onClick={() => setEdPlatformTG(!edPlatformTG)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      edPlatformTG ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-[#2a3942] text-gray-500"
                    }`}>
                    <Send size={10} /> Telegram
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a3942] sticky bottom-0 bg-[#111b21]">
              <button onClick={() => setArShowEditor(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg">Annuller</button>
              <button onClick={saveRule} disabled={!edName.trim() || arSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors">
                {arSaving && <Loader2 size={14} className="animate-spin" />}
                {arEditRule ? "Gem ændringer" : "Opret regel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Account Modal ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { if (!qrPolling) setShowAddModal(false) }}>
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3942]">
              <h2 className="text-base font-bold">Tilføj Konto</h2>
              <button onClick={() => { setShowAddModal(false); setQrPolling(false) }} className="p-1 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg"><X size={18} /></button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Platform</label>
                <div className="flex gap-2">
                  <button onClick={() => setNewPlatform("whatsapp")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      newPlatform === "whatsapp" ? "border-green-600 bg-green-600/20 text-green-400" : "border-[#2a3942] text-gray-400 hover:border-gray-600"
                    }`}>WhatsApp</button>
                  <button onClick={() => setNewPlatform("telegram")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      newPlatform === "telegram" ? "border-blue-600 bg-blue-600/20 text-blue-400" : "border-[#2a3942] text-gray-400 hover:border-gray-600"
                    }`}>Telegram</button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Konto Navn *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="f.eks. Business WhatsApp"
                  className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Telefonnummer (valgfrit)</label>
                <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+45 53 71 03 69"
                  className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
              </div>

              {qrPolling && (
                <div className="bg-[#1f2c34] border border-[#2a3942] rounded-xl p-4 text-center">
                  {qrDataUrl ? (
                    <>
                      <img src={qrDataUrl} alt="QR Code" className="mx-auto w-[250px] h-[250px] rounded-lg" />
                      <p className="text-sm text-[#00a884] mt-3 font-medium">Scan QR-koden med WhatsApp</p>
                      <p className="text-xs text-gray-500 mt-1">Åbn WhatsApp → Linked Devices → Link a Device</p>
                    </>
                  ) : (
                    <>
                      <Loader2 size={40} className="mx-auto text-gray-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-400">Venter på QR-kode...</p>
                    </>
                  )}
                </div>
              )}

              {!qrPolling && (
                <div className="bg-[#1f2c34] border border-[#2a3942] rounded-xl p-6 text-center">
                  <QrCode size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">QR Code Pairing</p>
                  <p className="text-xs text-gray-600 mt-1">Tryk &quot;Tilføj&quot; for at begynde pairing</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a3942]">
              <button onClick={() => { setShowAddModal(false); setQrPolling(false) }} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg">
                {qrPolling ? "Luk" : "Annuller"}
              </button>
              {!qrPolling && (
                <button onClick={createAccount} disabled={!newName.trim() || addingAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg">
                  {addingAccount && <Loader2 size={14} className="animate-spin" />}
                  Tilføj & Forbind
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
