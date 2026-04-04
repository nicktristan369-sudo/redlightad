"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { MessageSquare, X, Ruler, Weight } from "lucide-react"
import Link from "next/link"

interface Conversation {
  id: string
  listing_id: string | null
  provider_id: string
  customer_id: string
  last_message: string | null
  last_message_at: string
  provider_unread: number
  customer_unread: number
  listings?: { id: string; title: string; profile_image: string | null } | null
  other_avatar?: string | null
  other_initials?: string
  other_name?: string
  other_id?: string
  other_is_customer?: boolean
}

interface CustomerProfile {
  user_id: string
  username: string | null
  avatar_url: string | null
  age: number | null
  gender: string | null
  nationality: string | null
  height_cm: number | null
  weight_kg: number | null
  languages: string[] | null
  kinks: string[] | null
  kink_bio: string | null
  phone_verified: boolean
  created_at: string
}

export default function BeskederPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profilePopup, setProfilePopup] = useState<CustomerProfile | null>(null)
  const [cpProfiles, setCpProfiles] = useState<Map<string, CustomerProfile>>(new Map())
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      const { data: convs } = await supabase
        .from("conversations")
        .select("*, listings(id, title, profile_image)")
        .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false })

      if (!convs) { setLoading(false); return }

      // Saml alle "den anden part" user IDs
      const otherIds = convs.map(c =>
        user.id === c.provider_id ? c.customer_id : c.provider_id
      ).filter(Boolean)
      const uniqueIds = [...new Set(otherIds)]

      // Hent customer_profiles for alle
      const { data: customerProfiles } = await supabase
        .from("customer_profiles")
        .select("user_id, username, avatar_url, age, gender, nationality, height_cm, weight_kg, languages, kinks, kink_bio, phone_verified, created_at")
        .in("user_id", uniqueIds)

      // Hent listings profilbilleder (for providers)
      const { data: providerListings } = await supabase
        .from("listings")
        .select("user_id, profile_image, title")
        .in("user_id", uniqueIds)

      const cpMap = new Map(customerProfiles?.map(p => [p.user_id, p as CustomerProfile]) ?? [])
      setCpProfiles(cpMap)
      const plMap = new Map(providerListings?.map(l => [l.user_id, l]) ?? [])

      const enriched = convs.map(c => {
        const otherId = user.id === c.provider_id ? c.customer_id : c.provider_id
        const isOtherCustomer = user.id === c.provider_id // vi er provider, de er customer
        const cp = cpMap.get(otherId)
        const pl = plMap.get(otherId)

        const avatar = cp?.avatar_url ?? pl?.profile_image ?? null
        const name = isOtherCustomer
          ? (cp?.username || "Kunde")
          : (c.listings?.title || pl?.title || "Profil")
        const initials = name.slice(0, 2).toUpperCase()

        return { ...c, other_avatar: avatar, other_initials: initials, other_name: name, other_id: otherId, other_is_customer: isOtherCustomer }
      })

      setConversations(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  const getUnread = (conv: Conversation) => {
    if (!userId) return 0
    return userId === conv.provider_id ? conv.provider_unread : conv.customer_unread
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const diffH = (Date.now() - d.getTime()) / 3600000
    if (diffH < 24) return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
    if (diffH < 168) return d.toLocaleDateString("da-DK", { weekday: "short" })
    return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" })
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Beskeder</h1>
        <p className="text-gray-500 text-sm mb-6">{conversations.length} samtale{conversations.length !== 1 ? "r" : ""}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <MessageSquare size={40} color="#D1D5DB" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen beskeder endnu</h2>
            <p className="text-gray-500">Samtaler med brugere vises her</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {conversations.map((conv) => {
              const unread = getUnread(conv)
              // Link til profilen der er den "anden part"
              const profileHref = conv.other_is_customer
                ? null // kunder har ingen offentlig profil-URL endnu
                : conv.listing_id ? `/ads/${conv.listing_id}` : null

              return (
                <div key={conv.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  {/* Avatar — klikbar: profil-side (escort) eller kunde-popup */}
                  {profileHref ? (
                    <Link href={profileHref} className="flex-shrink-0" title="Se profil">
                      <Avatar avatar={conv.other_avatar} initials={conv.other_initials ?? "??"} />
                    </Link>
                  ) : conv.other_is_customer ? (
                    <button className="flex-shrink-0" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => {
                        const cp = cpProfiles.get(conv.other_id ?? "")
                        if (cp) setProfilePopup(cp)
                      }}
                      title="Se kundeprofil">
                      <Avatar avatar={conv.other_avatar} initials={conv.other_initials ?? "??"} />
                    </button>
                  ) : (
                    <div className="flex-shrink-0">
                      <Avatar avatar={conv.other_avatar} initials={conv.other_initials ?? "??"} />
                    </div>
                  )}

                  {/* Besked-link */}
                  <Link href={`/dashboard/beskeder/${conv.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm truncate ${unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                          {conv.other_name}
                        </p>
                        {profileHref && (
                          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">· Se profil →</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-sm truncate ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {conv.last_message || "Ingen beskeder endnu"}
                    </p>
                  </Link>

                  {unread > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center flex-shrink-0 px-1">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {profilePopup && <CustomerProfilePopup profile={profilePopup} onClose={() => setProfilePopup(null)} />}
    </DashboardLayout>
  )
}

function CustomerProfilePopup({ profile, onClose }: { profile: CustomerProfile; onClose: () => void }) {
  const genderLabel = profile.gender === "male" ? "Mand" : profile.gender === "female" ? "Dame" : profile.gender === "trans" ? "Trans" : profile.gender || null
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ background: "#111", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Kundeprofil</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", background: "#E5E7EB", border: "3px solid #F3F4F6", flexShrink: 0 }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{(profile.username || "K").slice(0,2).toUpperCase()}</span>
                  </div>}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>{profile.username || "Anonym"}</span>
                {profile.phone_verified && <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 7px", borderRadius: 20 }}>✓ Verificeret</span>}
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                {genderLabel && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{genderLabel}</span>}
                {profile.age && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{profile.age} år</span>}
                {profile.nationality && <span style={{ fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 12 }}>{profile.nationality}</span>}
              </div>
              {profile.created_at && <p style={{ fontSize: 10, color: "#9CA3AF", margin: "4px 0 0" }}>Profil oprettet {new Date(profile.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}</p>}
            </div>
          </div>
          {(profile.height_cm || profile.weight_kg) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {profile.height_cm && <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{profile.height_cm}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>cm høj</div>
              </div>}
              {profile.weight_kg && <div style={{ flex: 1, background: "#F9FAFB", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{profile.weight_kg} kg</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>vægt</div>
              </div>}
            </div>
          )}
          {profile.languages && profile.languages.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Taler</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {profile.languages.map(l => <span key={l} style={{ fontSize: 12, fontWeight: 600, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 9px", borderRadius: 12 }}>{l}</span>)}
              </div>
            </div>
          )}
          {profile.kinks && profile.kinks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Interesser</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {profile.kinks.map(k => <span key={k} style={{ fontSize: 12, fontWeight: 600, background: "#FFF1F2", color: "#DC2626", padding: "3px 9px", borderRadius: 12 }}>{k}</span>)}
              </div>
            </div>
          )}
          {profile.kink_bio && (
            <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{profile.kink_bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Avatar({ avatar, initials }: { avatar: string | null | undefined; initials: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      background: avatar ? "transparent" : "#DC2626",
      overflow: "hidden", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "2px solid #F3F4F6",
    }}>
      {avatar
        ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{initials}</span>}
    </div>
  )
}
