"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface OAuthButtonsProps {
  redirectTo?: string;
  variant?: "login" | "signup";
}

export default function OAuthButtons({ redirectTo, variant = "login" }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);

  const handleOAuth = async (provider: "google" | "twitter") => {
    setLoading(provider);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      setLoading(null);
    }
  };

  const text = variant === "signup" ? "Sign up with" : "Continue with";

  return (
    <div className="flex gap-3">
      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={loading !== null}
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium text-[14px] hover:bg-gray-50 disabled:opacity-50 transition-all"
        style={{ borderRadius: "8px" }}
      >
        {loading === "google" ? (
          <svg className="h-5 w-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
            </svg>
            <span className="hidden sm:inline">{text} Google</span>
            <span className="sm:hidden">Google</span>
          </>
        )}
      </button>

      {/* X (Twitter) Button */}
      <button
        type="button"
        onClick={() => handleOAuth("twitter")}
        disabled={loading !== null}
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-black text-white font-medium text-[14px] hover:bg-gray-900 disabled:opacity-50 transition-all"
        style={{ borderRadius: "8px" }}
      >
        {loading === "twitter" ? (
          <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="hidden sm:inline">{text} X</span>
            <span className="sm:hidden">X</span>
          </>
        )}
      </button>
    </div>
  );
}
