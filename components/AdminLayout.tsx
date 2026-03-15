"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, ShoppingBag, Users, BadgeCheck,
  CreditCard, Coins, ArrowDownToLine, Mail, MessageCircle,
  Megaphone, BarChart2, BookUser, Settings, LogOut, ChevronRight,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number | null;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group"
      style={{
        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
        color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
        borderLeft: isActive ? "2px solid #CC0000" : "2px solid transparent",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "#CC0000", color: "#fff" }}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

export default function AdminLayout({ children, pendingListings = 0, pendingMarketplace = 0 }: {
  children: React.ReactNode;
  pendingListings?: number;
  pendingMarketplace?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.rpc("get_my_admin_status");
      if (!data) { router.replace("/dashboard"); return; }
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const SECTIONS: NavSection[] = [
    {
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
      ],
    },
    {
      title: "CONTENT",
      items: [
        { href: "/admin/annoncer",    label: "Listings",     icon: FileText,     badge: pendingListings },
        { href: "/admin/marketplace", label: "Marketplace",  icon: ShoppingBag,  badge: pendingMarketplace },
        { href: "/admin/brugere",     label: "Users",        icon: Users },
        { href: "/admin/verification",label: "Verification", icon: BadgeCheck },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        { href: "/admin/payments",    label: "Payments",    icon: CreditCard },
        { href: "/admin/redcoins",    label: "RedCoins",    icon: Coins },
        { href: "/admin/udbetalinger",label: "Payouts",     icon: ArrowDownToLine },
      ],
    },
    {
      title: "COMMUNICATIONS",
      items: [
        { href: "/admin/inbox",       label: "Inbox",       icon: Mail },
        { href: "/admin/sms",         label: "SMS Center",  icon: MessageCircle },
        { href: "/admin/broadcasts",  label: "Broadcasts",  icon: Megaphone },
      ],
    },
    {
      title: "DATA",
      items: [
        { href: "/admin/statistics",  label: "Statistics",  icon: BarChart2 },
        { href: "/admin/phonebook",   label: "Phonebook",   icon: BookUser },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { href: "/admin/indstillinger", label: "Settings",  icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Dark sidebar ── */}
      <aside className="hidden md:flex w-56 flex-col fixed h-full z-10"
        style={{ background: "#0A0A0A", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" className="block">
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.03em", lineHeight: 1 }}>
              <span style={{ color: "#CC0000" }}>RED</span>
              <span style={{ color: "#fff" }}>LIGHTAD</span>
            </span>
          </Link>
          <span className="inline-block mt-2 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: "rgba(204,0,0,0.2)", color: "#CC0000" }}>
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {SECTIONS.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest"
                  style={{ color: "rgba(255,255,255,0.25)" }}>
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <SidebarLink key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={15} className="flex-shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-0 md:ml-56 min-h-screen" style={{ background: "#F8F8F8" }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-3"
          style={{ borderBottom: "1px solid #E5E5E5" }}>
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">Admin</Link>
            {pathname !== "/admin" && (
              <>
                <ChevronRight size={12} />
                <span className="text-gray-900 capitalize font-medium">
                  {pathname.split("/admin/")[1]?.split("/")[0] ?? ""}
                </span>
              </>
            )}
          </div>
          <Link href="/" target="_blank"
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            View site ↗
          </Link>
        </div>

        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
