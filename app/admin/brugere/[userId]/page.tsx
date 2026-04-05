import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabaseServer"
import Link from "next/link"
import AdminLayout from "@/components/AdminLayout"
import UserProfileClient from "./UserProfileClient"
import DangerZone from "./DangerZone"

/* ─── Helpers ─── */

function formatDate(d: string | null | undefined) {
  if (!d) return "–"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ─── Page ─── */

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const supabase = createServerClient()

  try {
    // Fetch all data in parallel
    const [authRes, profileRes, kycRes, messagesRes] = await Promise.all([
      adminClient.auth.admin.getUserById(userId),
      supabase.from("customer_profiles").select("*").eq("user_id", userId).single(),
      supabase
        .from("customer_kyc_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("messages")
        .select("*, conversation:conversation_id(listing_id, listing:listing_id(name))")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    const authUser = authRes.data?.user
    if (!authUser) {
      return (
        <AdminLayout>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 16, color: "#6B7280" }}>User not found</p>
            <Link href="/admin/kyc" style={{ color: "#DC2626", fontSize: 13, marginTop: 12, display: "inline-block" }}>
              ← Back to KYC
            </Link>
          </div>
        </AdminLayout>
      )
    }

    const profile = profileRes.data
    const kyc = kycRes.data
    const messages = messagesRes.data || []

    const displayName = profile?.username || authUser.email?.split("@")[0] || "Unknown"
    const email = authUser.email || "–"
    const joinedAt = formatDate(authUser.created_at)
    const lastSignIn = formatDate(authUser.last_sign_in_at)

    return (
      <AdminLayout>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/admin/kyc"
            style={{ fontSize: 13, color: "#DC2626", textDecoration: "none", fontWeight: 600, display: "inline-block", marginBottom: 20 }}
          >
            ← Back to KYC
          </Link>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {getInitials(displayName)}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>{displayName}</h1>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0" }}>{email}</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>
                Joined: {joinedAt} · Last sign in: {lastSignIn}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {/* Account Card */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Account
              </h3>
              <InfoRow label="Email" value={email} />
              <InfoRow label="User ID" value={userId.slice(0, 8) + "…"} title={userId} />
              <InfoRow label="Created at" value={joinedAt} />
              <InfoRow label="Last sign in" value={lastSignIn} />
              <InfoRow label="RedCoins" value={String(profile?.redcoins ?? 0)} />
            </div>

            {/* Profile Card */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Profile
              </h3>
              <InfoRow label="Username" value={profile?.username || "–"} />
              <InfoRow label="Gender" value={profile?.gender || "–"} />
              <InfoRow label="Age" value={profile?.age ? String(profile.age) : "–"} />
              <InfoRow label="Nationality" value={profile?.nationality || "–"} />
              <InfoRow label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "–"} />
              <InfoRow label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "–"} />
              {profile?.bio && (
                <InfoRow label="Bio" value={profile.bio.length > 100 ? profile.bio.slice(0, 100) + "…" : profile.bio} />
              )}
            </div>

            {/* Verification Card */}
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Verification
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, minWidth: 70 }}>Status</span>
                {kyc ? <StatusBadge status={kyc.status} /> : <span style={{ fontSize: 12, color: "#9CA3AF" }}>No KYC</span>}
              </div>
              {kyc && (
                <>
                  <InfoRow label="Submitted" value={formatDate(kyc.created_at)} />
                  {kyc.id_image_url && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>ID Document</span>
                      <IDThumbnail path={kyc.id_image_url} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tabs + Content (client component for interactivity) */}
          <UserProfileClient messages={messages} />

          {/* Admin Actions */}
          <DangerZone />
        </div>
      </AdminLayout>
    )
  } catch {
    return (
      <AdminLayout>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#6B7280" }}>User not found</p>
          <Link href="/admin/kyc" style={{ color: "#DC2626", fontSize: 13, marginTop: 12, display: "inline-block" }}>
            ← Back to KYC
          </Link>
        </div>
      </AdminLayout>
    )
  }
}

/* ─── Sub-components ─── */

function InfoRow({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, minWidth: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111", fontWeight: 500 }} title={title}>
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#D1FAE5", color: "#065F46" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  }
  const c = map[status] || { bg: "#F3F4F6", color: "#374151" }
  return (
    <span
      style={{
        display: "inline-block",
        background: c.bg,
        color: c.color,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {status}
    </span>
  )
}

function IDThumbnail({ path }: { path: string }) {
  const url = `/api/admin/kyc-signed-url?path=${encodeURIComponent(path)}`
  return (
    <div style={{ marginTop: 6 }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          width: 60,
          height: 42,
          background: "#F3F4F6",
          borderRadius: 4,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          fontSize: 10,
          color: "#9CA3AF",
          textAlign: "center",
          lineHeight: "42px",
        }}
      >
        View ID
      </a>
    </div>
  )
}
