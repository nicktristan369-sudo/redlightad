"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { Coins, TrendingUp, ShoppingBag, ArrowDownToLine } from "lucide-react";
import { COIN_SELL_RATE } from "@/lib/coinPackages";

interface CoinPurchase {
  id: string;
  user_id: string;
  coins_amount: number;
  price_usd: number;
  stripe_payment_id: string | null;
  created_at: string;
  buyer_email?: string;
}

interface ContentPurchase {
  id: string;
  buyer_id: string;
  content_id: string;
  coins_paid: number;
  created_at: string;
  buyer_email?: string;
  content_title?: string;
}

interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  item_id: string;
  coins_paid: number;
  created_at: string;
  buyer_email?: string;
  item_title?: string;
}

type ActiveTab = "purchases" | "content" | "marketplace";
const PAGE_SIZE = 25;

export default function AdminRedCoinsPage() {
  const [coinPurchases, setCoinPurchases] = useState<CoinPurchase[]>([]);
  const [contentPurchases, setContentPurchases] = useState<ContentPurchase[]>([]);
  const [marketplacePurchases, setMarketplacePurchases] = useState<MarketplacePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ActiveTab>("purchases");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [
        { data: cp },
        { data: ct },
        { data: mp },
      ] = await Promise.all([
        supabase
          .from("coin_purchases")
          .select("*, profiles(email)")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_purchases")
          .select("*, buyer:profiles!buyer_id(email), locked_content(title)")
          .order("created_at", { ascending: false }),
        supabase
          .from("marketplace_purchases")
          .select("*, buyer:profiles!buyer_id(email), marketplace_items(title)")
          .order("created_at", { ascending: false }),
      ]);

      setCoinPurchases((cp ?? []).map((d: Record<string, unknown>) => ({
        ...d,
        buyer_email: (d.profiles as Record<string, unknown> | null)?.email as string ?? undefined,
      })) as CoinPurchase[]);

      setContentPurchases((ct ?? []).map((d: Record<string, unknown>) => ({
        ...d,
        buyer_email: (d.buyer as Record<string, unknown> | null)?.email as string ?? undefined,
        content_title: (d.locked_content as Record<string, unknown> | null)?.title as string ?? undefined,
      })) as ContentPurchase[]);

      setMarketplacePurchases((mp ?? []).map((d: Record<string, unknown>) => ({
        ...d,
        buyer_email: (d.buyer as Record<string, unknown> | null)?.email as string ?? undefined,
        item_title: (d.marketplace_items as Record<string, unknown> | null)?.title as string ?? undefined,
      })) as MarketplacePurchase[]);

      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => { setPage(1); }, [tab]);

  // Stats
  const totalCoinsSold = coinPurchases.reduce((s, c) => s + c.coins_amount, 0);
  const totalRevenue = coinPurchases.reduce((s, c) => s + Number(c.price_usd), 0);
  const totalContentCoins = contentPurchases.reduce((s, c) => s + c.coins_paid, 0);
  const totalMarketplaceCoins = marketplacePurchases.reduce((s, c) => s + c.coins_paid, 0);

  const TABS: { key: ActiveTab; label: string; count: number }[] = [
    { key: "purchases",  label: "Coin Purchases",       count: coinPurchases.length },
    { key: "content",    label: "Content Purchases",    count: contentPurchases.length },
    { key: "marketplace",label: "Marketplace Purchases",count: marketplacePurchases.length },
  ];

  const activePaged = (() => {
    const arr = tab === "purchases" ? coinPurchases : tab === "content" ? contentPurchases : marketplacePurchases;
    const start = (page - 1) * PAGE_SIZE;
    return { arr, paged: arr.slice(start, start + PAGE_SIZE), pages: Math.max(1, Math.ceil(arr.length / PAGE_SIZE)) };
  })();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">RedCoins</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Coin economy overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Coins Sold",        value: totalCoinsSold.toLocaleString(),             Icon: Coins,          accent: false },
          { label: "Revenue (coins)",   value: `$${totalRevenue.toFixed(2)}`,                Icon: TrendingUp,     accent: false },
          { label: "Content Coins Out", value: totalContentCoins.toLocaleString(),           Icon: ShoppingBag,    accent: false },
          { label: "Marketplace Coins", value: totalMarketplaceCoins.toLocaleString(),       Icon: ArrowDownToLine,accent: false },
        ].map(({ label, value, Icon, accent }) => (
          <div key={label} className="bg-white p-5 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accent ? "rgba(204,0,0,0.08)" : "#F5F5F5" }}>
                <Icon size={15} color={accent ? "#CC0000" : "#6B7280"} />
              </div>
            </div>
            <p className="text-[26px] font-bold text-gray-900 leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-lg w-fit mb-5" style={{ background: "#F3F4F6" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
            style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#111" : "#6B7280" }}>
            {t.label}
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: "#F3F4F6", color: "#6B7280" }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : activePaged.paged.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-gray-400">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            {tab === "purchases" && (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {["User", "Coins", "USD Paid", "Stripe ID", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activePaged.paged as CoinPurchase[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[200px] truncate">
                        {r.buyer_email ?? r.user_id.slice(0, 12) + "…"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold" style={{ color: "#CC0000" }}>
                          +{r.coins_amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-gray-900">${Number(r.price_usd).toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-400 max-w-[140px] truncate">{r.stripe_payment_id ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "content" && (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {["Buyer", "Content", "Coins Paid", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activePaged.paged as ContentPurchase[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[180px] truncate">{r.buyer_email ?? r.buyer_id.slice(0,12)+"…"}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[180px] truncate">{r.content_title ?? r.content_id.slice(0,12)+"…"}</td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: "#CC0000" }}>{r.coins_paid}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "marketplace" && (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    {["Buyer", "Item", "Coins Paid", "USD Value", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activePaged.paged as MarketplacePurchase[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[180px] truncate">{r.buyer_email ?? r.buyer_id.slice(0,12)+"…"}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-[180px] truncate">{r.item_title ?? r.item_id.slice(0,12)+"…"}</td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: "#CC0000" }}>{r.coins_paid}</td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">${(r.coins_paid * COIN_SELL_RATE).toFixed(2)}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activePaged.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[12px] text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, activePaged.arr.length)} of {activePaged.arr.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: activePaged.pages }, (_, i) => i + 1).map(n => (
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
