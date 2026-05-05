"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase";
import { 
  Eye, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AnalyticsData {
  totalViews: number;
  totalMessages: number;
  totalConversations: number;
  viewsChange: number;
  messagesChange: number;
  listings: {
    id: string;
    title: string;
    profile_image: string | null;
    status: string;
    premium_tier: string | null;
    views: number;
    conversations: number;
  }[];
  viewsByDay: { date: string; count: number }[];
  messagesByDay: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please log in");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/provider/analytics?days=${days}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const analytics = await res.json();
        setData(analytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon,
    color = "red"
  }: { 
    title: string; 
    value: number; 
    change?: number;
    icon: typeof Eye;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {value.toLocaleString()}
          </p>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${change > 0 ? "text-green-600" : "text-red-600"}`}>
              {change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>{Math.abs(change)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color === "red" ? "bg-red-50" : color === "blue" ? "bg-blue-50" : "bg-green-50"}`}>
          <Icon size={24} className={color === "red" ? "text-red-600" : color === "blue" ? "text-blue-600" : "text-green-600"} />
        </div>
      </div>
    </div>
  );

  const SimpleChart = ({ 
    data: chartData, 
    color = "#DC2626",
    label 
  }: { 
    data: { date: string; count: number }[];
    color?: string;
    label: string;
  }) => {
    const maxValue = Math.max(...chartData.map(d => d.count), 1);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
        <div className="flex items-end gap-1 h-32">
          {chartData.slice(-14).map((d, i) => (
            <div key={d.date} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{ 
                  height: `${(d.count / maxValue) * 100}%`,
                  minHeight: d.count > 0 ? 4 : 0,
                  background: color,
                }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{chartData.slice(-14)[0]?.date.slice(5)}</span>
          <span>{chartData.slice(-1)[0]?.date.slice(5)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-red-600" />
              Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your profile performance
            </p>
          </div>
          
          {/* Period selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  days === d 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Profile Views" 
            value={data.totalViews} 
            change={data.viewsChange}
            icon={Eye} 
            color="red"
          />
          <StatCard 
            title="Messages Received" 
            value={data.totalMessages} 
            change={data.messagesChange}
            icon={MessageSquare} 
            color="blue"
          />
          <StatCard 
            title="New Conversations" 
            value={data.totalConversations} 
            icon={Users} 
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SimpleChart 
            data={data.viewsByDay} 
            color="#DC2626" 
            label="Daily Views"
          />
          <SimpleChart 
            data={data.messagesByDay} 
            color="#2563EB" 
            label="Daily Messages"
          />
        </div>

        {/* Per-listing breakdown */}
        {data.listings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Performance by Listing</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/profile/${listing.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {listing.profile_image ? (
                      <Image
                        src={listing.profile_image}
                        alt={listing.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">
                          {listing.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        listing.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {listing.status}
                      </span>
                      {listing.premium_tier && listing.premium_tier !== "basic" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          listing.premium_tier === "vip"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {listing.premium_tier.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{listing.views}</p>
                      <p className="text-gray-500 text-xs">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{listing.conversations}</p>
                      <p className="text-gray-500 text-xs">Chats</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.listings.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No listings yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a listing to start tracking your analytics
            </p>
            <Link
              href="/opret-annonce"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
