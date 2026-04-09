import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Lock, Shield, EyeOff, Star, Globe, CheckCircle, CreditCard } from "lucide-react";

export const metadata = {
  title: "About Us — RedLightAD",
  description: "RedLightAD is Europe's leading premium adult advertising platform — built on privacy, safety, and discretion.",
  openGraph: {
    title: "About Us — RedLightAD",
    description: "RedLightAD is Europe's leading premium adult advertising platform.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-6">
            About RedLightAD
          </p>
          <h1 className="text-[40px] sm:text-[56px] font-black leading-[1.05] tracking-tight mb-6">
            The Premier Platform<br className="hidden sm:block" /> for Adult Advertising
          </h1>
          <p className="text-[17px] sm:text-[19px] text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Built for privacy. Designed for discretion. Trusted by verified professionals across Europe and beyond.
          </p>
        </div>
      </section>

      {/* ── Who we are ── */}
      <section style={{ background: "#F5F5F7" }}>
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-4">Who We Are</p>
              <h2 className="text-[30px] sm:text-[36px] font-black text-gray-900 leading-tight mb-5">
                A platform built<br />on trust
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
                RedLightAD is a premium adult advertising platform connecting verified independent professionals with a global audience. We operate with a strict quality-first approach — every profile is reviewed, every transaction is secure.
              </p>
              <p className="text-[15px] text-gray-500 leading-relaxed">
                We believe that adult services deserve the same level of professionalism, privacy, and technology as any other industry. That is the standard we hold ourselves to.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "14+", label: "Countries" },
                { num: "100%", label: "Verified Profiles" },
                { num: "256-bit", label: "Encryption" },
                { num: "24/7", label: "Platform Uptime" },
              ].map(({ num, label }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E5E5E5] p-6 text-center"
                >
                  <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{num}</p>
                  <p className="text-[13px] text-gray-400 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Our Values</p>
            <h2 className="text-[30px] sm:text-[36px] font-black text-gray-900">What we stand for</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Lock size={22} strokeWidth={1.8} />,
                title: "Privacy",
                desc: "Your data is yours. We never sell, share, or exploit personal information. End-to-end privacy by design.",
              },
              {
                icon: <Shield size={22} strokeWidth={1.8} />,
                title: "Safety",
                desc: "Every listing is manually reviewed before going live. Zero tolerance for exploitation or illegal content.",
              },
              {
                icon: <EyeOff size={22} strokeWidth={1.8} />,
                title: "Discretion",
                desc: "Anonymous browsing, discreet payments, and no identifying information exposed without consent.",
              },
              {
                icon: <Star size={22} strokeWidth={1.8} />,
                title: "Quality",
                desc: "Premium design, verified profiles, and a curated experience. No low-effort listings allowed.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#E5E5E5] p-7 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "#F5F5F7", color: "#111" }}>
                  {icon}
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform stats ── */}
      <section style={{ background: "#F5F5F7" }}>
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Platform</p>
            <h2 className="text-[30px] sm:text-[36px] font-black text-gray-900">Built to scale</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe size={20} strokeWidth={1.8} />,
                title: "14 Countries",
                desc: "Active presence across Europe with continued expansion.",
              },
              {
                icon: <CheckCircle size={20} strokeWidth={1.8} />,
                title: "Verified Profiles",
                desc: "Every provider is manually reviewed and approved before publishing.",
              },
              {
                icon: <CreditCard size={20} strokeWidth={1.8} />,
                title: "Secure Payments",
                desc: "Stripe, crypto, and RedCoins — all transactions are encrypted and private.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-[#E5E5E5] p-7 flex gap-5"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#000", color: "#fff" }}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24 text-center">
          <h2 className="text-[30px] sm:text-[40px] font-black leading-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-[16px] text-gray-400 mb-10 leading-relaxed">
            Join thousands of verified professionals on Europe's most trusted adult advertising platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create-profile"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-semibold text-[15px] px-8 py-3.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Post an Ad
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 text-white font-semibold text-[15px] px-8 py-3.5 rounded-full hover:border-gray-500 transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
