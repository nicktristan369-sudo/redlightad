"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X, CheckCircle2, Circle, ChevronRight, Video, Camera, Mic, Share2, Shield, Star, TrendingUp, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface ProfileData {
  id: string
  profile_video_url: string | null
  video_url: string | null
  videos: string[] | null
  voice_message_url: string | null
  social_links: Record<string, { url?: string }> | null
  images: string[] | null
  profile_image: string | null
}

interface Step {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  impact: string
  impactColor: string
  href: string
  done: boolean
}

interface Props {
  listingId: string | null
  plan: string | null
  onClose: () => void
}

export default function ProfileCompletionModal({ listingId, plan, onClose }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!listingId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from("listings")
      .select("id, profile_video_url, video_url, videos, voice_message_url, social_links, images, profile_image")
      .eq("id", listingId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data)
        setLoading(false)
      })
  }, [listingId])

  const handleClose = () => {
    setDismissed(true)
    setTimeout(onClose, 300)
  }

  if (loading || !profile) return null

  const hasVideo = !!(profile.profile_video_url || profile.video_url || (profile.videos && profile.videos.length > 0))
  const hasVoice = !!profile.voice_message_url
  const hasPhotos = (profile.images?.length ?? 0) >= 5
  const hasSocial = !!(
    profile.social_links?.instagram?.url ||
    profile.social_links?.whatsapp?.url ||
    profile.social_links?.telegram?.url ||
    profile.social_links?.onlyfans?.url
  )
  const hasProfileVideo = !!profile.profile_video_url

  const steps: Step[] = [
    {
      id: "profile_video",
      icon: <Video size={18} />,
      title: "Add a live profile video",
      description: "Your profile picture comes alive — clients see you moving before clicking.",
      impact: "+320% more profile views",
      impactColor: "#DC2626",
      href: "/dashboard/profil",
      done: hasProfileVideo,
    },
    {
      id: "photos",
      icon: <Camera size={18} />,
      title: "Add 10+ photos",
      description: "Profiles with 10+ photos get dramatically more inquiries. Show your best side.",
      impact: "+180% more contacts",
      impactColor: "#DC2626",
      href: "/dashboard/profil",
      done: hasPhotos,
    },
    {
      id: "video",
      icon: <Video size={18} />,
      title: "Upload a video",
      description: "Video profiles are clicked 5× more than photo-only profiles.",
      impact: "+500% engagement",
      impactColor: "#DC2626",
      href: "/dashboard/profil",
      done: hasVideo,
    },
    {
      id: "voice",
      icon: <Mic size={18} />,
      title: "Record a voice message",
      description: "A short voice message creates an instant personal connection with clients.",
      impact: "Builds instant trust",
      impactColor: "#7C3AED",
      href: "/dashboard/profil",
      done: hasVoice,
    },
    {
      id: "social",
      icon: <Share2 size={18} />,
      title: "Connect social links",
      description: "Add Instagram, WhatsApp, Telegram or OnlyFans to let clients reach you directly.",
      impact: "More direct bookings",
      impactColor: "#0EA5E9",
      href: "/dashboard/social-links",
      done: hasSocial,
    },
    {
      id: "geo",
      icon: <Shield size={18} />,
      title: "Set up geo-blocking",
      description: "Hide your profile from specific countries — protect your privacy instantly.",
      impact: "Full privacy control",
      impactColor: "#059669",
      href: "/dashboard/profil",
      done: false, // always show as option
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const totalCount = steps.length
  const pct = Math.round((completedCount / totalCount) * 100)

  const incomplete = steps.filter(s => !s.done)
  const complete = steps.filter(s => s.done)

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center transition-opacity duration-300 ${dismissed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100 px-6 pt-6 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>

          {/* Plan badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
              <Zap size={11} />
              {plan?.toUpperCase() || "PREMIUM"} ACTIVE
            </div>
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <CheckCircle2 size={13} />
              Payment confirmed
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Complete your profile</h2>
          <p className="text-sm text-gray-500 mb-4">
            Maximise your visibility — complete these steps to get the most out of your premium membership.
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900 tabular-nums whitespace-nowrap">
              {completedCount}/{totalCount} done
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 flex-1">

          {/* Incomplete steps */}
          {incomplete.length > 0 && (
            <div className="space-y-2.5">
              {incomplete.map(step => (
                <button
                  key={step.id}
                  onClick={() => { handleClose(); router.push(step.href) }}
                  className="w-full text-left rounded-2xl border border-gray-100 p-4 hover:border-gray-300 hover:shadow-sm transition-all group bg-white"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon circle */}
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:bg-gray-100 transition-colors">
                      {step.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900">{step.title}</p>
                        <ChevronRight size={15} className="text-gray-400 flex-shrink-0 group-hover:text-gray-700 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                      {/* Impact badge */}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: `${step.impactColor}14`, color: step.impactColor }}>
                        <TrendingUp size={10} />
                        {step.impact}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Completed steps */}
          {complete.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 mt-4">Already done</p>
              <div className="space-y-1.5">
                {complete.map(step => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100"
                  >
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info boxes */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
              <div className="text-2xl font-black text-red-600 mb-0.5">5×</div>
              <div className="text-xs text-red-700 font-medium leading-tight">More clicks with a<br />profile video</div>
            </div>
            <div className="rounded-2xl bg-gray-900 p-4 text-center">
              <div className="text-2xl font-black text-white mb-0.5">Top</div>
              <div className="text-xs text-gray-400 font-medium leading-tight">Search placement<br />with premium</div>
            </div>
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center">
              <div className="text-2xl font-black text-purple-600 mb-0.5">3×</div>
              <div className="text-xs text-purple-700 font-medium leading-tight">More bookings with<br />voice message</div>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
              <div className="text-2xl font-black text-blue-600 mb-0.5">100%</div>
              <div className="text-xs text-blue-700 font-medium leading-tight">Private with<br />geo-blocking</div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          {incomplete.length > 0 ? (
            <button
              onClick={() => { handleClose(); router.push(incomplete[0].href) }}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Star size={15} />
              Start with: {incomplete[0].title}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={15} />
              Profile complete — you're all set!
            </button>
          )}
          <button onClick={handleClose} className="w-full text-center text-xs text-gray-400 mt-2 py-1 hover:text-gray-600 transition-colors">
            Remind me later
          </button>
        </div>
      </div>
    </div>
  )
}
