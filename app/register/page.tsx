"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";
import { Smartphone, CheckCircle, RefreshCw } from "lucide-react";

type AccountType = "provider" | "customer" | null;

// Country dial codes (top used + alphabetical)
const DIAL_CODES = [
  { code: "+45", iso: "DK", name: "Denmark" },
  { code: "+46", iso: "SE", name: "Sweden" },
  { code: "+47", iso: "NO", name: "Norway" },
  { code: "+358", iso: "FI", name: "Finland" },
  { code: "+44", iso: "GB", name: "United Kingdom" },
  { code: "+49", iso: "DE", name: "Germany" },
  { code: "+33", iso: "FR", name: "France" },
  { code: "+31", iso: "NL", name: "Netherlands" },
  { code: "+34", iso: "ES", name: "Spain" },
  { code: "+39", iso: "IT", name: "Italy" },
  { code: "+1",  iso: "US", name: "USA / Canada" },
  { code: "+61", iso: "AU", name: "Australia" },
  { code: "+66", iso: "TH", name: "Thailand" },
  { code: "+63", iso: "PH", name: "Philippines" },
  { code: "+55", iso: "BR", name: "Brazil" },
  { code: "+52", iso: "MX", name: "Mexico" },
  { code: "+48", iso: "PL", name: "Poland" },
  { code: "+43", iso: "AT", name: "Austria" },
  { code: "+32", iso: "BE", name: "Belgium" },
  { code: "+41", iso: "CH", name: "Switzerland" },
  { code: "+420", iso: "CZ", name: "Czech Republic" },
  { code: "+36", iso: "HU", name: "Hungary" },
  { code: "+40", iso: "RO", name: "Romania" },
  { code: "+30", iso: "GR", name: "Greece" },
  { code: "+351", iso: "PT", name: "Portugal" },
  { code: "+380", iso: "UA", name: "Ukraine" },
  { code: "+7",  iso: "RU", name: "Russia" },
  { code: "+90", iso: "TR", name: "Turkey" },
  { code: "+971", iso: "AE", name: "UAE" },
  { code: "+27", iso: "ZA", name: "South Africa" },
  { code: "+81", iso: "JP", name: "Japan" },
  { code: "+82", iso: "KR", name: "South Korea" },
  { code: "+86", iso: "CN", name: "China" },
  { code: "+91", iso: "IN", name: "India" },
  { code: "+60", iso: "MY", name: "Malaysia" },
];

