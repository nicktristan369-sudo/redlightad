"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { account_type: "customer" },
        emailRedirectTo: `${window.location.origin}/kunde`,
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }
    await supabase.auth.signInWithPassword({ email, password });
    router.push("/kunde");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/login-bg.jpg')",
          filter: "brightness(0.4)"
        }}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full p-8" style={{ maxWidth: "420px", background: "#1a1a1a", borderRadius: "16px" }}>
        
        {/* Close button */}
        <Link href="/" className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="dark" height={40} />
        </div>

        {/* Header */}
        <h1 className="text-[24px] font-bold text-center text-white mb-1">Sign Up for Free</h1>
        <p className="text-center text-gray-400 text-[14px] mb-8">Browse profiles, send messages, buy coins</p>

        {!showEmailForm ? (
          <>
            {/* OAuth Section */}
            <p className="text-center text-gray-400 text-[13px] mb-4">Sign up with</p>
            
            {/* OAuth buttons - icon only like Pornhub */}
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

            {/* Email signup button */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3.5 text-[14px] font-semibold text-white bg-[#333] hover:bg-[#444] transition-colors"
              style={{ borderRadius: "4px" }}
            >
              Sign up with email and password
            </button>

            {/* Login link */}
            <p className="text-center text-[14px] text-gray-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#DC2626] font-semibold hover:underline">
                Login
              </Link>{" "}
              here
            </p>

            {/* Terms */}
            <p className="text-center text-[11px] text-gray-500 mt-4 leading-relaxed">
              By signing up, you agree to the{" "}
              <Link href="/terms" className="text-[#DC2626] hover:underline">Terms and Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#DC2626] hover:underline">Privacy Policy</Link>, including Cookie Use.
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

            {error && (
              <div className="text-[13px] text-red-400 bg-red-900/30 border border-red-800 rounded px-3 py-2 mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-[13px] font-medium text-gray-300">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                  style={{ borderRadius: "4px" }}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[13px] font-medium text-gray-300">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                  style={{ borderRadius: "4px" }}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[13px] font-medium text-gray-300">Confirm Password *</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-[14px] text-white placeholder-gray-500 bg-[#2a2a2a] border border-gray-700 focus:border-gray-500 outline-none transition-colors"
                  style={{ borderRadius: "4px" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-[14px] font-semibold text-white bg-[#333] hover:bg-[#444] disabled:opacity-50 transition-colors flex items-center justify-center"
                style={{ borderRadius: "4px" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                ) : "Create account"}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-[14px] text-gray-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#DC2626] font-semibold hover:underline">
                Sign in
              </Link>
            </p>

            {/* Terms */}
            <p className="text-center text-[11px] text-gray-500 mt-4 leading-relaxed">
              By signing up, you agree to the{" "}
              <Link href="/terms" className="text-[#DC2626] hover:underline">Terms and Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#DC2626] hover:underline">Privacy Policy</Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
