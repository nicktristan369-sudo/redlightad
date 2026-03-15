"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

type AccountType = "provider" | "customer" | null;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [cpwFocus, setCpwFocus] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: accountType,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <div className="flex justify-center mb-6"><Logo variant="light" height={32} /></div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-6">
            <p className="text-lg font-semibold text-green-800">
              Tjek din email for at bekræfte din konto ✅
            </p>
            <p className="mt-2 text-sm text-green-600">
              Vi har sendt en bekræftelsesmail til {email}
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-red-600 hover:underline"
          >
            Gå til login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100" style={{ maxWidth: "680px" }}>

        {step === 1 ? (
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-3">Create Your Account</p>
              <h1 className="text-[32px] font-bold text-gray-900 leading-tight mb-2">Select Your Account Type</h1>
              <p className="text-base text-gray-500">Choose how you want to use RedLightAD</p>
            </div>

            {/* Two cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

              {/* Provider card */}
              <button
                type="button"
                onClick={() => setAccountType("provider")}
                className="text-left rounded-2xl border-2 p-6 transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: accountType === "provider" ? "#000" : "#E5E7EB",
                  boxShadow: accountType === "provider" ? "0 2px 12px rgba(0,0,0,0.10)" : "none",
                }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Create Profile</h2>
                <p className="text-[11px] font-bold text-red-600 tracking-[0.1em] uppercase mb-2">For Providers</p>
                <p className="text-sm text-gray-500 mb-4">Post listings, receive bookings, and grow your business</p>
                <ul className="space-y-1.5 mb-5">
                  {["Post Listings", "Receive Messages", "Add Media & Videos", "Voice Messages", "Boost Visibility"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-bold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full">
                    ⭐ Most Popular
                  </span>
                </div>
              </button>

              {/* Customer card */}
              <button
                type="button"
                onClick={() => setAccountType("customer")}
                className="text-left rounded-2xl border-2 p-6 transition-all duration-150 focus:outline-none"
                style={{
                  borderColor: accountType === "customer" ? "#000" : "#E5E7EB",
                  boxShadow: accountType === "customer" ? "0 2px 12px rgba(0,0,0,0.10)" : "none",
                }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gray-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Customer Account</h2>
                <p className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-2">For Clients</p>
                <p className="text-sm text-gray-500 mb-4">Browse providers, message securely</p>
                <ul className="space-y-1.5">
                  {["Private Profile", "Secure Messaging", "Buy RedCoins", "Unlock Exclusive Content"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>

            </div>

            {/* Info box */}
            <div className="flex gap-3 rounded-xl p-4 mb-6" style={{ backgroundColor: "#F5F5F7", border: "1px solid #E5E7EB" }}>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-700">Note: Your account type is permanent</p>
                <p className="text-sm text-gray-500 mt-0.5">Providers can post listings. Customers can browse and book. Choose carefully — you cannot switch later.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={!accountType}
                onClick={() => setStep(2)}
                className="flex-1 py-3 text-sm font-semibold text-white transition-colors"
                style={{
                  borderRadius: "8px",
                  backgroundColor: accountType ? "#111" : "#D1D5DB",
                  cursor: accountType ? "pointer" : "not-allowed",
                }}
              >
                Continue →
              </button>
            </div>
          </div>

        ) : (
          <div className="p-8 sm:p-10">
            {/* Back + badge */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                style={{ background: "#000" }}>
                {accountType === "provider" ? "✦ Provider" : "◆ Customer"}
              </span>
            </div>

            {/* Header */}
            <div className="flex justify-center mb-6">
              <Logo variant="light" height={28} />
            </div>
            <h1 className="text-[24px] font-bold text-center mb-1" style={{ color: "#000" }}>Create Account</h1>
            <p className="text-center mb-7" style={{ fontSize: "14px", color: "#6B7280" }}>
              Fill in your details to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block mb-1.5 font-medium" style={{ fontSize: "13px", color: "#374151" }}>
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                  style={{ border: `1px solid ${emailFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block mb-1.5 font-medium" style={{ fontSize: "13px", color: "#374151" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPwFocus(true)}
                    onBlur={() => setPwFocus(false)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                    style={{ border: `1px solid ${pwFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="reg-confirm" className="block mb-1.5 font-medium" style={{ fontSize: "13px", color: "#374151" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setCpwFocus(true)}
                    onBlur={() => setCpwFocus(false)}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                    style={{ border: `1px solid ${cpwFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-black"
                  />
                  <span style={{ fontSize: "13px", color: "#374151" }}>
                    I agree to the{" "}
                    <Link href="/terms" className="underline font-medium hover:text-black" target="_blank">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline font-medium hover:text-black" target="_blank">Privacy Policy</Link>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeAge}
                    onChange={e => setAgreeAge(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-black"
                  />
                  <span style={{ fontSize: "13px", color: "#374151" }}>
                    I confirm I am 18 years of age or older
                  </span>
                </label>
              </div>

              {error && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !agreeTerms || !agreeAge}
                className="w-full py-3 text-sm font-semibold text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40"
                style={{ background: btnHov && !loading ? "#CC0000" : "#000", borderRadius: "8px" }}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Create Account →"}
              </button>
            </form>

            {/* Sign in */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "#D1D5DB" }} />
              <span className="text-[13px]" style={{ color: "#9CA3AF" }}>or</span>
              <div className="h-px flex-1" style={{ background: "#D1D5DB" }} />
            </div>
            <p className="text-center text-[14px]" style={{ color: "#6B7280" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-gray-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
