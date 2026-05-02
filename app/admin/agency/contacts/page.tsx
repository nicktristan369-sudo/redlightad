"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { 
  User, Phone, Tag, Search, Plus, Edit, Trash2, X, 
  ArrowLeft, Star, Ban, Clock, MessageSquare, Filter
} from "lucide-react"
import Link from "next/link"

interface Contact {
  id: string
  phone_number: string
  name: string
  category: string
  notes: string
  is_favorite: boolean
  is_blocked: boolean
  created_at: string
  last_contact_at: string | null
  total_messages: number
}

const CATEGORIES = [
  { id: "regular", label: "🔄 Faste kunder", color: "bg-green-600" },
  { id: "new", label: "🆕 Nye", color: "bg-blue-600" },
  { id: "vip", label: "⭐ VIP", color: "bg-yellow-600" },
  { id: "pending", label: "⏳ Afventer", color: "bg-orange-600" },
  { id: "blocked", label: "🚫 Blokeret", color: "bg-red-600" },
  { id: "other", label: "📁 Andet", color: "bg-gray-600" },
]

export default function ContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    const { data } = await supabase
      .from("agency_contacts")
      .select("*")
      .order("name", { ascending: true })
    
    setContacts(data || [])
    setLoading(false)
  }

  async function saveContact(contact: Partial<Contact>) {
    if (editingContact) {
      await supabase
        .from("agency_contacts")
        .update(contact)
        .eq("id", editingContact.id)
    } else {
      await supabase
        .from("agency_contacts")
        .insert(contact)
    }
    loadContacts()
    setShowAddModal(false)
    setEditingContact(null)
  }

  async function deleteContact(id: string) {
    if (confirm("Delete this contact?")) {
      await supabase
        .from("agency_contacts")
        .delete()
        .eq("id", id)
      loadContacts()
    }
  }

  async function toggleFavorite(contact: Contact) {
    await supabase
      .from("agency_contacts")
      .update({ is_favorite: !contact.is_favorite })
      .eq("id", contact.id)
    loadContacts()
  }

  async function toggleBlocked(contact: Contact) {
    await supabase
      .from("agency_contacts")
      .update({ is_blocked: !contact.is_blocked, category: contact.is_blocked ? "other" : "blocked" })
      .eq("id", contact.id)
    loadContacts()
  }

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery)
    const matchesCategory = !selectedCategory || c.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryCount = (cat: string) => contacts.filter(c => c.category === cat).length

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
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/agency" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">📒 Kontaktbog</h1>
              <p className="text-sm text-gray-400">{contacts.length} kontakter</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add contact
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Categories */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 min-h-[calc(100vh-73px)]">
          <div className="p-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                !selectedCategory ? "bg-gray-800" : "hover:bg-gray-800/50"
              }`}
            >
              <span className="text-sm">📋 Alle kontakter</span>
              <span className="float-right text-xs text-gray-500">{contacts.length}</span>
            </button>
            
            <div className="border-t border-gray-800 pt-3 mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Kategorier</p>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    selectedCategory === cat.id ? "bg-gray-800" : "hover:bg-gray-800/50"
                  }`}
                >
                  <span className="text-sm">{cat.label}</span>
                  <span className="float-right text-xs text-gray-500">{categoryCount(cat.id)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or number..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Contacts Grid */}
          {filteredContacts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen kontakter fundet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-red-400 hover:text-red-300"
              >
                + Add your first contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`bg-gray-900 rounded-xl p-4 border transition-colors ${
                    contact.is_blocked ? "border-red-500/30" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          {contact.is_blocked && <Ban className="w-4 h-4 text-red-400" />}
                        </div>
                        <p className="text-sm text-gray-400">{contact.phone_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="mb-3">
                    {CATEGORIES.filter(c => c.id === contact.category).map(cat => (
                      <span key={cat.id} className={`text-xs px-2 py-1 rounded-full ${cat.color}`}>
                        {cat.label}
                      </span>
                    ))}
                  </div>

                  {/* Notes */}
                  {contact.notes && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{contact.notes}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {contact.total_messages || 0} beskeder
                    </div>
                    {contact.last_contact_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(contact.last_contact_at).toLocaleDateString("da-DK")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => toggleFavorite(contact)}
                      className={`p-2 rounded-lg transition-colors ${
                        contact.is_favorite ? "bg-yellow-600/20 text-yellow-400" : "hover:bg-gray-800 text-gray-400"
                      }`}
                      title="Favorit"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleBlocked(contact)}
                      className={`p-2 rounded-lg transition-colors ${
                        contact.is_blocked ? "bg-red-600/20 text-red-400" : "hover:bg-gray-800 text-gray-400"
                      }`}
                      title="Bloker"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg text-red-400 transition-colors ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingContact) && (
        <ContactModal
          contact={editingContact}
          onClose={() => {
            setShowAddModal(false)
            setEditingContact(null)
          }}
          onSave={saveContact}
        />
      )}
    </div>
  )
}

function ContactModal({ 
  contact, 
  onClose, 
  onSave 
}: { 
  contact: Contact | null
  onClose: () => void
  onSave: (data: Partial<Contact>) => void
}) {
  const [form, setForm] = useState({
    name: contact?.name || "",
    phone_number: contact?.phone_number || "",
    category: contact?.category || "new",
    notes: contact?.notes || "",
    is_favorite: contact?.is_favorite || false,
  })

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-bold">{contact ? "Edit contact" : "Add contact"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Navn *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="f.eks. Bo"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefonnummer *</label>
            <input
              type="text"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
              placeholder="+4512345678"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Noter</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this contact..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={form.is_favorite}
              onChange={e => setForm({ ...form, is_favorite: e.target.checked })}
              className="rounded bg-gray-800 border-gray-700"
            />
            <label htmlFor="favorite" className="text-sm text-gray-400">⭐ Marker som favorit</label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || !form.phone_number}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {contact ? "Save changes" : "Add contact"}
          </button>
        </div>
      </div>
    </div>
  )
}
