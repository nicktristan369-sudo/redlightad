"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [btnHov, setBtnHov] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  const inputClass = "w-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors";
  const inputStyle = (focused: boolean) => ({
    border: `1px solid ${focused ? "#000" : "#E5E5E5"}`,
    borderRadius: "8px",
  });

  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="w-full" style={{ maxWidth: "420px", background: "#fff", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "40px" }}>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="light" height={32} />
        </div>

        {/* Header */}
        <h1 className="text-[24px] font-bold text-center mb-1" style={{ color: "#000" }}>Welcome back</h1>
        <p className="text-center mb-8" style={{ fontSize: "14px", color: "#6B7280" }}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-1.5 font-medium" style={{ fontSize: "13px", color: "#374151" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="your@email.com"
              className={inputClass}
              style={inputStyle(emailFocus)}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="font-medium" style={{ fontSize: "13px", color: "#374151" }}>
                Password
              </label>
              <Link href="#" className="text-[13px] text-gray-900 hover:underline transition-colors" style={{ color: "#374151" }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPwFocus(true)}
                onBlur={() => setPwFocus(false)}
                placeholder="••••••••"
                className={inputClass + " pr-10"}
                style={inputStyle(pwFocus)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-600">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
            style={{ background: btnHov && !loading ? "#CC0000" : "#000", borderRadius: "8px" }}
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : "Sign In →"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "#D1D5DB" }} />
          <span className="text-[13px]" style={{ color: "#9CA3AF" }}>or</span>
          <div className="h-px flex-1" style={{ background: "#D1D5DB" }} />
        </div>

        {/* Sign up */}
        <p className="text-center text-[14px]" style={{ color: "#6B7280" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-gray-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
