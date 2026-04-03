"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface InviteData {
  token: string;
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  category?: string;
  description?: string;
  images?: string | string[];
  source_url?: string;
}

type Step = "preview" | "register" | "success";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("preview");

  useEffect(() => {
    fetch(`/api/invite?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setInvite(data);
        setLoading(false);
        // Track invite link click
        const supabase = createClient();
        supabase
          .from('scraped_phones')
          .update({ sms_status: 'clicked' })
          .eq('invite_token', token)
          .then(() => {});
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [token]);

  const images: string[] = invite?.images
    ? typeof invite.images === "string"
      ? JSON.parse(invite.images)
      : invite.images
    : [];

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Udfyld venligst email og kodeord");
      return;
    }
    if (password.length < 6) {
      setError("Kodeord skal være mindst 6 tegn");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();

      // 1. Sign up
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authErr) throw new Error(authErr.message);
      if (!authData.user) throw new Error("Signup failed");

      // 2. Create listing with invite data
      const listingPayload: Record<string, unknown> = {
        user_id: authData.user.id,
        display_name: invite?.name || email.split("@")[0],
        category: invite?.category || "escort",
        city: invite?.city || null,
        country: invite?.country || null,
        about: invite?.description || null,
        phone: invite?.phone || null,
        images: images.length > 0 ? images : [],
        profile_image: images[0] || null,
        status: "active",
      };

      const { data: listing } = await supabase
        .from("listings")
        .insert(listingPayload)
        .select("id")
        .single();

      // 3. Mark invite as used
      await fetch("/api/invite/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          listing_id: listing?.id || null,
        }),
      });

      // 4. Track conversion in scraped_phones
      await supabase
        .from('scraped_phones')
        .update({ sms_status: 'converted' })
        .eq('invite_token', token);

      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noget gik galt");
    }
    setSubmitting(false);
  };

  // Loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not found / expired
  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            :(
          </div>
          <p
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Ugyldigt invite link
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Dette invite link er ugyldigt eller udl&oslash;bet.
          </p>
        </div>
      </div>
    );
  }

  // Success
  if (step === "success") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <p
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Din profil er oprettet!
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Sender dig til dit dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Preview / Register
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px 60px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <span
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ color: "#CC0000" }}>RED</span>
          <span style={{ color: "#fff" }}>LIGHTAD</span>
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Profile preview card */}
        {(invite?.name || images.length > 0) && (
          <div
            style={{
              background: "#111",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 24,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {images[0] && (
              <div
                style={{
                  width: "100%",
                  height: 200,
                  background: `url(${images[0]}) center/cover`,
                }}
              />
            )}
            <div style={{ padding: "16px 20px" }}>
              {invite?.name && (
                <p
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {invite.name}
                </p>
              )}
              {(invite?.city || invite?.country) && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  {[invite.city, invite.country].filter(Boolean).join(", ")}
                </p>
              )}
              {invite?.category && (
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(204,0,0,0.15)",
                    color: "#CC0000",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20,
                    textTransform: "capitalize",
                  }}
                >
                  {invite.category}
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Din profil er klar! &#127881;
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Tilf&oslash;j bare email og kodeord for at g&aring; live
          </p>
        </div>

        {/* FREE badge */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(34,197,94,0.15)",
              color: "#22C55E",
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: 20,
              letterSpacing: "0.05em",
            }}
          >
            100% GRATIS
          </span>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Din email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(204,0,0,0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
            }
          />
          <input
            type="password"
            placeholder="V&aelig;lg et kodeord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(204,0,0,0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
            }
          />

          {error && (
            <p
              style={{
                color: "#EF4444",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "16px",
              background: submitting ? "#991B1B" : "#CC0000",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              borderRadius: 12,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {submitting ? "Opretter..." : "Opret min gratis profil"}
          </button>
        </div>

        {/* Fine print */}
        <p
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 12,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          Ved oprettelse accepterer du vores brugervilk&aring;r
        </p>
      </div>
    </div>
  );
}
