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
  AlertCircle, Hash, Type, Calendar, Brain, Radio,
  Pin, BellOff, Eye, Ban, Archive, UserPlus, Tag, FileText,
  Shield, ShieldOff, Volume2, VolumeX, BookOpen
} from "lucide-react"

// ─── Platform SVG Icons ─────────────────────────────────────────────────
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white" />
    </svg>
  )
}

function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path d="M9.417 15.181l-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931L23.93 4.488c.321-1.496-.543-2.081-1.527-1.714l-21.29 8.151c-1.453.564-1.431 1.374-.247 1.741l5.443 1.693L18.953 6.37c.529-.33 1.012-.148.614.21L9.417 15.18z" fill="white" />
    </svg>
  )
}

// ─── Constants ──────────────────────────────────────────────────────────
const API = "/api/messenger/api"

// ─── Types ──────────────────────────────────────────────────────────────
interface Account {
  id: string; user_id: string | null; platform: "whatsapp" | "telegram"
  phone_number: string | null; display_name: string | null
  session_data: Record<string, unknown>; status: string
  last_connected_at: string | null; error_message: string | null
  created_at: string; updated_at: string
  live_status?: { accountId: string; platform: string; status: string; uptime: number; messageCount: { sent: number; received: number }; reconnectAttempts: number }
}
interface Contact {
  id: string; account_id: string; platform_contact_id: string
  display_name: string | null; phone_number: string | null
  avatar_url?: string | null; notes?: string | null; tags?: string[]; is_blocked?: boolean
}
interface Conversation {
  id: string; account_id: string; contact_id: string | null
  platform_chat_id: string; chat_name: string | null; is_group: boolean
  unread_count: number; last_message_at: string | null; last_message_preview: string | null
  contact?: Contact | null; is_archived?: boolean; is_pinned?: boolean; is_muted?: boolean; marked_unread?: boolean
}
interface Message {
  id: string; conversation_id: string; account_id: string
  platform_message_id: string | null; direction: "inbound" | "outbound"
  message_type: string; content: string | null; status: string
  is_auto_reply: boolean; auto_reply_rule_id?: string | null; created_at: string
}
interface AutoReplyRule {
  id: string; name: string; trigger_type: string; trigger_config: Record<string, unknown>
  response_text: string | null; enabled: boolean; priority: number
  delay_seconds: number; delay_randomize: boolean; platforms: string[]
  schedule_active: Record<string, unknown>; max_per_contact: number
  cooldown_minutes: number; stats_sent: number; stats_last_used: string | null; created_at: string
}
interface AutoReplyLogEntry {
  id: string; rule_name: string; contact_name: string; platform: string
  response_sent: string; trigger_message: string; processing_time_ms: number; created_at: string
}
interface AutoReplyStats {
  totalSent: number; sentToday: number; activeRules: number
  topRule: { name: string; count: number } | null; avgResponseTime: number
}
type TabFilter = "all" | "whatsapp" | "telegram"
type MainView = "chat" | "autoreply" | "contacts"

