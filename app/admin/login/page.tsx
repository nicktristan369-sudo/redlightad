"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [totpFocus, setTotpFocus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          totp_code: totpCode || undefined,
        }),
      });

      const data = await res.json();

      // Check if 2FA is required
      if (data.requires_2fa) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials");
        setLoading(false);
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0A" }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px)",
        }}
      />

      <div
        className="relative w-full"
        style={{ maxWidth: "400px" }}
      >
        {/* Logo mark */}
        <div
          className="flex justify-center mb-10"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#CC0000" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 10L10 18L2 10L10 2Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#111",
            border: "1px solid #1F1F1F",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          <h1
            className="text-[22px] font-bold mb-1"
            style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}
          >
            Welcome back
          </h1>
          <p className="text-[13px] mb-8" style={{ color: "#555" }}>
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-medium mb-2"
                style={{ color: "#888" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-[14px] outline-none transition-all"
                style={{
                  background: "#1A1A1A",
                  border: `1px solid ${emailFocus ? "#444" : "#252525"}`,
                  borderRadius: "10px",
                  color: "#F5F5F5",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-medium mb-2"
                style={{ color: "#888" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 text-[14px] outline-none transition-all"
                  style={{
                    background: "#1A1A1A",
                    border: `1px solid ${pwFocus ? "#444" : "#252525"}`,
                    borderRadius: "10px",
                    color: "#F5F5F5",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#555" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#999")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#555")
                  }
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    ) : (
                      <>
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
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* 2FA Code */}
            {requires2FA && (
              <div>
                <label
                  htmlFor="totp"
                  className="block text-[12px] font-medium mb-2"
                  style={{ color: "#888" }}
                >
                  2FA Code
                </label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setTotpFocus(true)}
                  onBlur={() => setTotpFocus(false)}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-[14px] outline-none transition-all text-center tracking-[0.5em] font-mono"
                  style={{
                    background: "#1A1A1A",
                    border: `1px solid ${totpFocus ? "#444" : "#252525"}`,
                    borderRadius: "10px",
                    color: "#F5F5F5",
                    letterSpacing: "0.5em",
                  }}
                />
                <p className="text-[11px] mt-2" style={{ color: "#666" }}>
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                className="text-[12px] px-3 py-2.5 rounded-lg"
                style={{
                  background: "rgba(204,0,0,0.12)",
                  border: "1px solid rgba(204,0,0,0.2)",
                  color: "#FF6B6B",
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-[14px] font-semibold transition-all disabled:opacity-50 mt-2"
              style={{
                background: "#fff",
                color: "#000",
                borderRadius: "10px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#E5E5E5";
              }}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fff")
              }
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
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
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-[11px] mt-6"
          style={{ color: "#333" }}
        >
          This page is not indexed.
        </p>
      </div>
    </div>
  );
}
