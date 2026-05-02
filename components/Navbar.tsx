"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ChevronDown, MapPin, Globe, Bell, LogOut, MessageSquare, Home, Star, Zap, Play, ShoppingBag, Heart, Video, CircleDollarSign, LifeBuoy, ExternalLink } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase";
import CountrySelector from "@/components/CountrySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";


interface UserState {
  email: string;
  id: string;
  accountType: "provider" | "customer" | null;
  avatar: string | null;
  initials: string;
}

interface NavbarProps {
  variant?: "light" | "dark";
}

export default function Navbar({ variant = "light" }: NavbarProps) {
  const isDark = variant === "dark";
  const { t } = useLanguage();
  // Theme removed - always light mode
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<UserState | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentConversations, setRecentConversations] = useState<{ id: string; lastMessage: string; senderName: string; updatedAt: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; flag: string; name: string } | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [pushPoints, setPushPoints] = useState<number>(0);
  const [providerListingId, setProviderListingId] = useState<string | null>(null);
  const [quickPushing, setQuickPushing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    try {
      const code = localStorage.getItem("selected_country");
      if (code) {
        import("@/lib/countries").then(({ getCountry }) => {
          const c = getCountry(code);
          if (c) setSelectedCountry({ code: c.code, flag: c.flag, name: c.name });
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (authUser: { email?: string; id: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!authUser) { setUser(null); setCoinBalance(null); setUnreadMessages(0); return; }
      const accountType = (authUser.user_metadata?.account_type as "provider" | "customer") ?? null;
      const email = authUser.email || "";
      const initials = email.slice(0, 2).toUpperCase();

      // Hent profilbillede
      let avatar: string | null = null;
      if (accountType === "customer") {
        const { data } = await supabase.from("customer_profiles").select("avatar_url").eq("user_id", authUser.id).single();
        avatar = data?.avatar_url || null;
      } else {
        const { data } = await supabase.from("profiles").select("avatar_url").eq("id", authUser.id).single();
        avatar = data?.avatar_url || null;
        // Fallback: første listing profile_image + check active plan
        const { data: listing } = await supabase
          .from("listings")
          .select("id, profile_image, premium_tier")
          .eq("user_id", authUser.id)
          .limit(1)
          .single();
        if (!avatar) avatar = listing?.profile_image || null;
        setHasActivePlan(!!(listing?.premium_tier));
        if (listing) setProviderListingId((listing as any).id || null);
      }

      // Push points (provider only)
      if (accountType === "provider") {
        supabase.from("wallets").select("push_points").eq("user_id", authUser.id).single()
          .then(({ data }) => { if (data) setPushPoints(data.push_points ?? 0); });
      }

      setUser({ email, id: authUser.id, accountType, avatar, initials });

      // RedCoins balance
      supabase.from("wallets").select("balance").eq("user_id", authUser.id).single()
        .then(({ data }) => { if (data) setCoinBalance(data.balance); });

      // Ulæste beskeder - tjek conversations tabel
      const fetchUnread = async () => {
        try {
          // Check if user is provider (has listing)
          const { data: listing } = await supabase
            .from("listings")
            .select("id")
            .eq("user_id", authUser.id)
            .maybeSingle();
        
        const isProvider = !!listing;
        const unreadField = isProvider ? "provider_unread" : "customer_unread";
        const idField = isProvider ? "provider_id" : "customer_id";
        
        // Get conversations with unread count
        const { data: convs } = await supabase
          .from("conversations")
          .select(`id, last_message, last_message_at, ${unreadField}, customer_id, provider_id`)
          .eq(idField, authUser.id)
          .order("last_message_at", { ascending: false })
          .limit(5);
        
        const total = convs?.reduce((sum, c) => sum + ((c as Record<string, number>)[unreadField] || 0), 0) || 0;
        setUnreadMessages(total);
        
        // Set recent conversations for dropdown
        if (convs && convs.length > 0) {
          setRecentConversations(convs.map(c => ({
            id: c.id,
            lastMessage: c.last_message || "",
            senderName: "Ny besked",
            updatedAt: c.last_message_at || "",
          })));
        } else {
          setRecentConversations([]);
        }
        } catch (err) {
          console.error("[Navbar] fetchUnread error:", err);
        }
      };
      fetchUnread();

      // Subscribe to realtime message updates
      const channel = supabase
        .channel("navbar-messages")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "conversations",
        }, () => {
          // Refetch unread count when conversations change
          fetchUnread();
        })
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
        }, (payload) => {
          // Play notification sound for new messages not from me
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== authUser.id) {
            try {
              const audio = new Audio("/sounds/notification.mp3");
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
            fetchUnread();
          }
        })
        .subscribe();
      
      return channel;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let msgChannel: any = null;

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      msgChannel = await loadUser(u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (msgChannel) {
        await supabase.removeChannel(msgChannel);
      }
      msgChannel = await loadUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      if (msgChannel) {
        supabase.removeChannel(msgChannel).catch(() => {});
      }
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setCoinBalance(null);
    setUnreadMessages(0);
    setDrawerOpen(false);
    setShowUserMenu(false);
    router.push("/");
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleSearch = () => {
    if (navSearch.trim()) router.push(`/search?q=${encodeURIComponent(navSearch.trim())}`);
    else router.push("/search");
    setSearchOpen(false);
  };

  const dashboardHref = user?.accountType === "customer" ? "/kunde" : "/dashboard";

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/premium", label: "Premium", icon: Star },
    { href: "/available-now", label: "Available Now", icon: Zap },
    { href: "/videos", label: "Videos", icon: Play },
    { href: "/reviews", label: "Reviews", icon: MessageSquare },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/onlyfans", label: "OnlyFans", icon: ExternalLink },
    { href: "/cam", label: "RedLightCAM", icon: Video, isCam: true },
    { href: "/dashboard/buy-coins", label: "Red Coins", icon: CircleDollarSign, isRedCoins: true },
    { href: "/support", label: t.nav_support, icon: LifeBuoy },
  ];

  // Avatar component
  const Avatar = ({ size = 32 }: { size?: number }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user?.avatar ? "transparent" : "#DC2626",
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, border: "2px solid #fff",
      boxShadow: "0 0 0 1.5px #DC2626",
    }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.38, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{user?.initials}</span>
      }
    </div>
  );

  return (
    <>
      {showCountrySelector && (
        <CountrySelector
          forceOpen
          onClose={() => {
            setShowCountrySelector(false);
            try {
              const code = localStorage.getItem("selected_country");
              if (code) {
                import("@/lib/countries").then(({ getCountry }) => {
                  const c = getCountry(code);
                  if (c) setSelectedCountry({ code: c.code, flag: c.flag, name: c.name });
                });
              }
            } catch { /* ignore */ }
          }}
        />
      )}

      {/* ── Main navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, 
        backgroundColor: isDark ? "#000000" : "#ffffff",
        borderBottom: isDark ? "1px solid #333" : "1px solid #F3F3F3", 
        boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)", 
        height: "56px",
      }}>
      {/* Spacer for fixed navbar */}
      <style>{`body { padding-top: 0; }`}</style>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "56px", padding: "0 16px",
        }}>
          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0 }}>
            <Logo variant={isDark ? "dark" : "light"} height={28} />
          </Link>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>



            {/* Theme toggle removed */}

            {user ? (
              <>
                {/* Notifikationer / beskeder */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    style={{ position: "relative", padding: 8, borderRadius: 8, border: "none", background: showNotifications ? (isDark ? "#222" : "#F5F5F7") : "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? "#222" : "#F5F5F7"; }}
                    onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.background = "transparent"; }}>
                    <MessageSquare size={20} color={isDark ? "#fff" : "#374151"} />
                    {unreadMessages > 0 && (
                      <span style={{
                        position: "absolute", top: 4, right: 4,
                        minWidth: 16, height: 16, borderRadius: 8,
                        background: "#DC2626", color: "#fff",
                        fontSize: 9, fontWeight: 800, lineHeight: "16px", textAlign: "center",
                        paddingLeft: 3, paddingRight: 3,
                        border: "1.5px solid #fff",
                      }}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                    )}
                  </button>

                  {/* Besked-dropdown */}
                  {showNotifications && (
                    <>
                      <div onClick={() => setShowNotifications(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: "min(300px, calc(100vw - 32px))", background: "#fff", borderRadius: 14,
                        border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        zIndex: 50, overflow: "hidden",
                      }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Beskeder</span>
                          {unreadMessages > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>{unreadMessages} ulæste</span>}
                        </div>
                        <div style={{ maxHeight: 250, overflowY: "auto" }}>
                          {recentConversations.length > 0 ? (
                            recentConversations.map(conv => (
                              <Link
                                key={conv.id}
                                href={`${dashboardHref}/beskeder/${conv.id}`}
                                onClick={() => setShowNotifications(false)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "10px 16px",
                                  borderBottom: "1px solid #F3F4F6",
                                  textDecoration: "none",
                                  background: "#fff",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <MessageSquare size={16} color="#fff" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 12, color: "#111", margin: 0, fontWeight: 600 }}>{conv.senderName}</p>
                                  <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {conv.lastMessage.slice(0, 40)}{conv.lastMessage.length > 40 ? "..." : ""}
                                  </p>
                                </div>
                                <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0 }}>
                                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </Link>
                            ))
                          ) : (
                            <div style={{ padding: "24px 16px", textAlign: "center" }}>
                              <MessageSquare size={28} color="#E5E7EB" style={{ margin: "0 auto 8px" }} />
                              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Ingen nye beskeder</p>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "0 12px 12px" }}>
                          <Link href={`${dashboardHref}/beskeder`} onClick={() => setShowNotifications(false)}
                            style={{ display: "block", padding: "10px", background: "#000", color: "#fff", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                            Se alle beskeder
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Avatar → user menu */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", borderRadius: "50%" }}>
                    <Avatar size={32} />
                  </button>

                  {/* User dropdown */}
                  {showUserMenu && (
                    <>
                      <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        width: "min(220px, calc(100vw - 32px))", background: "#fff", borderRadius: 14,
                        border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        zIndex: 50, overflow: "hidden",
                      }}>
                        {/* Email */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar size={36} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                              <p style={{ fontSize: 10, color: "#9CA3AF", margin: "1px 0 0" }}>{user.accountType === "customer" ? "Kunde" : "Profil"}</p>
                            </div>
                          </div>
                        </div>
                        {/* Menu items */}
                        {[
                          ...(hasActivePlan || user?.accountType === "customer" ? [{ href: dashboardHref, label: "Dashboard" }] : []),
                          ...(hasActivePlan || user?.accountType === "customer" ? [{ href: `${dashboardHref}/profil`, label: "Indstillinger" }] : []),
                          ...(!hasActivePlan && user?.accountType !== "customer" ? [{ href: "/create-profile", label: "Complete Profile" }] : []),
                          ...(coinBalance !== null ? [{ href: `${dashboardHref}/coins`, label: `🔴 ${coinBalance} coins` }] : []),
                        ].map(({ href, label }) => (
                          <Link key={href} href={href} onClick={() => setShowUserMenu(false)}
                            style={{ display: "block", padding: "11px 16px", fontSize: 13, fontWeight: 500, color: "#374151", textDecoration: "none" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                            {label}
                          </Link>
                        ))}
                        <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />
                        <button onClick={handleLogout}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "#DC2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <LogOut size={14} />
                          Log ud
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : null}

            {/* Hamburger */}
            <button onClick={() => setDrawerOpen(true)}
              style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? "#222" : "#F5F5F7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <Menu size={20} color={isDark ? "#fff" : "#374151"} />
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        {searchOpen && (
          <div style={{
            position: "absolute", top: "56px", left: 0, right: 0,
            background: "#fff", borderBottom: "1px solid #E5E5E5",
            padding: "12px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 39,
          }}>
            <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
              <input type="text" value={navSearch} onChange={e => setNavSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                placeholder={t.search_placeholder} autoFocus
                style={{ width: "100%", borderRadius: "9999px", border: "1px solid #E5E5E5", background: "#F9F9F9", padding: "10px 16px 10px 40px", fontSize: "14px", color: "#111", outline: "none" }} />
              <button onClick={handleSearch} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <Search size={16} color="#9CA3AF" />
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer for fixed navbar */}
      <div style={{ height: "56px" }} />

      {/* ── Overlay ── */}
      <div onClick={closeDrawer} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998,
        opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "auto" : "none", transition: "opacity 0.25s ease",
      }} />

      {/* ── Slide-in Drawer ── */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "300px", maxWidth: "100vw",
        background: "#fff", zIndex: 9999,
        transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.12)",
      }}>

        {/* ── Header: Logo + close ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px" }}>
          <Link href="/" onClick={closeDrawer}>
            <Logo variant="light" height={24} />
          </Link>
          <button onClick={closeDrawer}
            style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#F2F2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="#555" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── User card ── */}
        {user && (
          <div style={{ margin: "0 16px 6px", padding: "12px 14px", background: "#F7F7F7", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar size={38} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{user.accountType === "customer" ? "Customer" : "Provider"}</span>
                {coinBalance !== null && <>
                  <span style={{ width: 2, height: 2, borderRadius: "50%", background: "#D1D5DB", display: "inline-block" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>{coinBalance} RC</span>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* ── Nav links ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          <nav>
            {navLinks.map(({ href, label, isRedCoins, isCam, icon: Icon }) => (
              <Link key={href} href={href} onClick={closeDrawer}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px", fontSize: 15,
                  fontWeight: isCam ? 800 : isRedCoins ? 700 : 450,
                  color: "#1A1A1A",
                  textDecoration: "none", letterSpacing: "-0.01em",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                {Icon && (
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isCam ? "#DC2626" : isRedCoins ? "#FEF2F2" : "#F5F5F5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} strokeWidth={1.8}
                      color={isCam ? "#fff" : isRedCoins ? "#DC2626" : "#555"} />
                  </span>
                )}
                {isCam ? (
                  <span>
                    <span style={{ color: "#DC2626" }}>RED</span>
                    <span>LIGHT</span>
                    <span style={{ color: "#DC2626" }}>CAM</span>
                  </span>
                ) : isRedCoins ? (
                  <span style={{ color: "#DC2626" }}>{label}</span>
                ) : label}
              </Link>
            ))}
          </nav>

          {/* ── Separator ── */}
          <div style={{ height: 1, background: "#F0F0F0", margin: "8px 20px" }} />

          {/* ── Auth buttons ── */}
          <div style={{ padding: "6px 16px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {user ? (
              <>
                {/* Push to Top — kun for providers med listing */}
                {user.accountType === "provider" && providerListingId && (
                  <button
                    onClick={async () => {
                      if (pushPoints < 1) {
                        alert("You need push points. Go to Premium & Boost to buy more.");
                        return;
                      }
                      setQuickPushing(true);
                      try {
                        const supabase = createClient();
                        const token = (await supabase.auth.getSession()).data.session?.access_token;
                        const res = await fetch("/api/push-points/push", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                          body: JSON.stringify({ listingId: providerListingId }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPushPoints(data.points_remaining);
                          alert(`✓ Profile pushed to top!\n${data.points_remaining} points remaining.`);
                        } else if (res.status === 402) {
                          alert("Insufficient push points. Buy more in Premium & Boost.");
                        } else {
                          alert(`Error: ${data.error || "Failed to push"}`);
                        }
                      } catch (e) {
                        alert("Error pushing profile. Please try again.");
                        console.error(e);
                      } finally {
                        setQuickPushing(false);
                      }
                    }}
                    disabled={quickPushing}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "11px", borderRadius: 10, border: "none",
                      background: pushPoints > 0 ? "#DC2626" : "#F5F5F5",
                      color: pushPoints > 0 ? "#fff" : "#9CA3AF",
                      fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.01em",
                      opacity: quickPushing ? 0.7 : 1,
                    }}>
                    <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                    </svg>
                    {quickPushing ? "Pushing..." : pushPoints > 0 ? `Push to Top  ·  ${pushPoints} pts` : "Buy Push Points"}
                  </button>
                )}

                {(hasActivePlan || user?.accountType === "customer") ? (
                  <Link href={dashboardHref} onClick={closeDrawer}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 10, background: "#111", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em" }}>
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/create-profile" onClick={closeDrawer}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 10, background: "#DC2626", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em" }}>
                    Complete your profile
                  </Link>
                )}
                <button onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 10, border: "none", background: "#FEF2F2", color: "#DC2626", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em" }}>
                  <LogOut size={14} strokeWidth={2.5} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeDrawer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 10, border: "1.5px solid #E8E8E8", background: "#fff", color: "#1A1A1A", fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em" }}>
                  {t.nav_login}
                </Link>
                <Link href="/register" onClick={closeDrawer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em" }}>
                  {t.nav_create_account}
                </Link>
              </>
            )}
          </div>

          {/* ── Separator ── */}
          <div style={{ height: 1, background: "#F0F0F0", margin: "4px 20px 0" }} />

          {/* ── Preferences (Language + Location) ── */}
          <div style={{ padding: "8px 6px 20px" }}>
            {/* Language */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px", borderRadius: 10 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F7F7F7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Globe size={14} color="#8E8E93" strokeWidth={2} />
                <span style={{ fontSize: 13, color: "#555", fontWeight: 450 }}>Language</span>
              </div>
              <LanguageSelector />
            </div>

            {/* Theme toggle removed */}

            {/* Location */}
            {selectedCountry && (
              <button onClick={() => { setShowCountrySelector(true); closeDrawer(); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "4px 14px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F7F7F7"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <MapPin size={14} color="#8E8E93" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: "#555", fontWeight: 450 }}>Location</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span className={`fi fi-${selectedCountry.code}`} style={{ width: 14, height: 11, display: "inline-block", borderRadius: 2 }} />
                  <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{selectedCountry.name}</span>
                  <ChevronDown size={12} color="#8E8E93" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes camPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (min-width: 768px) {
          .cam-nav-link { display: flex !important; }
        }
        @media (max-width: 639px) {
          div[style*="width: 280px"][style*="z-index: 9999"] {
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
    </>
  );
}

export { CountrySelector };