// ─── Helpers ────────────────────────────────────────────────────────────
function timeAgo(d: string | null) {
  if (!d) return ""; const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000)
  if (m < 1) return "nu"; if (m < 60) return `${m}m`; const h = Math.floor(m / 60)
  if (h < 24) return `${h}t`; return `${Math.floor(h / 24)}d`
}
function formatTime(d: string) { return new Date(d).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) }
function formatDateTime(d: string) { return new Date(d).toLocaleString("da-DK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }
function getEffectiveStatus(a: Account) { return a.live_status?.status || a.status || "disconnected" }

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { connected: "bg-green-500", online: "bg-green-500", connecting: "bg-yellow-500 animate-pulse", qr_required: "bg-orange-500 animate-pulse", awaiting_code: "bg-orange-500 animate-pulse", disconnected: "bg-gray-500", error: "bg-red-500" }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c[status] || "bg-gray-500"}`} />
}

function Avatar({ name, url, size = 40, platform }: { name: string; url?: string | null; size?: number; platform?: string }) {
  const [imgErr, setImgErr] = useState(false)
  const initial = (name || "?").charAt(0).toUpperCase()
  if (url && !imgErr) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <img src={url} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} onError={() => setImgErr(true)} />
        {platform && <div className="absolute -bottom-0.5 -right-0.5">{platform === "telegram" ? <TelegramIcon size={12} /> : <WhatsAppIcon size={12} />}</div>}
      </div>
    )
  }
  return (
    <div className="relative shrink-0">
      <div className="rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium" style={{ width: size, height: size }}>
        {initial}
      </div>
      {platform && <div className="absolute -bottom-0.5 -right-0.5">{platform === "telegram" ? <TelegramIcon size={12} /> : <WhatsAppIcon size={12} />}</div>}
    </div>
  )
}

function PlatformBadge({ platform }: { platform?: string }) {
  if (platform === "telegram") return <TelegramIcon size={14} />
  if (platform === "whatsapp") return <WhatsAppIcon size={14} />
  return null
}

const TRIGGER_ICONS: Record<string, typeof Bot> = { first_message: MessageCircle, keyword: Hash, regex: Type, schedule: Calendar, ai_fallback: Brain, all_messages: Radio }
const TRIGGER_LABELS: Record<string, string> = { first_message: "Første besked", keyword: "Nøgleord", regex: "Regex", schedule: "Tidsplan", ai_fallback: "AI Fallback", all_messages: "Alle beskeder" }

// Format display name for chat header - hide raw chat IDs
// Country code -> flag emoji
function ccToFlag(cc: string | null | undefined) {
  if (!cc || cc.length !== 2) return ""
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

// Phone prefix -> country code
const PHONE_CC: Record<string, string> = {'1':'US','7':'RU','20':'EG','27':'ZA','31':'NL','32':'BE','33':'FR','34':'ES','39':'IT','41':'CH','43':'AT','44':'GB','45':'DK','46':'SE','47':'NO','48':'PL','49':'DE','52':'MX','55':'BR','61':'AU','62':'ID','63':'PH','64':'NZ','65':'SG','66':'TH','81':'JP','82':'KR','86':'CN','90':'TR','91':'IN','98':'IR','212':'MA','234':'NG','351':'PT','353':'IE','358':'FI','380':'UA','420':'CZ','421':'SK','852':'HK','886':'TW','966':'SA','971':'AE','972':'IL','974':'QA'}
function phoneToCC(p: string | null) { if(!p) return null; const d=p.replace(/\D/g,''); for(const l of [3,2,1]){const px=d.substring(0,l);if(PHONE_CC[px])return PHONE_CC[px];} return null }

function displayName(conv: Conversation) {
  if (conv.contact?.custom_name) return conv.contact.custom_name
  if (conv.contact?.display_name) return conv.contact.display_name
  if (conv.chat_name && !conv.chat_name.includes("@")) return conv.chat_name
  // Extract phone from chat_id like "4553710369@c.us"
  const match = conv.platform_chat_id.match(/^(\d+)@/)
  if (match) return `+${match[1]}`
  return conv.chat_name || "Ukendt"
}

function displayPhone(conv: Conversation) {
  if (conv.contact?.phone_number) return conv.contact.phone_number
  const match = conv.platform_chat_id.match(/^(\d+)@/)
  if (match) return `+${match[1]}`
  return null
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function MessengerHubPage() {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // QR state
  const [qrAccountId, setQrAccountId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrPolling, setQrPolling] = useState(false)

  // Pair link state
  const [pairLink, setPairLink] = useState<string | null>(null)
  const [pairCopied, setPairCopied] = useState(false)

  // Health
  const [healthStatus, setHealthStatus] = useState<{ status: string; accounts: { id: string; platform: string; status: string; uptime: string }[]; autoReply: { activeRules: number; sentToday: number }; database: string } | null>(null)

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; convId: string } | null>(null)

  // Contact detail panel
  const [showContactPanel, setShowContactPanel] = useState(false)
  const [contactDetail, setContactDetail] = useState<Contact | null>(null)
  const [contactNotes, setContactNotes] = useState("")
  const [contactNameEdit, setContactNameEdit] = useState("")
  const [savingContact, setSavingContact] = useState(false)

  // Contacts page state
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactSearch, setContactSearch] = useState("")
  const [contactCountryFilter, setContactCountryFilter] = useState("")
  const [contactTagFilter, setContactTagFilter] = useState("")
  const [countries, setCountries] = useState<{code:string;count:number}[]>([])
  // Contact edit fields
  const [ceCustomName, setCeCustomName] = useState("")
  const [ceEmail, setCeEmail] = useState("")
  const [ceNotes, setCeNotes] = useState("")
  const [ceTags, setCeTags] = useState<string[]>([])
  const [ceTagInput, setCeTagInput] = useState("")
  const [ceCountry, setCeCountry] = useState("")
  const [ceFavorite, setCeFavorite] = useState(false)
  const [ceSaving, setCeSaving] = useState(false)

  // Auto-reply state
  const [arRules, setArRules] = useState<AutoReplyRule[]>([])
  const [arLog, setArLog] = useState<AutoReplyLogEntry[]>([])
  const [arStats, setArStats] = useState<AutoReplyStats | null>(null)
  const [arEditRule, setArEditRule] = useState<AutoReplyRule | null>(null)
  const [arShowEditor, setArShowEditor] = useState(false)
  const [arSaving, setArSaving] = useState(false)

  // Editor form
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

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null
  const selectedConv = conversations.find(c => c.id === selectedConvId) || null

  // ─── API ──────────────────────────────────────────────────────────────
  async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
    try { const r = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts }); if (!r.ok) return null; return await r.json() } catch { return null }
  }

  const loadAccounts = useCallback(async () => { const d = await apiFetch<Account[]>("/accounts"); if (d) setAccounts(d); setLoading(false) }, [])
  const loadConversations = useCallback(async (aid: string) => { const d = await apiFetch<Conversation[]>(`/conversations?account_id=${aid}`); if (d) setConversations(d); else setConversations([]) }, [])
  const loadMessages = useCallback(async (cid: string) => { const d = await apiFetch<Message[]>(`/conversations/${cid}/messages`); if (d) setMessages([...d].reverse()) }, [])
  const loadHealth = useCallback(async () => { const d = await apiFetch<typeof healthStatus>("/health"); if (d) setHealthStatus(d) }, [])
  const loadContacts = useCallback(async () => {
    const params = new URLSearchParams()
    if (contactSearch) params.set('search', contactSearch)
    if (contactCountryFilter) params.set('country', contactCountryFilter)
    if (contactTagFilter) params.set('tag', contactTagFilter)
    const [c, co] = await Promise.all([apiFetch<Contact[]>(`/contacts?${params}`), apiFetch<{code:string;count:number}[]>('/contacts/countries')])
    if (c) setAllContacts(c)
    if (co) setCountries(co)
  }, [contactSearch, contactCountryFilter, contactTagFilter])

  const loadAutoReply = useCallback(async () => {
    const [rules, log, stats] = await Promise.all([apiFetch<AutoReplyRule[]>("/autoreply/rules"), apiFetch<AutoReplyLogEntry[]>("/autoreply/log"), apiFetch<AutoReplyStats>("/autoreply/stats")])
    if (rules) setArRules(rules); if (log) setArLog(log); if (stats) setArStats(stats)
  }, [])

  // ─── Effects ──────────────────────────────────────────────────────────
  useEffect(() => { loadAccounts(); loadHealth() }, [loadAccounts, loadHealth])
  useEffect(() => { const iv = setInterval(() => { loadAccounts(); loadHealth() }, 5000); return () => clearInterval(iv) }, [loadAccounts, loadHealth])
  useEffect(() => { if (selectedAccountId) { loadConversations(selectedAccountId); setSelectedConvId(null); setMessages([]) } else { setConversations([]); setSelectedConvId(null); setMessages([]) } }, [selectedAccountId, loadConversations])
  useEffect(() => { if (selectedConvId) { loadMessages(selectedConvId); setShowContactPanel(false) } else setMessages([]) }, [selectedConvId, loadMessages])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { if (mainView === "autoreply") { loadAutoReply(); const iv = setInterval(loadAutoReply, 10000); return () => clearInterval(iv) } }, [mainView, loadAutoReply])
  useEffect(() => { if (mainView === "contacts") loadContacts() }, [mainView, loadContacts])

  // Realtime
  useEffect(() => {
    const msgSub = supabase.channel("messenger_messages_rt").on("postgres_changes", { event: "INSERT", schema: "public", table: "messenger_messages" }, (p) => {
      const m = p.new as Message; if (m.conversation_id === selectedConvId) setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
      if (selectedAccountId) loadConversations(selectedAccountId)
    }).subscribe()
    const convSub = supabase.channel("messenger_conversations_rt").on("postgres_changes", { event: "*", schema: "public", table: "messenger_conversations" }, () => { if (selectedAccountId) loadConversations(selectedAccountId) }).subscribe()
    return () => { supabase.removeChannel(msgSub); supabase.removeChannel(convSub) }
  }, [selectedAccountId, selectedConvId, loadConversations])
  useEffect(() => { if (!selectedAccountId) return; const iv = setInterval(() => loadConversations(selectedAccountId), 3000); return () => clearInterval(iv) }, [selectedAccountId, loadConversations])
  useEffect(() => { if (!selectedConvId) return; const iv = setInterval(() => loadMessages(selectedConvId), 3000); return () => clearInterval(iv) }, [selectedConvId, loadMessages])
  useEffect(() => { if (!qrAccountId || !qrPolling) return; const iv = setInterval(async () => { const d = await apiFetch<{ qr?: string; dataUrl?: string }>(`/accounts/${qrAccountId}/qr`); if (d?.dataUrl) setQrDataUrl(d.dataUrl); const a = await apiFetch<Account>(`/accounts/${qrAccountId}`); if (a) { const e = a.live_status?.status || a.status; if (e === "connected" || e === "online") { setQrPolling(false); setQrDataUrl(null); setQrAccountId(null); setShowAddModal(false); loadAccounts() } } }, 2000); return () => clearInterval(iv) }, [qrAccountId, qrPolling, loadAccounts])

  // WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket("ws://76.13.154.9:3001/ws")
      ws.onmessage = (ev) => { try { const d = JSON.parse(ev.data); if (d.type === "auto_reply_sent" && mainView === "autoreply") loadAutoReply(); if (d.type === "new_message") { if (selectedConvId && d.data?.conversationId === selectedConvId) loadMessages(selectedConvId); if (selectedAccountId) loadConversations(selectedAccountId) } } catch {} }
    } catch {}
    return () => { ws?.close() }
  }, [mainView, selectedConvId, selectedAccountId])

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setCtxMenu(null)
    if (ctxMenu) { document.addEventListener("click", handler); return () => document.removeEventListener("click", handler) }
  }, [ctxMenu])

  // ─── Actions ──────────────────────────────────────────────────────────
  async function createAccount() {
    if (!newName.trim()) return; setAddingAccount(true)
    try {
      const a = await apiFetch<Account>("/accounts", { method: "POST", body: JSON.stringify({ platform: newPlatform, display_name: newName.trim(), phone_number: newPhone.trim() || null }) })
      if (a) {
        await loadAccounts(); await apiFetch(`/accounts/${a.id}/connect`, { method: "POST" }); setQrAccountId(a.id); setQrPolling(true); setSelectedAccountId(a.id)
        // Generate pair link
        const pair = await apiFetch<{ token: string; url: string }>("/pair/create", { method: "POST", body: JSON.stringify({ account_id: a.id }) })
        if (pair) setPairLink(`${window.location.origin}/pair/${pair.token}`)
      }
    } finally { setAddingAccount(false) }
  }
  function copyPairLink() { if (pairLink) { navigator.clipboard.writeText(pairLink); setPairCopied(true); setTimeout(() => setPairCopied(false), 2000) } }
  async function deleteAccount(id: string) { if (!confirm("Slet denne konto?")) return; await apiFetch(`/accounts/${id}`, { method: "DELETE" }); if (selectedAccountId === id) setSelectedAccountId(null); loadAccounts() }
  async function connectAccount(id: string) { await apiFetch(`/accounts/${id}/connect`, { method: "POST" }); setQrAccountId(id); setQrPolling(true); loadAccounts() }
  async function disconnectAccount(id: string) { await apiFetch(`/accounts/${id}/disconnect`, { method: "POST" }); loadAccounts() }
  async function sendMessage() {
    if (!msgInput.trim() || !selectedConv || !selectedAccount) return; const content = msgInput.trim(); setMsgInput(""); setSendingMsg(true)
    const opt: Message = { id: crypto.randomUUID(), conversation_id: selectedConv.id, account_id: selectedAccount.id, platform_message_id: null, direction: "outbound", message_type: "text", content, status: "pending", is_auto_reply: false, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, opt])
    await apiFetch("/messages/send", { method: "POST", body: JSON.stringify({ account_id: selectedAccount.id, chat_id: selectedConv.platform_chat_id, content }) })
    setSendingMsg(false); setTimeout(() => loadMessages(selectedConv.id), 1000)
  }

  // Context menu actions
  async function archiveConv(convId: string) { await apiFetch(`/conversations/${convId}/archive`, { method: "PATCH" }); if (selectedConvId === convId) setSelectedConvId(null); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }
  async function pinConv(convId: string) { await apiFetch(`/conversations/${convId}/pin`, { method: "PATCH" }); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }
  async function muteConv(convId: string) { await apiFetch(`/conversations/${convId}/mute`, { method: "PATCH" }); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }
  async function markUnread(convId: string) { await apiFetch(`/conversations/${convId}/mark-unread`, { method: "PATCH" }); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }
  async function blockContact(convId: string) { await apiFetch(`/conversations/${convId}/block`, { method: "POST" }); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }
  async function unblockContact(convId: string) { await apiFetch(`/conversations/${convId}/unblock`, { method: "POST" }); if (selectedAccountId) loadConversations(selectedAccountId); setCtxMenu(null) }

  // Contact panel
  function openContactPanel() {
    if (!selectedConv?.contact) return
    setContactDetail(selectedConv.contact)
    setContactNameEdit(selectedConv.contact.display_name || "")
    setContactNotes(selectedConv.contact.notes || "")
    setShowContactPanel(true)
  }
  async function saveContact() {
    if (!contactDetail) return; setSavingContact(true)
    await apiFetch(`/contacts/${contactDetail.id}`, { method: "PATCH", body: JSON.stringify({ display_name: contactNameEdit, notes: contactNotes }) })
    setSavingContact(false); setShowContactPanel(false)
    if (selectedAccountId) loadConversations(selectedAccountId)
  }

  // Contact page actions
  function selectContactForEdit(c: Contact) {
    setSelectedContact(c); setCeCustomName(c.custom_name || c.display_name || ""); setCeEmail((c as any).email || ""); setCeNotes(c.notes || ""); setCeTags(Array.isArray(c.tags) ? c.tags as string[] : []); setCeCountry(c.country_code || phoneToCC(c.phone_number) || ""); setCeFavorite(c.is_favorite || false)
  }
  async function saveContactEdit() {
    if (!selectedContact) return; setCeSaving(true)
    await apiFetch(`/contacts/${selectedContact.id}`, { method: "PATCH", body: JSON.stringify({ custom_name: ceCustomName || null, email: ceEmail || null, notes: ceNotes || null, tags: ceTags, country_code: ceCountry || null, is_favorite: ceFavorite }) })
    setCeSaving(false); loadContacts()
  }
  async function toggleFavorite(c: Contact) {
    await apiFetch(`/contacts/${c.id}`, { method: "PATCH", body: JSON.stringify({ is_favorite: !c.is_favorite }) }); loadContacts()
  }
  function openChatWithContact(c: Contact) {
    // Find conversation for this contact and switch to chat
    const conv = conversations.find(cv => cv.contact_id === c.id)
    if (conv) { setMainView("chat"); setSelectedConvId(conv.id) }
  }

  // Auto-reply actions
  async function toggleRule(id: string) { await apiFetch(`/autoreply/rules/${id}/toggle`, { method: "PATCH" }); loadAutoReply() }
  async function deleteRule(id: string) { if (!confirm("Slet regel?")) return; await apiFetch(`/autoreply/rules/${id}`, { method: "DELETE" }); loadAutoReply() }
  function openRuleEditor(rule?: AutoReplyRule) {
    if (rule) {
      setArEditRule(rule); setEdName(rule.name); setEdTriggerType(rule.trigger_type); setEdResponseText(rule.response_text || ""); setEdDelay(rule.delay_seconds); setEdPriority(rule.priority)
      setEdPlatformWA((rule.platforms || []).includes("whatsapp")); setEdPlatformTG((rule.platforms || []).includes("telegram")); setEdCooldown(rule.cooldown_minutes)
      const c = rule.trigger_config || {}; setEdKeywords((c.keywords as string[]) || []); setEdRegexPattern((c.pattern as string) || ""); setEdAiPrompt((c.system_prompt as string) || "")
      setEdScheduleAlways(!c.outside_hours); setEdScheduleFrom((c.from as string) || "22:00"); setEdScheduleTo((c.to as string) || "10:00")
    } else {
      setArEditRule(null); setEdName(""); setEdTriggerType("keyword"); setEdResponseText(""); setEdDelay(5); setEdPriority(10); setEdPlatformWA(true); setEdPlatformTG(false); setEdCooldown(60)
      setEdKeywords([]); setEdKeywordInput(""); setEdRegexPattern(""); setEdAiPrompt(""); setEdScheduleAlways(true); setEdScheduleFrom("22:00"); setEdScheduleTo("10:00")
    }
    setArShowEditor(true)
  }
  async function saveRule() {
    if (!edName.trim()) return; setArSaving(true)
    const platforms: string[] = []; if (edPlatformWA) platforms.push("whatsapp"); if (edPlatformTG) platforms.push("telegram"); if (!platforms.length) platforms.push("whatsapp")
    let tc: Record<string, unknown> = {}
    if (edTriggerType === "keyword") tc = { keywords: edKeywords }
    else if (edTriggerType === "regex") tc = { pattern: edRegexPattern, flags: "i" }
    else if (edTriggerType === "ai_fallback") tc = { system_prompt: edAiPrompt, max_tokens: 150 }
    else if (edTriggerType === "schedule") tc = { outside_hours: !edScheduleAlways, from: edScheduleFrom, to: edScheduleTo }
    const body = { name: edName.trim(), trigger_type: edTriggerType, trigger_config: tc, response_text: edTriggerType === "ai_fallback" ? null : edResponseText, delay_seconds: edDelay, priority: edPriority, platforms, cooldown_minutes: edCooldown, schedule_active: edScheduleAlways ? { always: true } : { from: edScheduleFrom, to: edScheduleTo } }
    try { if (arEditRule) await apiFetch(`/autoreply/rules/${arEditRule.id}`, { method: "PUT", body: JSON.stringify(body) }); else await apiFetch("/autoreply/rules", { method: "POST", body: JSON.stringify(body) }); setArShowEditor(false); loadAutoReply() } finally { setArSaving(false) }
  }
  function addKeyword() { const kw = edKeywordInput.trim().toLowerCase(); if (kw && !edKeywords.includes(kw)) setEdKeywords([...edKeywords, kw]); setEdKeywordInput("") }

  // Filters
  const filteredAccounts = accounts.filter(a => tabFilter === "all" || a.platform === tabFilter)
  const filteredConvs = conversations.filter(c => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return (c.chat_name?.toLowerCase().includes(q) || c.contact?.display_name?.toLowerCase().includes(q) || c.contact?.phone_number?.includes(q) || c.last_message_preview?.toLowerCase().includes(q)) })
  const ctxConv = conversations.find(c => c.id === ctxMenu?.convId)

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0b141a] text-white">
      {/* ═══ Header ═══ */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942] shrink-0">
        <div className="flex items-center gap-3">
          <a href="/admin/agency" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></a>
          <div className="w-8 h-8 bg-[#00a884] rounded-lg flex items-center justify-center"><MessageCircle size={18} /></div>
          <h1 className="text-lg font-bold tracking-tight">MessengerHub</h1>
          {healthStatus && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${healthStatus.status === "ok" ? "bg-green-900/30 text-green-400" : healthStatus.status === "degraded" ? "bg-yellow-900/30 text-yellow-400" : "bg-red-900/30 text-red-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${healthStatus.status === "ok" ? "bg-green-500" : healthStatus.status === "degraded" ? "bg-yellow-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
              {healthStatus.status === "ok" ? "Online" : healthStatus.status === "degraded" ? "Degraded" : "Error"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 bg-[#1f2c34] rounded-lg p-1">
          <button onClick={() => setMainView("chat")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mainView === "chat" ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"}`}><MessageCircle size={14} /> Chat</button>
          <button onClick={() => setMainView("autoreply")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mainView === "autoreply" ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"}`}><Bot size={14} /> Auto-Reply</button>
          <button onClick={() => setMainView("contacts")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mainView === "contacts" ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"}`}><BookOpen size={14} /> Kontakter</button>
        </div>
        <div className="flex items-center gap-2">
          {mainView === "chat" && (
            <div className="flex items-center gap-1 bg-[#1f2c34] rounded-lg p-1 mr-2">
              {(["all", "whatsapp", "telegram"] as TabFilter[]).map(tab => (
                <button key={tab} onClick={() => setTabFilter(tab)} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${tabFilter === tab ? "bg-[#2a3942] text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  {tab === "whatsapp" && <WhatsAppIcon size={12} />}{tab === "telegram" && <TelegramIcon size={12} />}{tab === "all" ? "Alle" : tab === "whatsapp" ? "WA" : "TG"}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => { setShowAddModal(true); setNewName(""); setNewPhone(""); setNewPlatform("whatsapp"); setQrDataUrl(null); setQrAccountId(null); setQrPolling(false); setPairLink(null); setPairCopied(false) }}
            className="flex items-center gap-2 px-3 py-2 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-lg"><Plus size={16} /><span className="hidden md:inline">Add Account</span></button>
        </div>
      </header>

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {mainView === "chat" ? (
          <>
            {/* Left: Accounts */}
            <aside className="w-[220px] shrink-0 border-r border-[#2a3942] bg-[#111b21]/50 flex flex-col">
              <div className="px-3 py-3 border-b border-[#2a3942]"><span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{filteredAccounts.length} Account{filteredAccounts.length !== 1 ? "s" : ""}</span></div>
              <div className="flex-1 overflow-y-auto">
                {loading ? <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-gray-500" size={20} /></div>
                : filteredAccounts.length === 0 ? <div className="text-center py-10 px-3"><Phone size={28} className="mx-auto text-gray-600 mb-2" /><p className="text-sm text-gray-500">Ingen konti</p></div>
                : filteredAccounts.map(account => {
                  const eff = getEffectiveStatus(account)
                  return (
                    <div key={account.id} onClick={() => setSelectedAccountId(account.id)} className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-[#2a3942]/50 transition-colors group ${selectedAccountId === account.id ? "bg-[#2a3942]/80" : "hover:bg-[#2a3942]/40"}`}>
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${account.platform === "whatsapp" ? "bg-gradient-to-br from-green-600 to-green-800" : "bg-gradient-to-br from-blue-500 to-blue-700"}`}>
                          {account.platform === "whatsapp" ? <WhatsAppIcon size={18} /> : <TelegramIcon size={18} />}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5"><StatusDot status={eff} /></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{(account as any).country_code ? ccToFlag((account as any).country_code)+' ' : ''}{account.display_name || "Unnamed"}</p>
                        <p className="text-xs text-gray-500 truncate">{account.phone_number || account.platform}</p>
                        <span className="text-[10px] text-gray-600 capitalize">{eff.replace("_", " ")}</span>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {(eff === "disconnected" || eff === "error") ? <button onClick={e => { e.stopPropagation(); connectAccount(account.id) }} className="p-1 text-green-500 hover:text-green-400" title="Connect"><LogIn size={13} /></button>
                        : eff === "connected" ? <button onClick={e => { e.stopPropagation(); disconnectAccount(account.id) }} className="p-1 text-yellow-500 hover:text-yellow-400" title="Disconnect"><LogOut size={13} /></button> : null}
                        <button onClick={e => { e.stopPropagation(); deleteAccount(account.id) }} className="p-1 text-gray-600 hover:text-red-500" title="Slet"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>

            {/* Middle: Conversations */}
            <div className="w-[320px] shrink-0 border-r border-[#2a3942] flex flex-col bg-[#0b141a]">
              {selectedAccount ? (
                <>
                  <div className="px-3 py-3 border-b border-[#2a3942]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="Søg samtaler..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredConvs.length === 0 ? <div className="text-center py-16 px-4"><MessageCircle size={32} className="mx-auto text-gray-700 mb-3" /><p className="text-sm text-gray-500">Ingen samtaler</p></div>
                    : filteredConvs.map(conv => {
                      const name = displayName(conv)
                      const isBlocked = conv.contact?.is_blocked
                      return (
                        <div key={conv.id} onClick={() => { setSelectedConvId(conv.id); if (conv.marked_unread) apiFetch(`/conversations/${conv.id}/mark-unread`, { method: "PATCH" }) }}
                          onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, convId: conv.id }) }}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-[#2a3942]/30 transition-colors ${selectedConvId === conv.id ? "bg-[#2a3942]/60" : "hover:bg-[#2a3942]/30"}`}>
                          <Avatar name={name} url={conv.contact?.avatar_url} size={40} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {conv.is_pinned && <Pin size={10} className="text-gray-500 shrink-0" />}
                                <p className={`text-sm font-medium truncate ${isBlocked ? "text-red-400 line-through" : ""}`}>{conv.contact?.country_code ? ccToFlag(conv.contact.country_code)+' ' : ''}{name}</p>
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-center gap-1 min-w-0">
                                {conv.is_muted && <BellOff size={10} className="text-gray-600 shrink-0" />}
                                <p className="text-xs text-gray-500 truncate">{conv.last_message_preview || "Ingen beskeder"}</p>
                              </div>
                              {(conv.unread_count > 0 || conv.marked_unread) && (
                                <span className="ml-2 shrink-0 bg-[#00a884] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {conv.unread_count > 99 ? "99+" : conv.unread_count || "●"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center px-4"><div className="text-center"><MessageSquare size={32} className="mx-auto text-gray-700 mb-3" /><p className="text-sm text-gray-500">Vælg en konto</p></div></div>
              )}
            </div>

            {/* Right: Chat + Contact Panel */}
            <div className="flex-1 flex">
              <div className={`flex-1 flex flex-col bg-[#0b141a] ${showContactPanel ? "" : ""}`}>
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942] shrink-0">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={openContactPanel}>
                        <Avatar name={displayName(selectedConv)} url={selectedConv.contact?.avatar_url} size={36} />
                        <div>
                          <p className="text-sm font-medium">{selectedConv.contact?.country_code ? ccToFlag(selectedConv.contact.country_code)+' ' : ''}{displayName(selectedConv)}</p>
                          {displayPhone(selectedConv) && displayPhone(selectedConv) !== displayName(selectedConv) && (
                            <p className="text-[11px] text-gray-500">{displayPhone(selectedConv)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={openContactPanel} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg" title="Kontakt-detaljer"><UserPlus size={16} /></button>
                        <button onClick={() => loadMessages(selectedConv.id)} className="p-2 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg"><RefreshCw size={16} /></button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                      {messages.length === 0 ? <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-600">Ingen beskeder</p></div>
                      : messages.map(msg => {
                        const isOut = msg.direction === "outbound"
                        return (
                          <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[65%] rounded-2xl px-3.5 py-2 ${isOut ? "bg-[#005c4b] rounded-br-md" : "bg-[#1f2c34] rounded-bl-md"}`}>
                              {msg.is_auto_reply && isOut && <div className="flex items-center gap-1 text-[10px] text-blue-400 mb-1"><Zap size={10} /><span>Auto-reply</span></div>}
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content || `[${msg.message_type}]`}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500">{formatTime(msg.created_at)}</span>
                                {isOut && <span className="text-gray-400">{msg.status === "read" ? <CheckCheck size={12} className="text-blue-400" /> : msg.status === "delivered" ? <CheckCheck size={12} /> : msg.status === "sent" ? <Check size={12} /> : <Clock size={10} />}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 bg-[#111b21] border-t border-[#2a3942] shrink-0">
                      {getEffectiveStatus(selectedAccount!) !== "connected" ? <div className="flex items-center justify-center gap-2 py-2 text-gray-500 text-sm"><WifiOff size={16} /><span>Konto ikke forbundet</span></div>
                      : <div className="flex items-end gap-2">
                        <textarea value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Skriv en besked..." rows={1}
                          className="flex-1 px-4 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" />
                        <button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg} className="p-2.5 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl shrink-0 mb-0.5"><Send size={16} /></button>
                      </div>}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1f2c34] flex items-center justify-center"><MessageCircle size={28} className="text-gray-600" /></div><p className="text-gray-400 font-medium">Vælg en samtale</p></div></div>
                )}
              </div>

              {/* Contact Detail Panel */}
              {showContactPanel && selectedConv?.contact && (
                <div className="w-[300px] shrink-0 border-l border-[#2a3942] bg-[#111b21] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3942]">
                    <h3 className="text-sm font-semibold">Kontakt-detaljer</h3>
                    <button onClick={() => setShowContactPanel(false)} className="p-1 text-gray-400 hover:text-white"><X size={16} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <div className="text-center">
                      <Avatar name={contactDetail?.display_name || "?"} url={contactDetail?.avatar_url} size={80} />
                      <input type="text" value={contactNameEdit} onChange={e => setContactNameEdit(e.target.value)} placeholder="Kontaktnavn"
                        className="mt-3 w-full text-center px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telefon</p>
                      <p className="text-sm text-gray-300">{displayPhone(selectedConv) || contactDetail?.phone_number || "Ukendt"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Noter</p>
                      <textarea value={contactNotes} onChange={e => setContactNotes(e.target.value)} rows={3} placeholder="Tilføj noter..."
                        className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {(contactDetail?.tags || []).map(t => <span key={t} className="px-2 py-0.5 bg-[#1f2c34] text-xs text-gray-400 rounded">{t}</span>)}
                        {(!contactDetail?.tags || contactDetail.tags.length === 0) && <span className="text-xs text-gray-600">Ingen tags</span>}
                      </div>
                    </div>
                    <button onClick={saveContact} disabled={savingContact}
                      className="w-full py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                      {savingContact && <Loader2 size={14} className="animate-spin" />} Gem ændringer
                    </button>
                    <div className="pt-2 border-t border-[#2a3942]">
                      {contactDetail?.is_blocked ? (
                        <button onClick={() => { if (selectedConv) unblockContact(selectedConv.id) }} className="w-full py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 text-sm rounded-lg flex items-center justify-center gap-2"><ShieldOff size={14} /> Fjern blokering</button>
                      ) : (
                        <button onClick={() => { if (selectedConv) blockContact(selectedConv.id) }} className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg flex items-center justify-center gap-2"><Ban size={14} /> Bloker kontakt</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ════ AUTO-REPLY VIEW ════ */
          <div className="flex flex-1 overflow-hidden">
            <div className="w-[60%] flex flex-col border-r border-[#2a3942]">
              <div className="flex items-center justify-between px-4 py-3 bg-[#111b21] border-b border-[#2a3942]">
                <h2 className="text-sm font-semibold text-gray-300">Auto-Reply Regler</h2>
                <button onClick={() => openRuleEditor()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884] hover:bg-[#00c49a] text-white text-sm font-medium rounded-lg"><Plus size={14} /> Ny regel</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {arRules.length === 0 ? <div className="text-center py-16"><Bot size={32} className="mx-auto text-gray-700 mb-3" /><p className="text-sm text-gray-500">Ingen regler</p></div>
                : arRules.map(rule => {
                  const Icon = TRIGGER_ICONS[rule.trigger_type] || Bot
                  return (
                    <div key={rule.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2a3942]/50 hover:bg-[#1f2c34]/50 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rule.enabled ? "bg-[#00a884]/20 text-[#00a884]" : "bg-gray-800 text-gray-600"}`}><Icon size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${rule.enabled ? "text-white" : "text-gray-500"}`}>{rule.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2c34] text-gray-400">{TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-gray-600">P{rule.priority}</span><span className="text-[10px] text-gray-600">{rule.delay_seconds}s</span><span className="text-[10px] text-gray-600">{rule.stats_sent} sendt</span>
                          {(rule.platforms || []).map(p => <span key={p} className="text-[10px]">{p === "whatsapp" ? <WhatsAppIcon size={10} /> : <TelegramIcon size={10} />}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRule(rule.id)} className={`p-1 rounded ${rule.enabled ? "text-[#00a884]" : "text-gray-600"}`}>{rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}</button>
                        <button onClick={() => openRuleEditor(rule)} className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
                        <button onClick={() => deleteRule(rule.id)} className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="w-[40%] flex flex-col bg-[#0b141a]">
              <div className="px-4 py-3 bg-[#111b21] border-b border-[#2a3942]"><h2 className="text-sm font-semibold text-gray-300">Seneste auto-replies</h2></div>
              <div className="flex-1 overflow-y-auto">
                {arLog.length === 0 ? <div className="text-center py-16"><Activity size={24} className="mx-auto text-gray-700 mb-2" /><p className="text-xs text-gray-600">Ingen auto-replies endnu</p></div>
                : arLog.slice(0, 50).map(e => (
                  <div key={e.id} className="px-4 py-2.5 border-b border-[#2a3942]/30 hover:bg-[#1f2c34]/30">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Zap size={12} className="text-[#00a884]" /><span className="text-xs font-medium text-white">{e.rule_name || "Regel"}</span></div><span className="text-[10px] text-gray-600">{formatDateTime(e.created_at)}</span></div>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-gray-400">→ {e.contact_name || "Ukendt"}</span><span className="text-[10px]">{e.platform === "telegram" ? <TelegramIcon size={10} /> : <WhatsAppIcon size={10} />}</span></div>
                  </div>
                ))}
              </div>
              {arStats && (
                <div className="p-4 bg-[#111b21] border-t border-[#2a3942] shrink-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1f2c34] rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase">Sendt i dag</p><p className="text-lg font-bold text-[#00a884]">{arStats.sentToday}</p></div>
                    <div className="bg-[#1f2c34] rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase">Aktive regler</p><p className="text-lg font-bold text-white">{arStats.activeRules}</p></div>
                    <div className="bg-[#1f2c34] rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase">Total sendt</p><p className="text-lg font-bold text-white">{arStats.totalSent}</p></div>
                    <div className="bg-[#1f2c34] rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase">Avg responstid</p><p className="text-lg font-bold text-white">{arStats.avgResponseTime}ms</p></div>
                  </div>
                  {arStats.topRule && <div className="mt-3 bg-[#1f2c34] rounded-lg p-3"><p className="text-[10px] text-gray-500 uppercase">Mest brugte</p><p className="text-sm font-medium text-white mt-0.5">{arStats.topRule.name} <span className="text-gray-500">({arStats.topRule.count}×)</span></p></div>}
                </div>
              )}
            </div>
          </div>
        ) : mainView === "contacts" ? (
          /* ════ CONTACTS VIEW ════ */
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Contact List */}
            <div className="w-[55%] flex flex-col border-r border-[#2a3942]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#111b21] border-b border-[#2a3942]">
                <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Søg kontakter..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /></div>
                <select value={contactCountryFilter} onChange={e => setContactCountryFilter(e.target.value)} className="px-2 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-xs text-gray-300 focus:outline-none">
                  <option value="">Alle lande</option>
                  {countries.map(c => <option key={c.code} value={c.code}>{c.code !== 'unknown' ? ccToFlag(c.code)+' '+c.code : '❓ Ukendt'} ({c.count})</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto">
                {allContacts.length === 0 ? <div className="text-center py-16"><BookOpen size={32} className="mx-auto text-gray-700 mb-3" /><p className="text-sm text-gray-500">Ingen kontakter</p></div>
                : allContacts.map(c => {
                  const name = (c as any).custom_name || c.display_name || c.phone_number || 'Ukendt'
                  const flag = ccToFlag(c.country_code)
                  return (
                    <div key={c.id} onClick={() => selectContactForEdit(c)} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-[#2a3942]/30 transition-colors ${selectedContact?.id === c.id ? 'bg-[#2a3942]/60' : 'hover:bg-[#2a3942]/30'}`}>
                      <Avatar name={name} url={c.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {c.is_favorite && <span className="text-yellow-500 text-xs">★</span>}
                          <p className="text-sm font-medium truncate">{flag ? flag+' ' : ''}{name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500">{c.phone_number || ''}</span>
                          {(Array.isArray(c.tags) ? c.tags as string[] : []).slice(0,2).map(t => <span key={t} className="text-[10px] px-1 py-0.5 bg-[#1f2c34] text-gray-500 rounded">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Contact Detail */}
            <div className="w-[45%] flex flex-col bg-[#0b141a]">
              {selectedContact ? (
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                  <div className="text-center">
                    <Avatar name={(selectedContact as any).custom_name || selectedContact.display_name || '?'} url={selectedContact.avatar_url} size={80} />
                    <p className="text-lg font-bold mt-3">{ccToFlag(selectedContact.country_code)} {(selectedContact as any).custom_name || selectedContact.display_name || 'Ukendt'}</p>
                    <p className="text-xs text-gray-500">{selectedContact.phone_number}</p>
                  </div>
                  <div className="space-y-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Brugerdefineret navn</label><input type="text" value={ceCustomName} onChange={e => setCeCustomName(e.target.value)} placeholder="Overskriver WA-navn" className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Email</label><input type="email" value={ceEmail} onChange={e => setCeEmail(e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Land</label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ccToFlag(ceCountry)}</span>
                        <input type="text" value={ceCountry} onChange={e => setCeCountry(e.target.value.toUpperCase().slice(0,2))} placeholder="DK" maxLength={2} className="w-20 px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white uppercase focus:outline-none focus:border-[#00a884]" />
                      </div>
                    </div>
                    <div><label className="block text-xs text-gray-500 mb-1">Noter</label><textarea value={ceNotes} onChange={e => setCeNotes(e.target.value)} rows={3} placeholder="Tilføj noter..." className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Tags</label>
                      <div className="flex gap-2 mb-2"><input type="text" value={ceTagInput} onChange={e => setCeTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = ceTagInput.trim(); if (t && !ceTags.includes(t)) setCeTags([...ceTags, t]); setCeTagInput('') }}} placeholder="Tilføj tag..." className="flex-1 px-3 py-1.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
                      <div className="flex flex-wrap gap-1">{ceTags.map(t => <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-[#1f2c34] text-xs text-gray-300 rounded-md">{t}<button onClick={() => setCeTags(ceTags.filter(x => x !== t))} className="text-gray-500 hover:text-red-400"><X size={10} /></button></span>)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-500">Favorit</label>
                      <button onClick={() => setCeFavorite(!ceFavorite)} className={`p-1 rounded ${ceFavorite ? 'text-yellow-500' : 'text-gray-600'}`}>{ceFavorite ? <span className="text-lg">★</span> : <span className="text-lg">☆</span>}</button>
                    </div>
                  </div>
                  <button onClick={saveContactEdit} disabled={ceSaving} className="w-full py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">{ceSaving && <Loader2 size={14} className="animate-spin" />}Gem</button>
                  <div className="flex gap-2">
                    <button onClick={() => openChatWithContact(selectedContact)} className="flex-1 py-2 bg-[#1f2c34] hover:bg-[#2a3942] text-white text-sm rounded-lg flex items-center justify-center gap-1.5"><Send size={14} /> Send besked</button>
                    <button onClick={() => { if(selectedContact) blockContact(selectedContact.id); loadContacts() }} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg"><Ban size={14} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center"><div className="text-center"><BookOpen size={32} className="mx-auto text-gray-700 mb-3" /><p className="text-sm text-gray-500">Vælg en kontakt</p></div></div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ═══ Context Menu ═══ */}
      {ctxMenu && ctxConv && (
        <div className="fixed z-50 bg-[#1f2c34] border border-[#2a3942] rounded-xl shadow-2xl py-1 min-w-[180px]" style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => pinConv(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-[#2a3942] hover:text-white"><Pin size={14} />{ctxConv.is_pinned ? "Unpin" : "Pin til top"}</button>
          <button onClick={() => markUnread(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-[#2a3942] hover:text-white"><Eye size={14} />Marker som ulæst</button>
          <button onClick={() => muteConv(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:bg-[#2a3942] hover:text-white">{ctxConv.is_muted ? <Volume2 size={14} /> : <BellOff size={14} />}{ctxConv.is_muted ? "Unmute" : "Mute"}</button>
          <div className="border-t border-[#2a3942] my-1" />
          {ctxConv.contact?.is_blocked ? (
            <button onClick={() => unblockContact(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-green-400 hover:bg-[#2a3942]"><ShieldOff size={14} />Fjern blokering</button>
          ) : (
            <button onClick={() => blockContact(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-[#2a3942]"><Ban size={14} />Bloker kontakt</button>
          )}
          <button onClick={() => archiveConv(ctxMenu.convId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-[#2a3942]"><Archive size={14} />Slet samtale</button>
        </div>
      )}

      {/* ═══ Rule Editor Modal ═══ */}
      {arShowEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setArShowEditor(false)}>
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3942] sticky top-0 bg-[#111b21] z-10">
              <h2 className="text-base font-bold">{arEditRule ? "Rediger regel" : "Ny regel"}</h2>
              <button onClick={() => setArShowEditor(false)} className="p-1 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div><label className="block text-xs text-gray-400 mb-1.5">Regelnavn *</label><input type="text" value={edName} onChange={e => setEdName(e.target.value)} placeholder="f.eks. Velkomstbesked" className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /></div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Trigger type</label>
                <div className="grid grid-cols-3 gap-2">{Object.entries(TRIGGER_LABELS).map(([k, l]) => { const I = TRIGGER_ICONS[k] || Bot; return (<button key={k} onClick={() => setEdTriggerType(k)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border ${edTriggerType === k ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400 hover:border-gray-600"}`}><I size={12} /> {l}</button>) })}</div>
              </div>
              {edTriggerType === "keyword" && <div><label className="block text-xs text-gray-400 mb-1.5">Nøgleord</label><div className="flex gap-2 mb-2"><input type="text" value={edKeywordInput} onChange={e => setEdKeywordInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword() } }} placeholder="Tilføj..." className="flex-1 px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /><button onClick={addKeyword} className="px-3 py-2 bg-[#2a3942] hover:bg-[#3a4a52] text-white text-sm rounded-lg"><Plus size={14} /></button></div><div className="flex flex-wrap gap-1.5">{edKeywords.map(kw => <span key={kw} className="flex items-center gap-1 px-2 py-1 bg-[#1f2c34] text-xs text-gray-300 rounded-md">{kw}<button onClick={() => setEdKeywords(edKeywords.filter(k => k !== kw))} className="text-gray-500 hover:text-red-400"><X size={10} /></button></span>)}</div></div>}
              {edTriggerType === "regex" && <div><label className="block text-xs text-gray-400 mb-1.5">Regex pattern</label><input type="text" value={edRegexPattern} onChange={e => setEdRegexPattern(e.target.value)} placeholder="\\d{4}" className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /></div>}
              {edTriggerType === "ai_fallback" && <div><label className="block text-xs text-gray-400 mb-1.5">AI System Prompt</label><textarea value={edAiPrompt} onChange={e => setEdAiPrompt(e.target.value)} rows={3} placeholder="Du er en venlig assistent..." className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" /></div>}
              {edTriggerType === "schedule" && <div><label className="block text-xs text-gray-400 mb-1.5">Tidsplan</label><div className="flex items-center gap-3 mb-2"><button onClick={() => setEdScheduleAlways(true)} className={`px-3 py-1.5 rounded-lg text-xs border ${edScheduleAlways ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400"}`}>Altid aktiv</button><button onClick={() => setEdScheduleAlways(false)} className={`px-3 py-1.5 rounded-lg text-xs border ${!edScheduleAlways ? "border-[#00a884] bg-[#00a884]/20 text-[#00a884]" : "border-[#2a3942] text-gray-400"}`}>Uden for timer</button></div>{!edScheduleAlways && <div className="flex items-center gap-2"><input type="time" value={edScheduleFrom} onChange={e => setEdScheduleFrom(e.target.value)} className="px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white" /><span className="text-gray-500 text-sm">til</span><input type="time" value={edScheduleTo} onChange={e => setEdScheduleTo(e.target.value)} className="px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white" /></div>}</div>}
              {edTriggerType !== "ai_fallback" && <div><label className="block text-xs text-gray-400 mb-1.5">Svar-tekst</label><textarea value={edResponseText} onChange={e => setEdResponseText(e.target.value)} rows={3} placeholder="Hej! Tak for din besked..." className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884] resize-none" /></div>}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Forsinkelse (s)</label><input type="number" value={edDelay} onChange={e => setEdDelay(parseInt(e.target.value) || 5)} min={1} className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Prioritet</label><input type="number" value={edPriority} onChange={e => setEdPriority(parseInt(e.target.value) || 10)} min={1} className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Cooldown (min)</label><input type="number" value={edCooldown} onChange={e => setEdCooldown(parseInt(e.target.value) || 60)} min={0} className="w-full px-3 py-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white focus:outline-none focus:border-[#00a884]" /></div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1.5">Platforme</label><div className="flex items-center gap-3">
                <button onClick={() => setEdPlatformWA(!edPlatformWA)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${edPlatformWA ? "border-green-600 bg-green-600/20 text-green-400" : "border-[#2a3942] text-gray-500"}`}><WhatsAppIcon size={12} /> WhatsApp</button>
                <button onClick={() => setEdPlatformTG(!edPlatformTG)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${edPlatformTG ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-[#2a3942] text-gray-500"}`}><TelegramIcon size={12} /> Telegram</button>
              </div></div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a3942] sticky bottom-0 bg-[#111b21]">
              <button onClick={() => setArShowEditor(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg">Annuller</button>
              <button onClick={saveRule} disabled={!edName.trim() || arSaving} className="flex items-center gap-2 px-4 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg">{arSaving && <Loader2 size={14} className="animate-spin" />}{arEditRule ? "Gem" : "Opret"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Account Modal ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { if (!qrPolling) setShowAddModal(false) }}>
          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3942]"><h2 className="text-base font-bold">Tilføj Konto</h2><button onClick={() => { setShowAddModal(false); setQrPolling(false) }} className="p-1 text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg"><X size={18} /></button></div>
            <div className="px-5 py-5 space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1.5">Platform</label><div className="flex gap-2">
                <button onClick={() => setNewPlatform("whatsapp")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 ${newPlatform === "whatsapp" ? "border-green-600 bg-green-600/20 text-green-400" : "border-[#2a3942] text-gray-400 hover:border-gray-600"}`}><WhatsAppIcon size={18} /> WhatsApp</button>
                <button onClick={() => setNewPlatform("telegram")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 ${newPlatform === "telegram" ? "border-blue-600 bg-blue-600/20 text-blue-400" : "border-[#2a3942] text-gray-400 hover:border-gray-600"}`}><TelegramIcon size={18} /> Telegram</button>
              </div></div>
              <div><label className="block text-sm text-gray-400 mb-1.5">Konto Navn *</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="f.eks. Business WhatsApp" className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /></div>
              <div><label className="block text-sm text-gray-400 mb-1.5">Telefonnummer</label><input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+45 53 71 03 69" className="w-full px-3 py-2.5 bg-[#1f2c34] border border-[#2a3942] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00a884]" /></div>
              {qrPolling && <div className="bg-[#1f2c34] border border-[#2a3942] rounded-xl p-4 text-center">{qrDataUrl ? <><img src={qrDataUrl} alt="QR" className="mx-auto w-[250px] h-[250px] rounded-lg" /><p className="text-sm text-[#00a884] mt-3 font-medium">Scan QR-koden med WhatsApp</p></> : <><Loader2 size={40} className="mx-auto text-gray-500 animate-spin mb-3" /><p className="text-sm text-gray-400">Venter på QR-kode...</p></>}</div>}
              {/* Pair link buttons */}
              {qrPolling && pairLink && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-[#1f2c34] border border-[#2a3942] rounded-lg px-3 py-2">
                    <input type="text" readOnly value={pairLink} className="flex-1 bg-transparent text-xs text-gray-400 outline-none truncate" />
                    <button onClick={copyPairLink} className={`px-3 py-1 text-xs font-medium rounded-md shrink-0 transition-colors ${pairCopied ? 'bg-[#00a884] text-white' : 'bg-[#2a3942] text-gray-300 hover:bg-[#3a4a52]'}`}>{pairCopied ? '✓ Kopieret' : 'Kopiér'}</button>
                  </div>
                  <p className="text-[10px] text-gray-600 text-center">Del dette link — modtageren kan paire uden login (udløber om 5 min)</p>
                </div>
              )}
              {!qrPolling && <div className="bg-[#1f2c34] border border-[#2a3942] rounded-xl p-6 text-center"><QrCode size={48} className="mx-auto text-gray-600 mb-3" /><p className="text-sm text-gray-400">Tryk &quot;Tilføj&quot; for at begynde</p></div>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a3942]">
              <button onClick={() => { setShowAddModal(false); setQrPolling(false) }} className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#2a3942] rounded-lg">{qrPolling ? "Luk" : "Annuller"}</button>
              {!qrPolling && <button onClick={createAccount} disabled={!newName.trim() || addingAccount} className="flex items-center gap-2 px-4 py-2 bg-[#00a884] hover:bg-[#00c49a] disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg">{addingAccount && <Loader2 size={14} className="animate-spin" />}Tilføj & Forbind</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
