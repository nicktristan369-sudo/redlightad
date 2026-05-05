"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import {
  Plus, Search, Phone, Mail, MessageCircle, Edit2, Trash2,
  Download, X, Check, Globe, Scan, Tag, AlertCircle, CheckCircle,
  StopCircle, Send, Eye, Link2,
} from "lucide-react";

interface ScrapedPhone {
  id: string;
  phone: string;
  source_url: string;
  source_domain?: string;
  tag: string;
  is_duplicate?: boolean;
  first_seen?: string;
  sms_status?: string;
  sms_sent_at?: string;
  invite_token?: string;
  notes?: string;
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
  country: string | null;
  source_domain: string | null;
  source: string | null;
  created_at: string;
}

interface ScrapeHistory {
  source_domain: string;
  count: number;
  last_scraped: string;
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

const SMS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pending",  bg: "#FEF3C7", color: "#92400E" },
  sent:      { label: "Sendt",    bg: "#DBEAFE", color: "#1E40AF" },
  clicked:   { label: "Klikket",  bg: "#EDE9FE", color: "#6D28D9" },
  converted: { label: "Created", bg: "#DCFCE7", color: "#14532D" },
};

function SmsBadge({ status }: { status: string }) {
  const s = SMS_BADGES[status] ?? SMS_BADGES.pending;
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

const DEFAULT_SMS_TEMPLATE = `Hi! We saw your ad and invite you to RedLightAD. Sign up FREE for 30 days with code: FREE30 at redlightad.com`;

function AdminPhonebookPage() {
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"contacts" | "scraper">(
    searchParams.get("tab") === "scraper" ? "scraper" : "contacts"
  );
  const [scrapeUrl, setScrapeUrl] = useState("https://annoncelight.dk");
  const [scrapeTag, setScrapeTag] = useState("untagged");
  const [depth, setDepth] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{
    total: number;
    newCount: number;
    dupCount: number;
    pagesScanned: number;
  } | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const [scrapedPhones, setScrapedPhones] = useState<ScrapedPhone[]>([]);
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // CRM state
  const [domainFilter, setDomainFilter] = useState("all");
  const [smsFilter, setSmsFilter] = useState("all");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_SMS_TEMPLATE);
  const [smsSending, setSmsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState<string | null>(null);
  const [smsResult, setSmsResult] = useState<{ sent: number; failed: number } | null>(null);
  const [scrapeHistory, setScrapeHistory] = useState<ScrapeHistory[]>([]);
  const [showTokenModal, setShowTokenModal] = useState<string | null>(null);

  // Contacts CRM filters
  const [countryFilter, setCountryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Refs for stale-closure-safe access inside SSE handler
  const loadScrapedRef = useRef<() => Promise<void>>(async () => {});
  const scrapeTagFilterRef = useRef("all");

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

  const loadScraped = useCallback(async () => {
    setLoadingScraped(true);
    const res = await fetch(`/api/admin/scrape-phones?tag=all`);
    const data = await res.json();
    setScrapedPhones(Array.isArray(data) ? data : []);
    setLoadingScraped(false);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/admin/scrape-phones?tag=all`);
    const data = await res.json();
    if (!Array.isArray(data)) return;
    // Group by source_domain
    const map = new Map<string, { count: number; last: string }>();
    for (const p of data) {
      const domain = p.source_domain || "(ukendt)";
      const existing = map.get(domain);
      if (!existing) {
        map.set(domain, { count: 1, last: p.created_at });
      } else {
        existing.count++;
        if (p.created_at > existing.last) existing.last = p.created_at;
      }
    }
    const hist = [...map.entries()]
      .map(([domain, v]) => ({ source_domain: domain, count: v.count, last_scraped: v.last }))
      .sort((a, b) => b.last_scraped.localeCompare(a.last_scraped))
      .slice(0, 5);
    setScrapeHistory(hist);
  }, []);

  useEffect(() => {
    loadScrapedRef.current = loadScraped;
  }, [loadScraped]);

  useEffect(() => {
    if (activeTab === "scraper") {
      loadScraped();
      loadHistory();
    }
  }, [activeTab, loadScraped, loadHistory]);

  // Derived data
  const uniqueDomains = Array.from(new Set(scrapedPhones.map(p => p.source_domain || "").filter(Boolean)));

  const filteredScraped = scrapedPhones.filter(p => {
    if (domainFilter !== "all" && (p.source_domain || "") !== domainFilter) return false;
    if (smsFilter !== "all" && (p.sms_status || "pending") !== smsFilter) return false;
    if (phoneSearch && !p.phone.includes(phoneSearch)) return false;
    return true;
  });

  const totalCount = scrapedPhones.length;
  const pendingCount = scrapedPhones.filter(p => (p.sms_status || "pending") === "pending").length;
  const sentCount = scrapedPhones.filter(p => p.sms_status === "sent").length;
  const convertedCount = scrapedPhones.filter(p => p.sms_status === "converted").length;

  const allFilteredSelected = filteredScraped.length > 0 && filteredScraped.every(p => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScraped.map(p => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendBulkSms() {
    setSmsSending(true);
    setSmsProgress("Sender...");
    setSmsResult(null);

    try {
      const res = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_ids: [...selectedIds], template: smsTemplate }),
      });
      const data = await res.json();
      setSmsResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
      setSmsProgress(null);
      setSelectedIds(new Set());
      await loadScraped();
    } catch (err: any) {
      setSmsProgress(null);
      setSmsResult({ sent: 0, failed: selectedIds.size });
    } finally {
      setSmsSending(false);
    }
  }

  async function startScrape() {
    setIsRunning(true);
    setScrapeError(null);
    setScrapeResult(null);
    setProgress("Forbinder...");

    try {
      const response = await fetch("/api/admin/scrape-phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, depth, tag: scrapeTag }),
      });

      const reader = response.body!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgress(data.message);
            } else if (data.type === "done") {
              setScrapeResult({
                total: data.total,
                newCount: data.newCount,
                dupCount: data.dupCount,
                pagesScanned: data.pagesScanned,
              });
              setProgress(null);
              setIsRunning(false);
              await loadScrapedRef.current();
              await loadHistory();
            } else if (data.type === "error") {
              setScrapeError(data.message);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setScrapeError(err.message);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  }

  function stopScrape() {
    readerRef.current?.cancel();
    setIsRunning(false);
    setProgress(null);
  }

  async function deleteAll() {
    const confirmed = window.confirm(
      "Are you sure? This will delete ALL numbers in the phonebook. This action cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch("/api/admin/scrape-phones", { method: "DELETE" });
    if (res.ok) {
      await loadScrapedRef.current();
    }
  }

  const deleteScraped = async (id: string) => {
    await fetch("/api/admin/scrape-phones", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setScrapedPhones(p => p.filter(x => x.id !== id));
  };

  const deleteAllScraped = async () => {
    await deleteAll();
    setShowDeleteAllModal(false);
  };

  async function copyToContacts() {
    const res = await fetch('/api/admin/copy-to-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'Denmark' }),
    });
    const data = await res.json();
    alert(`${data.added} added to Contacts · ${data.skipped} duplicates skipped`);
    await load();
  }

  const exportScrapedCSV = () => {
    const rows = [
      ["Phone", "Source Domain", "Source URL", "SMS Status", "SMS Sent At", "Tag", "Duplicate", "First Seen", "Added"],
      ...scrapedPhones.map(p => [p.phone, p.source_domain ?? "", p.source_url, p.sms_status ?? "pending", p.sms_sent_at ?? "", p.tag, p.is_duplicate ? "yes" : "no", p.first_seen ?? "", new Date(p.created_at).toISOString()]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = u; a.download = "scraped-phones.csv"; a.click();
    URL.revokeObjectURL(u);
  };

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
  const uniqueCountries = Array.from(new Set(contacts.map(c => c.country || 'Denmark').filter(Boolean)));
  const uniqueSources = Array.from(new Set(contacts.map(c => c.source_domain || '').filter(Boolean)));
  const base = catFilter === "all" ? contacts : contacts.filter(c => c.category === catFilter);
  const filtered = base.filter(c => {
    if (countryFilter !== "all" && (c.country || 'Denmark') !== countryFilter) return false;
    if (sourceFilter !== "all" && (c.source_domain || '') !== sourceFilter) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
    return true;
  });

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
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Delete all numbers?</h3>
            <p className="text-[13px] text-gray-500 mb-5">Are you sure? This will delete all {totalCount} numbers permanently.</p>
            <div className="flex gap-2">
              <button onClick={deleteAllScraped} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg" style={{ background: "#DC2626" }}>Slet alt</button>
              <button onClick={() => setShowDeleteAllModal(false)} className="px-4 py-2.5 text-[13px] font-medium rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Annuller</button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gray-900">Send SMS</h3>
              <button onClick={() => { setShowSmsModal(false); setSmsResult(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} color="#6B7280" />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">Sender til <strong>{selectedIds.size}</strong> numre</p>
            <textarea
              value={smsTemplate}
              onChange={e => setSmsTemplate(e.target.value)}
              rows={5}
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none mb-1"
              style={{ border: "1px solid #E5E5E5" }}
            />
            <p className="text-[11px] text-gray-400 mb-4">[TOKEN] erstattes med unikt invite link</p>

            {smsProgress && (
              <div className="text-[13px] text-blue-600 flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                {smsProgress}
              </div>
            )}

            {smsResult && (
              <div className="text-[13px] mb-3 px-3 py-2 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <strong>{smsResult.sent}</strong> sendt &middot; <strong>{smsResult.failed}</strong> fejlede
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={sendBulkSms}
                disabled={smsSending || selectedIds.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                style={{ background: "#000" }}
                onMouseEnter={e => { if (!smsSending) e.currentTarget.style.background = "#CC0000"; }}
                onMouseLeave={e => e.currentTarget.style.background = "#000"}
              >
                <Send size={14} />
                {smsSending ? "Sender..." : "Send"}
              </button>
              <button onClick={() => { setShowSmsModal(false); setSmsResult(null); }} className="px-4 py-2.5 text-[13px] font-medium rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Luk</button>
            </div>
          </div>
        </div>
      )}

      {/* Token/Link modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Invite link</h3>
            <p className="text-[13px] text-gray-500 break-all mb-4 font-mono bg-gray-50 p-3 rounded-lg">
              {typeof window !== "undefined" ? `${window.location.origin}/join/${showTokenModal}` : `/join/${showTokenModal}`}
            </p>
            <button onClick={() => setShowTokenModal(null)} className="w-full py-2.5 text-[13px] font-medium rounded-lg" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>Luk</button>
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
              <button
                onClick={copyToContacts}
                disabled={scrapedPhones.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-40 transition-colors"
                style={{ border: "1px solid #D1FAE5", color: "#059669", background: "#ECFDF5" }}
              >
                Add to Contacts ({scrapedPhones.filter(p => p.sms_status === 'pending').length})
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
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
          className="text-[13px] px-3 py-2 rounded-lg bg-white" style={{ border: "1px solid #E5E5E5" }}>
          <option value="all">Alle lande</option>
          {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="text-[13px] px-3 py-2 rounded-lg bg-white" style={{ border: "1px solid #E5E5E5" }}>
          <option value="all">Alle kilder</option>
          {uniqueSources.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Contact cards with sidebar */}
      <div className="flex gap-5">
        {/* Sidebar gruppering */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          {Object.entries(
            contacts.reduce((acc, c) => {
              const country = c.country || 'Denmark';
              const domain = c.source_domain || 'Manuel';
              if (!acc[country]) acc[country] = {};
              acc[country][domain] = (acc[country][domain] || 0) + 1;
              return acc;
            }, {} as Record<string, Record<string, number>>)
          ).map(([country, domains]) => (
            <div key={country} className="mb-4">
              <p className="text-[12px] font-bold text-gray-700 mb-1">{country} ({Object.values(domains).reduce((a, b) => a + b, 0)})</p>
              {Object.entries(domains).map(([domain, count]) => (
                <button key={domain} onClick={() => { setCountryFilter(country); setSourceFilter(domain === 'Manuel' ? 'all' : domain); }}
                  className="block w-full text-left text-[11px] text-gray-500 hover:text-gray-900 py-0.5 pl-2">
                  └ {domain} ({count})
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Contact cards */}
        <div className="flex-1 min-w-0">
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
                {c.source_domain && <p className="text-[11px] text-gray-400 mb-1">Source: {c.source_domain}</p>}
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
        </div>
      </div>
      </>) : (
        /* URL SCRAPER / CRM TAB */
        <div className="space-y-5">
          {/* Stats bar */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <span className="text-[13px] font-semibold text-gray-900">{totalCount} total</span>
            <span className="text-[13px] text-gray-400">&middot;</span>
            <span className="text-[13px] font-semibold" style={{ color: "#92400E" }}>{pendingCount} pending</span>
            <span className="text-[13px] text-gray-400">&middot;</span>
            <span className="text-[13px] font-semibold" style={{ color: "#1E40AF" }}>{sentCount} sendt</span>
            <span className="text-[13px] text-gray-400">&middot;</span>
            <span className="text-[13px] font-semibold" style={{ color: "#14532D" }}>{convertedCount} oprettet</span>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg bg-white"
              style={{ border: "1px solid #E5E5E5" }}
            >
              <option value="all">Alle kilder</option>
              {uniqueDomains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={smsFilter}
              onChange={e => setSmsFilter(e.target.value)}
              className="text-[13px] px-3 py-2 rounded-lg bg-white"
              style={{ border: "1px solid #E5E5E5" }}
            >
              <option value="all">Alle statusser</option>
              <option value="pending">Pending</option>
              <option value="sent">Sendt</option>
              <option value="clicked">Klikket</option>
              <option value="converted">Oprettet</option>
            </select>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-[140px] max-w-[220px]" style={{ border: "1px solid #E5E5E5" }}>
              <Search size={13} color="#9CA3AF" />
              <input value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="Search phone..."
                className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
            </div>
            <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={allFilteredSelected && filteredScraped.length > 0} onChange={toggleSelectAll} className="rounded" />
              Select all
            </label>
            <button
              onClick={() => setShowSmsModal(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40 transition-colors ml-auto"
              style={{ background: "#000" }}
              onMouseEnter={e => { if (selectedIds.size > 0) e.currentTarget.style.background = "#CC0000"; }}
              onMouseLeave={e => e.currentTarget.style.background = "#000"}
            >
              <Send size={13} />
              Send SMS til valgte ({selectedIds.size})
            </button>
          </div>

          {/* CRM Table */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
            {loadingScraped ? (
              <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
            ) : filteredScraped.length === 0 ? (
              <div className="py-14 text-center">
                <Globe size={28} color="#E5E5E5" className="mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">Ingen numre matcher filteret</p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <th className="px-4 py-2.5 text-left w-10"></th>
                      {["Phone", "Source", "SMS Status", "SMS Dato", "Added", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScraped.map(p => {
                      const status = p.sms_status || "pending";
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #F9FAFB" }}>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                          </td>
                          <td className="px-4 py-2.5 text-[13px] font-mono font-semibold text-gray-900">{p.phone}</td>
                          <td className="px-4 py-2.5 text-[12px]" style={{ color: p.source_domain ? "#6B7280" : "#D1D5DB" }}>
                            {p.source_domain || "\u2014"}
                          </td>
                          <td className="px-4 py-2.5">
                            <SmsBadge status={status} />
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                            {p.sms_sent_at ? new Date(p.sms_sent_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                            {new Date(p.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short" })}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              {status === "pending" && (
                                <button
                                  onClick={() => { setSelectedIds(new Set([p.id])); setShowSmsModal(true); }}
                                  className="px-2 py-1 text-[11px] font-semibold rounded-md transition-colors"
                                  style={{ border: "1px solid #E5E5E5", color: "#374151" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  Send SMS
                                </button>
                              )}
                              {(status === "sent" || status === "clicked") && p.invite_token && (
                                <button
                                  onClick={() => setShowTokenModal(p.invite_token!)}
                                  className="px-2 py-1 text-[11px] font-semibold rounded-md transition-colors"
                                  style={{ border: "1px solid #E5E5E5", color: "#374151" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <Link2 size={11} className="inline mr-1" />Vis link
                                </button>
                              )}
                              <button onClick={() => deleteScraped(p.id)} className="p-1 rounded transition-colors text-gray-300 hover:text-red-500 hover:bg-red-50"><X size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scraper section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Scrape telefonnumre</h2>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                placeholder="https://annoncelight.dk"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={scrapeTag}
                onChange={e => setScrapeTag(e.target.value)}
                placeholder="Tag (f.eks. annoncelight)"
                className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={depth}
                onChange={e => setDepth(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value={1}>Depth: 1</option>
                <option value={2}>Depth: 2</option>
                <option value={3}>Depth: 3</option>
                <option value={99}>Unlimited</option>
              </select>
              {!isRunning ? (
                <button
                  onClick={startScrape}
                  className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
                >
                  Start scrape
                </button>
              ) : (
                <button
                  onClick={stopScrape}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                >
                  Stop
                </button>
              )}
            </div>

            {progress && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                {progress}
              </div>
            )}

            {scrapeError && (
              <p className="text-sm text-red-500 mt-2">Error: {scrapeError}</p>
            )}

            {scrapeResult && (
              <p className="text-sm text-gray-700 mt-2">
                Fandt <strong>{scrapeResult.total}</strong> numre &middot; <strong>{scrapeResult.newCount}</strong> nye &middot; <strong>{scrapeResult.dupCount}</strong> duplikater &middot; {scrapeResult.pagesScanned} sider scannet
              </p>
            )}
          </div>

          {/* Scrape historik */}
          {scrapeHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3">Scrape historik</h3>
              <div className="space-y-2">
                {scrapeHistory.map(h => (
                  <div key={h.source_domain} className="flex items-center justify-between text-[12px] py-1.5" style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <span className="font-medium text-gray-700">{h.source_domain}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">{h.count} numre</span>
                      <span className="text-gray-400">{new Date(h.last_scraped).toLocaleDateString("da-DK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default function PhonebookPageWrapper() {
  return (
    <Suspense>
      <AdminPhonebookPage />
    </Suspense>
  );
}
