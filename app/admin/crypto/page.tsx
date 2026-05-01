"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Copy, Check, ExternalLink, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Image from "next/image";

interface CryptoPayment {
  id: string;
  payment_id: string;
  order_id: string;
  payment_status: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  listing_id: string | null;
  listing_name: string | null;
  profile_image: string | null;
  payment_type: string;
}

interface WalletBalance {
  currency: string;
  balance: number;
  usd_value: number;
}

interface Stats {
  total_received: number;
  total_transactions: number;
  pending_transactions: number;
  completed_this_month: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  finished: { icon: CheckCircle, color: "#15803D", bg: "#DCFCE7", label: "Completed" },
  confirmed: { icon: CheckCircle, color: "#15803D", bg: "#DCFCE7", label: "Confirmed" },
  sending: { icon: Clock, color: "#D97706", bg: "#FEF3C7", label: "Sending" },
  partially_paid: { icon: AlertCircle, color: "#D97706", bg: "#FEF3C7", label: "Partial" },
  waiting: { icon: Clock, color: "#6B7280", bg: "#F3F4F6", label: "Waiting" },
  failed: { icon: XCircle, color: "#DC2626", bg: "#FEE2E2", label: "Failed" },
  expired: { icon: XCircle, color: "#9CA3AF", bg: "#F3F4F6", label: "Expired" },
  refunded: { icon: ArrowUpRight, color: "#6366F1", bg: "#EEF2FF", label: "Refunded" },
};

const CRYPTO_ICONS: Record<string, string> = {
  btc: "₿",
  eth: "Ξ",
  ltc: "Ł",
  usdt: "₮",
  usdc: "$",
  sol: "◎",
  doge: "Ð",
  xrp: "✕",
  bnb: "◆",
  trx: "◊",
};

export default function AdminCryptoWallet() {
  const [payments, setPayments] = useState<CryptoPayment[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "completed" | "pending">("all");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { createClient } = await import("@/lib/supabase");
      const { data: { session } } = await createClient().auth.getSession();
      
      const res = await fetch("/api/admin/crypto", {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setBalances(data.balances || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch crypto data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredPayments = payments.filter(p => {
    if (tab === "completed") return ["finished", "confirmed"].includes(p.payment_status);
    if (tab === "pending") return ["waiting", "sending", "partially_paid"].includes(p.payment_status);
    return true;
  });

  const totalUsdValue = balances.reduce((sum, b) => sum + b.usd_value, 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crypto Wallet</h1>
            <p className="text-sm text-gray-500">NOWPayments transaktioner og balance</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Opdater
          </button>
        </div>

        {/* Wallet Balances */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Balance</p>
              <p className="text-3xl font-bold">${totalUsdValue.toFixed(2)}</p>
            </div>
          </div>
          
          {balances.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {balances.map(b => (
                <div key={b.currency} className="bg-white/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CRYPTO_ICONS[b.currency.toLowerCase()] || "●"}</span>
                    <span className="text-sm font-medium uppercase">{b.currency}</span>
                  </div>
                  <p className="text-white/80 text-sm">{b.balance.toFixed(8)}</p>
                  <p className="text-white/50 text-xs">${b.usd_value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft size={16} className="text-green-600" />
              <p className="text-xs text-gray-500">Modtaget (Total)</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats?.total_received.toFixed(2) || "0.00"}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-blue-600" />
              <p className="text-xs text-gray-500">Denne måned</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats?.completed_this_month.toFixed(2) || "0.00"}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-xs text-gray-500">Transaktioner</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.total_transactions || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-amber-600" />
              <p className="text-xs text-gray-500">Afventer</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.pending_transactions || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "completed", "pending"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t 
                  ? "bg-gray-900 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "all" ? "Alle" : t === "completed" ? "Gennemført" : "Afventer"}
              <span className="ml-2 text-xs opacity-70">
                {t === "all" ? payments.length : 
                 t === "completed" ? payments.filter(p => ["finished", "confirmed"].includes(p.payment_status)).length :
                 payments.filter(p => ["waiting", "sending", "partially_paid"].includes(p.payment_status)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              Ingen crypto transaktioner endnu
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["PROFIL", "TYPE", "BELØB", "CRYPTO", "STATUS", "PAYMENT ID", "DATO"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.map(p => {
                  const status = STATUS_CONFIG[p.payment_status] || STATUS_CONFIG.waiting;
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Profile */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.profile_image ? (
                              <Image
                                src={p.profile_image}
                                alt=""
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                {p.listing_name?.[0] || "?"}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                            {p.listing_name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {p.payment_type === "plan" ? "Abonnement" : 
                           p.payment_type === "coins" ? "Coins" : 
                           p.payment_type === "push" ? "Push Points" : p.payment_type}
                        </span>
                      </td>
                      
                      {/* Amount USD */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">${p.price_amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{p.price_currency}</p>
                      </td>
                      
                      {/* Crypto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{CRYPTO_ICONS[p.pay_currency.toLowerCase()] || "●"}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.actually_paid || p.pay_amount}</p>
                            <p className="text-xs text-gray-400 uppercase">{p.pay_currency}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span 
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                          style={{ background: status.bg, color: status.color }}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      
                      {/* Payment ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-gray-500 font-mono truncate max-w-[100px]">
                            {p.payment_id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(p.payment_id, p.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copied === p.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                          <a
                            href={`https://nowpayments.io/payment/${p.payment_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                      
                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString("da-DK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
