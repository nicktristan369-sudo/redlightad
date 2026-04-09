"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase";
import { MARKETPLACE_CATEGORIES, CATEGORY_LABELS, eurToCoins, coinsToEur, type MarketplaceItem, type MarketplaceCategory, type ContentType } from "@/lib/marketplace";
import { Plus, Upload, Trash2, Eye, Clock, CheckCircle, XCircle, ShoppingBag } from "lucide-react";

const STATUS_BADGE = {
  pending:  { label: "Pending",  bg: "#FEF3C7", color: "#92400E", icon: <Clock size={12} /> },
  approved: { label: "Approved", bg: "#D1FAE5", color: "#065F46", icon: <CheckCircle size={12} /> },
  rejected: { label: "Rejected", bg: "#FEE2E2", color: "#991B1B", icon: <XCircle size={12} /> },
};

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const s = STATUS_BADGE[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "photos" as MarketplaceCategory,
  coin_price: "",
  content_type: "image" as ContentType,
  stock: "",
  delivery_info: "",
};

export default function DashboardMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLInputElement>(null);

  const isPhysical = form.category === "underwear" || form.category === "toy";

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as MarketplaceItem[]);
    setLoading(false);
  };

  const uploadToCloudinary = async (file: File, resourceType: "image" | "video" | "raw" = "image") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? "redlightad_unsigned");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: fd }
    );
    const json = await res.json();
    return json.secure_url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let thumbnailUrl: string | null = null;
      let previewUrl: string | null = null;
      const fullUrls: string[] = [];

      if (thumbnailFile) thumbnailUrl = await uploadToCloudinary(thumbnailFile, "image");
      if (previewFile) {
        const rt = form.content_type === "video" ? "video" : "image";
        previewUrl = await uploadToCloudinary(previewFile, rt);
      }
      for (const f of contentFiles) {
        const rt = form.content_type === "video" ? "video" : "image";
        const url = await uploadToCloudinary(f, rt);
        fullUrls.push(url);
      }

      const { error } = await supabase.from("marketplace_items").insert({
        seller_id: user.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        coin_price: parseInt(form.coin_price),
        content_type: isPhysical ? "physical" : form.content_type,
        thumbnail_url: thumbnailUrl,
        preview_url: previewUrl,
        full_content_urls: fullUrls.length > 0 ? fullUrls : null,
        stock: isPhysical && form.stock ? parseInt(form.stock) : null,
        status: "pending",
      });

      if (error) throw new Error(error.message);
      setSubmitSuccess(true);
      setForm(INITIAL_FORM);
      setThumbnailFile(null);
      setPreviewFile(null);
      setContentFiles([]);
      setShowForm(false);
      await loadItems();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;
    const supabase = createClient();
    await supabase.from("marketplace_items").delete().eq("id", itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={22} /> My Marketplace
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Sell photos, videos, physical items and more for RedCoins</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setSubmitSuccess(false); setSubmitError(""); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors"
            style={{ background: "#000", borderRadius: "8px" }}
          >
            <Plus size={16} /> New Listing
          </button>
        </div>

        {/* Success banner */}
        {submitSuccess && (
          <div className="flex items-center gap-2 text-[13px] text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Item submitted for review — usually approved within 24h.
          </div>
        )}

        {/* Upload form */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5]">
            <h2 className="text-[16px] font-bold text-gray-900 mb-5">New Marketplace Listing</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Exclusive photoshoot — 50 photos"
                    className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900" />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what the buyer gets..."
                    className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900 resize-none" />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Category *</label>
                  <select required value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as MarketplaceCategory }))}
                    className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900 bg-white">
                    {MARKETPLACE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {/* Content type */}
                {!isPhysical && (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Content Type *</label>
                    <select value={form.content_type}
                      onChange={e => setForm(f => ({ ...f, content_type: e.target.value as ContentType }))}
                      className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900 bg-white">
                      <option value="image">Images</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                )}

                {/* Price — EUR input + live coins calculator */}
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Price *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* EUR input */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-400">€</span>
                      <input
                        type="number" min={1} step={0.5}
                        placeholder="10.00"
                        className="w-full pl-7 pr-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900"
                        onChange={e => {
                          const eur = parseFloat(e.target.value);
                          if (!isNaN(eur) && eur > 0) {
                            setForm(f => ({ ...f, coin_price: String(eurToCoins(eur)) }));
                          } else {
                            setForm(f => ({ ...f, coin_price: "" }));
                          }
                        }}
                      />
                    </div>
                    {/* Coins display */}
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
                      style={{ background: "#FFF8F8", border: "1px solid #FEE2E2" }}>
                      
                      <span className="text-[14px] font-bold text-gray-900">
                        {form.coin_price ? `${form.coin_price} coins` : "—"}
                      </span>
                    </div>
                  </div>
                  {form.coin_price && (
                    <p className="mt-1.5 text-[12px] text-gray-400">
                      You receive <strong>{Math.round(parseInt(form.coin_price) * 0.81)}</strong> coins after 19% platform fee (≈ €{coinsToEur(Math.round(parseInt(form.coin_price) * 0.81))})
                    </p>
                  )}
                </div>

                {/* Stock (physical) */}
                {isPhysical && (
                  <>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Stock quantity</label>
                      <input type="number" min={1} value={form.stock}
                        onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                        placeholder="Leave blank = unlimited"
                        className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Delivery information</label>
                      <textarea rows={2} value={form.delivery_info}
                        onChange={e => setForm(f => ({ ...f, delivery_info: e.target.value }))}
                        placeholder="How will you ship? Estimated delivery time..."
                        className="w-full px-4 py-2.5 text-[14px] border border-[#E5E5E5] rounded-lg outline-none focus:border-gray-900 resize-none" />
                    </div>
                  </>
                )}
              </div>

              {/* File uploads */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Thumbnail */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Cover thumbnail</label>
                  <input ref={thumbnailRef} type="file" accept="image/*" className="hidden"
                    onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => thumbnailRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                    <Upload size={18} />
                    {thumbnailFile ? thumbnailFile.name : "Upload cover"}
                  </button>
                </div>

                {/* Teaser video (9s free) */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Teaser video <span className="text-gray-400">(maks 9 sek, gratis preview)</span>
                  </label>
                  <input ref={previewRef} type="file" accept="video/*" className="hidden"
                    onChange={e => setPreviewFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => previewRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                    <Upload size={18} />
                    {previewFile ? previewFile.name : "Upload teaser (video)"}
                  </button>
                  <p className="mt-1 text-[11px] text-gray-400">Must not contain explicit content</p>
                </div>

                {/* Full content */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Full content (locked)</label>
                  <input ref={contentRef} type="file" accept="image/*,video/*" multiple className="hidden"
                    onChange={e => setContentFiles(Array.from(e.target.files ?? []))} />
                  <button type="button" onClick={() => contentRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-[#E5E5E5] rounded-xl text-[13px] text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                    <Upload size={18} />
                    {contentFiles.length > 0 ? `${contentFiles.length} file(s)` : "Upload content (up to 20)"}
                  </button>
                </div>
              </div>

              {submitError && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{submitError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 text-[14px] font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: "#000", borderRadius: "8px" }}>
                  {submitting ? "Uploading..." : "Submit for Review"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-[14px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  style={{ borderRadius: "8px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <div className="text-[14px] text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5E5]">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <p className="text-[16px] font-semibold text-gray-900">No listings yet</p>
            <p className="text-[13px] text-gray-500 mt-1">Create your first listing to start selling</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wide">Item</th>
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Sales</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail_url} alt="" className="w-10 h-10 object-cover flex-shrink-0"
                            style={{ borderRadius: "6px" }} />
                        )}
                        <span className="text-[14px] font-medium text-gray-900 line-clamp-1">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[13px] text-gray-600">{CATEGORY_LABELS[item.category]}</td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-semibold" style={{ color: "#CC0000" }}>{item.coin_price} coins</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-[13px] text-gray-600">{item.purchase_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {item.status === "approved" && (
                          <a href={`/marketplace/${item.id}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                            <Eye size={15} />
                          </a>
                        )}
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
