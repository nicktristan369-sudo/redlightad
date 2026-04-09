"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Wallet, ArrowDownLeft, Gift, Video, ShoppingBag } from "lucide-react"

const COIN_TO_USD = 0.08
const MIN_PAYOUT = 500 // minimum coins to request payout

interface WalletTx {
  id: string
  type: string
  amount: number
  source_username: string | null
  note: string | null
  created_at: string
}

interface PayoutReq {
  id: string
  coins_amount: number
  usd_amount: number
  payment_method: string
  status: string
  created_at: string
}

function txIcon(type: string) {
  switch (type) {
    case "tip": return <Gift size={16} color="#DC2626" />
    case "private_show": return <Video size={16} color="#7C3AED" />
    case "content_sale": return <ShoppingBag size={16} color="#0891B2" />
    case "payout": return <ArrowDownLeft size={16} color="#059669" />
    default: return <DollarSign size={16} color="#6B7280" />
  }
}

function txLabel(type: string, username: string | null, note: string | null) {
  switch (type) {
    case "tip": return username ? `Tip from ${username}` : "Tip received"
    case "private_show": return username ? `Private show with ${username}` : "Private show"
    case "content_sale": return "Content sale"
    case "payout": return "Payout"
    case "bonus": return note || "Bonus"
    default: return note || type
  }
}

function statusBadge(status: string) {
  const s: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "#92400E", bg: "#FEF3C7", icon: <Clock size={12} /> },
    processing: { label: "Processing", color: "#1E40AF", bg: "#DBEAFE", icon: <AlertCircle size={12} /> },
    paid: { label: "Paid", color: "#065F46", bg: "#D1FAE5", icon: <CheckCircle size={12} /> },
    rejected: { label: "Rejected", color: "#991B1B", bg: "#FEE2E2", icon: <XCircle size={12} /> },
  }
  const c = s[status] || s.pending
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
      {c.icon} {c.label}
    </span>
  )
}

function WalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const coinsPurchased = searchParams.get("coins_purchased")

  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [thisMonth, setThisMonth] = useState(0)
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [payouts, setPayouts] = useState<PayoutReq[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayout, setShowPayout] = useState(false)
  const [payStep, setPayStep] = useState(1) // 1=amount, 2=method, 3=details, 4=confirm
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("bank")
  const [payDetails, setPayDetails] = useState<Record<string, string>>({})
  const [payLoading, setPayLoading] = useState(false)
  const [payDone, setPayDone] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [{ data: w }, { data: tx }, { data: po }] = await Promise.all([
        supabase.from("wallets").select("balance, total_earned").eq("user_id", user.id).single(),
        supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("payout_requests").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(10),
      ])

      const bal = w?.balance || 0
      const earned = w?.total_earned || 0
      setBalance(bal)
      setTotalEarned(earned)
      setTransactions(tx || [])
      setPayouts(po || [])

      // Calculate this month from transactions
      const monthTx = (tx || []).filter(t => t.amount > 0 && t.created_at >= monthStart)
      setThisMonth(monthTx.reduce((s: number, t: WalletTx) => s + t.amount, 0))

      setLoading(false)
    })
  }, [router])

  const handlePayout = async () => {
    if (!userId) return
    setPayLoading(true)
    const supabase = createClient()
    const coins = parseInt(payAmount)
    await supabase.from("payout_requests").insert({
      seller_id: userId,
      coins_amount: coins,
      usd_amount: +(coins * COIN_TO_USD).toFixed(2),
      payment_method: payMethod,
      payment_details: payDetails,
      status: "pending",
    })
    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "payout",
      amount: -coins,
      note: `Payout via ${payMethod}`,
    })
    // Deduct balance
    await supabase.from("wallets").update({ balance: balance - coins }).eq("user_id", userId)
    setBalance(prev => prev - coins)
    setPayDone(true)
    setPayLoading(false)
    setShowPayout(false)
    const { data: po } = await supabase.from("payout_requests").select("*").eq("seller_id", userId).order("created_at", { ascending: false }).limit(10)
    setPayouts(po || [])
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #DC2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </DashboardLayout>
  )

  const usdBalance = (balance * COIN_TO_USD).toFixed(2)
  const usdEarned = (totalEarned * COIN_TO_USD).toFixed(2)
  const usdMonth = (thisMonth * COIN_TO_USD).toFixed(2)
  const pendingPayout = payouts.filter(p => p.status === "pending" || p.status === "processing").reduce((s, p) => s + p.coins_amount, 0)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 16px 60px" }}>

        {coinsPurchased && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#16A34A" />
            <span style={{ fontSize: 14, color: "#15803D", fontWeight: 600 }}>Payment completed! Coins added.</span>
          </div>
        )}

        {payDone && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#16A34A" />
            <span style={{ fontSize: 14, color: "#15803D", fontWeight: 600 }}>Payout request sent! We will process it within 3–5 business days.</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>My Wallet</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/dashboard/buy-coins"
              style={{ padding: "9px 18px", background: "#DC2626", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              + Buy Coins
            </Link>
            {balance >= MIN_PAYOUT && (
              <button onClick={() => { setShowPayout(true); setPayStep(1); setPayDone(false) }}
                style={{ padding: "9px 18px", background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 10, color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Request Payout
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
          {/* Available balance */}
          <div style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)", borderRadius: 16, padding: "20px 22px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Wallet size={15} color="#9CA3AF" />
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Available</span>
            </div>
            <p style={{ fontSize: 36, fontWeight: 900, color: "#DC2626", lineHeight: 1 }}>{balance.toLocaleString()}</p>
            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>≈ ${usdBalance} USD</p>
          </div>

          {/* Total earned */}
          <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingUp size={15} color="#6B7280" />
              <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Earned</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#111", lineHeight: 1 }}>{totalEarned.toLocaleString()}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>≈ ${usdEarned} USD</p>
          </div>

          {/* This month */}
          <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <DollarSign size={15} color="#6B7280" />
              <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>This Month</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#111", lineHeight: 1 }}>{thisMonth.toLocaleString()}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>≈ ${usdMonth} USD</p>
          </div>

          {/* Pending */}
          {pendingPayout > 0 && (
            <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Clock size={15} color="#92400E" />
                <span style={{ fontSize: 11, color: "#92400E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Payout</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#92400E", lineHeight: 1 }}>{pendingPayout.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>≈ ${(pendingPayout * COIN_TO_USD).toFixed(2)} USD</p>
            </div>
          )}
        </div>

        {/* Conversion info */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} color="#6B7280" />
          <span style={{ fontSize: 13, color: "#6B7280" }}>1 RedCoin = $0.08 USD · Minimum withdrawal: {MIN_PAYOUT} RC · Processing time: 3–5 business days</span>
        </div>

        {/* Transactions */}
        <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 16, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Transaction History</h2>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Last 50</span>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <Wallet size={32} color="#E5E7EB" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "#9CA3AF", fontSize: 14 }}>No transactions yet</p>
              <p style={{ color: "#D1D5DB", fontSize: 12, marginTop: 4 }}>Your earnings from tips, shows, and sales will appear here</p>
            </div>
          ) : (
            <div>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", padding: "14px 22px", borderBottom: i < transactions.length - 1 ? "1px solid #F9FAFB" : "none", gap: 14 }}>
                  <div style={{ width: 36, height: 36, background: "#F9FAFB", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {txIcon(tx.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>
                      {txLabel(tx.type, tx.source_username, tx.note)}
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
                      {new Date(tx.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: tx.amount > 0 ? "#16A34A" : "#DC2626", whiteSpace: "nowrap" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} RC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout history */}
        {payouts.length > 0 && (
          <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Payout History</h2>
            </div>
            {payouts.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "14px 22px", borderBottom: i < payouts.length - 1 ? "1px solid #F9FAFB" : "none", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{p.coins_amount.toLocaleString()} RC</span>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>≈ ${p.usd_amount.toFixed(2)}</span>
                    {statusBadge(p.status)}
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                    {p.payment_method === "bank" ? "Bank transfer" : p.payment_method === "payoneer" ? "Payoneer" : "USDT (Crypto)"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payout modal */}
        {showPayout && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, padding: "32px 28px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>

              {/* Steps */}
              <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ flex: 1, height: 3, borderRadius: 4, background: payStep >= s ? "#DC2626" : "#E5E7EB" }} />
                ))}
              </div>

              {payStep === 1 && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Request Payout</h3>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>Available: <b style={{ color: "#111" }}>{balance.toLocaleString()} RC</b> (≈ ${usdBalance})</p>

                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Amount of RedCoins</label>
                  <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    min={MIN_PAYOUT} max={balance}
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 16, fontWeight: 700, marginBottom: 8, boxSizing: "border-box" }}
                    placeholder={`Min. ${MIN_PAYOUT}`} />

                  {payAmount && parseInt(payAmount) >= MIN_PAYOUT && (
                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                      <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>You will receive approx.</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", margin: "2px 0 0" }}>${(parseInt(payAmount) * COIN_TO_USD).toFixed(2)} USD</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowPayout(false)}
                      style={{ flex: 1, padding: 13, background: "#F9FAFB", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                      Cancel
                    </button>
                    <button onClick={() => setPayStep(2)}
                      disabled={!payAmount || parseInt(payAmount) < MIN_PAYOUT || parseInt(payAmount) > balance}
                      style={{ flex: 2, padding: 13, background: "#DC2626", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (!payAmount || parseInt(payAmount) < MIN_PAYOUT || parseInt(payAmount) > balance) ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {payStep === 2 && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Payment Method</h3>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Choose how you want {payAmount} RC paid out</p>

                  {[
                    { id: "bank", label: "Bank Transfer (SEPA)", sub: "IBAN · 2–3 business days", icon: "🏦" },
                    { id: "payoneer", label: "Payoneer", sub: "To your Payoneer account · 1–2 days", icon: "💳" },
                    { id: "usdt", label: "USDT (Crypto)", sub: "TRC20 or ERC20 · Same day", icon: "🔗" },
                  ].map(m => (
                    <div key={m.id} onClick={() => setPayMethod(m.id)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `2px solid ${payMethod === m.id ? "#DC2626" : "#E5E7EB"}`, borderRadius: 12, marginBottom: 10, cursor: "pointer", background: payMethod === m.id ? "#FFF5F5" : "#fff", transition: "all 0.15s" }}>
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>{m.label}</p>
                        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>{m.sub}</p>
                      </div>
                      <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${payMethod === m.id ? "#DC2626" : "#D1D5DB"}`, background: payMethod === m.id ? "#DC2626" : "transparent", flexShrink: 0 }} />
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setPayStep(1)}
                      style={{ flex: 1, padding: 13, background: "#F9FAFB", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                      Back
                    </button>
                    <button onClick={() => setPayStep(3)}
                      style={{ flex: 2, padding: 13, background: "#DC2626", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {payStep === 3 && (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Payment Details</h3>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                    {payMethod === "bank" ? "Enter your IBAN" : payMethod === "payoneer" ? "Enter your Payoneer email" : "Enter your USDT address"}
                  </p>

                  {payMethod === "bank" && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Full name (account holder)</label>
                      <input value={payDetails.name || ""} onChange={e => setPayDetails(p => ({ ...p, name: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
                        placeholder="Name as it appears on the account" />
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>IBAN</label>
                      <input value={payDetails.iban || ""} onChange={e => setPayDetails(p => ({ ...p, iban: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                        placeholder="DK12 3456 7890 1234 56" />
                    </>
                  )}

                  {payMethod === "payoneer" && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Payoneer email</label>
                      <input value={payDetails.payoneer_email || ""} onChange={e => setPayDetails(p => ({ ...p, payoneer_email: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                        placeholder="din@email.com" />
                    </>
                  )}

                  {payMethod === "usdt" && (
                    <>
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Network</label>
                      <select value={payDetails.network || "trc20"} onChange={e => setPayDetails(p => ({ ...p, network: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}>
                        <option value="trc20">TRC20 (Tron) — recommended</option>
                        <option value="erc20">ERC20 (Ethereum)</option>
                      </select>
                      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>USDT Wallet address</label>
                      <input value={payDetails.usdt_address || ""} onChange={e => setPayDetails(p => ({ ...p, usdt_address: e.target.value }))}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                        placeholder="T..." />
                    </>
                  )}

                  {/* Summary */}
                  <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#6B7280" }}>Payout</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{parseInt(payAmount).toLocaleString()} RC</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#6B7280" }}>You receive</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#16A34A" }}>${(parseInt(payAmount) * COIN_TO_USD).toFixed(2)} USD</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setPayStep(2)}
                      style={{ flex: 1, padding: 13, background: "#F9FAFB", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                      Back
                    </button>
                    <button onClick={handlePayout} disabled={payLoading}
                      style={{ flex: 2, padding: 13, background: "#DC2626", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: payLoading ? 0.6 : 1 }}>
                      {payLoading ? "Sending..." : "Confirm request"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function WalletPage() {
  return <Suspense><WalletContent /></Suspense>
}
