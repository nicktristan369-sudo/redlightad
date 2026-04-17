"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "twitter" | null>(null);
  const [error, setError] = useState("");

  const handleOAuth = async (provider: "google" | "twitter") => {
    setOauthLoading(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "tristan369@protonmail.com"
    if (email === adminEmail) {
      document.cookie = `admin_verified=${email}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    }
    const { data: { user: loggedUser } } = await supabase.auth.getUser()
    const accountType = loggedUser?.user_metadata?.account_type
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get("redirect")
    if (redirect) {
      router.push(redirect)
    } else if (accountType === "customer") {
      router.push("/kunde")
    } else if (!accountType) {
      const { data: cp } = await supabase.from("customer_profiles").select("user_id").eq("user_id", loggedUser?.id ?? "").single()
      if (cp) {
        router.push("/kunde")
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#0d0d0d" }}>
      
      {/* Modal with image header */}
      <div className="relative w-full overflow-hidden" style={{ maxWidth: "420px", background: "#1a1a1a", borderRadius: "16px" }}>
        
        {/* Close button */}
        <Link href="/" className="absolute top-4 right-4 z-20 text-white/80 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>

        {/* Image header inside modal */}
        <div className="relative h-[180px] overflow-hidden">
          <img 
            src="/login-bg.jpg" 
            alt="" 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
          
          {/* Logo + Title overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Logo variant="dark" height={44} />
            <h1 className="text-[22px] font-bold text-white mt-2">Member Log In</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <p className="text-center text-gray-400 text-[14px] mb-6">Access your RedLightAD account</p>

          {!showEmailForm ? (
            <>
              {/* OAuth Section */}
              <p className="text-center text-gray-400 text-[13px] mb-4">Log in with</p>
              
              {/* OAuth buttons - icon only */}
              <div className="flex gap-3 justify-center mb-6">
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center w-[140px] h-[52px] bg-white hover:bg-gray-100 disabled:opacity-50 transition-all"
                  style={{ borderRadius: "4px" }}
                >
                  {oauthLoading === "google" ? (
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleOAuth("twitter")}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center w-[140px] h-[52px] bg-black border border-gray-700 hover:bg-gray-900 disabled:opacity-50 transition-all"
                  style={{ borderRadius: "4px" }}
                >
                  {oauthLoading === "twitter" ? (
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-[13px] text-gray-500">OR</span>
                <div className="h-px flex-1 bg-gray-700" />
              </div>

              {/* Email login button */}
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full py-3.5 text-[14px] font-semibold text-white bg-[#333] hover:bg-[#444] transition-colors"
                style={{ borderRadius: "4px" }}
              >
                Log in with email and password
              </button>

              {/* Sign up link */}
              <p className="text-center text-[14px] text-gray-400 mt-6">
                Don't have an account yet?{" "}
                <Link href="/register" className="text-[#DC2626] font-semibold hover:underline">
                  Sign Up
                </Link>{" "}
                here
              </p>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-gray-400 text-[13px] mb-4 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                    style={{ borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-medium text-gray-300">Password</label>
                    <Link href="#" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-10 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                      style={{ borderRadius: "4px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[13px] text-red-400 bg-red-900/30 border border-red-800 rounded px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-[14px] font-semibold text-white bg-[#333] hover:bg-[#444] disabled:opacity-50 transition-colors flex items-center justify-center"
                  style={{ borderRadius: "4px" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                  ) : "Sign in"}
                </button>
              </form>

              <p className="text-center text-[14px] text-gray-400 mt-6">
                Don't have an account?{" "}
                <Link href="/register" className="text-[#DC2626] font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
