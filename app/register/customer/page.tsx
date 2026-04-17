"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";
import OAuthButtons from "@/components/OAuthButtons";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    // Auto sign-in
    await supabase.auth.signInWithPassword({ email, password });
    router.push("/kunde");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#0d0d0d" }}>
      <div className="w-full p-8" style={{ maxWidth: "400px", background: "#1a1a1a", borderRadius: "16px" }}>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="dark" height={36} />
        </div>

        {/* Header */}
        <h1 className="text-[22px] font-bold text-center text-white mb-1">Sign Up for Free</h1>
        <p className="text-center text-gray-400 text-[14px] mb-8">Browse profiles, send messages, buy coins</p>

        {!showEmailForm ? (
          <>
            {/* OAuth Section */}
            <p className="text-center text-gray-400 text-[13px] mb-4">Sign up with</p>
            <OAuthButtons variant="signup" redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/kunde`} />

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-gray-700" />
              <span className="text-[13px] text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-700" />
            </div>

            {/* Email signup button */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3.5 text-[14px] font-semibold text-white border border-gray-600 hover:bg-gray-800 transition-colors"
              style={{ borderRadius: "8px" }}
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
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms and Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>.
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
              <div className="text-[13px] text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">{error}</div>
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
                  style={{ borderRadius: "8px" }}
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
                  style={{ borderRadius: "8px" }}
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
                  style={{ borderRadius: "8px" }}
                />
              </div>

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
              <Link href="/terms" className="text-gray-400 hover:text-white">Terms and Conditions</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
