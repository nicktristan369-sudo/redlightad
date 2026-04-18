"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#0d0d0d" }}>
      
      {/* Modal */}
      <div className="relative w-full overflow-hidden" style={{ maxWidth: "520px", background: "#1a1a1a", borderRadius: "20px" }}>
        
        {/* Close button */}
        <Link href="/" className="absolute top-5 right-5 z-20 text-gray-500 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo variant="dark" height={40} />
          </div>

          {/* Header */}
          <h1 className="text-[26px] font-bold text-center text-white mb-2">Join RedLightAD</h1>
          <p className="text-center text-gray-400 text-[15px] mb-10">Choose how you want to get started</p>

          {/* Options */}
          <div className="space-y-4">
            
            {/* Create Profile - Provider */}
            <Link href="/register/provider" className="group block">
              <div 
                className="relative p-6 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ 
                  background: "linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%)",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, transparent 100%)" }} 
                />
                
                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                    style={{ background: "#DC2626", borderRadius: "10px" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-semibold text-white mb-1 group-hover:text-[#DC2626] transition-colors">
                      Create a Profile
                    </h2>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      For escorts, masseuses & independent providers. Get discovered by clients.
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 self-center">
                    <svg 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-gray-600 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Browse as Client */}
            <Link href="/register/customer" className="group block">
              <div 
                className="relative p-6 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ 
                  background: "linear-gradient(135deg, #1f1f1f 0%, #2a2a2a 100%)",
                  border: "1px solid #333",
                  borderRadius: "12px",
                }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)" }} 
                />
                
                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                    style={{ background: "#333", borderRadius: "10px" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-semibold text-white mb-1 group-hover:text-gray-200 transition-colors">
                      Browse as a Client
                    </h2>
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      Find & contact profiles. Create a free account to unlock messages.
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 self-center">
                    <svg 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-[12px] text-gray-500 uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Login link */}
          <p className="text-center text-[14px] text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-semibold hover:text-[#DC2626] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
