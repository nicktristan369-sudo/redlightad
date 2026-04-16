"use client"

import { Phone, MessageSquare, X } from "lucide-react"

// ── Centered Modal Wrapper ─────────────────────────────────────
export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (visual only) */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Shared Contact Modal ───────────────────────────────────────
export function ContactModal({ phone, whatsapp, profileImage, name, onClose }: {
  phone: string | null
  whatsapp: string | null
  profileImage?: string | null
  name?: string
  onClose: () => void
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pt-2 pb-6">
        {/* Profile Image & Header */}
        <div className="flex flex-col items-center mb-6">
          {profileImage && (
            <img 
              src={profileImage} 
              alt={name ?? ""}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 mb-3 shadow-sm" 
            />
          )}
          <h3 className="text-[18px] font-bold text-gray-900">Contact me</h3>
          <p className="text-[13px] text-gray-400 text-center mt-1 leading-relaxed">
            Please mention you found me on<br />
            <span className="font-semibold text-gray-500">RedLightAD.com</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Ring Button - Primary Green */}
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[15px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Phone size={18} /> Ring: {phone}
            </a>
          )}

          {/* SMS Button */}
          {phone && (
            <a 
              href={`sms:${phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[14px] font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={18} className="text-gray-500" /> SMS: {phone}
            </a>
          )}

          {/* WhatsApp Button */}
          {whatsapp && (
            <a 
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[14px] font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp: {whatsapp}
            </a>
          )}

          {/* Empty State */}
          {!phone && !whatsapp && (
            <p className="text-[14px] text-gray-400 text-center py-4">
              Ingen kontaktinfo tilgængeligt
            </p>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Luk
          </button>
        </div>
      </div>
    </Sheet>
  )
}
