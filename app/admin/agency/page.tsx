"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Smartphone, Plus, Settings, MessageSquare, Bell, Search, 
  MoreVertical, Send, User, Clock, Check, CheckCheck, AlertTriangle,
  Wifi, WifiOff, Battery, BatteryLow, X, ChevronRight, Bot, Hand,
  Volume2, VolumeX, Trash2, Edit, Filter, RefreshCw, Ban, Paperclip, Image
} from "lucide-react"

// Types
interface Phone {
  id: string
  phone_number: string
  device_id: string | null
  persona_name: string
  persona_age: number | null
  persona_location: string | null
  persona_personality: string | null
  ai_enabled: boolean
  ai_response_delay_min: number
  ai_response_delay_max: number
  is_online: boolean
  last_seen_at: string | null
  battery_level: number | null
  created_at: string
}

interface Conversation {
  id: string
  phone_id: string
  customer_phone: string
  customer_name: string | null
  status: "ai_handling" | "manual" | "closed"
  is_flagged: boolean
  message_count: number
  last_message_at: string | null
  last_message?: string
}

interface Message {
  id: string
  conversation_id: string
  direction: "inbound" | "outbound"
  content: string
  status: string
  sent_by: "ai" | "manual" | "customer"
  ai_generated: boolean
  created_at: string
  sent_at: string | null
}

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  phone_id: string | null
}

