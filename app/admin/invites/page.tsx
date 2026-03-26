"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { createClient } from "@supabase/supabase-js";
import {
  Link2, Send, BarChart2, Copy, Check, Plus, Phone,
  CheckCircle, XCircle, AlertCircle, Users,
} from "lucide-react";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

const svc = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

interface Invite {
  id: string;
  token: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  description: string | null;
  images: string | null;
  source_url: string | null;
  is_used: boolean;
  clicks: number;
  created_at: string;
  expires_at: string;
}

interface PhonebookEntry {
  id: string;
  name: string;
  phone: string | null;
  category: string;
}

type Tab = "generate" | "sms" | "statistics";

const DEFAULT_SMS = "Hej [navn] \u{1F44B} Din gratis profil p\u00E5 RedLightAD er klar! Verdens hurtigst voksende escort platform. Tilf\u00F8j bare email + kodeord: redlightad.com/join/[token]";

export default function AdminInvitesPage() {
  const [tab, setTab] = useState<Tab>("generate");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Phonebook import
  const [phonebook, setPhonebook] = useState<PhonebookEntry[]>([]);
  const [pbLoading, setPbLoading] = useState(false);
  const [pbSelected, setPbSelected] = useState<Set<string>>(new Set());
  const [pbGenerating, setPbGenerating] = useState(false);

  // SMS
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_SMS);
  const [smsSelected, setSmsSelected] = useState<Set<string>>(new Set());
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invite/list");
    // Fallback: use direct supabase if no list endpoint
    if (!res.ok) {
      // fetch via supabase anon — but invite_links may need service role
      // We'll do it via a simple API call instead
    }
    setLoading(false);
  }, []);

  // Load invites directly via POST to our own endpoint that returns all
  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invite/admin-list");
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const generateLink = async () => {
    setGenerating(true);
    setGeneratedUrl("");
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          phone: phone || undefined,
          city: city || undefined,
          country: country || undefined,
          category: category || undefined,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        setGeneratedUrl(data.url);
        fetchInvites();
      }
    } catch {
      // handle error
    }
    setGenerating(false);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPhonebook = async () => {
    setPbLoading(true);
    try {
      const supabase = db();
      const { data } = await supabase
        .from("admin_contacts")
        .select("id, name, phone, category")
        .order("created_at", { ascending: false });
      setPhonebook(data ?? []);
    } catch {
      // silently fail
    }
    setPbLoading(false);
  };

  const togglePb = (id: string) => {
    setPbSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateForSelected = async () => {
    setPbGenerating(true);
    const selected = phonebook.filter((p) => pbSelected.has(p.id));
    for (const entry of selected) {
      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: entry.name,
          phone: entry.phone || undefined,
        }),
      });
    }
    setPbSelected(new Set());
    await fetchInvites();
    setPbGenerating(false);
  };

  const toggleSms = (token: string) => {
    setSmsSelected((prev) => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });
  };

  const sendSms = async () => {
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await fetch("/api/invite/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens: Array.from(smsSelected),
          message_template: smsTemplate,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSmsResult({ ok: false, msg: data.error });
      } else {
        setSmsResult({
          ok: true,
          msg: `Sent: ${data.sent}, Failed: ${data.failed}`,
        });
        setSmsSelected(new Set());
      }
    } catch (e: unknown) {
      setSmsResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Failed",
      });
    }
    setSmsSending(false);
  };

  const withPhone = invites.filter((i) => i.phone);
  const totalClicks = invites.reduce((a, i) => a + (i.clicks || 0), 0);
  const totalUsed = invites.filter((i) => i.is_used).length;
  const conversionRate =
    invites.length > 0 ? ((totalUsed / invites.length) * 100).toFixed(1) : "0";

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "generate", label: "Generate", icon: Link2 },
    { key: "sms", label: "Send SMS", icon: Send },
    { key: "statistics", label: "Statistics", icon: BarChart2 },
  ];

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          fontSize: 13,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #E5E5E5",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );

  return (
    <AdminLayout>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}
          >
            Invite Links
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {invites.length} invites &middot; {totalUsed} converted &middot;{" "}
            {totalClicks} clicks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: 4,
          borderRadius: 12,
          background: "#F3F4F6",
          width: "fit-content",
          marginBottom: 24,
        }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: tab === key ? "#fff" : "transparent",
              color: tab === key ? "#111" : "#6B7280",
              transition: "all 0.15s",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Generate ── */}
      {tab === "generate" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Manual form */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              border: "1px solid #E5E5E5",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111",
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              Generate Invite Link
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Navn"
              />
              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="+45..."
              />
              <Field
                label="City"
                value={city}
                onChange={setCity}
                placeholder="K\u00F8benhavn"
              />
              <Field
                label="Country"
                value={country}
                onChange={setCountry}
                placeholder="Denmark"
              />
              <Field
                label="Category"
                value={category}
                onChange={setCategory}
                placeholder="escort"
              />
              <Field
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Kort beskrivelse..."
              />
            </div>

            <button
              onClick={generateLink}
              disabled={generating}
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "#000",
                border: "none",
                borderRadius: 8,
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.5 : 1,
              }}
            >
              <Plus size={14} />
              {generating ? "Generating..." : "Generate Invite Link"}
            </button>

            {generatedUrl && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  background: "#F0FDF4",
                  borderRadius: 8,
                  border: "1px solid #BBF7D0",
                }}
              >
                <CheckCircle size={14} color="#16A34A" />
                <code
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#14532D",
                    wordBreak: "break-all",
                  }}
                >
                  {generatedUrl}
                </code>
                <button
                  onClick={copyUrl}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid #BBF7D0",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                    color: "#14532D",
                  }}
                >
                  {copied ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>

          {/* Import from Phonebook */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              border: "1px solid #E5E5E5",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111",
                  margin: 0,
                }}
              >
                Import from Phonebook
              </h2>
              <button
                onClick={loadPhonebook}
                disabled={pbLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #E5E5E5",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                <Users size={13} />
                {pbLoading ? "Loading..." : "Load from Phonebook"}
              </button>
            </div>

            {phonebook.length > 0 && (
              <>
                <div
                  style={{
                    maxHeight: 300,
                    overflowY: "auto",
                    border: "1px solid #F3F4F6",
                    borderRadius: 8,
                  }}
                >
                  {phonebook.map((p) => (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        borderBottom: "1px solid #F9FAFB",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={pbSelected.has(p.id)}
                        onChange={() => togglePb(p.id)}
                        style={{ accentColor: "#CC0000" }}
                      />
                      <span style={{ fontWeight: 600, color: "#111" }}>
                        {p.name}
                      </span>
                      {p.phone && (
                        <span style={{ color: "#9CA3AF", fontSize: 12 }}>
                          {p.phone}
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "#F3F4F6",
                          color: "#6B7280",
                          textTransform: "capitalize",
                        }}
                      >
                        {p.category}
                      </span>
                    </label>
                  ))}
                </div>
                {pbSelected.size > 0 && (
                  <button
                    onClick={generateForSelected}
                    disabled={pbGenerating}
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      background: "#000",
                      border: "none",
                      borderRadius: 8,
                      cursor: pbGenerating ? "not-allowed" : "pointer",
                      opacity: pbGenerating ? 0.5 : 1,
                    }}
                  >
                    <Link2 size={14} />
                    {pbGenerating
                      ? "Generating..."
                      : `Generate links for ${pbSelected.size} selected`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Recent invite links */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #E5E5E5",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #F3F4F6",
                fontSize: 14,
                fontWeight: 600,
                color: "#111",
              }}
            >
              Recent Invite Links
            </div>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "48px 0",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid #E5E5E5",
                    borderTopColor: "#111",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : invites.length === 0 ? (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
              >
                No invite links yet
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {["Name", "Phone", "Token", "Clicks", "Used", "Created"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 16px",
                              textAlign: "left",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#9CA3AF",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: "1px solid #F9FAFB" }}
                      >
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111",
                          }}
                        >
                          {inv.name || "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "#6B7280",
                            fontFamily: "monospace",
                          }}
                        >
                          {inv.phone || "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "#6B7280",
                            fontFamily: "monospace",
                          }}
                        >
                          {inv.token}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111",
                          }}
                        >
                          {inv.clicks}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: inv.is_used ? "#DCFCE7" : "#F3F4F6",
                              color: inv.is_used ? "#14532D" : "#6B7280",
                            }}
                          >
                            {inv.is_used ? "Yes" : "No"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 11,
                            color: "#9CA3AF",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(inv.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Send SMS ── */}
      {tab === "sms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Template */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              border: "1px solid #E5E5E5",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111",
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              SMS Template
            </h2>
            <textarea
              value={smsTemplate}
              onChange={(e) => setSmsTemplate(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                fontSize: 13,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #E5E5E5",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                marginTop: 8,
              }}
            >
              Brug [navn] og [token] som placeholders
            </p>
          </div>

          {/* Select invites */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #E5E5E5",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111",
                }}
              >
                <Phone size={14} />
                Invites with phone numbers ({withPhone.length})
              </div>
              {smsSelected.size > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#CC0000",
                  }}
                >
                  {smsSelected.size} selected
                </span>
              )}
            </div>

            {withPhone.length === 0 ? (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
              >
                No invites with phone numbers
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {withPhone.map((inv) => (
                  <label
                    key={inv.token}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                      borderBottom: "1px solid #F9FAFB",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={smsSelected.has(inv.token)}
                      onChange={() => toggleSms(inv.token)}
                      style={{ accentColor: "#CC0000" }}
                    />
                    <span style={{ fontWeight: 600, color: "#111" }}>
                      {inv.name || "Unknown"}
                    </span>
                    <span
                      style={{
                        color: "#6B7280",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {inv.phone}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: inv.is_used ? "#DCFCE7" : "#FEF3C7",
                        color: inv.is_used ? "#14532D" : "#92400E",
                      }}
                    >
                      {inv.is_used ? "Converted" : "Pending"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {smsResult && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                borderRadius: 8,
                background: smsResult.ok ? "#DCFCE7" : "#FEE2E2",
                color: smsResult.ok ? "#14532D" : "#7F1D1D",
                fontSize: 13,
              }}
            >
              {smsResult.ok ? (
                <CheckCircle size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {smsResult.msg}
            </div>
          )}

          <button
            onClick={sendSms}
            disabled={smsSending || smsSelected.size === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "#000",
              border: "none",
              borderRadius: 10,
              cursor:
                smsSending || smsSelected.size === 0
                  ? "not-allowed"
                  : "pointer",
              opacity: smsSending || smsSelected.size === 0 ? 0.4 : 1,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Send size={14} />
            {smsSending
              ? "Sending..."
              : `Send SMS to ${smsSelected.size} invite(s)`}
          </button>
        </div>
      )}

      {/* ── TAB 3: Statistics ── */}
      {tab === "statistics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                label: "Total invites",
                value: invites.length,
                color: "#2563EB",
              },
              { label: "Total clicks", value: totalClicks, color: "#7C3AED" },
              {
                label: "Conversions",
                value: totalUsed,
                color: "#16A34A",
              },
              {
                label: "Conversion rate",
                value: `${conversionRate}%`,
                color: "#EA580C",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "20px 24px",
                  border: "1px solid #E5E5E5",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 8px",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: s.color,
                    margin: 0,
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #E5E5E5",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #F3F4F6",
                fontSize: 14,
                fontWeight: 600,
                color: "#111",
              }}
            >
              All Invites
            </div>
            {invites.length === 0 ? (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
              >
                No invites yet
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {[
                        "Name",
                        "Phone",
                        "Token",
                        "Clicks",
                        "Used",
                        "Created",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => (
                      <tr
                        key={inv.id}
                        style={{ borderBottom: "1px solid #F9FAFB" }}
                      >
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111",
                          }}
                        >
                          {inv.name || "\u2014"}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "#6B7280",
                            fontFamily: "monospace",
                          }}
                        >
                          {inv.phone || "\u2014"}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "#6B7280",
                            fontFamily: "monospace",
                          }}
                        >
                          {inv.token}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111",
                          }}
                        >
                          {inv.clicks}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: inv.is_used ? "#DCFCE7" : "#F3F4F6",
                              color: inv.is_used ? "#14532D" : "#6B7280",
                            }}
                          >
                            {inv.is_used ? "Yes" : "No"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 11,
                            color: "#9CA3AF",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(inv.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
