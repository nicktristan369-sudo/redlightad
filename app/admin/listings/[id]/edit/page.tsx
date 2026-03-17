"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import type { SocialLinks } from "@/components/SocialLinksSection";
import type { TravelEntry } from "@/components/TravelBox";
import { CATEGORIES } from "@/lib/constants/categories";
import { GENDERS } from "@/lib/constants/genders";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
import Link from "next/link";
import {
  ChevronLeft, Save, Trash2, Plus, XCircle,
  Crown, Star, AlertTriangle, CheckCircle,
  MapPin, Calendar, Image as ImageIcon
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────
const SERVICE_OPTIONS = ["Dinner dates","Social events","Travel companion","Private meetings","Weekend getaways"];
const LANGUAGE_OPTIONS = ["Dansk","Engelsk","Tysk","Fransk","Spansk","Arabisk","Russisk","Thai"];
const CURRENCIES = ["DKK","EUR","USD","GBP","THB","NOK","SEK"];
const TIERS = [
  { value: null,       label: "Standard", bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  { value: "basic",    label: "Basic",    bg: "#E5E7EB", color: "#374151", border: "#D1D5DB" },
  { value: "featured", label: "Featured", bg: "#BFDBFE", color: "#1E3A8A", border: "#3B82F6" },
  { value: "vip",      label: "VIP",      bg: "#FEF08A", color: "#78350F", border: "#F59E0B" },
];
const COUNTRIES_SORTED = [...SUPPORTED_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

interface Listing {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  gender: string | null;
  age: number | null;
  country: string | null;
  city: string | null;
  location: string | null;
  status: string;
  about: string | null;
  services: string[] | null;
  languages: string[] | null;
  rate_1hour: string | null;
  rate_2hours: string | null;
  rate_overnight: string | null;
  rate_weekend: string | null;
  currency: string | null;
  images: string[] | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  snapchat: string | null;
  email: string | null;
  social_links: SocialLinks | null;
  premium_tier: string | null;
  in_carousel: boolean;
  location_changed_at: string | null;
  show_travel_schedule: boolean | null;
}

// ── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400";
const selectCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none focus:border-gray-400 bg-white text-gray-900";

// ── Save button ──────────────────────────────────────────────────────────────
function SaveBtn({ onClick, saving, label = "Gem ændringer" }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: "#000" }}>
      <Save size={14} />
      {saving ? "Gemmer…" : label}
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminListingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([]);

  // ── Section states ─────────────────────────────────────────────────────────
  const [basics, setBasics] = useState({ title: "", category: "", gender: "", age: "", country: "", city: "", status: "" });
  const [details, setDetails] = useState({ about: "", services: [] as string[], languages: [] as string[], rate_1hour: "", rate_2hours: "", rate_overnight: "", rate_weekend: "", currency: "DKK" });
  const [contact, setContact] = useState({ phone: "", whatsapp: "", telegram: "", snapchat: "", email: "", social_links: {} as SocialLinks });
  const [premium, setPremium] = useState({ tier: null as string | null, in_carousel: false, location_changed_at: null as string | null });
  const [newTravel, setNewTravel] = useState({ from_date: "", to_date: "", city: "", country: "" });

  // ── Saving states ──────────────────────────────────────────────────────────
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPremium, setSavingPremium] = useState(false);
  const [savingTravel, setSavingTravel] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [deletingTravel, setDeletingTravel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Feedback states ────────────────────────────────────────────────────────
  const [saved, setSaved] = useState<string | null>(null); // section name
  const [error, setError] = useState<string | null>(null);

  // ── Load listing ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/admin/listings?id=${id}`)
      .then(r => r.json())
      .then(d => {
        const l: Listing = d.listing ?? d.listings?.[0];
        if (!l) { setLoading(false); return; }
        setListing(l);
        setBasics({ title: l.title ?? "", category: l.category ?? "", gender: l.gender ?? "", age: String(l.age ?? ""), country: l.country ?? "", city: l.city ?? "", status: l.status ?? "active" });
        setDetails({ about: l.about ?? "", services: l.services ?? [], languages: l.languages ?? [], rate_1hour: l.rate_1hour ?? "", rate_2hours: l.rate_2hours ?? "", rate_overnight: l.rate_overnight ?? "", rate_weekend: l.rate_weekend ?? "", currency: l.currency ?? "DKK" });
        setContact({ phone: l.phone ?? "", whatsapp: l.whatsapp ?? "", telegram: l.telegram ?? "", snapchat: l.snapchat ?? "", email: l.email ?? "", social_links: l.social_links ?? {} });
        setPremium({ tier: l.premium_tier, in_carousel: l.in_carousel ?? false, location_changed_at: l.location_changed_at });
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/listings/${id}/travel`)
      .then(r => r.json())
      .then(d => { if (d.entries) setTravelEntries(d.entries); })
      .catch(() => {});
  }, [id]);

  // ── API helper ─────────────────────────────────────────────────────────────
  const adminPatch = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    if (!r.ok) { const j = await r.json(); throw new Error(j.error ?? "Fejl"); }
    return r.json();
  };

  const flash = (section: string) => { setSaved(section); setTimeout(() => setSaved(null), 2500); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 4000); };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  // ── Save handlers ──────────────────────────────────────────────────────────
  const saveBasics = async () => {
    setSavingBasics(true);
    try {
      await adminPatch({ action: "update_basics", title: basics.title, category: basics.category, gender: basics.gender, age: parseInt(basics.age) || null, country: basics.country, city: basics.city, location: basics.city, status: basics.status });
      flash("basics");
    } catch (e) { showError(String(e)); }
    finally { setSavingBasics(false); }
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      await adminPatch({ action: "update_details", about: details.about, services: details.services, languages: details.languages, rate_1hour: details.rate_1hour, rate_2hours: details.rate_2hours, rate_overnight: details.rate_overnight, rate_weekend: details.rate_weekend, currency: details.currency });
      flash("details");
    } catch (e) { showError(String(e)); }
    finally { setSavingDetails(false); }
  };

  const saveContact = async () => {
    setSavingContact(true);
    try {
      await adminPatch({ action: "update_contact", phone: contact.phone, whatsapp: contact.whatsapp, telegram: contact.telegram, snapchat: contact.snapchat, email: contact.email, social_links: contact.social_links });
      flash("contact");
    } catch (e) { showError(String(e)); }
    finally { setSavingContact(false); }
  };

  const savePremium = async () => {
    setSavingPremium(true);
    try {
      await adminPatch({ action: "set_tier", tier: premium.tier });
      await adminPatch({ action: "set_carousel", in_carousel: premium.in_carousel });
      flash("premium");
    } catch (e) { showError(String(e)); }
    finally { setSavingPremium(false); }
  };

  const deleteImage = async (url: string) => {
    setDeletingImage(url);
    try {
      await adminPatch({ action: "delete_image", image_url: url });
      setListing(prev => prev ? { ...prev, images: (prev.images ?? []).filter(i => i !== url) } : prev);
    } catch (e) { showError(String(e)); }
    finally { setDeletingImage(null); }
  };

  const addTravel = async () => {
    const { from_date, to_date, city, country } = newTravel;
    if (!from_date || !to_date || !city || !country) { showError("Udfyld alle felter"); return; }
    setSavingTravel(true);
    try {
      const r = await fetch(`/api/listings/${id}/travel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from_date, to_date, city, country }) });
      const j = await r.json();
      if (!r.ok) { showError(j.error ?? "Fejl"); return; }
      setTravelEntries(prev => [...prev, j.entry].sort((a, b) => a.from_date.localeCompare(b.from_date)));
      setNewTravel({ from_date: "", to_date: "", city: "", country: "" });
    } catch (e) { showError(String(e)); }
    finally { setSavingTravel(false); }
  };

  const deleteTravel = async (travelId: string) => {
    setDeletingTravel(travelId);
    try {
      await fetch(`/api/listings/${id}/travel`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ travel_id: travelId }) });
      setTravelEntries(prev => prev.filter(e => e.id !== travelId));
    } catch (e) { showError(String(e)); }
    finally { setDeletingTravel(null); }
  };

  const deleteListing = async () => {
    setDeleting(true);
    try {
      await adminPatch({ action: "delete" });
      router.push("/admin/annoncer");
    } catch (e) { showError(String(e)); setDeleting(false); setConfirmDelete(false); }
  };

  const rejectListing = async () => {
    try {
      await adminPatch({ action: "reject" });
      setBasics(prev => ({ ...prev, status: "rejected" }));
      flash("basics");
    } catch (e) { showError(String(e)); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!listing) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-500">Annonce ikke fundet.</div>
      </AdminLayout>
    );
  }

  const tierInfo = TIERS.find(t => t.value === premium.tier) ?? TIERS[0];

  return (
    <AdminLayout>
      {/* Toast */}
      {saved && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-[13px] font-medium shadow-xl">
          <CheckCircle size={14} color="#4ADE80" />
          Gemt
        </div>
      )}
      {error && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-medium shadow-xl">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <Link href="/admin/annoncer" className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> Admin
          </Link>
          <span>/</span>
          <Link href="/admin/annoncer" className="hover:text-gray-900 transition-colors">Listings</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{listing.title}</span>
        </div>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">{listing.title}</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{listing.id}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full"
              style={{ background: basics.status === "active" ? "#DCFCE7" : basics.status === "rejected" ? "#FEE2E2" : "#FEF3C7", color: basics.status === "active" ? "#14532D" : basics.status === "rejected" ? "#7F1D1D" : "#92400E" }}>
              {basics.status}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 1 — Basis info
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Basis info" icon={<CheckCircle size={16} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Titel">
                <input className={inputCls} value={basics.title}
                  onChange={e => setBasics(p => ({ ...p, title: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select className={selectCls} value={basics.status}
                  onChange={e => setBasics(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
              <Field label="Kategori">
                <select className={selectCls} value={basics.category}
                  onChange={e => setBasics(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Vælg…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Køn">
                <select className={selectCls} value={basics.gender}
                  onChange={e => setBasics(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Vælg…</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Alder">
                <input className={inputCls} type="number" min={18} max={99}
                  value={basics.age}
                  onChange={e => setBasics(p => ({ ...p, age: e.target.value }))} />
              </Field>
              <Field label="Land">
                <select className={selectCls} value={basics.country}
                  onChange={e => setBasics(p => ({ ...p, country: e.target.value }))}>
                  <option value="">Vælg…</option>
                  {COUNTRIES_SORTED.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </Field>
              <Field label="By">
                <input className={inputCls} value={basics.city} placeholder="fx København"
                  onChange={e => setBasics(p => ({ ...p, city: e.target.value }))} />
              </Field>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveBasics} saving={savingBasics} />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 2 — Detaljer
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Detaljer & Services" icon={<CheckCircle size={16} />}>
          <div className="space-y-5">
            <Field label="Om mig">
              <textarea rows={5} className={`${inputCls} resize-none`}
                value={details.about} placeholder="Beskrivelse…"
                onChange={e => setDetails(p => ({ ...p, about: e.target.value }))} />
            </Field>
            <Field label="Services">
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map(s => (
                  <button key={s} type="button"
                    onClick={() => setDetails(p => ({ ...p, services: toggleArr(p.services, s) }))}
                    className="rounded-full border px-4 py-1.5 text-[12px] transition-colors"
                    style={{ borderColor: details.services.includes(s) ? "#000" : "#E5E7EB", background: details.services.includes(s) ? "#000" : "#fff", color: details.services.includes(s) ? "#fff" : "#6B7280" }}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Sprog">
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(l => (
                  <button key={l} type="button"
                    onClick={() => setDetails(p => ({ ...p, languages: toggleArr(p.languages, l) }))}
                    className="rounded-full border px-4 py-1.5 text-[12px] transition-colors"
                    style={{ borderColor: details.languages.includes(l) ? "#000" : "#E5E7EB", background: details.languages.includes(l) ? "#000" : "#fff", color: details.languages.includes(l) ? "#fff" : "#6B7280" }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Valuta">
                <select className={selectCls} value={details.currency}
                  onChange={e => setDetails(p => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="1 time">
                <input className={inputCls} value={details.rate_1hour} placeholder="fx 2000"
                  onChange={e => setDetails(p => ({ ...p, rate_1hour: e.target.value }))} />
              </Field>
              <Field label="2 timer">
                <input className={inputCls} value={details.rate_2hours} placeholder="fx 3500"
                  onChange={e => setDetails(p => ({ ...p, rate_2hours: e.target.value }))} />
              </Field>
              <Field label="Overnat">
                <input className={inputCls} value={details.rate_overnight} placeholder="fx 7000"
                  onChange={e => setDetails(p => ({ ...p, rate_overnight: e.target.value }))} />
              </Field>
              <Field label="Weekend">
                <input className={inputCls} value={details.rate_weekend} placeholder="fx 12000"
                  onChange={e => setDetails(p => ({ ...p, rate_weekend: e.target.value }))} />
              </Field>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveDetails} saving={savingDetails} />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 3 — Billeder
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Billeder" icon={<ImageIcon size={16} />}>
          {(!listing.images || listing.images.length === 0) ? (
            <p className="text-[13px] text-gray-400 text-center py-4">Ingen billeder</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {listing.images.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Billede ${i+1}`} className="w-full h-full object-cover" />
                  {/* Locked badge */}
                  {i > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                      Låst
                    </span>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => deleteImage(url)}
                    disabled={deletingImage === url}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                    title="Slet billede">
                    {deletingImage === url
                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <XCircle size={13} color="white" />}
                  </button>
                  {/* Index label */}
                  <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                    #{i+1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 4 — Kontakt
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Kontakt" icon={<MapPin size={16} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefon">
                <input className={inputCls} value={contact.phone} placeholder="+45..."
                  onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
              </Field>
              <Field label="WhatsApp">
                <input className={inputCls} value={contact.whatsapp} placeholder="+45..."
                  onChange={e => setContact(p => ({ ...p, whatsapp: e.target.value }))} />
              </Field>
              <Field label="Telegram">
                <input className={inputCls} value={contact.telegram} placeholder="@username"
                  onChange={e => setContact(p => ({ ...p, telegram: e.target.value }))} />
              </Field>
              <Field label="Snapchat">
                <input className={inputCls} value={contact.snapchat} placeholder="username"
                  onChange={e => setContact(p => ({ ...p, snapchat: e.target.value }))} />
              </Field>
              <Field label="Email">
                <input className={inputCls} value={contact.email} placeholder="email@..."
                  onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
              </Field>
            </div>
            <Field label="Social Media Links">
              <SocialLinksEditor value={contact.social_links} onChange={v => setContact(p => ({ ...p, social_links: v }))} isPremium={true} />
            </Field>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveContact} saving={savingContact} />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 5 — Premium & Carousel
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Premium & Carousel" icon={<Crown size={16} />}>
          <div className="space-y-5">
            {/* Tier selector */}
            <Field label="Tier">
              <div className="flex flex-wrap gap-2 mt-1">
                {TIERS.map(t => (
                  <button key={String(t.value)} type="button"
                    onClick={() => setPremium(p => ({ ...p, tier: t.value }))}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all"
                    style={{
                      background: premium.tier === t.value ? t.bg : "#F9FAFB",
                      color: premium.tier === t.value ? t.color : "#9CA3AF",
                      borderColor: premium.tier === t.value ? t.border : "transparent",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Current tier badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: tierInfo.bg, borderColor: tierInfo.border }}>
              <Crown size={15} color={tierInfo.color} />
              <span className="text-[13px] font-semibold" style={{ color: tierInfo.color }}>
                Aktiv tier: {tierInfo.label}
              </span>
            </div>

            {/* Carousel toggle */}
            <Field label="Premium Carousel">
              <button
                onClick={() => setPremium(p => ({ ...p, in_carousel: !p.in_carousel }))}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors"
                style={{
                  background: premium.in_carousel ? "#FFFBEB" : "#F9FAFB",
                  borderColor: premium.in_carousel ? "#F59E0B" : "#E5E7EB",
                }}>
                <Star size={16} color={premium.in_carousel ? "#F59E0B" : "#9CA3AF"} fill={premium.in_carousel ? "#F59E0B" : "none"} />
                <span className="text-[13px] font-medium" style={{ color: premium.in_carousel ? "#B45309" : "#6B7280" }}>
                  {premium.in_carousel ? "Pinnet til Premium Carousel" : "Ikke i Premium Carousel"}
                </span>
              </button>
            </Field>

            {/* Location changed at */}
            {premium.location_changed_at && (
              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Lokation sidst skiftet</p>
                <p className="text-[13px] text-gray-700">
                  {new Date(premium.location_changed_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <SaveBtn onClick={savePremium} saving={savingPremium} />
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 6 — Travel Schedule
        ══════════════════════════════════════════════════════════════ */}
        <Section title="Travel Schedule" icon={<Calendar size={16} />}>
          <div className="space-y-4">
            {/* Existing entries */}
            {travelEntries.length > 0 ? (
              <div className="space-y-2">
                {travelEntries.map(e => (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                    <span className="text-[12px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {new Date(e.from_date + "T00:00:00").toLocaleDateString("da-DK", { day: "numeric", month: "short" })} – {new Date(e.to_date + "T00:00:00").toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-[13px] text-gray-700 flex-1 font-medium">{e.city}, {e.country}</span>
                    <button
                      onClick={() => deleteTravel(e.id)}
                      disabled={deletingTravel === e.id}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      style={{ color: "#9CA3AF" }}
                      onMouseEnter={ev => { ev.currentTarget.style.color = "#DC2626"; ev.currentTarget.style.background = "#FEF2F2"; }}
                      onMouseLeave={ev => { ev.currentTarget.style.color = "#9CA3AF"; ev.currentTarget.style.background = "transparent"; }}>
                      {deletingTravel === e.id
                        ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin block" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 text-center py-2">Ingen travel entries</p>
            )}

            {/* Add new entry */}
            <div className="rounded-xl border border-dashed border-gray-300 p-4 space-y-3">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Tilføj destination</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fra dato">
                  <input type="date" className={inputCls} value={newTravel.from_date}
                    onChange={e => setNewTravel(p => ({ ...p, from_date: e.target.value }))} />
                </Field>
                <Field label="Til dato">
                  <input type="date" className={inputCls} value={newTravel.to_date}
                    onChange={e => setNewTravel(p => ({ ...p, to_date: e.target.value }))} />
                </Field>
              </div>
              <Field label="By">
                <input className={inputCls} placeholder="fx København" value={newTravel.city}
                  onChange={e => setNewTravel(p => ({ ...p, city: e.target.value }))} />
              </Field>
              <Field label="Land">
                <select className={selectCls} value={newTravel.country}
                  onChange={e => setNewTravel(p => ({ ...p, country: e.target.value }))}>
                  <option value="">Vælg land…</option>
                  {COUNTRIES_SORTED.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </Field>
              <button onClick={addTravel} disabled={savingTravel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: "#000" }}>
                <Plus size={14} />
                {savingTravel ? "Gemmer…" : "Tilføj entry"}
              </button>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════
            SEKTION 7 — Danger Zone
        ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border-2 border-red-100 bg-red-50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-red-100">
            <AlertTriangle size={16} color="#DC2626" />
            <h2 className="text-[15px] font-bold text-red-700">Danger Zone</h2>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <button
              onClick={rejectListing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FDE68A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FEF3C7"; }}>
              <XCircle size={14} />
              Afvis annonce
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{ background: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FECACA" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FECACA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FEE2E2"; }}>
              <Trash2 size={14} />
              Slet annonce permanent
            </button>
          </div>
        </div>

        {/* ── Confirm delete dialog ── */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} color="#DC2626" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">Slet annonce permanent?</h3>
              <p className="text-[13px] text-gray-500 mb-6">
                Handlingen kan ikke fortrydes. Alle billeder, data og travel entries slettes.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuller
                </button>
                <button onClick={deleteListing} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                  {deleting ? "Sletter…" : "Slet permanent"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
