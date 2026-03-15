"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, FileText, Coins, DollarSign, TrendingUp } from "lucide-react";

type Range = "7d" | "30d" | "90d" | "12m";

interface DayStat { date: string; users: number; listings: number; coins: number; }
interface CategoryStat { name: string; value: number; }
interface CountryStat { country: string; users: number; }

const PIE_COLORS = ["#000", "#CC0000", "#C9A84C", "#2563EB", "#6B7280", "#10B981", "#F59E0B"];

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

function pad2(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date, range: Range) {
  if (range === "12m") return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return `${pad2(d.getDate())} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
}

export default function AdminStatisticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [dayStats, setDayStats] = useState<DayStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
  const [totals, setTotals] = useState({ users: 0, listings: 0, activeListings: 0, coinsSold: 0, revenue: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const days = RANGE_DAYS[range];
      const since = new Date(); since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      const [
        { data: allUsers },
        { data: allListings },
        { count: activeListings },
        { data: coinData },
        { data: catData },
        { data: countryData },
      ] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", sinceISO),
        supabase.from("listings").select("created_at, status").gte("created_at", sinceISO),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("coin_purchases").select("coins_amount, price_usd, created_at").gte("created_at", sinceISO),
        supabase.from("listings").select("category").not("category", "is", null),
        supabase.from("profiles").select("country").not("country", "is", null),
      ]);

      // Totals
      const coinsSold = (coinData ?? []).reduce((s: number, c: { coins_amount: number }) => s + c.coins_amount, 0);
      const revenue   = (coinData ?? []).reduce((s: number, c: { price_usd: number }) => s + Number(c.price_usd), 0);

      setTotals({
        users: allUsers?.length ?? 0,
        listings: allListings?.length ?? 0,
        activeListings: activeListings ?? 0,
        coinsSold,
        revenue,
      });

      // Build day-by-day buckets
      const buckets: Record<string, DayStat> = {};
      const step = range === "12m" ? 30 : 1;
      for (let i = days; i >= 0; i -= step) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = fmtDate(d, range);
        buckets[key] = { date: key, users: 0, listings: 0, coins: 0 };
      }

      (allUsers ?? []).forEach((u: { created_at: string }) => {
        const key = fmtDate(new Date(u.created_at), range);
        if (buckets[key]) buckets[key].users++;
      });
      (allListings ?? []).forEach((l: { created_at: string }) => {
        const key = fmtDate(new Date(l.created_at), range);
        if (buckets[key]) buckets[key].listings++;
      });
      (coinData ?? []).forEach((c: { created_at: string; coins_amount: number }) => {
        const key = fmtDate(new Date(c.created_at), range);
        if (buckets[key]) buckets[key].coins += c.coins_amount;
      });

      setDayStats(Object.values(buckets));

      // Category distribution
      const catMap: Record<string, number> = {};
      (catData ?? []).forEach((l: { category: string }) => {
        catMap[l.category] = (catMap[l.category] ?? 0) + 1;
      });
      setCategoryStats(
        Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value }))
      );

      // Top countries
      const countryMap: Record<string, number> = {};
      (countryData ?? []).forEach((p: { country: string }) => {
        countryMap[p.country] = (countryMap[p.country] ?? 0) + 1;
      });
      setCountryStats(
        Object.entries(countryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([country, users]) => ({ country, users }))
      );

      setLoading(false);
    };
    load();
  }, [range]);

  const RANGES: Range[] = ["7d", "30d", "90d", "12m"];

  const MetricCard = ({ label, value, Icon, sub }: { label: string; value: string; Icon: React.ElementType; sub?: string }) => (
    <div className="bg-white p-5 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5F5F5" }}>
          <Icon size={15} color="#6B7280" />
        </div>
      </div>
      <p className="text-[26px] font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );

  return (
    <AdminLayout>
      {/* Header + range picker */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Statistics</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Platform growth and activity</p>
        </div>
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "#F3F4F6" }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors"
              style={{ background: range === r ? "#fff" : "transparent", color: range === r ? "#111" : "#6B7280" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="New Users"       value={totals.users.toLocaleString()}        Icon={Users}    sub={`in last ${range}`} />
            <MetricCard label="New Listings"    value={totals.listings.toLocaleString()}     Icon={FileText} sub={`in last ${range}`} />
            <MetricCard label="Active Listings" value={totals.activeListings.toLocaleString()} Icon={TrendingUp} />
            <MetricCard label="Coins Sold"      value={totals.coinsSold.toLocaleString()}    Icon={Coins}    sub={`in last ${range}`} />
            <MetricCard label="Revenue"         value={`$${totals.revenue.toFixed(2)}`}      Icon={DollarSign} sub={`in last ${range}`} />
          </div>

          {/* Growth chart */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-5">User & Listing Growth</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dayStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CC0000" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#CC0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
                  interval={dayStats.length > 14 ? Math.floor(dayStats.length / 7) : 0} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="users"    stroke="#000"    strokeWidth={1.5} fill="url(#gU)" name="Users"    dot={false} />
                <Area type="monotone" dataKey="listings" stroke="#CC0000" strokeWidth={1.5} fill="url(#gL)" name="Listings" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Coins chart */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Coin Sales</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
                  interval={dayStats.length > 14 ? Math.floor(dayStats.length / 7) : 0} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="coins" fill="#C9A84C" name="Coins Sold" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom: Category + Country */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category pie */}
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Listings by Category</h2>
              {categoryStats.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={categoryStats} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {categoryStats.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {categoryStats.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[12px] text-gray-700 flex-1 truncate capitalize">{c.name}</span>
                        <span className="text-[12px] font-semibold text-gray-900">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top countries */}
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-5">Top Countries</h2>
              {countryStats.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-8">No country data yet</p>
              ) : (
                <div className="space-y-2">
                  {countryStats.map((c, i) => {
                    const max = countryStats[0].users;
                    const pct = Math.round((c.users / max) * 100);
                    return (
                      <div key={c.country} className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold text-gray-400 w-4 text-right">{i + 1}</span>
                        <span className="text-[13px] text-gray-700 w-28 truncate">{c.country}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? "#000" : "#9CA3AF" }} />
                        </div>
                        <span className="text-[12px] font-semibold text-gray-900 w-8 text-right">{c.users}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