const RESEND_DELAY = 30;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<AccountType>(null);

  // Step 2 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [cpwFocus, setCpwFocus] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 3 state
  const [dialCode, setDialCode] = useState("+45");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showDialDropdown, setShowDialDropdown] = useState(false);
  const [dialSearch, setDialSearch] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullPhone = dialCode + phoneNumber.replace(/\s/g, "");

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resendTimer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { account_type: accountType } },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setUserId(data.user?.id ?? null);
    setLoading(false);
    setStep(3);
  };

  const sendCode = async () => {
    setPhoneError("");
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 5) {
      setPhoneError("Please enter a valid phone number");
      return;
    }
    setSendingCode(true);
    const res = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone }),
    });
    const data = await res.json();
    setSendingCode(false);
    if (!res.ok) { setPhoneError(data.error ?? "Failed to send SMS"); return; }
    setCodeSent(true);
    setResendTimer(RESEND_DELAY);
    setCodeInputs(["", "", "", "", "", ""]);
    setTimeout(() => codeRefs.current[0]?.focus(), 100);
  };

  const handleCodeInput = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...codeInputs];
    next[i] = digit;
    setCodeInputs(next);
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeInputs[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const verifyCode = async () => {
    const code = codeInputs.join("");
    if (code.length < 6) { setPhoneError("Enter the full 6-digit code"); return; }
    setVerifying(true);
    setPhoneError("");
    const res = await fetch("/api/auth/verify-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone, code, user_id: userId }),
    });
    const data = await res.json();
    setVerifying(false);
    if (!res.ok) { setPhoneError(data.error ?? "Verification failed"); return; }
    setPhoneVerified(true);
  };

  const skipPhone = async () => {
    // Mark email verified — proceed to success
    setPhoneVerified(true);
  };

  const filteredDials = DIAL_CODES.filter(d =>
    !dialSearch || d.name.toLowerCase().includes(dialSearch.toLowerCase()) || d.code.includes(dialSearch)
  );

  if (phoneVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F5F5F7" }}>
        <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
          <div className="flex justify-center mb-4"><Logo variant="light" height={28} /></div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#DCFCE7" }}>
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-[14px] text-gray-500 mb-6">
            Check your email at <strong>{email}</strong> to confirm your account, then log in.
          </p>
          <Link href="/login"
            className="inline-block w-full py-3 text-[13px] font-semibold text-white rounded-xl transition-colors"
            style={{ background: "#000" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#CC0000")}
            onMouseLeave={e => (e.currentTarget.style.background = "#000")}>
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5F5F7" }}>
      {/* Step indicator */}
      <div className="w-full" style={{ maxWidth: "680px" }}>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors"
                style={{ background: step >= s ? "#000" : "#E5E5E5", color: step >= s ? "#fff" : "#9CA3AF" }}>
                {s}
              </div>
              {s < 3 && <div className="w-8 h-0.5" style={{ background: step > s ? "#000" : "#E5E5E5" }} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-3">Step 1 of 3</p>
                <h1 className="text-[32px] font-bold text-gray-900 leading-tight mb-2">Select Your Account Type</h1>
                <p className="text-base text-gray-500">Choose how you want to use RedLightAD</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Provider */}
                <button type="button" onClick={() => setAccountType("provider")}
                  className="text-left rounded-2xl border-2 p-6 transition-all duration-150 focus:outline-none"
                  style={{ borderColor: accountType === "provider" ? "#000" : "#E5E7EB", boxShadow: accountType === "provider" ? "0 2px 12px rgba(0,0,0,0.10)" : "none" }}>
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Create Profile</h2>
                  <p className="text-[11px] font-bold text-red-600 tracking-[0.1em] uppercase mb-2">For Providers</p>
                  <p className="text-sm text-gray-500 mb-4">Post listings, receive bookings, and grow your business</p>
                  <ul className="space-y-1.5">
                    {["Post Listings", "Receive Messages", "Add Media & Videos", "Voice Messages", "Boost Visibility"].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
                {/* Customer */}
                <button type="button" onClick={() => setAccountType("customer")}
                  className="text-left rounded-2xl border-2 p-6 transition-all duration-150 focus:outline-none"
                  style={{ borderColor: accountType === "customer" ? "#000" : "#E5E7EB", boxShadow: accountType === "customer" ? "0 2px 12px rgba(0,0,0,0.10)" : "none" }}>
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
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
              <div className="flex gap-3">
                <Link href="/" className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap">Cancel</Link>
                <button type="button" disabled={!accountType} onClick={() => setStep(2)}
                  className="flex-1 py-3 text-sm font-semibold text-white transition-colors"
                  style={{ borderRadius: "8px", backgroundColor: accountType ? "#111" : "#D1D5DB", cursor: accountType ? "pointer" : "not-allowed" }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="p-8 sm:p-10">
              <div className="mb-6 flex items-center gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold text-white" style={{ background: "#000" }}>
                  {accountType === "provider" ? "✦ Provider" : "◆ Customer"}
                </span>
                <span className="text-[12px] text-gray-400 ml-auto">Step 2 of 3</span>
              </div>
              <div className="flex justify-center mb-6"><Logo variant="light" height={28} /></div>
              <h1 className="text-[24px] font-bold text-center mb-1">Create Account</h1>
              <p className="text-center mb-7 text-[14px] text-gray-500">Fill in your details to get started</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-medium text-gray-700">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                    style={{ border: `1px solid ${emailFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} placeholder="Min. 6 characters"
                      className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                      style={{ border: `1px solid ${pwFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => setCpwFocus(true)} onBlur={() => setCpwFocus(false)} placeholder="Repeat your password"
                      className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors"
                      style={{ border: `1px solid ${cpwFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showConfirmPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-black" />
                    <span className="text-[13px] text-gray-700">I agree to the <Link href="/terms" className="underline font-medium" target="_blank">Terms of Service</Link> and <Link href="/privacy" className="underline font-medium" target="_blank">Privacy Policy</Link></span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={agreeAge} onChange={e => setAgreeAge(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-black" />
                    <span className="text-[13px] text-gray-700">I confirm I am 18 years of age or older</span>
                  </label>
                </div>
                {error && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">{error}</p>}
                <button type="submit" disabled={loading || !agreeTerms || !agreeAge}
                  className="w-full py-3 text-sm font-semibold text-white flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: btnHov && !loading ? "#CC0000" : "#000", borderRadius: "8px" }}
                  onMouseEnter={() => setBtnHov(true)} onMouseLeave={() => setBtnHov(false)}>
                  {loading ? <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : "Continue →"}
                </button>
              </form>
              <div className="my-6 flex items-center gap-3"><div className="h-px flex-1" style={{ background: "#D1D5DB" }} /><span className="text-[13px] text-gray-400">or</span><div className="h-px flex-1" style={{ background: "#D1D5DB" }} /></div>
              <p className="text-center text-[14px] text-gray-500">Already have an account? <Link href="/login" className="font-bold text-gray-900 hover:underline">Sign in</Link></p>
            </div>
          )}

          {/* ── STEP 3 — Phone Verification ── */}
          {step === 3 && (
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                  <Smartphone size={20} color="#374151" />
                </div>
                <div>
                  <h1 className="text-[20px] font-bold text-gray-900">Verify your phone</h1>
                  <p className="text-[12px] text-gray-400">Step 3 of 3 · optional but recommended</p>
                </div>
              </div>

              {!codeSent ? (
                <div className="space-y-4">
                  <p className="text-[14px] text-gray-600">
                    Enter your phone number to receive a verification code via SMS.
                  </p>

                  {/* Phone input */}
                  <div>
                    <label className="block mb-1.5 text-[13px] font-medium text-gray-700">Phone number</label>
                    <div className="flex gap-2">
                      {/* Dial code picker */}
                      <div className="relative">
                        <button type="button" onClick={() => setShowDialDropdown(v => !v)}
                          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold h-full transition-colors"
                          style={{ border: "1px solid #E5E5E5", minWidth: "80px", background: showDialDropdown ? "#F5F5F5" : "#fff" }}>
                          {dialCode}
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showDialDropdown && (
                          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl overflow-hidden"
                            style={{ border: "1px solid #E5E5E5", width: "220px" }}>
                            <div className="p-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <input value={dialSearch} onChange={e => setDialSearch(e.target.value)}
                                placeholder="Search country…"
                                className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
                                style={{ border: "1px solid #E5E5E5" }} autoFocus />
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                              {filteredDials.map(d => (
                                <button key={d.iso} type="button"
                                  onClick={() => { setDialCode(d.code); setShowDialDropdown(false); setDialSearch(""); }}
                                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 w-10">{d.code}</span>
                                  <span className="text-gray-500 truncate">{d.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Number */}
                      <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        onFocus={() => setPhoneFocus(true)} onBlur={() => setPhoneFocus(false)}
                        placeholder="XX XX XX XX" type="tel"
                        className="flex-1 px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 outline-none"
                        style={{ border: `1px solid ${phoneFocus ? "#000" : "#E5E5E5"}`, borderRadius: "8px" }} />
                    </div>
                  </div>

                  {phoneError && <p className="text-[13px] text-red-600">{phoneError}</p>}

                  <button onClick={sendCode} disabled={sendingCode}
                    className="w-full py-3 text-[13px] font-semibold text-white rounded-xl disabled:opacity-40 transition-colors"
                    style={{ background: "#000" }}
                    onMouseEnter={e => { if (!sendingCode) e.currentTarget.style.background = "#CC0000"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                    {sendingCode ? "Sending…" : "Send verification code"}
                  </button>

                  <button onClick={skipPhone} type="button"
                    className="w-full py-3 text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                    Skip for now →
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <CheckCircle size={16} color="#16A34A" className="flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-green-700">
                      Code sent to <strong>{fullPhone}</strong>. Valid for 10 minutes.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-3 text-[13px] font-medium text-gray-700">Enter the 6-digit code</label>
                    <div className="flex gap-2 justify-center">
                      {codeInputs.map((v, i) => (
                        <input
                          key={i}
                          ref={el => { codeRefs.current[i] = el; }}
                          type="text" inputMode="numeric" maxLength={1} value={v}
                          onChange={e => handleCodeInput(i, e.target.value)}
                          onKeyDown={e => handleCodeKeyDown(i, e)}
                          className="w-11 h-14 text-center text-[20px] font-bold outline-none rounded-xl transition-colors"
                          style={{ border: `2px solid ${v ? "#000" : "#E5E5E5"}` }}
                        />
                      ))}
                    </div>
                  </div>

                  {phoneError && <p className="text-[13px] text-red-600 text-center">{phoneError}</p>}

                  <button onClick={verifyCode} disabled={verifying || codeInputs.join("").length < 6}
                    className="w-full py-3 text-[13px] font-semibold text-white rounded-xl disabled:opacity-40 transition-colors"
                    style={{ background: "#000" }}
                    onMouseEnter={e => { if (!verifying) e.currentTarget.style.background = "#CC0000"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "#000"}>
                    {verifying ? "Verifying…" : "Verify →"}
                  </button>

                  <div className="flex items-center justify-between text-[13px]">
                    <button type="button" onClick={() => { setCodeSent(false); setCodeInputs(["","","","","",""]); setPhoneError(""); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                      ← Change number
                    </button>
                    {resendTimer > 0 ? (
                      <span className="text-gray-400 flex items-center gap-1">
                        <RefreshCw size={12} /> Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button type="button" onClick={sendCode} disabled={sendingCode}
                        className="text-gray-900 font-semibold hover:text-red-600 transition-colors flex items-center gap-1">
                        <RefreshCw size={12} /> Resend code
                      </button>
                    )}
                  </div>

                  <button onClick={skipPhone} type="button"
                    className="w-full py-2 text-[13px] font-medium text-gray-400 hover:text-gray-600 transition-colors">
                    Skip verification →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
