"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Mail, Phone, MessageCircle, Send, Copy, Check, Download } from "lucide-react";
import Image from "next/image";

interface Contact {
  id: string;
  listing_id: string;
  display_name: string;
  profile_image: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase");
      const { data: { session } } = await createClient().auth.getSession();
      
      const res = await fetch("/api/admin/contacts", {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.display_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.whatsapp?.includes(q) ||
      c.telegram?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "WhatsApp", "Telegram", "City", "Country", "Created"];
    const rows = contacts.map(c => [
      c.display_name || "",
      c.email || "",
      c.phone || "",
      c.whatsapp || "",
      c.telegram || "",
      c.city || "",
      c.country || "",
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ""
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500">{contacts.length} contacts collected</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            <p className="text-xs text-gray-500">Total Contacts</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">{contacts.filter(c => c.email).length}</p>
            <p className="text-xs text-gray-500">With Email</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{contacts.filter(c => c.whatsapp).length}</p>
            <p className="text-xs text-gray-500">With WhatsApp</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-sky-500">{contacts.filter(c => c.telegram).length}</p>
            <p className="text-xs text-gray-500">With Telegram</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              {search ? "No contacts match your search" : "No contacts yet"}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["", "NAME", "EMAIL", "PHONE", "WHATSAPP", "TELEGRAM", "LOCATION", "JOINED"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContacts.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Avatar */}
                    <td className="px-4 py-3 w-14">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {c.profile_image ? (
                          <Image
                            src={c.profile_image}
                            alt={c.display_name || ""}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                            {c.display_name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{c.display_name || "—"}</p>
                    </td>
                    
                    {/* Email */}
                    <td className="px-4 py-3">
                      {c.email ? (
                        <button
                          onClick={() => copyToClipboard(c.email!, `email-${c.id}`)}
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
                        >
                          <Mail size={14} className="text-gray-400 group-hover:text-blue-500" />
                          <span className="truncate max-w-[160px]">{c.email}</span>
                          {copied === `email-${c.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-50" />}
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    
                    {/* Phone */}
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <button
                          onClick={() => copyToClipboard(c.phone!, `phone-${c.id}`)}
                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                        >
                          <Phone size={14} className="text-gray-400" />
                          <span>{c.phone}</span>
                          {copied === `phone-${c.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-50" />}
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    
                    {/* WhatsApp */}
                    <td className="px-4 py-3">
                      {c.whatsapp ? (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors"
                        >
                          <MessageCircle size={14} />
                          <span>{c.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    
                    {/* Telegram */}
                    <td className="px-4 py-3">
                      {c.telegram ? (
                        <a
                          href={`https://t.me/${c.telegram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-sky-500 hover:text-sky-600 transition-colors"
                        >
                          <Send size={14} />
                          <span>{c.telegram}</span>
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    
                    {/* Location */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    
                    {/* Joined */}
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("da-DK") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
