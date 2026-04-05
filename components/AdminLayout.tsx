"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, ShoppingBag, Users, BadgeCheck, UserPlus,
  CreditCard, Coins, ArrowDownToLine, Mail, MessageCircle,
  Megaphone, BarChart2, BookUser, Settings, LogOut, ChevronRight,
  ShieldCheck, Menu, X, Link2,
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

function SidebarLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
      style={{
        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
        color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
        borderLeft: isActive ? "2px solid #CC0000" : "2px solid transparent",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "rgba(255,255,255,0.85)";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }
      }}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "#CC0000", color: "#fff" }}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

// Shared nav content — used in both sidebar and mobile drawer
function NavContent({
  sections,
  isActive,
  onSignOut,
  onClose,
}: {
  sections: NavSection[];
  isActive: (href: string) => boolean;
  onSignOut: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div
        className="px-4 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="block" onClick={onClose}>
          <span
            style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#CC0000" }}>RED</span>
            <span style={{ color: "#fff" }}>LIGHTAD</span>
          </span>
          <div
            className="inline-block mt-2 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: "rgba(204,0,0,0.2)", color: "#CC0000" }}
          >
            Admin
          </div>
        </Link>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg md:hidden transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p
                className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div
        className="px-3 pb-4"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "12px",
        }}
      >
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={15} className="flex-shrink-0" />
          Log out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
  pendingListings = 0,
  pendingMarketplace = 0,
}: {
  children: React.ReactNode;
  pendingListings?: number;
  pendingMarketplace?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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
    await fetch("/api/admin/auth/logout", { method: "POST" });
    await createClient().auth.signOut();
    router.replace("/admin/login");
  };

  const SECTIONS: NavSection[] = [
    {
      title: "CONTENT",
      items: [
        { href: "/admin",                label: "Overview",         icon: LayoutDashboard },
        { href: "/admin/annoncer",        label: "Profiles",        icon: FileText,    badge: pendingListings },
        { href: "/admin/create-profile",  label: "Create Profile",  icon: UserPlus },
        { href: "/admin/marketplace",     label: "Marketplace",     icon: ShoppingBag, badge: pendingMarketplace },
        { href: "/admin/brugere",         label: "Users",           icon: Users },
      ],
    },
    {
      title: "VERIFICATION",
      items: [
        { href: "/admin/verification",    label: "Verification",    icon: BadgeCheck },
      ],
    },
    {
      title: "BUSINESS",
      items: [
        { href: "/admin/payments",     label: "Payments",    icon: CreditCard },
        { href: "/admin/redcoins",     label: "RedCoins",    icon: Coins },
        { href: "/admin/udbetalinger", label: "Payouts",     icon: ArrowDownToLine },
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
        { href: "/admin/invites",    label: "Invites",     icon: Link2 },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { href: "/admin/audit",          label: "Audit Log", icon: ShieldCheck },
        { href: "/admin/indstillinger",  label: "Settings",  icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Current page label for mobile topbar breadcrumb
  const currentLabel = (() => {
    for (const s of SECTIONS) {
      for (const item of s.items) {
        if (isActive(item.href)) return item.label;
      }
    }
    return "Admin";
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-56 flex-col fixed h-full z-10"
        style={{ background: "#0A0A0A", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <NavContent
          sections={SECTIONS}
          isActive={isActive}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col md:hidden"
        style={{
          width: "280px",
          background: "#0A0A0A",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <NavContent
          sections={SECTIONS}
          isActive={isActive}
          onSignOut={handleSignOut}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main ── */}
      <main
        className="flex-1 ml-0 md:ml-56 min-h-screen"
        style={{ background: "#F8F8F8" }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 md:px-6 py-3"
          style={{ borderBottom: "1px solid #E5E5E5" }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F5F5F5")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-gray-400">
              <Link href="/admin" className="hover:text-gray-900 transition-colors hidden md:inline">
                Admin
              </Link>
              <span className="md:hidden text-[14px] font-semibold text-gray-900">
                {currentLabel}
              </span>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight size={12} className="hidden md:inline" />
                  <span className="text-gray-900 capitalize font-medium hidden md:inline">
                    {pathname.split("/admin/")[1]?.split("/")[0] ?? ""}
                  </span>
                </>
              )}
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            View site ↗
          </Link>
        </div>

        {/* Content — add bottom padding on mobile for safe area */}
        <div className="p-4 md:p-8 pb-6">{children}</div>
      </main>
    </div>
  );
}
