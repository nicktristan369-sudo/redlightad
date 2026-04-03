"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import {
  Plus, Search, Phone, Mail, MessageCircle, Edit2, Trash2,
  Download, X, Check, Globe, Scan, Tag, AlertCircle, CheckCircle,
  StopCircle,
} from "lucide-react";

interface ScrapedPhone {
  id: string;
  phone: string;
  source_url: string;
  tag: string;
  is_duplicate?: boolean;
  first_seen?: string;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  signal_username: string | null;
  telegram: string | null;
  category: string;
  notes: string | null;
  created_at: string;
}

type Category = "partner" | "advertiser" | "vip_user" | "other";
const CATEGORIES: { key: Category; label: string; bg: string; color: string }[] = [
  { key: "partner",    label: "Partner",    bg: "#DBEAFE", color: "#1E40AF" },
  { key: "advertiser", label: "Advertiser", bg: "#DCFCE7", color: "#14532D" },
  { key: "vip_user",   label: "VIP User",   bg: "#FEF3C7", color: "#92400E" },
  { key: "other",      label: "Other",      bg: "#F3F4F6", color: "#6B7280" },
];

const catStyle = (cat: string) =>
  CATEGORIES.find(c => c.key === cat) ?? CATEGORIES[3];

function Badge({ cat }: { cat: string }) {
  const s = catStyle(cat);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

interface ContactForm {
  name: string; email: string; phone: string; signal_username: string;
  telegram: string; category: string; notes: string;
}
const EMPTY: ContactForm = {
  name: "", email: "", phone: "", signal_username: "", telegram: "", category: "other", notes: "",
};

export default function AdminPhonebookPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"contacts" | "scraper">("contacts");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeTag, setScrapeTag] = useState("untagged");
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<{ current: number; phones_found: number; url: string } | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{ ok: boolean; msg: string; phones?: string[]; newCount?: number; dupCount?: number } | null>(null);
  const [scrapedPhones, setScrapedPhones] = useState<ScrapedPhone[]>([]);
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [scrapeTagFilter, setScrapeTagFilter] = useState("all");
  const [maxDepth, setMaxDepth] = useState(2);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient()
      .from("admin_contacts")
      .select("*")
      .order("created_at", { ascending: false });
    setContacts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadScraped = useCallback(async (tag = "all") => {
    setLoadingScraped(true);
    const res = await fetch(`/api/admin/scrape-phones?tag=${tag}`);
    const data = await res.json();
    setScrapedPhones(Array.isArray(data) ? data : []);
    setLoadingScraped(false);
  }, []);

  useEffect(() => {
    if (activeTab === "scraper") loadScraped(scrapeTagFilter);
  }, [activeTab, scrapeTagFilter, loadScraped]);

  const totalScraped = scrapedPhones.length;
  const duplicateCount = scrapedPhones.filter(p => p.is_duplicate).length;
  const uniqueCount = totalScraped - duplicateCount;
  const filteredScraped = hideDuplicates ? scrapedPhones.filter(p => !p.is_duplicate) : scrapedPhones;

  const runScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeResult(null);
    setScrapeProgress(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/admin/scrape-phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim(), tag: scrapeTag || "untagged", maxDepth }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json();
        setScrapeResult({ ok: false, msg: data.error ?? "Scrape failed" });
        setScraping(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) { setScrapeResult({ ok: false, msg: "No response stream" }); setScraping(false); return; }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "progress") {
              setScrapeProgress({ current: parsed.current, phones_found: parsed.phones_found ?? 0, url: parsed.url });
            } else if (parsed.type === "done") {
              setScrapeResult({ ok: true, msg: parsed.message, phones: parsed.phones, newCount: parsed.new_numbers, dupCount: parsed.duplicates });
            } else if (parsed.type === "error") {
              setScrapeResult({ ok: false, msg: parsed.error });
            }
          } catch { /* skip */ }
        }
      }
      loadScraped(scrapeTagFilter);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setScrapeResult({ ok: false, msg: String(e) });
    }
    setScraping(false);
    setScrapeProgress(null);
    abortRef.current = null;
  };

  const stopScrape = () => { abortRef.current?.abort(); setScraping(false); setScrapeProgress(null); };

  const deleteScraped = async (id: string) => {
    await fetch("/api/admin/scrape-phones", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setScrapedPhones(p => p.filter(x => x.id !== id));
  };

  const deleteAllScraped = async () => {
    await fetch("/api/admin/scrape-phones", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setScrapedPhones([]);
    setShowDeleteAllModal(false);
  };

  const exportScrapedCSV = () => {
    const rows = [
      ["Phone", "Source URL", "Tag", "Duplicate", "First Seen", "Added"],
      ...scrapedPhones.map(p => [p.phone, p.source_url, p.tag, p.is_duplicate ? "yes" : "no", p.first_seen ?? "", new Date(p.created_at).toISOString()]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = "scraped-phones.csv"; a.click();
    URL.revokeObjectURL(u);
  };

  const scrapedTags = ["all", ...Array.from(new Set(scrapedPhones.map(p => p.tag)))];

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", signal_username: c.signal_username ?? "", telegram: c.telegram ?? "", category: c.category, notes: c.notes ?? "" });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = { name: form.name.trim(), email: form.email || null, phone: form.phone || null, signal_username: form.signal_username || null, telegram: form.telegram || null, category: form.category, notes: form.notes || null };
    if (editing) {
      await supabase.from("admin_contacts").update(payload).eq("id", editing.id);
      setContacts(p => p.map(c => c.id === editing.id ? { ...c, ...payload } : c));
    } else {
      const { data } = await supabase.from("admin_contacts").insert(payload).select().single();
      if (data) setContacts(p => [data as Contact, ...p]);
    }
    setSaving(false); setShowForm(false); setEditing(null);
  };

  const remove = async () => {
    if (!deleteId) return;
    await createClient().from("admin_contacts").delete().eq("id", deleteId);
    setContacts(p => p.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Signal", "Telegram", "Category", "Notes", "Added"],
      ...filtered.map(c => [c.name, c.email ?? "", c.phone ?? "", c.signal_username ?? "", c.telegram ?? "", c.category, c.notes ?? "", new Date(c.created_at).toISOString()]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = "phonebook.csv"; a.click();
    URL.revokeObjectURL(u);
  };

  const q = search.toLowerCase();
  const base = catFilter === "all" ? contacts : contacts.filter(c => c.category === catFilter);
  const filtered = base.filter(c => !q || c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q));

  const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="text-[12px] font-semibold text-gray-700 block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none" style={{ border: "1px solid #E5E5E5" }} />
    </div>
  );

  return (
    <AdminLayout>
      {/* Delete contact modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Delete contact?</h3>
            <p className="text-[13px] text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={remove} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg" style={{ background: "#DC2626" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 text-[13px] font-medium rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL scraped modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Slet alle numre?</h3>
            <p className="text-[13px] text-gray-500 mb-5">Er du sikker? Dette sletter alle {totalScraped} numre permanent.</p>
            <div className="flex gap-2">
              <button onClick={deleteAllScraped} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg" style={{ background: "#DC2626" }}>Slet alt</button>
              <button onClick={() => setShowDeleteAllModal(false)} className="px-4 py-2.5 text-[13px] font-medium rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Annuller</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E5E5E5" }}>
              <h2 className="text-[16px] font-bold text-gray-900">{editing ? "Edit Contact" : "New Contact"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg"
                onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X size={16} color="#6B7280" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Full name" />
              <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@example.com" type="email" />
              <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+45 XX XX XX XX" />
              <Field label="Signal" value={form.signal_username} onChange={v => setForm(f => ({ ...f, signal_username: v }))} placeholder="@username" />
              <Field label="Telegram" value={form.telegram} onChange={v => setForm(f => ({ ...f, telegram: v }))} placeholder="@username" />
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))}
                      className="px-3 py-1.5 text-[12px] font-semibold rounded-full transition-colors"
                      style={{ background: form.category === c.key ? c.bg : "#F3F4F6", color: form.category === c.key ? c.color : "#6B7280", border: form.category === c.key ? `1.5px solid ${c.color}` : "1.5px solid transparent" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-700 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes…" rows={3}
                  className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none" style={{ border: "1px solid #E5E5E5" }} />
              </div>
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid #E5E5E5" }}>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white rounded-xl disabled:opacity-40 transition-colors"
                style={{ background: "#000" }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#CC0000"; }}
                onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                <Check size={15} />
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Phonebook</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{contacts.length} contacts · {scrapedPhones.length} scraped numbers</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "contacts" ? (
            <>
              <button onClick={exportCSV} disabled={filtered.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-40 transition-colors"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Download size={13} /> CSV
              </button>
              <button onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-colors"
                style={{ background: "#000" }}
                onMouseEnter={e => e.currentTarget.style.background = "#CC0000"}
                onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                <Plus size={14} /> Add Contact
              </button>
            </>
          ) : (
            <>
              <button onClick={exportScrapedCSV} disabled={scrapedPhones.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-40 transition-colors"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Download size={13} /> Export CSV
              </button>
              <button onClick={() => setShowDeleteAllModal(true)} disabled={scrapedPhones.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-40 transition-colors"
                style={{ border: "1px solid #FECACA", color: "#DC2626", background: "#FEF2F2" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FEF2F2"; }}>
                <Trash2 size={13} /> Slet alt
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0.5 p-1 rounded-xl mb-6 w-fit" style={{ background: "#F3F4F6" }}>
        {([["contacts", "Contacts", Phone], ["scraper", "URL Scraper", Globe]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors"
            style={{ background: activeTab === key ? "#fff" : "transparent", color: activeTab === key ? "#111" : "#6B7280" }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === "contacts" ? (<>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          <button onClick={() => setCatFilter("all")}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
            style={{ background: catFilter === "all" ? "#fff" : "transparent", color: catFilter === "all" ? "#111" : "#6B7280" }}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: catFilter === c.key ? "#fff" : "transparent", color: catFilter === c.key ? "#111" : "#6B7280" }}>{c.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-[160px] max-w-xs" style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone…"
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
      </div>

      {/* Contact cards */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
          <p className="text-[14px] text-gray-400">{contacts.length === 0 ? "No contacts yet — add your first contact" : "No contacts match your search"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-5 group" style={{ border: "1px solid #E5E5E5" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0" style={{ background: "#F3F4F6", color: "#374151" }}>{c.name[0]?.toUpperCase()}</div>
                  <p className="text-[14px] font-bold text-gray-900 truncate">{c.name}</p>
                </div>
                <Badge cat={c.category} />
              </div>
              <div className="space-y-1.5 mb-3">
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-900 transition-colors truncate"><Mail size={12} color="#9CA3AF" className="flex-shrink-0" />{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-900 transition-colors"><Phone size={12} color="#9CA3AF" className="flex-shrink-0" />{c.phone}</a>}
                {c.signal_username && <a href={`https://signal.me/#p/${c.signal_username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-900 transition-colors"><MessageCircle size={12} color="#9CA3AF" className="flex-shrink-0" />Signal: {c.signal_username}</a>}
                {c.telegram && <a href={`https://t.me/${c.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-900 transition-colors"><MessageCircle size={12} color="#9CA3AF" className="flex-shrink-0" />Telegram: {c.telegram}</a>}
              </div>
              {c.notes && <p className="text-[12px] text-gray-400 italic line-clamp-2 mb-3">{c.notes}</p>}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md transition-colors" style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}><Edit2 size={13} /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md transition-colors" style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>) : (
        /* URL SCRAPER TAB */
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <span className="text-[13px] font-semibold text-gray-900">{totalScraped} scraped</span>
            <span className="text-[13px] text-gray-400">&middot;</span>
            <span className="text-[13px] text-gray-500">{duplicateCount} duplikater</span>
            <span className="text-[13px] text-gray-400">&middot;</span>
            <span className="text-[13px] font-semibold" style={{ color: "#16A34A" }}>{uniqueCount} unikke</span>
            <div className="ml-auto">
              <button onClick={() => setHideDuplicates(!hideDuplicates)}
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
                style={{ border: "1px solid #E5E5E5", background: hideDuplicates ? "#F3F4F6" : "transparent", color: hideDuplicates ? "#111" : "#6B7280" }}>
                {hideDuplicates ? "Vis duplikater" : "Skjul duplikater"}
              </button>
            </div>
          </div>

          {/* Scan card */}
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={15} color="#6B7280" />
              <h2 className="text-[15px] font-semibold text-gray-900">Scan URL for phone numbers</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://example.com/contacts"
                className="flex-1 text-[13px] px-3 py-2.5 rounded-lg outline-none font-mono" style={{ border: "1px solid #E5E5E5" }}
                onKeyDown={e => e.key === "Enter" && !scraping && runScrape()} />
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg flex-shrink-0" style={{ border: "1px solid #E5E5E5", minWidth: "140px" }}>
                <Tag size={12} color="#9CA3AF" />
                <input value={scrapeTag} onChange={e => setScrapeTag(e.target.value)} placeholder="Tag (e.g. escorts)" maxLength={32}
                  className="flex-1 text-[13px] outline-none bg-transparent text-gray-700 placeholder-gray-400" />
              </div>
              <select value={maxDepth} onChange={e => setMaxDepth(Number(e.target.value))}
                className="text-[13px] px-3 py-2.5 rounded-lg outline-none flex-shrink-0"
                style={{ border: "1px solid #E5E5E5", color: "#374151", minWidth: "130px" }}>
                <option value={1}>Dybde: 1</option>
                <option value={2}>Dybde: 2</option>
                <option value={3}>Dybde: 3</option>
                <option value={0}>Ubegrænset</option>
              </select>
              {scraping ? (
                <button onClick={stopScrape}
                  className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-lg transition-colors flex-shrink-0"
                  style={{ background: "#DC2626" }}>
                  <StopCircle size={14} /> Stop
                </button>
              ) : (
                <button onClick={runScrape} disabled={!scrapeUrl.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors flex-shrink-0"
                  style={{ background: "#000" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#CC0000"}
                  onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                  <Scan size={14} /> Start scrape
                </button>
              )}
            </div>

            {scraping && scrapeProgress && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-3" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                <span className="text-[13px] text-blue-800">Scanner side {scrapeProgress.current}… {scrapeProgress.phones_found} numre fundet</span>
                <span className="text-[11px] text-blue-500 font-mono truncate max-w-[300px]">{scrapeProgress.url}</span>
              </div>
            )}

            {scrapeResult && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px]"
                style={{ background: scrapeResult.ok ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${scrapeResult.ok ? "#BBF7D0" : "#FECACA"}` }}>
                {scrapeResult.ok ? <CheckCircle size={14} color="#16A34A" className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} color="#DC2626" className="flex-shrink-0 mt-0.5" />}
                <div>
                  <p style={{ color: scrapeResult.ok ? "#14532D" : "#7F1D1D" }}>{scrapeResult.msg}</p>
                  {scrapeResult.phones && scrapeResult.phones.length > 0 && (
                    <p className="text-[11px] mt-1 font-mono" style={{ color: "#6B7280" }}>
                      {scrapeResult.phones.slice(0, 8).join(" · ")}{scrapeResult.phones.length > 8 ? ` +${scrapeResult.phones.length - 8} more` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scraped numbers list */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
            <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="flex items-center gap-2">
                <Phone size={14} color="#6B7280" />
                <span className="text-[14px] font-semibold text-gray-900">{filteredScraped.length} numre</span>
              </div>
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "#F3F4F6" }}>
                {scrapedTags.map(t => (
                  <button key={t} onClick={() => setScrapeTagFilter(t)}
                    className="px-3 py-1 text-[12px] font-semibold rounded-md transition-colors capitalize"
                    style={{ background: scrapeTagFilter === t ? "#fff" : "transparent", color: scrapeTagFilter === t ? "#111" : "#6B7280" }}>{t}</button>
                ))}
              </div>
            </div>

            {loadingScraped ? (
              <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
            ) : filteredScraped.length === 0 ? (
              <div className="py-14 text-center">
                <Globe size={28} color="#E5E5E5" className="mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">
                  {hideDuplicates && scrapedPhones.length > 0 ? "Alle numre er duplikater — skift filter for at se dem" : "No scraped numbers yet — scan a URL above"}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {["Phone", "Source URL", "Tag", "Status", "Date", ""].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScraped.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #F9FAFB", opacity: p.is_duplicate ? 0.55 : 1 }}>
                        <td className="px-4 py-2.5 text-[13px] font-mono font-semibold" style={{ color: p.is_duplicate ? "#9CA3AF" : "#111" }}>{p.phone}</td>
                        <td className="px-4 py-2.5 text-[12px] max-w-[200px] truncate" style={{ color: p.is_duplicate ? "#9CA3AF" : "#6B7280" }}>
                          <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors truncate block">{p.source_url}</a>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "#F3F4F6", color: "#6B7280" }}>{p.tag}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {p.is_duplicate && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>DUPLICATE</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[11px] whitespace-nowrap" style={{ color: p.is_duplicate ? "#D1D5DB" : "#9CA3AF" }}>
                          {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => deleteScraped(p.id)} className="p-1 rounded transition-colors text-gray-300 hover:text-red-500 hover:bg-red-50"><X size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
