"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { AutoPlayVideo } from "@/components/AutoPlayVideo"
import { MapPin, Phone, MessageCircle, Send, Globe, Instagram, ExternalLink, ChevronLeft, ChevronRight, Play, Mic, X } from "lucide-react"
import Link from "next/link"

interface Story {
  id: string
  media_url: string
  media_type: string
  created_at: string
}

interface LockedItem {
  id: string
  title: string
  description: string | null
  coin_price: number
  media_urls: string[]
  media_types: string[]
}

interface Listing {
  id: string
  slug: string
  title: string
  display_name: string | null
  about: string | null
  age: number | null
  city: string | null
  country: string | null
  premium_tier: string | null
  profile_image: string | null
  profile_video_url: string | null
  images: string[] | null
  videos: string[] | null
  video_url: string | null
  voice_message_url: string | null
  phone: string | null
  whatsapp: string | null
  telegram: string | null
  social_links: Record<string, { url?: string; username?: string }> | null
  services: string[] | null
  languages: string[] | null
  rate_1hour: string | null
  rate_2hours: string | null
  rate_overnight: string | null
  height_cm: number | null
  body_build: string | null
  ethnicity: string | null
  hair_color: string | null
  kyc_status: string | null
  category: string | null
}

export default function PersonalLinkPage() {
  const params = useParams()
  const slug = params?.code as string
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showVoice, setShowVoice] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [lockedContent, setLockedContent] = useState<LockedItem[]>([])
  const [activeStory, setActiveStory] = useState<Story | null>(null)

  useEffect(() => {
    if (!slug) return
    const supabase = createClient()
    supabase
      .from("listings")
      .select("id, slug, title, display_name, about, age, city, country, premium_tier, profile_image, profile_video_url, images, videos, video_url, voice_message_url, phone, whatsapp, telegram, social_links, services, languages, rate_1hour, rate_2hours, rate_overnight, height_cm, body_build, ethnicity, hair_color, kyc_status, category, share_code")
      .eq("share_code", slug)
      .eq("status", "active")
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        if (!["vip", "featured", "basic"].includes(data.premium_tier || "")) {
          setNotFound(true); setLoading(false); return
        }
        setListing(data)
        setLoading(false)

        // Fetch stories
        supabase
          .from("stories")
          .select("id, media_url, media_type, created_at")
          .eq("listing_id", data.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data: s }) => setStories(s || []))

        // Fetch locked content
        supabase
          .from("locked_content")
          .select("id, title, description, coin_price, media_urls, media_types")
          .eq("listing_id", data.id)
          .order("created_at", { ascending: false })
          .limit(10)
          .then(({ data: lc }) => setLockedContent(lc || []))
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  if (notFound || !listing) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
      <p className="text-2xl font-bold mb-2">Profile not found</p>
      <p className="text-gray-500 text-sm mb-6">This link may have expired or the profile is not available.</p>
      <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Back to RedLightAD
      </Link>
    </div>
  )

  const name = listing.display_name || listing.title
  const allPhotos = [
    ...(listing.profile_image ? [listing.profile_image] : []),
    ...(listing.images || []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const allVideos = [
    ...(listing.video_url ? [listing.video_url] : []),
    ...(listing.videos || []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const location = [listing.city, listing.country].filter(Boolean).join(", ")

  const socialLinks = listing.social_links || {}
  const hasWhatsApp = listing.whatsapp || socialLinks.whatsapp?.url
  const hasTelegram = listing.telegram || socialLinks.telegram?.url
  const hasPhone = listing.phone
  const hasInstagram = socialLinks.instagram?.url || socialLinks.instagram?.username
  const hasOnlyFans = socialLinks.onlyfans?.url
  const hasOnlyFansName = socialLinks.onlyfans?.username

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Image lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full"><X size={20} /></button>
          <img src={lightbox} alt="" className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      {/* Story viewer */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setActiveStory(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full z-10"><X size={20} /></button>
          {activeStory.media_type === "video" ? (
            <video
              src={activeStory.media_url}
              autoPlay
              controls
              playsInline
              className="max-w-[95vw] max-h-[90vh] rounded-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img src={activeStory.media_url} alt="" className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl" />
          )}
        </div>
      )}

      {/* Hero — full screen */}
      <div className="relative h-[100svh] max-h-[800px] overflow-hidden">
        {listing.profile_video_url ? (
          <AutoPlayVideo src={listing.profile_video_url} className="absolute inset-0 w-full h-full object-cover" />
        ) : allPhotos[imgIdx] ? (
          <img src={allPhotos[imgIdx]} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Photo nav arrows */}
        {allPhotos.length > 1 && !listing.profile_video_url && (
          <>
            <button
              onClick={() => setImgIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setImgIdx(i => (i + 1) % allPhotos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-36 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allPhotos.slice(0, 8).map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white scale-125" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-20">
          {/* Verified badge */}
          {listing.kyc_status === "approved" && (
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-3">
              <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">{name}</h1>
          <div className="flex items-center gap-3 text-sm text-white/70">
            {listing.age && <span>{listing.age} years</span>}
            {location && <><span>·</span><span className="flex items-center gap-1"><MapPin size={12} />{location}</span></>}
            {listing.category && <><span>·</span><span>{listing.category}</span></>}
          </div>

          {/* Quick contact buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {hasPhone && (
              <a href={`tel:${listing.phone}`}
                className="flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
                <Phone size={14} /> Call
              </a>
            )}
            {hasWhatsApp && (
              <a href={`https://wa.me/${(listing.whatsapp || socialLinks.whatsapp?.url || "").replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#20c55e] transition-colors">
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            {hasTelegram && (
              <a href={`https://t.me/${listing.telegram || socialLinks.telegram?.url || ""}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#229ED9] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#1a8fc4] transition-colors">
                <Send size={14} /> Telegram
              </a>
            )}
            {listing.voice_message_url && (
              <button
                onClick={() => setShowVoice(v => !v)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-white/20 transition-colors">
                <Mic size={14} /> Voice message
              </button>
            )}
          </div>

          {/* Voice player */}
          {showVoice && listing.voice_message_url && (
            <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
              <audio controls src={listing.voice_message_url} className="w-full h-8" style={{ filter: "invert(1)" }} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* About */}
        {listing.about && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">About me</h2>
            <p className="text-gray-300 leading-relaxed text-base whitespace-pre-line">{listing.about}</p>
          </section>
        )}

        {/* Stats */}
        {(listing.height_cm || listing.body_build || listing.ethnicity || listing.hair_color) && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {listing.height_cm && (
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold">{listing.height_cm} cm</div>
                  <div className="text-xs text-white/50 mt-0.5">Height</div>
                </div>
              )}
              {listing.body_build && (
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold capitalize">{listing.body_build}</div>
                  <div className="text-xs text-white/50 mt-0.5">Build</div>
                </div>
              )}
              {listing.ethnicity && (
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold capitalize">{listing.ethnicity}</div>
                  <div className="text-xs text-white/50 mt-0.5">Ethnicity</div>
                </div>
              )}
              {listing.hair_color && (
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <div className="text-lg font-bold capitalize">{listing.hair_color}</div>
                  <div className="text-xs text-white/50 mt-0.5">Hair</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Rates */}
        {(listing.rate_1hour || listing.rate_2hours || listing.rate_overnight) && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Rates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {listing.rate_1hour && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xl font-black text-white">{listing.rate_1hour}</div>
                  <div className="text-xs text-white/50 mt-1">1 hour</div>
                </div>
              )}
              {listing.rate_2hours && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xl font-black text-white">{listing.rate_2hours}</div>
                  <div className="text-xs text-white/50 mt-1">2 hours</div>
                </div>
              )}
              {listing.rate_overnight && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="text-xl font-black text-white">{listing.rate_overnight}</div>
                  <div className="text-xs text-white/50 mt-1">Overnight</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Services */}
        {listing.services && listing.services.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Services</h2>
            <div className="flex flex-wrap gap-2">
              {listing.services.map(s => (
                <span key={s} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/80">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Stories */}
        {stories.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
              Stories <span className="text-white/20">({stories.length})</span>
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {stories.map((story, i) => (
                <button
                  key={story.id}
                  onClick={() => setActiveStory(story)}
                  className="relative flex-shrink-0 w-20 h-28 rounded-2xl overflow-hidden bg-gray-800 border-2 border-white/20 hover:border-white/50 transition-all"
                >
                  {story.media_type === "video" ? (
                    <video
                      src={story.media_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                  {/* Play icon for video */}
                  {story.media_type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <Play size={12} className="text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                  {/* Story ring gradient */}
                  <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 0 0 2px rgba(220,38,38,0.7)" }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Photo gallery */}
        {allPhotos.length > 1 && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
              Photos <span className="text-white/20">({allPhotos.length})</span>
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {allPhotos.map((img, i) => (
                <button key={i} onClick={() => setLightbox(img)}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-800 hover:opacity-90 transition-opacity">
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {allVideos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
              Videos <span className="text-white/20">({allVideos.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {allVideos.map((v, i) => (
                <video key={i} src={v} controls muted playsInline
                  className="w-full aspect-[9/16] object-cover rounded-xl bg-gray-800" />
              ))}
            </div>
          </section>
        )}

        {/* Exclusive content */}
        {lockedContent.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Exclusive content</h2>
              <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">🔒 Premium</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lockedContent.map(item => (
                <div key={item.id} className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10">
                  {/* Preview image blurred */}
                  {item.media_urls?.[0] && (
                    <div className="relative aspect-[3/4]">
                      <img
                        src={item.media_urls[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: "blur(12px)", transform: "scale(1.1)" }}
                      />
                      {/* Lock overlay */}
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-white text-xs font-bold text-center px-2 leading-tight">{item.title}</p>
                        <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RC</text></svg>
                          {item.coin_price} coins
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 text-center mt-3">
              Unlock exclusive content with Red Coins on{" "}
              <a href="https://redlightad.com" className="text-white/50 hover:text-white">RedLightAD.com</a>
            </p>
          </section>
        )}

        {/* Social links */}
        {(hasInstagram || hasOnlyFans) && (
          <section>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Find me on</h2>
            <div className="flex flex-col gap-2">
              {hasInstagram && (
                <a
                  href={socialLinks.instagram?.url || `https://instagram.com/${socialLinks.instagram?.username}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 rounded-2xl px-4 py-3 hover:from-purple-600/30 hover:to-pink-600/30 transition-colors"
                >
                  <Instagram size={18} className="text-pink-400" />
                  <span className="font-semibold text-sm">Instagram</span>
                  <ExternalLink size={13} className="ml-auto text-white/40" />
                </a>
              )}
              {hasOnlyFans && (
                <a
                  href={socialLinks.onlyfans?.url || `https://onlyfans.com/${hasOnlyFansName}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#00AFF0]/10 border border-[#00AFF0]/20 rounded-2xl px-4 py-3 hover:bg-[#00AFF0]/20 transition-colors"
                >
                  <img src="/onlyfans-logo.svg" alt="OnlyFans" className="h-4 w-auto" />
                  <span className="font-semibold text-sm">OnlyFans</span>
                  <ExternalLink size={13} className="ml-auto text-white/40" />
                </a>
              )}
            </div>
          </section>
        )}

        {/* Contact CTA */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
          <h2 className="text-xl font-black mb-1">Ready to book?</h2>
          <p className="text-white/50 text-sm mb-5">Contact me directly — I respond fast.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {hasPhone && (
              <a href={`tel:${listing.phone}`}
                className="flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                <Phone size={16} /> Call now
              </a>
            )}
            {hasWhatsApp && (
              <a href={`https://wa.me/${(listing.whatsapp || "").replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#20c55e] transition-colors">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {hasTelegram && (
              <a href={`https://t.me/${listing.telegram || ""}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1a8fc4] transition-colors">
                <Send size={16} /> Telegram
              </a>
            )}
          </div>
        </section>
      </div>

      {/* Powered by footer */}
      <footer className="border-t border-white/10 py-8 px-6 flex flex-col items-center gap-3">
        <a
          href="https://redlightad.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 group"
        >
          {/* Logo text */}
          <span style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}>
            <span style={{ color: "#CC0000" }}>RED</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }} className="group-hover:text-white transition-colors">LIGHTAD</span>
          </span>
          <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors">
            This profile is powered by <strong className="text-white/50">RedLightAD.com</strong>
          </span>
        </a>
      </footer>
    </div>
  )
}
