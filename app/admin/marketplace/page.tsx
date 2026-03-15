"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { CATEGORY_LABELS, coinsToEur, type MarketplaceItem, type MarketplaceStatus } from "@/lib/marketplace";
import { CheckCircle, XCircle, Trash2, Eye, Search, X, Play, Pause, ZoomIn } from "lucide-react";

type Tab = MarketplaceStatus | "all";
const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#DCFCE7", color: "#14532D" },
  rejected: { bg: "#FEE2E2", color: "#7F1D1D" },
};

// ─── Content Preview Modal ───────────────────────────────────────────────────
function PreviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  item: MarketplaceItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy: string | null;
}) {
  const teaserRef = useRef<HTMLVideoElement>(null);
  const [teaserPlaying, setTeaserPlaying] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null); // URL of zoomed media

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (lightbox) setLightbox(null); else onClose(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, onClose]);

  const toggleTeaser = () => {
    if (!teaserRef.current) return;
    if (teaserPlaying) { teaserRef.current.pause(); setTeaserPlaying(false); }
    else { teaserRef.current.play().then(() => setTeaserPlaying(true)).catch(() => {}); }
  };

  const teaserSrc = item.teaser_url ?? item.preview_url;
  const allContent = item.full_content_urls ?? [];
  const isBusy = busy === item.id;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        {/* Modal */}
        <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ borderRadius: "16px", boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}>

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white"
            style={{ borderBottom: "1px solid #E5E5E5" }}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Content Review</p>
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{item.title}</h2>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-4"
              style={{ color: "#6B7280" }}>
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">

            {/* Seller + Meta */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {item.seller_avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.seller_avatar} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-[13px] font-semibold text-gray-700">{item.seller_name ?? "Unknown seller"}</span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              <span className="text-[12px] font-bold" style={{ color: "#CC0000" }}>
                {item.coin_price} coins <span className="font-normal text-gray-400">(≈ €{coinsToEur(item.coin_price)})</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                style={{ background: STATUS_BADGE[item.status]?.bg, color: STATUS_BADGE[item.status]?.color }}>
                {item.status}
              </span>
            </div>

            {/* Description */}
            {item.description && (
              <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Beskrivelse</p>
                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {/* Teaser video */}
            {teaserSrc && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Teaser video <span className="normal-case font-normal">(fri preview — maks 9 sek)</span>
                </p>
                <div className="relative rounded-xl overflow-hidden bg-black"
                  style={{ aspectRatio: "16/9", maxHeight: 280 }}>
                  <video
                    ref={teaserRef}
                    src={teaserSrc}
                    playsInline
                    className="w-full h-full object-contain"
                    onEnded={() => setTeaserPlaying(false)}
                  />
                  <button onClick={toggleTeaser}
                    className="absolute inset-0 flex items-center justify-center group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${teaserPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)" }}>
                      {teaserPlaying
                        ? <Pause size={18} color="#fff" />
                        : <Play size={18} color="#fff" className="ml-0.5" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail */}
            {item.thumbnail_url && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Cover thumbnail</p>
                <div className="relative group inline-block rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setLightbox(item.thumbnail_url!)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnail_url} alt="Thumbnail"
                    className="w-32 h-24 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.4)" }}>
                    <ZoomIn size={16} color="#fff" />
                  </div>
                </div>
              </div>
            )}

            {/* Full / locked content */}
            {allContent.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Fuldt indhold ({allContent.length} fil{allContent.length !== 1 ? "er" : ""}) — kun synligt for admin
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allContent.map((url, i) => {
                    const isVid = /\.(mp4|mov|webm)(\?|$)/i.test(url);
                    return (
                      <div key={i}
                        className="relative group rounded-xl overflow-hidden bg-gray-900 cursor-pointer"
                        style={{ aspectRatio: "4/3" }}
                        onClick={() => !isVid && setLightbox(url)}>
                        {isVid ? (
                          <video src={url} controls playsInline
                            className="w-full h-full object-contain" />
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Content ${i + 1}`}
                              className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.35)" }}>
                              <ZoomIn size={18} color="#fff" />
                            </div>
                          </>
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}>
                            {isVid ? "VIDEO" : "IMG"} {i + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 text-center text-[13px] text-gray-400"
                style={{ border: "1.5px dashed #E5E5E5" }}>
                Intet fuldt indhold uploadet
              </div>
            )}

          </div>

          {/* Sticky footer — Godkend / Afvis */}
          {item.status === "pending" && (
            <div className="sticky bottom-0 flex gap-3 px-6 py-4 bg-white"
              style={{ borderTop: "1px solid #E5E5E5" }}>
              <button
                onClick={() => { onApprove(item.id); onClose(); }}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-bold text-white rounded-xl disabled:opacity-50 transition-colors"
                style={{ background: "#16A34A" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#15803D")}
                onMouseLeave={e => (e.currentTarget.style.background = "#16A34A")}>
                <CheckCircle size={16} /> Godkend
              </button>
              <button
                onClick={() => { onClose(); onReject(item.id); }}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-bold text-white rounded-xl disabled:opacity-50 transition-colors"
                style={{ background: "#DC2626" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#B91C1C")}
                onMouseLeave={e => (e.currentTarget.style.background = "#DC2626")}>
                <XCircle size={16} /> Afvis
              </button>
              <button onClick={onClose}
                className="px-4 py-3 text-[13px] font-medium rounded-xl transition-colors"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                Luk
              </button>
            </div>
          )}
          {item.status !== "pending" && (
            <div className="px-6 py-4 flex justify-end" style={{ borderTop: "1px solid #E5E5E5" }}>
              <button onClick={onClose}
                className="px-5 py-2.5 text-[13px] font-medium rounded-xl transition-colors"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>
                Luk
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for images */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Preview" className="max-w-full max-h-full object-contain p-4" />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <X size={20} color="#fff" />
          </button>
        </div>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectMsg, setRejectMsg] = useState("");
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    const res = await fetch(`/api/admin/marketplace-items?${params}`);
    const json = await res.json();
    setItems((json.items ?? []) as MarketplaceItem[]);
    setLoading(false);
    setPage(1);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setBusy(id);
    await fetch("/api/admin/marketplace-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, action: "approve" }),
    });
    setItems(p => tab === "pending" ? p.filter(i => i.id !== id) : p.map(i => i.id === id ? { ...i, status: "approved" as const } : i));
    setBusy(null);
  };

  const reject = async () => {
    if (!rejectId) return;
    setBusy(rejectId);
    await fetch("/api/admin/marketplace-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: rejectId, action: "reject", reason: rejectMsg || undefined }),
    });
    setItems(p => tab === "pending" ? p.filter(i => i.id !== rejectId) : p.map(i => i.id === rejectId ? { ...i, status: "rejected" as const } : i));
    setBusy(null);
    setRejectId(null);
    setRejectMsg("");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setBusy(id);
    await fetch("/api/admin/marketplace-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, action: "delete" }),
    });
    setItems(p => p.filter(i => i.id !== id));
    setBusy(null);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  const pendingCount = items.filter(i => i.status === "pending").length;
  const q = search.toLowerCase();
  const filtered = items.filter(i => !q || i.title?.toLowerCase().includes(q));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout pendingMarketplace={pendingCount}>

      {/* Preview modal */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onApprove={id => { approve(id); setPreviewItem(null); }}
          onReject={id => { setPreviewItem(null); setRejectId(id); }}
          busy={busy}
        />
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ border: "1px solid #E5E5E5" }}>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1">Afvis item</h3>
            <p className="text-[13px] text-gray-500 mb-4">Valgfrit: efterlad en besked til sælger</p>
            <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}
              placeholder="Årsag til afvisning (valgfrit)…"
              rows={3}
              className="w-full text-[13px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{ border: "1px solid #E5E5E5" }} />
            <div className="flex gap-2 mt-4">
              <button onClick={reject} disabled={busy !== null}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: "#DC2626" }}>
                Bekræft afvisning
              </button>
              <button onClick={() => { setRejectId(null); setRejectMsg(""); }}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-gray-900">Marketplace</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Gennemse og moderer sælger-items</p>
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && tab !== "pending" && (
        <button onClick={() => setTab("pending")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-5 text-left transition-opacity hover:opacity-90"
          style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <div className="flex items-center gap-2">
            <span className="text-[18px]">⚠️</span>
            <div>
              <p className="text-[13px] font-semibold text-orange-900">{pendingCount} item{pendingCount !== 1 ? "s" : ""} venter på gennemgang</p>
              <p className="text-[12px] text-orange-700">Klik for at se pending submissions</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full">Gennemse →</span>
        </button>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
              {t.label}
              {t.key === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#CC0000", color: "#fff" }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white rounded-lg px-3 py-2"
          style={{ border: "1px solid #E5E5E5" }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title…"
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-900 placeholder-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-gray-400">Ingen items fundet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["", "Item", "Kategori", "Sælger", "Pris", "Status", "Dato", "Handlinger"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "#9CA3AF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(item => {
                  const sb = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
                  const isBusy = busy === item.id;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Thumbnail */}
                      <td className="pl-4 py-3 w-12">
                        <button onClick={() => setPreviewItem(item)} className="group relative">
                          {item.thumbnail_url
                            ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover group-hover:opacity-80 transition-opacity" />
                            )
                            : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px] group-hover:bg-gray-200 transition-colors"
                                style={{ background: "#F3F4F6" }}>🖼</div>}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                            style={{ background: "rgba(0,0,0,0.4)" }}>
                            <Eye size={12} color="#fff" />
                          </div>
                        </button>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <button onClick={() => setPreviewItem(item)} className="text-left hover:underline">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        {item.seller_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold whitespace-nowrap" style={{ color: "#CC0000" }}>
                        {item.coin_price} coins
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: sb.bg, color: sb.color }}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* Se indhold — always visible */}
                          <button onClick={() => setPreviewItem(item)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                            style={{ background: "#F3F4F6", color: "#374151" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#E5E7EB")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#F3F4F6")}
                            title="Se fuldt indhold">
                            <Eye size={12} /> Se
                          </button>

                          {item.status === "approved" && (
                            <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-md" style={{ color: "#9CA3AF" }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#111"; e.currentTarget.style.background = "#F3F4F6"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}
                              title="Se på marketplace">
                              <Eye size={14} />
                            </a>
                          )}

                          {item.status === "pending" ? (
                            <>
                              <button onClick={() => approve(item.id)} disabled={isBusy}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-colors"
                                style={{ background: "#DCFCE7", color: "#14532D" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#BBF7D0")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#DCFCE7")}>
                                {isBusy
                                  ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  : <><CheckCircle size={12} /> Godkend</>}
                              </button>
                              <button onClick={() => setRejectId(item.id)} disabled={isBusy}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-colors"
                                style={{ background: "#FEE2E2", color: "#991B1B" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FECACA")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#FEE2E2")}>
                                <XCircle size={12} /> Afvis
                              </button>
                            </>
                          ) : (
                            <>
                              {item.status !== "approved" && (
                                <button onClick={() => approve(item.id)} disabled={isBusy}
                                  className="p-1.5 rounded-md disabled:opacity-40"
                                  style={{ color: "#16A34A" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#DCFCE7")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {item.status !== "rejected" && (
                                <button onClick={() => setRejectId(item.id)} disabled={isBusy}
                                  className="p-1.5 rounded-md disabled:opacity-40"
                                  style={{ color: "#DC2626" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#FEE2E2")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <XCircle size={14} />
                                </button>
                              )}
                            </>
                          )}

                          <button onClick={() => remove(item.id)} disabled={isBusy}
                            className="p-1.5 rounded-md disabled:opacity-40" style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[12px] text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-7 h-7 rounded-md text-[12px] font-medium"
                  style={{ background: n === page ? "#000" : "transparent", color: n === page ? "#fff" : "#6B7280" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
