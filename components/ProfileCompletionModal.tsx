"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  X, CheckCircle2, ChevronRight, Video, Camera, Mic, Share2, Shield, Star, 
  TrendingUp, Zap, MapPin, Globe, Link2, ShoppingBag, Coins, MessageSquare,
  Play, Heart, Lock, Sparkles, Crown, ArrowRight, ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase"

interface ProfileData {
  id: string
  slug: string | null
  profile_video_url: string | null
  video_url: string | null
  videos: string[] | null
  voice_message_url: string | null
  social_links: Record<string, { url?: string }> | null
  images: string[] | null
  profile_image: string | null
  onlyfans_url: string | null
  review_visibility: string | null
  geo_block_countries: string[] | null
}

interface FeatureStep {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  tip: string
  href: string
  done: boolean
  impact?: string
  impactColor?: string
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
  const [activeTab, setActiveTab] = useState<"setup" | "features">("setup")

  useEffect(() => {
    if (!listingId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from("listings")
      .select("id, slug, profile_video_url, video_url, videos, voice_message_url, social_links, images, profile_image, onlyfans_url, review_visibility, geo_block_countries")
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

  const goTo = (href: string) => {
    handleClose()
    router.push(href)
  }

  if (loading || !profile) return null

  // Check completion status
  const hasProfileVideo = !!profile.profile_video_url
  const hasVideos = (profile.videos?.length ?? 0) > 0 || !!profile.video_url
  const hasVoice = !!profile.voice_message_url
  const hasPhotos = (profile.images?.length ?? 0) >= 5
  const hasSocial = !!(
    profile.social_links?.instagram?.url ||
    profile.social_links?.twitter?.url ||
    profile.social_links?.tiktok?.url
  )
  const hasOnlyFans = !!profile.onlyfans_url || !!profile.social_links?.onlyfans?.url
  const hasReviewControl = profile.review_visibility !== null
  const hasGeoBlock = (profile.geo_block_countries?.length ?? 0) > 0
  const shareLink = profile.slug ? `redlightad.com/p/${profile.slug}` : null

  // Setup steps (things to complete)
  const setupSteps: FeatureStep[] = [
    {
      id: "profile_video",
      icon: <Play size={18} />,
      title: "Add a Live Profile Video",
      description: "Your profile picture comes ALIVE — clients see you moving before they even click.",
      tip: "💡 Profiles with video get 5× more clicks. Record a short 5-10 second clip.",
      href: "/dashboard/profil",
      done: hasProfileVideo,
      impact: "+500% clicks",
      impactColor: "#DC2626",
    },
    {
      id: "videos",
      icon: <Video size={18} />,
      title: "Upload Profile Videos",
      description: "Show more of yourself with up to 50+ videos on your profile page.",
      tip: "💡 Mix it up — behind the scenes, outfit reveals, personality clips work great.",
      href: "/dashboard/profil",
      done: hasVideos,
      impact: "+320% engagement",
      impactColor: "#DC2626",
    },
    {
      id: "photos",
      icon: <Camera size={18} />,
      title: "Add 10+ Photos",
      description: "Premium gives you unlimited photos. More photos = more trust.",
      tip: "💡 Show variety — different outfits, angles, locations. Quality over quantity.",
      href: "/dashboard/profil",
      done: hasPhotos,
      impact: "+180% contacts",
      impactColor: "#F59E0B",
    },
    {
      id: "voice",
      icon: <Mic size={18} />,
      title: "Record a Voice Message",
      description: "Let clients hear your voice. Creates instant personal connection.",
      tip: "💡 Keep it short and sweet — 10-20 seconds. Be natural and friendly.",
      href: "/dashboard/profil",
      done: hasVoice,
      impact: "3× more bookings",
      impactColor: "#7C3AED",
    },
    {
      id: "social",
      icon: <Share2 size={18} />,
      title: "Connect Social Media",
      description: "Link your Instagram, Twitter, TikTok — let clients follow you everywhere.",
      tip: "💡 Cross-promote your RedLightAD profile on your social channels.",
      href: "/dashboard/social-links",
      done: hasSocial,
      impact: "More followers",
      impactColor: "#0EA5E9",
    },
    {
      id: "onlyfans",
      icon: <Heart size={18} />,
      title: "Add OnlyFans Link",
      description: "Promote your OnlyFans directly on your profile. Premium feature.",
      tip: "💡 Clients discovering you here can become subscribers on OF too.",
      href: "/dashboard/social-links",
      done: hasOnlyFans,
      impact: "New subscribers",
      impactColor: "#EC4899",
    },
  ]

  // Premium features to explore
  const premiumFeatures = [
    {
      id: "share_link",
      icon: <Link2 size={18} />,
      title: "Your Personal Share Link",
      value: shareLink || "redlightad.com/p/your-name",
      description: "Your unique URL that you can share anywhere — Instagram bio, Twitter, business cards.",
      tip: "💡 Share this link on all your platforms. One link, all your services in one place.",
      action: shareLink ? () => { navigator.clipboard.writeText(`https://${shareLink}`); alert("Link copied!") } : undefined,
      actionLabel: "Copy Link",
    },
    {
      id: "locations",
      icon: <Globe size={18} />,
      title: "Multiple Locations Worldwide",
      description: "Your profile can appear in multiple countries. Traveling? Add your new location.",
      tip: "💡 Going to Spain next week? Add it now — clients can find you before you arrive.",
      action: () => goTo("/dashboard/profil"),
      actionLabel: "Add Location",
    },
    {
      id: "change_location",
      icon: <MapPin size={18} />,
      title: "Change Location Anytime",
      description: "Unlike Standard, you can update your location whenever you want. Move freely.",
      tip: "💡 Perfect for providers who travel. Update your city with one click.",
      action: () => goTo("/dashboard/profil"),
      actionLabel: "Update Location",
    },
    {
      id: "reviews",
      icon: <Star size={18} />,
      title: "Control Your Reviews",
      description: "Choose whether reviews are visible. You decide what clients see.",
      tip: "💡 Got a few bad reviews? Hide them. Build trust at your own pace.",
      action: () => goTo("/dashboard/profil"),
      actionLabel: "Manage Reviews",
    },
    {
      id: "geo_block",
      icon: <Shield size={18} />,
      title: "Block Countries (Privacy)",
      description: "Hide your profile from specific countries. Full privacy control.",
      tip: "💡 Block your home country if you don't want locals to see you.",
      action: () => goTo("/dashboard/profil"),
      actionLabel: "Set Geo-Blocks",
    },
    {
      id: "marketplace",
      icon: <ShoppingBag size={18} />,
      title: "Sell on Marketplace",
      description: "Sell items, videos, photos, or services globally. Your own mini-store.",
      tip: "💡 Worn items, custom videos, exclusive content — set your prices, get paid.",
      action: () => goTo("/dashboard/marketplace"),
      actionLabel: "Open Marketplace",
    },
    {
      id: "stories",
      icon: <Sparkles size={18} />,
      title: "Post Stories",
      description: "Share daily updates, behind-the-scenes, announcements. Like Instagram Stories.",
      tip: "💡 Stories keep you at the top of clients' minds. Post regularly.",
      action: () => goTo("/dashboard/stories"),
      actionLabel: "Post Story",
    },
    {
      id: "redcoins",
      icon: <Coins size={18} />,
      title: "Receive RedCoins (Tips)",
      description: "Clients can send you RedCoins as tips or gifts. Cash out anytime.",
      tip: "💡 RedCoins can be converted to real money. More engagement = more tips.",
      action: () => goTo("/dashboard/wallet"),
      actionLabel: "View Wallet",
    },
    {
      id: "push_points",
      icon: <TrendingUp size={18} />,
      title: "Push to Top (Boost)",
      description: "Want to be #1? Buy Push Points and boost to the absolute top position.",
      tip: "💡 Best used during peak hours (evening). One push = top spot for a set time.",
      action: () => goTo("/dashboard/boost"),
      actionLabel: "Buy Push Points",
    },
  ]

  const incompleteSteps = setupSteps.filter(s => !s.done)
  const completeSteps = setupSteps.filter(s => s.done)
  const completionPct = Math.round((completeSteps.length / setupSteps.length) * 100)

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center transition-opacity duration-300 ${dismissed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative w-full sm:max-w-lg bg-white sm:rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 ${dismissed ? "translate-y-8 sm:scale-95" : "translate-y-0 sm:scale-100"}`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-white" />
        </button>

        {/* Premium header */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-8 w-2 h-2 bg-white rounded-full animate-ping" />
            <div className="absolute top-8 right-16 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: "0.5s" }} />
            <div className="absolute bottom-3 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: "1s" }} />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Welcome to Premium! 🎉</h2>
              <p className="text-amber-100 text-sm">Let's maximize your profile</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
              <span>Profile completion</span>
              <span className="font-bold">{completionPct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("setup")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "setup" ? "text-amber-600 border-b-2 border-amber-500" : "text-gray-400"}`}
          >
            Complete Profile {incompleteSteps.length > 0 && `(${incompleteSteps.length})`}
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "features" ? "text-amber-600 border-b-2 border-amber-500" : "text-gray-400"}`}
          >
            Premium Features
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto">
          {activeTab === "setup" ? (
            <div className="p-5 space-y-3">
              {/* Incomplete steps */}
              {incompleteSteps.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Recommended to complete
                  </p>
                  {incompleteSteps.map(step => (
                    <button
                      key={step.id}
                      onClick={() => goTo(step.href)}
                      className="w-full text-left rounded-2xl border border-gray-100 p-4 hover:border-amber-200 hover:shadow-md transition-all group bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 group-hover:bg-amber-100 transition-colors">
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-gray-900">{step.title}</p>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                          <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded-lg inline-block">{step.tip}</p>
                          {step.impact && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: `${step.impactColor}14`, color: step.impactColor }}>
                              <TrendingUp size={10} />
                              {step.impact}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Complete! 🎉</h3>
                  <p className="text-sm text-gray-500">You've set up all the essentials. Explore Premium features below.</p>
                </div>
              )}

              {/* Completed steps */}
              {completeSteps.length > 0 && incompleteSteps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                    ✓ Already done
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {completeSteps.map(step => (
                      <span key={step.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-xs font-medium text-green-700">
                        <CheckCircle2 size={12} />
                        {step.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Your Premium Features
              </p>
              {premiumFeatures.map(feature => (
                <div
                  key={feature.id}
                  className="rounded-2xl border border-gray-100 p-4 hover:border-amber-200 transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{feature.title}</p>
                      {feature.value && (
                        <p className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">{feature.value}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{feature.description}</p>
                      <p className="text-xs text-amber-700 mt-2 bg-amber-50/50 px-2 py-1 rounded-lg">{feature.tip}</p>
                      {feature.action && (
                        <button
                          onClick={feature.action}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors"
                        >
                          {feature.actionLabel}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
          {activeTab === "setup" && incompleteSteps.length > 0 ? (
            <button
              onClick={() => goTo(incompleteSteps[0].href)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              <Zap size={16} />
              Start: {incompleteSteps[0].title}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Got it — Start using Premium
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
