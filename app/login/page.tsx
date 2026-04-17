"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";
import OAuthButtons from "@/components/OAuthButtons";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    // Sæt admin cookie hvis det er admin-emailen
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "tristan369@protonmail.com"
    if (email === adminEmail) {
      document.cookie = `admin_verified=${email}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    }
    // Rut baseret på account_type
    const { data: { user: loggedUser } } = await supabase.auth.getUser()
    const accountType = loggedUser?.user_metadata?.account_type
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get("redirect")
    if (redirect) {
      router.push(redirect)
    } else if (accountType === "customer") {
      router.push("/kunde")
    } else if (!accountType) {
      // Ingen metadata — tjek om det er en customer via customer_profiles
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
      <div className="w-full p-8" style={{ maxWidth: "400px", background: "#1a1a1a", borderRadius: "16px" }}>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="dark" height={36} />
        </div>

        {/* Header */}
        <h1 className="text-[22px] font-bold text-center text-white mb-1">Member Log In</h1>
        <p className="text-center text-gray-400 text-[14px] mb-8">Access your RedLightAD account</p>

        {!showEmailForm ? (
          <>
            {/* OAuth Section */}
            <p className="text-center text-gray-400 text-[13px] mb-4">Log in with</p>
            <OAuthButtons variant="login" />

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-gray-700" />
              <span className="text-[13px] text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-700" />
            </div>

            {/* Email login button */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3.5 text-[14px] font-semibold text-white border border-gray-600 hover:bg-gray-800 transition-colors"
              style={{ borderRadius: "8px" }}
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
              {/* Email */}
              <div>
                <label className="block mb-1.5 text-[13px] font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                  style={{ borderRadius: "8px" }}
                />
              </div>

              {/* Password */}
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
                    style={{ borderRadius: "8px" }}
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
                <p className="text-[13px] text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-[14px] font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 transition-colors flex items-center justify-center"
                style={{ borderRadius: "8px" }}
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Sign in"}
              </button>
            </form>

            {/* Sign up link */}
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
  );
}
