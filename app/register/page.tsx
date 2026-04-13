"use client";

import Link from "next/link";
import { User, Users } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-5">
        <Link href="/" className="inline-block">
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#DC2626" }}>RED</span>
            <span style={{ color: "#111" }}>LIGHTAD</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create your account</h1>
          <p className="text-gray-500 text-center mb-10">Choose how you want to use RedLightAD</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Provider */}
            <Link href="/register/provider" className="group block">
              <div className="border-2 border-gray-200 group-hover:border-red-500 p-8 transition-all cursor-pointer bg-white">
                <div className="w-12 h-12 bg-red-50 flex items-center justify-center mb-5">
                  <User className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Create a Profile</h2>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  You are an escort, masseuse or independent provider. Create your profile and get clients.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  Create profile →
                </div>
              </div>
            </Link>

            {/* Customer */}
            <Link href="/register/customer" className="group block">
              <div className="border-2 border-gray-200 group-hover:border-gray-900 p-8 transition-all cursor-pointer bg-white">
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-gray-700" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Browse as a Client</h2>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  You want to find and contact profiles. Create a free client account to unlock messages and more.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Create client account →
                </div>
              </div>
            </Link>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
