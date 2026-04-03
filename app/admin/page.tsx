"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  Users, FileText, DollarSign, Coins,
  TrendingUp, Clock, UserPlus, CreditCard, ArrowDownToLine, ShoppingBag,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Metrics {
  totalUsers: number;
  newUsersToday: number;
  activeListings: number;
  pendingListings: number;
  pendingMarketplace: number;
  totalRevenue: number;
  revenueThisMonth: number;
  coinsSoldTotal: number;
  pendingPayouts: number;
}

interface OutreachStats {
  total: number;
  pending: number;
  smsSent: number;
  clicked: number;
  converted: number;
}

interface Activity {
  href?: string;
  id: string;
  type: "listing" | "user" | "payment" | "payout" | "marketplace";
  text: string;
  time: string;
  status?: string;
}

interface ChartDay {
  date: string;
  visitors: number;
  registrations: number;
}

const ACTIVITY_ICONS = {
  listing:     <FileText size={14} color="#6B7280" />,
  user:        <UserPlus size={14} color="#6B7280" />,
  payment:     <CreditCard size={14} color="#6B7280" />,
  payout:      <ArrowDownToLine size={14} color="#6B7280" />,
  marketplace: <ShoppingBag size={14} color="#CC0000" />,
};

function MetricCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: accent ? "rgba(204,0,0,0.08)" : "#F5F5F5" }}>
          <Icon size={16} color={accent ? "#CC0000" : "#6B7280"} />
        </div>
      </div>
      <p className="text-[28px] font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-[12px] mt-1.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

