"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface ReportModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

const REASONS = [
  "Fake Profile",
  "Underage",
  "Scam",
  "Spam",
  "Stolen Photos",
  "Other",
];

export default function ReportModal({ listingId, isOpen, onClose, isLoggedIn }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [reporterId, setReporterId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      createClient().auth.getUser().then(({ data }) => {
        setReporterId(data.user?.id ?? null);
      });
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setDetails("");
      setSubmitting(false);
      setSubmitted(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason || !details) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          reporter_id: reporterId,
          reason,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <span style={{ fontSize: 18, fontWeight: 700 }}>Report Profile</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        {!isLoggedIn ? (
          <div style={{ padding: "0 16px 16px" }}>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
              You must be logged in to report a profile.
            </p>
            <button
              onClick={onClose}
              style={{ background: "white", border: "1px solid #D1D5DB", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        ) : submitted ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#16A34A" }}>Report submitted. Thank you.</p>
          </div>
        ) : (
          <>
            {/* Warning */}
            <div style={{ background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 0, padding: 12, margin: "0 16px 16px" }}>
              <p style={{ fontSize: 13, color: "#854D0E", margin: 0 }}>
                False reporting is a violation of our terms of service and may result in account suspension.
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: "0 16px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Reason for Report*
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 0, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }}
              >
                <option value="">Select a reason...</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Details*
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Please provide details..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 0, fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
                {details.length}/500
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>{error}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px 16px" }}>
              <button
                onClick={onClose}
                style={{ background: "white", border: "1px solid #D1D5DB", padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: "#DC2626",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
