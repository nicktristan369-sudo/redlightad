"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"
import { Plus, Trash2, Copy, Check, Tag, Percent, Euro, Gift } from "lucide-react"

type PromoCode = {
  id: string
  code: string
  description: string
  discount_type: "trial" | "percent" | "fixed"
  trial_days: number | null
  discount_percent: number | null
  discount_fixed: number | null
  applies_to: string | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  trial:   { label: "Free trial",  icon: <Gift className="w-3.5 h-3.5" />,    color: "bg-purple-100 text-purple-700" },
  percent: { label: "% discount",  icon: <Percent className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700" },
  fixed:   { label: "€ discount",  icon: <Euro className="w-3.5 h-3.5" />,    color: "bg-green-100 text-green-700" },
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "trial" | "percent" | "fixed",
    trial_days: 30,
    discount_percent: 20,
    discount_fixed: 10,
    applies_to: "",
    max_uses: "",
    expires_at: "",
  })

  useEffect(() => { fetchCodes() }, [])

  const fetchCodes = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch("/api/admin/promo-codes", {
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    const d = await res.json()
    setCodes(d.codes || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.code.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discount_type: form.discount_type,
        trial_days: form.discount_type === "trial" ? form.trial_days : null,
        discount_percent: form.discount_type === "percent" ? form.discount_percent : null,
        discount_fixed: form.discount_type === "fixed" ? form.discount_fixed : null,
        applies_to: form.applies_to || null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    })
    setForm({ code: "", description: "", discount_type: "percent", trial_days: 30, discount_percent: 20, discount_fixed: 10, applies_to: "", max_uses: "", expires_at: "" })
    setShowForm(false)
    setCreating(false)
    fetchCodes()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ id, is_active: !current }),
    })
    fetchCodes()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ id }),
    })
    setDeleteId(null)
    fetchCodes()
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)]
    setForm(f => ({ ...f, code: result }))
  }

  const discountLabel = (c: PromoCode) => {
    if (c.discount_type === "trial") return `${c.trial_days} days free`
    if (c.discount_type === "percent") return `${c.discount_percent}% off`
    if (c.discount_type === "fixed") return `€${c.discount_fixed} off`
    return ""
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{codes.length} codes total</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Create promo code</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Code */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">CODE</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-red-500"
                />
                <button onClick={generateCode} className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
                  Random
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">DESCRIPTION</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Summer discount 20%"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">TYPE</label>
              <div className="flex gap-2">
                {(["percent", "fixed", "trial"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, discount_type: t }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      form.discount_type === t
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {t === "percent" ? "% Discount" : t === "fixed" ? "€ Discount" : "Free Trial"}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                {form.discount_type === "percent" ? "DISCOUNT %" : form.discount_type === "fixed" ? "DISCOUNT €" : "FREE DAYS"}
              </label>
              <input
                type="number"
                value={
                  form.discount_type === "percent" ? form.discount_percent
                  : form.discount_type === "fixed" ? form.discount_fixed
                  : form.trial_days
                }
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (form.discount_type === "percent") setForm(f => ({ ...f, discount_percent: v }))
                  else if (form.discount_type === "fixed") setForm(f => ({ ...f, discount_fixed: v }))
                  else setForm(f => ({ ...f, trial_days: v }))
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Applies to */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">APPLIES TO (optional)</label>
              <select
                value={form.applies_to}
                onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 bg-white"
              >
                <option value="">All plans</option>
                <option value="basic">Basic only</option>
                <option value="vip">VIP only</option>
              </select>
            </div>

            {/* Max uses */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">MAX USES (blank = unlimited)</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Expires */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">EXPIRES (optional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={creating || !form.code.trim()}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Code"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Codes list */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No promo codes yet</div>
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Code", "Type", "Discount", "Plan", "Uses", "Expires", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c, i) => {
                const typeMeta = TYPE_LABELS[c.discount_type]
                return (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i === codes.length - 1 ? "border-0" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 text-gray-900 font-mono text-xs px-2.5 py-1 rounded-lg font-bold">{c.code}</code>
                        <button onClick={() => copyCode(c.code, c.id)} className="text-gray-400 hover:text-gray-700 transition-colors">
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${typeMeta.color}`}>
                        {typeMeta.icon}{typeMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">{discountLabel(c)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{c.applies_to ? c.applies_to.toUpperCase() : "All"}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-gray-900 font-semibold">{c.used_count}</span>
                      <span className="text-gray-400">/{c.max_uses ?? "∞"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString("da-DK") : "Never"}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleActive(c.id, c.is_active)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${c.is_active ? "bg-green-500" : "bg-gray-200"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${c.is_active ? "left-5" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      {deleteId === c.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(c.id)} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
                          <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Delete this code?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