export default function AgencyPage() {
  const [phones, setPhones] = useState<Phone[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPhoneSettings, setShowPhoneSettings] = useState(false)
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load data
  useEffect(() => {
    loadData()
    
    // Set up realtime subscriptions
    const messagesChannel = supabase
      .channel("agency_messages_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agency_messages" }, 
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Also refresh conversations to update message count
          if (selectedPhone) loadConversations(selectedPhone)
        })
      .subscribe()

    const conversationsChannel = supabase
      .channel("agency_conversations_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agency_conversations" },
        () => {
          if (selectedPhone) loadConversations(selectedPhone)
        })
      .subscribe()

    const notificationsChannel = supabase
      .channel("agency_notifications_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agency_notifications" },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          // Play notification sound
          new Audio("/notification.mp3").play().catch(() => {})
        })
      .subscribe()

    const phonesChannel = supabase
      .channel("agency_phones_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "agency_phones" },
        () => loadPhones())
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(conversationsChannel)
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(phonesChannel)
    }
  }, [selectedPhone])

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load conversations when phone selected
  useEffect(() => {
    if (selectedPhone) loadConversations(selectedPhone)
  }, [selectedPhone])

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) loadMessages(selectedConversation)
  }, [selectedConversation])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadPhones(), loadNotifications()])
    setLoading(false)
  }

  async function loadPhones() {
    const { data } = await supabase
      .from("agency_phones")
      .select("*")
      .order("created_at", { ascending: true })
    if (data) setPhones(data)
  }

  async function loadConversations(phoneId: string) {
    const { data } = await supabase
      .from("agency_conversations")
      .select("*")
      .eq("phone_id", phoneId)
      .order("last_message_at", { ascending: false })
    if (data) setConversations(data)
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from("agency_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (data) setMessages(data)
  }

  async function loadNotifications() {
    const { data } = await supabase
      .from("agency_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedConversation) return
    
    const conversation = conversations.find(c => c.id === selectedConversation)
    if (!conversation) return

    // Insert message
    await supabase.from("agency_messages").insert({
      conversation_id: selectedConversation,
      phone_id: conversation.phone_id,
      direction: "outbound",
      content: messageInput.trim(),
      status: "pending",
      sent_by: "manual",
      ai_generated: false,
    })

    // Update conversation to manual mode
    await supabase
      .from("agency_conversations")
      .update({ status: "manual" })
      .eq("id", selectedConversation)

    setMessageInput("")
  }

  async function toggleAI(phoneId: string, enabled: boolean) {
    await supabase
      .from("agency_phones")
      .update({ ai_enabled: enabled })
      .eq("id", phoneId)
    loadPhones()
  }

  async function takeoverConversation(conversationId: string) {
    await supabase
      .from("agency_conversations")
      .update({ status: "manual" })
      .eq("id", conversationId)
    loadConversations(selectedPhone!)
  }

  async function returnToAI(conversationId: string) {
    await supabase
      .from("agency_conversations")
      .update({ status: "ai_handling" })
      .eq("id", conversationId)
    loadConversations(selectedPhone!)
  }

  async function updatePhone(phoneId: string, updates: any) {
    await supabase
      .from("agency_phones")
      .update(updates)
      .eq("id", phoneId)
    loadPhones()
  }

  async function updateContactName(conversationId: string, name: string) {
    await supabase
      .from("agency_conversations")
      .update({ contact_name: name })
      .eq("id", conversationId)
    loadConversations(selectedPhone!)
  }

  async function blockContact(conversationId: string) {
    await supabase
      .from("agency_conversations")
      .update({ status: "blocked" })
      .eq("id", conversationId)
    loadConversations(selectedPhone!)
    setSelectedConversation(null)
  }

  async function deleteConversation(conversationId: string) {
    // Delete messages first
    await supabase
      .from("agency_messages")
      .delete()
      .eq("conversation_id", conversationId)
    // Delete conversation
    await supabase
      .from("agency_conversations")
      .delete()
      .eq("id", conversationId)
    loadConversations(selectedPhone!)
    setSelectedConversation(null)
  }

  const unreadNotifications = notifications.filter(n => !n.is_read).length
  const selectedPhoneData = phones.find(p => p.id === selectedPhone)
  const selectedConvData = conversations.find(c => c.id === selectedConversation)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg">Agency SMS Management</h1>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
            {phones.length} phones • {phones.filter(p => p.is_online).length} online
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Contacts */}
          <a 
            href="/admin/agency/contacts"
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <User className="w-4 h-4" />
            Kontakter
          </a>

          {/* Add Phone */}
          <button 
            onClick={() => setShowPhoneModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Phone
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Phone List - Left Sidebar */}
        <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-3 overflow-y-auto">
          {phones.map(phone => (
            <button
              key={phone.id}
              onClick={() => { setSelectedPhone(phone.id); setSelectedConversation(null) }}
              className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedPhone === phone.id 
                  ? "bg-red-600" 
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {/* Online indicator */}
              <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
                phone.is_online ? "bg-green-500" : "bg-gray-600"
              }`} />
              
              {/* Avatar/Initial */}
              {(phone as any).avatar_url ? (
                <img src={(phone as any).avatar_url} alt={phone.persona_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold">
                  {phone.persona_name.charAt(0)}
                </span>
              )}
              
              {/* AI indicator */}
              {phone.ai_enabled && (
                <Bot className="w-3 h-3 absolute bottom-1 right-1 text-blue-400" />
              )}
            </button>
          ))}

          {phones.length === 0 && (
            <div className="text-center px-2">
              <p className="text-gray-500 text-[10px]">No phones</p>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="w-72 bg-gray-900/50 border-r border-gray-800 flex flex-col">
          {selectedPhone ? (
            <>
              {/* Phone Info Header */}
              <div className="p-3 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedPhoneData?.is_online ? "bg-green-500" : "bg-gray-600"}`} />
                    <span className="font-semibold">{selectedPhoneData?.persona_name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingPhone(selectedPhoneData || null)
                      setShowPhoneSettings(true)
                    }}
                    className="p-1.5 hover:bg-gray-800 rounded" 
                    title="Phone Settings"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">{selectedPhoneData?.phone_number}</p>
                <p className="text-[10px] text-gray-600 mt-1 font-mono break-all">ID: {selectedPhone}</p>
                
                {/* AI Toggle */}
                <div className="flex items-center justify-between mt-3 p-2 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">AI Auto-Reply</span>
                  </div>
                  <button
                    onClick={() => toggleAI(selectedPhone, !selectedPhoneData?.ai_enabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      selectedPhoneData?.ai_enabled ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      selectedPhoneData?.ai_enabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-2 border-b border-gray-800">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border-none rounded-lg pl-8 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-3 text-left border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                        selectedConversation === conv.id ? "bg-gray-800" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {(conv as any).contact_name || conv.customer_name || conv.customer_phone}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        {conv.status === "ai_handling" && (
                          <Bot className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
                        {conv.status === "manual" && (
                          <Hand className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        )}
                        {(conv.status as string) === "blocked" && (
                          <Ban className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        {conv.is_flagged && (
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-400 truncate">
                          {conv.message_count} messages
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a phone to view conversations
            </div>
          )}
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {selectedConversation && selectedConvData ? (
            <>
              {/* Conversation Header */}
              <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {(selectedConvData as any).contact_name || selectedConvData.customer_name || selectedConvData.customer_phone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedConvData.status === "ai_handling" ? "🤖 AI handling" : "✋ Manual mode"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Contact name edit */}
                  <button
                    onClick={() => {
                      const name = prompt("Gem kontakt som:", (selectedConvData as any).contact_name || "")
                      if (name !== null) {
                        updateContactName(selectedConversation, name)
                      }
                    }}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Gem kontakt"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {/* Block contact */}
                  <button
                    onClick={() => {
                      if (confirm(`Bloker ${selectedConvData.customer_phone}?`)) {
                        blockContact(selectedConversation)
                      }
                    }}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Bloker kontakt"
                  >
                    <Ban className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  {/* Delete conversation */}
                  <button
                    onClick={() => {
                      if (confirm("Slet hele samtalen?")) {
                        deleteConversation(selectedConversation)
                      }
                    }}
                    className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Slet samtale"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  
                  {selectedConvData.status === "ai_handling" ? (
                    <button
                      onClick={() => takeoverConversation(selectedConversation)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Hand className="w-4 h-4" />
                      Take Over
                    </button>
                  ) : (
                    <button
                      onClick={() => returnToAI(selectedConversation)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Bot className="w-4 h-4" />
                      Return to AI
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.direction === "outbound"
                          ? msg.sent_by === "ai" 
                            ? "bg-blue-600" 
                            : "bg-red-600"
                          : "bg-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-white/60">
                          {new Date(msg.created_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {msg.direction === "outbound" && (
                          <>
                            {msg.sent_by === "ai" && <Bot className="w-3 h-3 text-white/60" />}
                            {msg.status === "sent" && <Check className="w-3 h-3 text-white/60" />}
                            {msg.status === "delivered" && <CheckCheck className="w-3 h-3 text-white/60" />}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-gray-900 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  {/* Attachment button */}
                  <button
                    onClick={() => {
                      alert("📷 MMS (billede/video) kommer snart!\n\nSMS Bridge understøtter kun tekst-SMS lige nu.")
                    }}
                    className="w-11 h-11 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center transition-colors"
                    title="Vedhæft billede/video"
                  >
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Skriv en besked..."
                    className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="w-11 h-11 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {selectedConvData.status === "ai_handling" 
                    ? "AI styrer samtalen. Send en besked for at tage over."
                    : "Du styrer samtalen. Send beskeder manuelt."}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-16 h-16 mb-4 text-gray-700" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a phone and conversation to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          <div className="fixed top-14 right-4 w-80 max-h-96 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="font-semibold">Notifications</span>
              <button className="text-xs text-red-400 hover:text-red-300">Mark all read</button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 20).map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer ${
                      !notif.is_read ? "bg-gray-800/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.is_read && <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {notif.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.body}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">
                          {new Date(notif.created_at).toLocaleString("da-DK")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Phone Modal */}
      {showPhoneModal && (
        <PhoneModal onClose={() => setShowPhoneModal(false)} onSave={() => { setShowPhoneModal(false); loadPhones() }} />
      )}

      {/* Phone Settings Modal */}
      {showPhoneSettings && editingPhone && (
        <PhoneSettingsModal 
          phone={editingPhone} 
          onClose={() => {
            setShowPhoneSettings(false)
            setEditingPhone(null)
          }} 
          onSave={(updates) => {
            updatePhone(editingPhone.id, updates)
            setShowPhoneSettings(false)
            setEditingPhone(null)
          }} 
        />
      )}
    </div>
  )
}

// Phone Creation/Edit Modal
function PhoneModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    phone_number: "",
    persona_name: "",
    persona_age: "",
    persona_gender: "female",
    persona_height: "",
    persona_weight: "",
    persona_location: "",
    persona_nationality: "",
    persona_personality: "",
    persona_description: "",
    ai_response_delay_min: "45",
    ai_response_delay_max: "90",
    ai_style: "friendly",
    ai_language: "da",
  })

  const supabase = createClient()

  async function handleSubmit() {
    if (!form.phone_number || !form.persona_name) return
    setLoading(true)

    await supabase.from("agency_phones").insert({
      phone_number: form.phone_number,
      persona_name: form.persona_name,
      persona_age: form.persona_age ? parseInt(form.persona_age) : null,
      persona_gender: form.persona_gender,
      persona_height: form.persona_height || null,
      persona_weight: form.persona_weight || null,
      persona_location: form.persona_location || null,
      persona_nationality: form.persona_nationality || null,
      persona_personality: form.persona_personality || null,
      persona_description: form.persona_description || null,
      ai_response_delay_min: parseInt(form.ai_response_delay_min),
      ai_response_delay_max: parseInt(form.ai_response_delay_max),
      ai_style: form.ai_style,
      ai_language: form.ai_language,
      ai_enabled: true,
    })

    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add New Phone</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
            <input
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              placeholder="+45 12 34 56 78"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <hr className="border-gray-800" />
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Persona Information</p>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input
              value={form.persona_name}
              onChange={e => setForm({ ...form, persona_name: e.target.value })}
              placeholder="Sofia"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
              <input
                type="number"
                value={form.persona_age}
                onChange={e => setForm({ ...form, persona_age: e.target.value })}
                placeholder="25"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
              <select
                value={form.persona_gender}
                onChange={e => setForm({ ...form, persona_gender: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="trans">Trans</option>
              </select>
            </div>
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
              <input
                value={form.persona_height}
                onChange={e => setForm({ ...form, persona_height: e.target.value })}
                placeholder="168 cm"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight</label>
              <input
                value={form.persona_weight}
                onChange={e => setForm({ ...form, persona_weight: e.target.value })}
                placeholder="55 kg"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Location & Nationality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <input
                value={form.persona_location}
                onChange={e => setForm({ ...form, persona_location: e.target.value })}
                placeholder="København"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nationality</label>
              <input
                value={form.persona_nationality}
                onChange={e => setForm({ ...form, persona_nationality: e.target.value })}
                placeholder="Danish"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Personality</label>
            <input
              value={form.persona_personality}
              onChange={e => setForm({ ...form, persona_personality: e.target.value })}
              placeholder="Flirty, venlig, professionel"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={form.persona_description}
              onChange={e => setForm({ ...form, persona_description: e.target.value })}
              placeholder="Jeg er en charmerende pige der elsker at møde nye mennesker..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <hr className="border-gray-800" />
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">AI Settings</p>

          {/* Response Delay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Min Delay (sec)</label>
              <input
                type="number"
                value={form.ai_response_delay_min}
                onChange={e => setForm({ ...form, ai_response_delay_min: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Delay (sec)</label>
              <input
                type="number"
                value={form.ai_response_delay_max}
                onChange={e => setForm({ ...form, ai_response_delay_max: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Style & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">AI Style</label>
              <select
                value={form.ai_style}
                onChange={e => setForm({ ...form, ai_style: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="friendly">Friendly</option>
                <option value="flirty">Flirty</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
              <select
                value={form.ai_language}
                onChange={e => setForm({ ...form, ai_language: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="da">Danish</option>
                <option value="en">English</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.phone_number || !form.persona_name}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Phone"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Phone Settings Modal Component
function PhoneSettingsModal({ phone, onClose, onSave }: { 
  phone: Phone
  onClose: () => void
  onSave: (updates: Partial<Phone>) => void 
}) {
  const [form, setForm] = useState({
    persona_name: phone.persona_name || "",
    persona_age: phone.persona_age?.toString() || "",
    persona_gender: (phone as any).persona_gender || "female",
    persona_location: phone.persona_location || "",
    persona_nationality: (phone as any).persona_nationality || "",
    persona_height: (phone as any).persona_height || "",
    persona_weight: (phone as any).persona_weight || "",
    persona_personality: phone.persona_personality || "",
    persona_description: (phone as any).persona_description || "",
    persona_availability: (phone as any).persona_availability || "",
    persona_address: (phone as any).persona_address || "",
    ai_enabled: (phone as any).ai_enabled ?? true,
    ai_style: (phone as any).ai_style || "flirty",
    ai_response_delay_min: phone.ai_response_delay_min?.toString() || "45",
    ai_response_delay_max: phone.ai_response_delay_max?.toString() || "90",
    avatar_url: (phone as any).avatar_url || "",
  })
  const [customQA, setCustomQA] = useState<{q: string, a: string}[]>((phone as any).custom_qa || [])
  const [aiRules, setAiRules] = useState<string[]>((phone as any).ai_rules || [])
  const [newRule, setNewRule] = useState("")
  
  // Rates: [{service, incall, outcall}]
  const [rates, setRates] = useState<{service: string, incall: string, outcall: string}[]>(
    (phone as any).rates || [
      { service: "0.5 time", incall: "", outcall: "" },
      { service: "1 time", incall: "", outcall: "" },
      { service: "2 timer", incall: "", outcall: "" },
      { service: "3 timer", incall: "", outcall: "" },
      { service: "Hel nat", incall: "", outcall: "" },
    ]
  )
  
  // Standard services list
  const standardServices = [
    "Blowjob", "69", "Cum in mouth", "Cum in face", "Anal", "Kiss", "GFE",
    "Erotic massage", "Oil massage", "Escort service", "Lesbian", "Domina",
    "Goldenshower", "Handjob", "All positions", "Bondage", "Strap on",
    "Video call", "Roleplay", "Facesitting", "Couples"
  ]
  
  // Selected services (from standardServices + custom)
  const [selectedServices, setSelectedServices] = useState<string[]>((phone as any).services || [])
  const [customServices, setCustomServices] = useState<string[]>((phone as any).custom_services || [])
  const [newService, setNewService] = useState("")
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>((phone as any).avatar_url || null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setAvatarPreview(dataUrl)
        setForm({ ...form, avatar_url: dataUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    await onSave({
      persona_name: form.persona_name,
      persona_age: form.persona_age ? parseInt(form.persona_age) : null,
      persona_location: form.persona_location,
      persona_personality: form.persona_personality,
      ai_response_delay_min: parseInt(form.ai_response_delay_min) || 45,
      ai_response_delay_max: parseInt(form.ai_response_delay_max) || 90,
      // Extended fields
      persona_gender: form.persona_gender,
      persona_nationality: form.persona_nationality,
      persona_height: form.persona_height,
      persona_weight: form.persona_weight,
      persona_description: form.persona_description,
      persona_availability: form.persona_availability,
      persona_address: form.persona_address,
      rates: rates.filter(r => r.incall || r.outcall),
      services: selectedServices,
      custom_services: customServices,
      ai_enabled: form.ai_enabled,
      ai_style: form.ai_style,
      avatar_url: form.avatar_url,
      custom_qa: customQA.filter(qa => qa.q.trim() && qa.a.trim()),
      ai_rules: aiRules.filter(r => r.trim()),
    } as any)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-bold">📱 Phone Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    {form.persona_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700">
                <Edit className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <p className="font-semibold">{phone.phone_number}</p>
              <p className="text-xs text-gray-400 font-mono">ID: {phone.id}</p>
              <button 
                onClick={() => navigator.clipboard.writeText(phone.id)}
                className="text-xs text-blue-400 hover:underline mt-1"
              >
                Copy ID
              </button>
            </div>
          </div>

          {/* Persona Info */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">👤 Persona</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.persona_name}
                  onChange={e => setForm({ ...form, persona_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Age</label>
                <input
                  type="number"
                  value={form.persona_age}
                  onChange={e => setForm({ ...form, persona_age: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Gender</label>
                <select
                  value={form.persona_gender}
                  onChange={e => setForm({ ...form, persona_gender: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={form.persona_location}
                  onChange={e => setForm({ ...form, persona_location: e.target.value })}
                  placeholder="e.g. København"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nationality</label>
                <input
                  type="text"
                  value={form.persona_nationality}
                  onChange={e => setForm({ ...form, persona_nationality: e.target.value })}
                  placeholder="e.g. Danish"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Height</label>
                <input
                  type="text"
                  value={form.persona_height}
                  onChange={e => setForm({ ...form, persona_height: e.target.value })}
                  placeholder="e.g. 170cm"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-gray-400 mb-1">Personality</label>
              <input
                type="text"
                value={form.persona_personality}
                onChange={e => setForm({ ...form, persona_personality: e.target.value })}
                placeholder="e.g. Flirty, playful, mysterious"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={form.persona_description}
                onChange={e => setForm({ ...form, persona_description: e.target.value })}
                placeholder="Describe the persona in detail..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          </div>

          {/* AI Settings */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">🤖 AI Settings</p>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="text-sm">AI Auto-Reply</span>
              </div>
              <button
                onClick={() => setForm({ ...form, ai_enabled: !form.ai_enabled })}
                className={`w-10 h-5 rounded-full transition-colors ${
                  form.ai_enabled ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  form.ai_enabled ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Style</label>
                <select
                  value={form.ai_style}
                  onChange={e => setForm({ ...form, ai_style: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="flirty">😏 Flirty</option>
                  <option value="friendly">😊 Friendly</option>
                  <option value="professional">💼 Professional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Delay (s)</label>
                <input
                  type="number"
                  value={form.ai_response_delay_min}
                  onChange={e => setForm({ ...form, ai_response_delay_min: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Delay (s)</label>
                <input
                  type="number"
                  value={form.ai_response_delay_max}
                  onChange={e => setForm({ ...form, ai_response_delay_max: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">AI will wait between {form.ai_response_delay_min}-{form.ai_response_delay_max} seconds before replying</p>
          </div>

          {/* Rates Table */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">💰 Prisliste</p>
            
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-xs text-gray-500 font-medium">SERVICE</div>
              <div className="text-xs text-gray-500 font-medium text-center">INCALL</div>
              <div className="text-xs text-gray-500 font-medium text-center">OUTCALL</div>
            </div>
            
            {/* Rates rows */}
            <div className="space-y-2">
              {rates.map((rate, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={rate.service}
                    onChange={e => {
                      const newRates = [...rates]
                      newRates[index].service = e.target.value
                      setRates(newRates)
                    }}
                    placeholder="Service"
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={rate.incall}
                    onChange={e => {
                      const newRates = [...rates]
                      newRates[index].incall = e.target.value
                      setRates(newRates)
                    }}
                    placeholder="Pris / X"
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-red-500"
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={rate.outcall}
                      onChange={e => {
                        const newRates = [...rates]
                        newRates[index].outcall = e.target.value
                        setRates(newRates)
                      }}
                      placeholder="Pris / X"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => setRates(rates.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300 px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setRates([...rates, { service: "", incall: "", outcall: "" }])}
              className="mt-2 w-full py-1.5 border border-dashed border-gray-600 rounded text-xs text-gray-400 hover:border-gray-500"
            >
              + Tilføj pris
            </button>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">✨ Services</p>
            
            {/* Standard services grid */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[...standardServices, ...customServices].map(service => (
                <button
                  key={service}
                  onClick={() => {
                    if (selectedServices.includes(service)) {
                      setSelectedServices(selectedServices.filter(s => s !== service))
                    } else {
                      setSelectedServices([...selectedServices, service])
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedServices.includes(service)
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
            
            {/* Add custom service */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={e => setNewService(e.target.value)}
                placeholder="Tilføj custom service..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-500"
                onKeyDown={e => {
                  if (e.key === "Enter" && newService.trim()) {
                    setCustomServices([...customServices, newService.trim()])
                    setSelectedServices([...selectedServices, newService.trim()])
                    setNewService("")
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newService.trim()) {
                    setCustomServices([...customServices, newService.trim()])
                    setSelectedServices([...selectedServices, newService.trim()])
                    setNewService("")
                  }
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Tilføj
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">📍 Adresse / Lokation</p>
            <input
              type="text"
              value={form.persona_address || ""}
              onChange={e => setForm({ ...form, persona_address: e.target.value })}
              placeholder="f.eks. Vesterbrogade 45, 1620 København V"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">AI bruger denne adresse når kunder spørger hvor du er</p>
          </div>

          {/* Availability */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">🕐 Tilgængelighed</p>
            <input
              type="text"
              value={form.persona_availability}
              onChange={e => setForm({ ...form, persona_availability: e.target.value })}
              placeholder="f.eks. Man-Fre 18-22, Weekend hele dagen"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Custom Q&A */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">❓ Custom Q&A (Auto-svar)</p>
            <p className="text-xs text-gray-500 mb-3">Tilføj spørgsmål og svar. Hvis kunden skriver noget der matcher spørgsmålet, svarer AI automatisk med dit svar.</p>
            
            <div className="space-y-3">
              {customQA.map((qa, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Regel #{index + 1}</span>
                    <button
                      onClick={() => setCustomQA(customQA.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Slet
                    </button>
                  </div>
                  <input
                    type="text"
                    value={qa.q}
                    onChange={e => {
                      const newQA = [...customQA]
                      newQA[index].q = e.target.value
                      setCustomQA(newQA)
                    }}
                    placeholder="Hvis de spørger om... (f.eks. 'pris', 'hvor bor du')"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-red-500"
                  />
                  <textarea
                    value={qa.a}
                    onChange={e => {
                      const newQA = [...customQA]
                      newQA[index].a = e.target.value
                      setCustomQA(newQA)
                    }}
                    placeholder="Så svar... (dit svar)"
                    rows={2}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              ))}
              
              <button
                onClick={() => setCustomQA([...customQA, { q: "", a: "" }])}
                className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
              >
                + Tilføj Q&A regel
              </button>
            </div>
          </div>

          {/* AI Rules - Things AI must never do */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">⛔ Regler / AI må aldrig...</p>
            <p className="text-xs text-gray-500 mb-3">Tilføj regler for hvad AI aldrig må gøre eller sige.</p>
            
            <div className="space-y-2">
              {aiRules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-red-400">⛔</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={e => {
                      const newRules = [...aiRules]
                      newRules[index] = e.target.value
                      setAiRules(newRules)
                    }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => setAiRules(aiRules.filter((_, i) => i !== index))}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  placeholder="f.eks. Må aldrig give adresse, Må aldrig aftale pris under 1000kr..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newRule.trim()) {
                      setAiRules([...aiRules, newRule.trim()])
                      setNewRule("")
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newRule.trim()) {
                      setAiRules([...aiRules, newRule.trim()])
                      setNewRule("")
                    }
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                >
                  Tilføj
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3 sticky bottom-0 bg-gray-900">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !form.persona_name}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