/** Build a map of last 30 dates (YYYY-MM-DD) → { visitors: 0, registrations: 0 } */
function emptyDayMap(): Map<string, { visitors: number; registrations: number }> {
  const m = new Map();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    m.set(key, { visitors: 0, registrations: 0 });
  }
  return m;
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, newUsersToday: 0, activeListings: 0, pendingListings: 0,
    pendingMarketplace: 0, totalRevenue: 0, revenueThisMonth: 0,
    coinsSoldTotal: 0, pendingPayouts: 0,
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [outreach, setOutreach] = useState<OutreachStats>({ total: 0, pending: 0, smsSent: 0, clicked: 0, converted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: activeListings },
        { count: pendingListings },
        { count: pendingMarketplace },
        { data: coinData },
        { count: pendingPayouts },
        { data: recentListings },
        { data: recentUsers },
        { data: recentMarketplace },
        { data: pageViewRows },
        { data: regRows },
        { data: recentKyc },
        { data: outreachStats },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("marketplace_items").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("coin_transactions").select("amount").eq("type", "purchase"),
        supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("listings").select("title, city, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("full_name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("marketplace_items").select("title, category, created_at, status, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
        // Traffic: distinct sessions per day from page_views
        supabase.from("page_views").select("created_at, session_id").gte("created_at", thirtyDaysAgo),
        // Registrations per day from profiles
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo),
        // KYC submissions for activity feed
        supabase.from("kyc_submissions").select("full_name, status, submitted_at").order("submitted_at", { ascending: false }).limit(5),
        // Outreach stats
        supabase.from("scraped_phones").select("sms_status"),
      ]);

      // --- Build chart data ---
      const dayMap = emptyDayMap();

      // Count distinct sessions per day
      if (pageViewRows) {
        const sessionsByDay = new Map<string, Set<string>>();
        for (const row of pageViewRows) {
          const day = row.created_at.split("T")[0];
          if (!sessionsByDay.has(day)) sessionsByDay.set(day, new Set());
          if (row.session_id) sessionsByDay.get(day)!.add(row.session_id);
        }
        for (const [day, sessions] of sessionsByDay) {
          const entry = dayMap.get(day);
          if (entry) entry.visitors = sessions.size;
        }
      }

      // Count registrations per day
      if (regRows) {
        for (const row of regRows) {
          const day = row.created_at.split("T")[0];
          const entry = dayMap.get(day);
          if (entry) entry.registrations++;
        }
      }

      const chart: ChartDay[] = [];
      for (const [key, val] of dayMap) {
        const d = new Date(key + "T00:00:00");
        chart.push({
          date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
          visitors: val.visitors,
          registrations: val.registrations,
        });
      }
      setChartData(chart);

      // --- Metrics ---
      const coinsSoldTotal = (coinData ?? []).reduce((sum: number, t: { amount: number }) => sum + Math.abs(t.amount), 0);

      setMetrics({
        totalUsers: totalUsers ?? 0,
        newUsersToday: newUsersToday ?? 0,
        activeListings: activeListings ?? 0,
        pendingListings: pendingListings ?? 0,
        pendingMarketplace: pendingMarketplace ?? 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        coinsSoldTotal,
        pendingPayouts: pendingPayouts ?? 0,
      });

      // --- Build activity feed ---
      const acts: Activity[] = [];
      (recentListings ?? []).forEach((l: { title: string; city: string; created_at: string; status: string }) => {
        acts.push({
          id: l.created_at,
          type: "listing",
          text: `${l.status === "pending" ? "New listing pending" : "Listing active"} — ${l.title}${l.city ? `, ${l.city}` : ""}`,
          time: new Date(l.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          href: l.status === "pending" ? "/admin/annoncer?tab=pending" : "/admin/annoncer",
        });
      });
      (recentUsers ?? []).forEach((u: { full_name: string; created_at: string }) => {
        acts.push({
          id: u.created_at + "u",
          type: "user",
          text: `New user registered — ${u.full_name ?? "Anonymous"}`,
          time: new Date(u.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          href: "/admin/brugere",
        });
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recentMarketplace ?? []).forEach((m: any) => {
        acts.push({
          id: m.created_at + "m",
          type: "marketplace",
          status: m.status,
          text: `${m.status === "pending" ? "Pending review" : m.status === "approved" ? "Approved" : "Rejected"} — Marketplace: ${m.title}${m.profiles?.full_name ? ` by ${m.profiles.full_name}` : ""}`,
          time: new Date(m.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          href: "/admin/marketplace",
        });
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recentKyc ?? []).forEach((k: any) => {
        acts.push({
          id: (k.submitted_at || k.created_at) + "k",
          type: "user",
          text: `KYC ${k.status === "pending" ? "submitted" : k.status} — ${k.full_name ?? "Unknown"}`,
          time: new Date(k.submitted_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          href: "/admin/kyc",
        });
      });
      acts.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
      setActivity(acts.slice(0, 12));

      // --- Outreach stats ---
      const oTotal = outreachStats?.length || 0;
      const oPending = outreachStats?.filter((r: { sms_status: string }) => r.sms_status === 'pending').length || 0;
      const oSent = outreachStats?.filter((r: { sms_status: string }) => r.sms_status === 'sent').length || 0;
      const oClicked = outreachStats?.filter((r: { sms_status: string }) => r.sms_status === 'clicked').length || 0;
      const oConverted = outreachStats?.filter((r: { sms_status: string }) => r.sms_status === 'converted').length || 0;
      setOutreach({ total: oTotal, pending: oPending, smsSent: oSent, clicked: oClicked, converted: oConverted });

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout pendingListings={metrics.pendingListings} pendingMarketplace={metrics.pendingMarketplace}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-gray-900">Overview</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Platform health at a glance</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Users"       value={metrics.totalUsers.toLocaleString()}   sub={`+${metrics.newUsersToday} today`}        icon={Users} />
        <MetricCard label="Active Listings"   value={metrics.activeListings.toLocaleString()} sub={`${metrics.pendingListings} pending review`} icon={FileText} accent={metrics.pendingListings > 0} />
        <MetricCard label="Revenue (month)"   value={`$${metrics.revenueThisMonth.toFixed(2)}`} sub={`$${metrics.totalRevenue.toFixed(2)} total`} icon={DollarSign} />
        <MetricCard label="Coins Sold"        value={metrics.coinsSoldTotal.toLocaleString()} sub={`${metrics.pendingPayouts} payout${metrics.pendingPayouts !== 1 ? "s" : ""} pending`} icon={Coins} accent={metrics.pendingPayouts > 0} />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Traffic & Registrations</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Last 30 days</p>
            </div>
            <TrendingUp size={16} color="#9CA3AF" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CC0000" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#CC0000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: "#111" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="visitors" stroke="#000" strokeWidth={1.5} fill="url(#gVisitors)" name="Visitors" dot={false} />
              <Area type="monotone" dataKey="registrations" stroke="#CC0000" strokeWidth={1.5} fill="url(#gReg)" name="Registrations" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-[13px] text-gray-400">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activity.map(a => {
                const inner = (
                  <>
                    <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: a.type === "marketplace" ? "rgba(204,0,0,0.08)" : "#F5F5F5" }}>
                      {ACTIVITY_ICONS[a.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] leading-snug ${a.type === "marketplace" && a.status === "pending" ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {a.text}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} color="#9CA3AF" />
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{a.time}</span>
                        {a.href && <span className="text-[11px] text-red-500 ml-1">→ Review</span>}
                      </div>
                    </div>
                  </>
                );
                return a.href ? (
                  <Link key={a.id} href={a.href}
                    className="flex items-start gap-3 -mx-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    {inner}
                  </Link>
                ) : (
                  <div key={a.id} className="flex items-start gap-3">{inner}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Outreach widget */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900">Outreach</h3>
            <a href="/admin/phonebook?tab=scraper" className="text-[12px] text-gray-400 hover:text-gray-700">Se alle &rarr;</a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[22px] font-bold text-gray-900">{outreach.total}</p><p className="text-[11px] text-gray-400">Scraped</p></div>
            <div><p className="text-[22px] font-bold text-blue-600">{outreach.smsSent}</p><p className="text-[11px] text-gray-400">SMS sendt</p></div>
            <div><p className="text-[22px] font-bold text-purple-600">{outreach.clicked}</p><p className="text-[11px] text-gray-400">Klikket</p></div>
            <div><p className="text-[22px] font-bold text-green-600">{outreach.converted}</p><p className="text-[11px] text-gray-400">Oprettet</p></div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/annoncer", label: "Review Listings", badge: metrics.pendingListings, color: "#CC0000" },
          { href: "/admin/marketplace", label: "Review Marketplace", badge: metrics.pendingMarketplace, color: "#CC0000" },
          { href: "/admin/udbetalinger", label: "Process Payouts", badge: metrics.pendingPayouts, color: "#C9A84C" },
          { href: "/admin/brugere", label: "Manage Users", badge: null, color: null },
        ].map(q => (
          <a key={q.href} href={q.href}
            className="flex items-center justify-between bg-white px-4 py-3 rounded-xl transition-shadow hover:shadow-sm"
            style={{ border: "1px solid #E5E5E5" }}>
            <span className="text-[13px] font-medium text-gray-900">{q.label}</span>
            {q.badge != null && q.badge > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: q.color ?? "#000" }}>
                {q.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </AdminLayout>
  );
}
