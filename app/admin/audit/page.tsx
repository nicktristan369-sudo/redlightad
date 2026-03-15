"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@supabase/supabase-js";
import { Shield, LogIn, LogOut, AlertTriangle, Ban, Clock } from "lucide-react";

interface AuditEntry {
  id: string;
  user_id: string | null;
  email: string | null;
  ip: string | null;
  user_agent: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  login_success:    { label: "Login",        bg: "#DCFCE7", color: "#14532D", Icon: LogIn },
  login_failed:     { label: "Failed",       bg: "#FEE2E2", color: "#7F1D1D", Icon: AlertTriangle },
  login_blocked:    { label: "Blocked",      bg: "#FEF3C7", color: "#78350F", Icon: Ban },
  login_unauthorized: { label: "Unauth",     bg: "#FEE2E2", color: "#7F1D1D", Icon: Ban },
  logout:           { label: "Logout",       bg: "#F3F4F6", color: "#374151", Icon: LogOut },
  session_expired:  { label: "Expired",      bg: "#EFF6FF", color: "#1E40AF", Icon: Clock },
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    db.from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setEntries(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3">
        <Shield size={20} color="#6B7280" />
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Audit Log</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Admin access history — last 200 events</p>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-gray-400">No audit events yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                {["Time", "Action", "Email", "IP", "Detail"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const style = ACTION_STYLES[e.action] ?? { label: e.action, bg: "#F3F4F6", color: "#6B7280", Icon: Shield };
                const { Icon } = style;
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: style.bg, color: style.color }}>
                        <Icon size={10} />
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-700 font-mono">{e.email ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 font-mono">{e.ip ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-400 truncate max-w-[200px]">{e.detail ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
