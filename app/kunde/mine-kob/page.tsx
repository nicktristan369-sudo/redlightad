"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { Lock, Play, Image } from "lucide-react"

interface Purchase {
  id: string
  created_at: string
  content_type: "video" | "image" | "gallery"
  content_url: string
  thumbnail_url: string | null
  listing_id: string
  listing_title: string
  listing_image: string | null
  title: string | null
  redcoins_spent: number
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)} min. siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} t. siden`
  return `${Math.floor(diff / 86400)} d. siden`
}

export default function MineKob() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<Purchase | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from("content_purchases")
        .select(`
          id, created_at, content_type, content_url, thumbnail_url, redcoins_spent, title,
          listing_id,
          listings(title, profile_image)
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
      setPurchases((data ?? []).map((p: any) => ({
        ...p,
        listing_title: p.listings?.title || "Ukendt profil",
        listing_image: p.listings?.profile_image || null,
      })))
      setLoading(false)
    })
  }, [])

  return (
    <KundeLayout>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>Mine køb</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Indhold du har låst op med RedCoins</p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : purchases.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "52px 24px", textAlign: "center" }}>
            <Lock size={40} color="#E5E7EB" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>Ingen køb endnu</h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Lås eksklusivt indhold op med RedCoins på profil-sider</p>
            <Link href="/" style={{ display: "inline-block", padding: "10px 24px", background: "#000", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Gennemse profiler
            </Link>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {purchases.map(p => (
                <button key={p.id} onClick={() => setLightbox(p)}
                  style={{ position: "relative", aspectRatio: "4/5", background: "#111", borderRadius: 12, overflow: "hidden", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {/* Thumbnail */}
                  {p.thumbnail_url || (p.content_type === "image" && p.content_url) ? (
                    <img src={p.thumbnail_url || p.content_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1A1A" }}>
                      {p.content_type === "video" ? <Play size={32} color="#374151" /> : <Image size={32} color="#374151" />}
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {p.listing_image && <img src={p.listing_image} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.listing_title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{timeAgo(p.created_at)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>🔴 {p.redcoins_spent} RC</span>
                    </div>
                  </div>
                  {/* Type badge */}
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.content_type === "video" ? <Play size={12} fill="white" color="white" /> : <Image size={12} color="white" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: "90vh", width: "100%" }}>
              {lightbox.content_type === "video" ? (
                <video src={lightbox.content_url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", borderRadius: 10, background: "#000" }} />
              ) : (
                <img src={lightbox.content_url} alt="" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 10 }} />
              )}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                {lightbox.listing_image && <img src={lightbox.listing_image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />}
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{lightbox.listing_title}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>🔴 {lightbox.redcoins_spent} RC</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </KundeLayout>
  )
}
