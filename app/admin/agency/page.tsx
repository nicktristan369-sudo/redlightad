"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Smartphone, Plus, Settings, MessageSquare, Bell, Search, 
  MoreVertical, Send, User, Clock, Check, CheckCheck, AlertTriangle,
  Wifi, WifiOff, Battery, BatteryLow, X, ChevronRight, Bot, Hand,
  Volume2, VolumeX, Trash2, Edit, Filter, RefreshCw
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
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load data
  useEffect(() => {
    loadData()
    
    // Set up realtime subscriptions
    const messagesChannel = supabase
      .channel("agency_messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "agency_messages" }, 
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages(prev => [...prev, payload.new as Message])
          }
        })
      .subscribe()

    const notificationsChannel = supabase
      .channel("agency_notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agency_notifications" },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          // Play notification sound
          new Audio("/notification.mp3").play().catch(() => {})
        })
      .subscribe()

    const phonesChannel = supabase
      .channel("agency_phones")
      .on("postgres_changes", { event: "*", schema: "public", table: "agency_phones" },
        () => loadPhones())
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(phonesChannel)
    }
  }, [])

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
              <span className="text-lg font-bold">
                {phone.persona_name.charAt(0)}
              </span>
              
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
                  <button className="p-1.5 hover:bg-gray-800 rounded">
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">{selectedPhoneData?.phone_number}</p>
                
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
                          {conv.customer_name || conv.customer_phone}
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
                      {selectedConvData.customer_name || selectedConvData.customer_phone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedConvData.status === "ai_handling" ? "🤖 AI handling" : "✋ Manual mode"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                  <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
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
                    ? "AI is handling this conversation. Send a message to take over."
                    : "You are in control. Send messages manually."}
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
