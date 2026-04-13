"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function CustomerRegisterPage() {
  const router = useRouter();
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

  const inputStyle = {
    width: "100%", border: "1px solid #E5E7EB", padding: "11px 14px",
    fontSize: 15, outline: "none", borderRadius: 0, background: "#fff", color: "#111",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-5">
        <Link href="/" className="inline-block">
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#DC2626" }}>RED</span>
            <span style={{ color: "#111" }}>LIGHTAD</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link href="/register" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create client account</h1>
          <p className="text-gray-500 text-sm mb-8">Browse profiles, send messages, buy Red Coins</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: "#111", color: "#fff", padding: "13px", fontSize: 15, fontWeight: 700, border: "none", cursor: loading ? "wait" : "pointer", letterSpacing: "-0.01em" }}
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
