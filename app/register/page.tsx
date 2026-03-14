"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Kodeord skal være mindst 6 tegn");
      return;
    }

    if (password !== confirmPassword) {
      setError("Kodeord matcher ikke");
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
          <p className="mb-6 text-2xl font-bold text-red-600">REDLIGHTAD</p>
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
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {accountType === "provider" ? "Provider" : "Customer"}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900">Opret konto</h1>
            <p className="mb-6 text-sm text-gray-500">
              Udfyld dine oplysninger
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="din@email.dk"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Kodeord
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Bekræft kodeord
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <svg
                    className="mx-auto h-5 w-5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Opret konto"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Har du allerede en konto?{" "}
              <Link href="/login" className="font-medium text-gray-900 underline hover:text-black">
                Log ind
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
