"use client"
import { useState } from "react"
import Navbar from "@/components/Navbar"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

const FAQ_SECTIONS = [
  {
    title: "Advertising",
    items: [
      { q: "How do I create a profile?", a: "Click 'Create Profile' in your dashboard. Fill in your details across 3 steps: basic info, services & appearance, and contact & photos. Your profile is reviewed within 24 hours before going live." },
      { q: "How much does advertising cost?", a: "Creating a basic profile is free. Premium upgrades (Premium Profile, Push to Top) are available using Red Coins." },
      { q: "How long does profile approval take?", a: "Profiles are typically reviewed and approved within 24 hours. You will be notified once your profile is live." },
      { q: "Can I edit my profile after it is published?", a: "Yes. Go to Dashboard → My Profile to edit any details, update photos, or change pricing at any time." },
      { q: "How do I add photos to my profile?", a: "You can upload up to 20 photos during profile creation or via the edit page. Minimum 3 photos are required to publish." },
      { q: "Why was my profile rejected?", a: "Profiles may be rejected if they violate our terms of service — for example, explicit content in public photos, false information, or suspected underage content. Contact support for details." },
    ],
  },
  {
    title: "REDLIGHTCAM",
    items: [
      { q: "What is REDLIGHTCAM?", a: "REDLIGHTCAM is our live streaming platform integrated directly into RedLightAD. Verified profiles can go live and interact with viewers in real time." },
      { q: "How do I go live?", a: "Go to Dashboard → Go Live. You need an active profile to start streaming. Set your title, category, and tokens-per-minute, then click Go Live." },
      { q: "How do I earn from REDLIGHTCAM?", a: "Viewers tip you using Red Coins during your live stream. You can set a tip menu with custom actions and a tip goal to encourage tipping." },
      { q: "What is a tip menu?", a: "A tip menu lists actions you offer during your stream with a Red Coin price — for example: 'Dance — 50 RC', 'Show face — 100 RC'." },
      { q: "What is a tip goal?", a: "A tip goal is a target amount you want to reach during your stream. When the goal is hit, you perform the promised action for your viewers." },
      { q: "Can viewers be notified when I go live?", a: "Yes. Viewers can enable a notification to be alerted when you go live. They will receive an alert when your stream starts." },
      { q: "How do I show I am available for cam chat?", a: "In your Dashboard, use the REDLIGHTCAM widget. Select 'Ready now' and choose a duration. Your profile will appear as available on the cam page with a green 'Ready to chat' indicator." },
    ],
  },
  {
    title: "Red Coins",
    items: [
      { q: "What are Red Coins?", a: "Red Coins (RC) are the platform currency used for tipping models during live streams, buying locked content, boosting your profile, and purchasing premium features." },
      { q: "How do I buy Red Coins?", a: "Go to Dashboard → Buy Coins. We accept card payments and crypto. The minimum crypto purchase is €20." },
      { q: "Can I withdraw Red Coins I have earned?", a: "Yes. Red Coins you earn as a model can be withdrawn. The minimum withdrawal is 500 RC. Processing time is 3–5 business days. Go to Dashboard → Wallet." },
      { q: "Do Red Coins expire?", a: "No. Red Coins do not expire and remain in your account until spent or withdrawn." },
    ],
  },
  {
    title: "Premium & Boost",
    items: [
      { q: "What is a Premium Profile?", a: "Premium profiles are shown at the top of search results above standard profiles, with a VIP badge. Available in 1, 3, 6, and 12-month packages." },
      { q: "What is Push to Top?", a: "Push to Top temporarily places your profile at the absolute #1 position on the platform, above all other profiles including premium ones." },
      { q: "How do I upgrade to Premium or Boost?", a: "Go to Dashboard → Premium & Boost. Select your listing, choose a package, and confirm. Payment is deducted from your Red Coins balance." },
    ],
  },
  {
    title: "Account & Verification",
    items: [
      { q: "How do I verify my identity?", a: "Go to Dashboard → Verify. Upload a photo ID and a selfie. Verification is reviewed within 24 hours. Verified profiles receive a trust badge visible to everyone." },
      { q: "How do I verify my phone number?", a: "During profile creation, enter your phone number and click 'Verify phone number'. You will receive an SMS code to confirm. Only verified phone numbers are shown on your profile." },
      { q: "How do I delete my account?", a: "Contact support at contact@redlightad.com with your account email and a deletion request. Your profile and data will be removed within 72 hours." },
      { q: "I forgot my password. What do I do?", a: "Click 'Forgot password' on the login page. Enter your email and you will receive a reset link within a few minutes." },
    ],
  },
  {
    title: "Safety & Privacy",
    items: [
      { q: "Is my personal information safe?", a: "Yes. We take privacy seriously. Your data is encrypted and never shared with third parties without your consent. Read our Privacy Policy for full details." },
      { q: "How do I report a fake or abusive profile?", a: "Click 'Report Profile' at the bottom of any profile page. Select the reason and provide details. Our team reviews all reports within 24 hours." },
      { q: "Can other users see my personal details?", a: "Only the information you choose to display on your profile is visible to others. Your email address is never shown publicly." },
      { q: "How old do I need to be to use the platform?", a: "You must be 18 years or older to use RedLightAD. All advertisers must confirm they are 18+ at registration. We have a zero-tolerance policy for underage content." },
    ],
  },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: "1px solid #F3F4F6" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#111", lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={18} color="#9CA3AF" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 18, paddingRight: 32 }}>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#FAFAFA" }}>
        <div style={{ background: "#111", padding: "60px 16px 48px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Frequently Asked <span style={{ color: "#DC2626" }}>Questions</span>
            </h1>
            <p style={{ fontSize: 16, color: "#9CA3AF", margin: 0 }}>Everything you need to know about RedLightAD</p>
          </div>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 16px 80px" }}>
          {FAQ_SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px", paddingBottom: 12, borderBottom: "2px solid #DC2626", display: "inline-block" }}>
                {section.title}
              </h2>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "0 24px" }}>
                {section.items.map((item, i) => (
                  <AccordionItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}

          <div style={{ background: "#111", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Still have questions?</h3>
            <p style={{ fontSize: 14, color: "#9CA3AF", margin: "0 0 24px" }}>Our team is happy to help. Reach out and we will get back to you within 24 hours.</p>
            <Link href="/contact"
              style={{ display: "inline-block", padding: "12px 28px", background: "#DC2626", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
