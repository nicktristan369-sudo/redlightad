"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { Heart } from "lucide-react"

interface FeedItem {
  id: string
  listing_id: string
  type: "image" | "video" | "story"
  url: string
  title: string
  listing_name: string
  profile_image: string | null
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function KundeFeed() {
  const [following, setFollowing] = useState<{ listing_id: string; name: string; image: string | null }[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      // Get follow list
      const { data: follows } = await supabase
        .from("customer_follows")
        .select("listing_id, listings(id, title, profile_image)")
        .eq("customer_id", user.id)
      const followList = (follows ?? []).map((f: any) => ({
        listing_id: f.listing_id,
        name: f.listings?.title || "Unknown",
        image: f.listings?.profile_image || null,
      }))
      setFollowing(followList)

      if (followList.length === 0) { setLoading(false); return }

      // Get feed from followed profiles
      const ids = followList.map(f => f.listing_id)
      const { data: videos } = await supabase.from("listing_videos")
        .select("id, listing_id, url, created_at, listings(title, profile_image)")
        .in("listing_id", ids)
        .order("created_at", { ascending: false })
        .limit(30)

      const items: FeedItem[] = (videos ?? []).map((v: any) => ({
        id: v.id,
        listing_id: v.listing_id,
        type: "video" as const,
        url: v.url,
        title: "Video",
        listing_name: v.listings?.title || "",
        profile_image: v.listings?.profile_image || null,
        created_at: v.created_at,
      }))

      setFeed(items)
      setLoading(false)
    })
  }, [])

  return (
    <KundeLayout>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>My Feed</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Content from profiles you follow</p>

        {/* Following row */}
        {following.length > 0 && (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, marginBottom: 20, scrollbarWidth: "none" }}>
            {following.map(f => (
              <Link key={f.listing_id} href={`/ads/${f.listing_id}`} style={{ flexShrink: 0, textAlign: "center", textDecoration: "none" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #DC2626", overflow: "hidden", background: "#E5E7EB", marginBottom: 4 }}>
                  {f.image && <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <span style={{ fontSize: 10, color: "#374151", maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{f.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 24, height: 24, border: "3px solid #E5E7EB", borderTopColor: "#DC2626", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : following.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
              <Heart size={40} color="#9CA3AF" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>You are not following anyone yet</h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Visit a profile and click "Follow" to see their content here</p>
            <Link href="/" style={{ display: "inline-block", padding: "10px 20px", background: "#000", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Browse profiles
            </Link>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px", color: "#9CA3AF", fontSize: 14 }}>
            No new content yet from profiles you follow
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {feed.map(item => (
              <Link key={item.id} href={`/ads/${item.listing_id}`} style={{ textDecoration: "none", position: "relative", display: "block" }}>
                <div style={{ position: "relative", aspectRatio: "9/16", background: "#111", borderRadius: 10, overflow: "hidden" }}>
                  {item.type === "video" && (
                    <video src={`${item.url}#t=1`} style={{ width: "100%", height: "100%", objectFit: "cover" }} preload="metadata" />
                  )}
                  {/* Overlay */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 10px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#374151", overflow: "hidden", flexShrink: 0 }}>
                        {item.profile_image && <img src={item.profile_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.listing_name}</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto", flexShrink: 0 }}>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                  {/* Video icon */}
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5l11 7-11 7V5z"/></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </KundeLayout>
  )
}
