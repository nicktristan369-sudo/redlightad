"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Shield, ShieldCheck, Copy, Check, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/2fa/setup");
      const data = await res.json();

      if (data.enabled) {
        setIs2FAEnabled(true);
        setSetupData(null);
      } else if (data.secret) {
        setIs2FAEnabled(false);
        setSetupData({
          secret: data.secret,
          otpauthUrl: data.otpauthUrl,
        });
      }
    } catch (err) {
      setError("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (verifyCode.length !== 6) {
      setError("Enter a 6-digit code");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to enable 2FA");
        setSaving(false);
        return;
      }

      setSuccess("2FA enabled successfully!");
      setIs2FAEnabled(true);
      setSetupData(null);
      setVerifyCode("");
    } catch {
      setError("Failed to enable 2FA");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      setError("Enter your current 2FA code to disable");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/2fa/setup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to disable 2FA");
        setSaving(false);
        return;
      }

      setSuccess("2FA disabled");
      setIs2FAEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      // Fetch new setup data
      fetch2FAStatus();
    } catch {
      setError("Failed to disable 2FA");
    } finally {
      setSaving(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h1>

        {/* 2FA Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <div className="p-2 rounded-lg bg-green-50">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-gray-100">
                  <Shield className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="text-sm text-gray-500">
                  {is2FAEnabled
                    ? "Your account is protected with 2FA"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                {success}
              </div>
            )}

            {is2FAEnabled ? (
              // 2FA is enabled - show disable option
              <div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">2FA is enabled</span>
                  </div>
                  <button
                    onClick={() => setShowDisable(!showDisable)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {showDisable ? "Cancel" : "Disable 2FA"}
                  </button>
                </div>

                {showDisable && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700 mb-3">
                      Enter your current 2FA code to disable two-factor authentication:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="flex-1 px-4 py-2 border border-red-200 rounded-lg text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={handleDisable2FA}
                        disabled={saving || disableCode.length !== 6}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Disable
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : setupData ? (
              // Show setup flow
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    1. Scan QR Code
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    {/* QR Code - using a simple QR code API */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    2. Or enter manually
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Can&apos;t scan? Enter this secret key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                      {setupData.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    3. Verify setup
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleEnable2FA}
                      disabled={saving || verifyCode.length !== 6}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading setup...</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
