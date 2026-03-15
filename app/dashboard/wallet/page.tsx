"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { COIN_SELL_RATE, MIN_PAYOUT_COINS } from "@/lib/coinPackages"
import { Suspense } from "react"

interface Transaction {
  id: string
  type: string
  amount: number
  note: string | null
  created_at: string
}

interface Wallet {
  balance: number
  total_earned: number
}

function WalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const coinsPurchased = searchParams.get("coins_purchased")
  const coinsAmount = searchParams.get("coins")

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutModal, setPayoutModal] = useState(false)
  const [iban, setIban] = useState("")
  const [payoutCoins, setPayoutCoins] = useState("")
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const [{ data: w }, { data: tx }] = await Promise.all([
        supabase.from("wallets").select("balance, total_earned").eq("user_id", user.id).single(),
        supabase.from("coin_transactions").select("id, type, amount, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ])

      setWallet(w || { balance: 0, total_earned: 0 })
      setTransactions(tx || [])
      setLoading(false)
    })
  }, [router])

  const handlePayout = async () => {
    if (!userId || !iban || !payoutCoins) return
    const coins = parseInt(payoutCoins)
    if (coins < MIN_PAYOUT_COINS || coins > (wallet?.balance || 0)) return

    setPayoutLoading(true)
    const supabase = createClient()
    await supabase.from("payout_requests").insert({
      seller_id: userId,
      coins_amount: coins,
      usd_amount: coins * COIN_SELL_RATE,
      iban,
      status: "pending",
    })
    setPayoutSuccess(true)
    setPayoutLoading(false)
    setPayoutModal(false)
  }

  const txLabel = (type: string) => {
    switch(type) {
      case "purchase": return "Købt coins"
      case "spend": return "Brugt på indhold"
      case "earn": return "Optjent fra salg"
      case "payout": return "Udbetaling"
      default: return type
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <DashboardLayout>
      <div>
        {coinsPurchased && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            
            <div>
              <p className="font-semibold text-green-800">Betaling gennemført!</p>
              <p className="text-green-600 text-sm">{coinsAmount} coins er tilføjet til din wallet</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Min Wallet</h1>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">RedCoins balance</p>
            <p className="text-5xl font-black text-red-400">{wallet?.balance ?? 0}</p>
            <p className="text-gray-400 text-sm mt-1">≈ ${((wallet?.balance ?? 0) * 0.08).toFixed(2)} USD</p>
          </div>
          
        </div>

        <div className="flex gap-3 mb-8">
          <Link href="/dashboard/buy-coins" className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-3 rounded-xl text-center transition-colors">
            + Køb flere coins
          </Link>
          {(wallet?.total_earned ?? 0) >= MIN_PAYOUT_COINS && (
            <button
              onClick={() => setPayoutModal(true)}
              className="flex-1 bg-white border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Anmod om udbetaling
            </button>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Transaktionshistorik</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Ingen transaktioner endnu</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{txLabel(tx.type)}</p>
                    {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString("da-DK")}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} coins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout modal */}
        {payoutModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Anmod om udbetaling</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Antal coins (min {MIN_PAYOUT_COINS})</label>
                  <input
                    type="number"
                    value={payoutCoins}
                    onChange={e => setPayoutCoins(e.target.value)}
                    min={MIN_PAYOUT_COINS}
                    max={wallet?.balance}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                    placeholder={`${MIN_PAYOUT_COINS}`}
                  />
                  {payoutCoins && <p className="text-xs text-gray-400 mt-1">= ${(parseInt(payoutCoins || "0") * COIN_SELL_RATE).toFixed(2)} USD</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">IBAN</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="DK12 3456 7890 1234 56"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setPayoutModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuller</button>
                  <button onClick={handlePayout} disabled={payoutLoading} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                    {payoutLoading ? "..." : "Send anmodning"}
                  </button>
                </div>
              </div>
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
