"use client"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

export default function KundeBeskeder() {
  const [convos, setConvos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      // Hent samtaler — kun med profiler kunden har kontaktet
      const { data } = await supabase
        .from("messages")
        .select("*, listings(id, title, profile_image)")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(50)
      // Grupér per profil
      const seen = new Map<string, any>()
      for (const m of data ?? []) {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
        if (!seen.has(otherId)) seen.set(otherId, { ...m, listing: m.listings })
      }
      setConvos(Array.from(seen.values()))
      setLoading(false)
    })
  }, [])

  return (
    <KundeLayout>
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Beskeder</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Private samtaler — kun synlige for dig og profilen</p>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : convos.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <MessageSquare size={36} color="#E5E7EB" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Ingen samtaler endnu</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Kontakt en profil for at starte en privat samtale</p>
              <Link href="/" style={{ display: "inline-block", padding: "10px 20px", background: "#000", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Find en profil
              </Link>
            </div>
          ) : (
            convos.map((c, i) => (
              <Link key={i} href={`/dashboard/beskeder/${c.listing?.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textDecoration: "none", borderBottom: "1px solid #F9FAFB" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#E5E7EB", overflow: "hidden", flexShrink: 0 }}>
                  {c.listing?.profile_image && <img src={c.listing.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.listing?.title || "Profil"}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content || c.message || "..."}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </KundeLayout>
  )
}
