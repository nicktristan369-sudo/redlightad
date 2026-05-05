"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Crown, Video, Camera, Mic, MapPin, Globe, Link2, Star, ShoppingBag, Coins, Shield, Zap } from "lucide-react"

interface Props {
  featureName?: string
  onClose: () => void
}

const PREMIUM_PERKS = [
  { icon: Crown, text: "Always in top section" },
  { icon: Video, text: "Video profile picture (live)" },
  { icon: Camera, text: "Unlimited photos + videos" },
  { icon: Mic, text: "Voice messages" },
  { icon: MapPin, text: "Multiple locations" },
  { icon: Globe, text: "Change location anytime" },
  { icon: Link2, text: "Social media links" },
  { icon: Star, text: "OnlyFans promotion" },
  { icon: ShoppingBag, text: "Sell on Marketplace" },
  { icon: Coins, text: "Receive RedCoins" },
  { icon: Shield, text: "Block specific countries" },
]

export default function UpgradeToPremiumModal({ featureName, onClose }: Props) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  const handleClose = () => {
    setDismissed(true)
    setTimeout(onClose, 300)
  }

  const handleUpgrade = () => {
    router.push("/upgrade")
    handleClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center transition-opacity duration-300 ${dismissed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative w-full sm:max-w-md bg-white sm:rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 ${dismissed ? "translate-y-8 sm:scale-95" : "translate-y-0 sm:scale-100"}`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-white" />
        </button>

        {/* Premium header */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 py-8 text-center relative overflow-hidden">
          {/* Sparkle effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 left-8 w-2 h-2 bg-white rounded-full animate-ping" />
            <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: "0.5s" }} />
            <div className="absolute bottom-4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: "1s" }} />
          </div>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Upgrade to Premium</h2>
          <p className="text-amber-100 text-sm">
            {featureName 
              ? `"${featureName}" is a Premium feature`
              : "Unlock all features and maximize your visibility"
            }
          </p>
        </div>

        {/* Features list */}
        <div className="px-6 py-5 max-h-[40vh] overflow-y-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Premium includes everything:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PREMIUM_PERKS.map((perk, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <perk.icon size={16} className="text-amber-600" />
                </div>
                <span className="text-[13px] text-gray-700">{perk.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-5">
          {/* Price badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-500 line-through text-sm">$42/mo</span>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">50% OFF</span>
            <span className="text-xl font-black text-gray-900">$21/mo</span>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[15px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
          >
            <Zap size={18} />
            Upgrade to Premium
          </button>
          
          <button 
            onClick={handleClose} 
            className="w-full text-center text-xs text-gray-500 mt-3 py-1 hover:text-gray-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
