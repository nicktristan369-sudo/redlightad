"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, MessageSquare, User } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  authRequired?: boolean;
  customerHref?: string;
  providerHref?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/kunde/favoritter", icon: Heart, label: "Favorites", authRequired: true, customerHref: "/kunde/favoritter", providerHref: "/dashboard" },
  { href: "/kunde/beskeder", icon: MessageSquare, label: "Messages", authRequired: true, customerHref: "/kunde/beskeder", providerHref: "/dashboard/beskeder" },
  { href: "/kunde", icon: User, label: "Profile", authRequired: true, customerHref: "/kunde", providerHref: "/dashboard" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ accountType: "customer" | "provider" | null } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        const accountType = (authUser.user_metadata?.account_type as "customer" | "provider") ?? null;
        setUser({ accountType });

        // Get unread message count
        if (accountType === "provider") {
          supabase
            .from("conversations")
            .select("provider_unread")
            .eq("provider_id", authUser.id)
            .then(({ data }) => {
              const total = (data || []).reduce((sum, c) => sum + (c.provider_unread || 0), 0);
              setUnreadCount(total);
            });
        } else {
          supabase
            .from("conversations")
            .select("customer_unread")
            .eq("customer_id", authUser.id)
            .then(({ data }) => {
              const total = (data || []).reduce((sum, c) => sum + (c.customer_unread || 0), 0);
              setUnreadCount(total);
            });
        }
      }
    });
  }, []);

  const getHref = (item: NavItem) => {
    if (!item.authRequired) return item.href;
    if (!user) return "/login";
    if (user.accountType === "provider" && item.providerHref) return item.providerHref;
    if (user.accountType === "customer" && item.customerHref) return item.customerHref;
    return item.href;
  };

  const isActive = (item: NavItem) => {
    const href = getHref(item);
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Don't show on dashboard/admin pages (they have their own nav)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/kunde")) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const href = getHref(item);
            const active = isActive(item);
            const isMessages = item.label === "Messages";

            return (
              <Link
                key={item.label}
                href={href}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? "text-red-600 dark:text-red-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  
                  {/* Unread badge for messages */}
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx global>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </>
  );
}
