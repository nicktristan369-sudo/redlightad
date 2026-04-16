"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Lock, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export type SocialPlatform = "snapchat" | "instagram" | "onlyfans" | "telegram" | "whatsapp" | "twitter_x" | "signal" | "bitcoin";

export interface SocialLinkConfig {
  url: string;
  locked?: boolean;
  price_coins?: number;
}

export type SocialLinks = Partial<Record<SocialPlatform, SocialLinkConfig>>;

// Official brand icons from iconify
const Icons: Record<SocialPlatform, React.ReactElement> = {
  telegram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="tg1" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#2aabee"/>
          <stop offset="100%" stopColor="#229ed9"/>
        </linearGradient>
      </defs>
      <path fill="url(#tg1)" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0"/>
      <path fill="#fff" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072"/>
    </svg>
  ),
  onlyfans: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
      <path fill="#00AFF0" d="M24 4.003h-4.015c-3.45 0-5.3.197-6.748 1.957a7.996 7.996 0 1 0 2.103 9.211c3.182-.231 5.39-2.134 6.085-5.173c0 0-2.399.585-4.43 0c4.018-.777 6.333-3.037 7.005-5.995M5.61 11.999A2.391 2.391 0 0 1 9.28 9.97a2.966 2.966 0 0 1 2.998-2.528h.008c-.92 1.778-1.407 3.352-1.998 5.263A2.392 2.392 0 0 1 5.61 12Zm2.386-7.996a7.996 7.996 0 1 0 7.996 7.996a7.996 7.996 0 0 0-7.996-7.996m0 10.394A2.399 2.399 0 1 1 10.395 12a2.396 2.396 0 0 1-2.399 2.398Z"/>
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256">
      <defs>
        <radialGradient id="ig1" cx="0" cy="0" r="1" gradientTransform="matrix(0 -253.715 235.975 0 68 275.717)" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fd5"/>
          <stop offset=".1" stopColor="#fd5"/>
          <stop offset=".5" stopColor="#ff543e"/>
          <stop offset="1" stopColor="#c837ab"/>
        </radialGradient>
        <radialGradient id="ig2" cx="0" cy="0" r="1" gradientTransform="rotate(78.68 -32.69 -16.937)scale(113.412 467.488)" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3771c8"/>
          <stop offset=".128" stopColor="#3771c8"/>
          <stop offset="1" stopColor="#60f" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#ig1)" rx="60"/>
      <rect width="256" height="256" fill="url(#ig2)" rx="60"/>
      <path fill="#fff" d="M128.009 28c-27.158 0-30.567.119-41.233.604c-10.646.488-17.913 2.173-24.271 4.646c-6.578 2.554-12.157 5.971-17.715 11.531c-5.563 5.559-8.98 11.138-11.542 17.713c-2.48 6.36-4.167 13.63-4.646 24.271c-.477 10.667-.602 14.077-.602 41.236s.12 30.557.604 41.223c.49 10.646 2.175 17.913 4.646 24.271c2.556 6.578 5.973 12.157 11.533 17.715c5.557 5.563 11.136 8.988 17.709 11.542c6.363 2.473 13.631 4.158 24.275 4.646c10.667.485 14.073.604 41.23.604c27.161 0 30.559-.119 41.225-.604c10.646-.488 17.921-2.173 24.284-4.646c6.575-2.554 12.146-5.979 17.702-11.542c5.563-5.558 8.979-11.137 11.542-17.712c2.458-6.361 4.146-13.63 4.646-24.272c.479-10.666.604-14.066.604-41.225s-.125-30.567-.604-41.234c-.5-10.646-2.188-17.912-4.646-24.27c-2.563-6.578-5.979-12.157-11.542-17.716c-5.562-5.562-11.125-8.979-17.708-11.53c-6.375-2.474-13.646-4.16-24.292-4.647c-10.667-.485-14.063-.604-41.23-.604zm-8.971 18.021c2.663-.004 5.634 0 8.971 0c26.701 0 29.865.096 40.409.575c9.75.446 15.042 2.075 18.567 3.444c4.667 1.812 7.994 3.979 11.492 7.48c3.5 3.5 5.666 6.833 7.483 11.5c1.369 3.52 3 8.812 3.444 18.562c.479 10.542.583 13.708.583 40.396s-.104 29.855-.583 40.396c-.446 9.75-2.075 15.042-3.444 18.563c-1.812 4.667-3.983 7.99-7.483 11.488c-3.5 3.5-6.823 5.666-11.492 7.479c-3.521 1.375-8.817 3-18.567 3.446c-10.542.479-13.708.583-40.409.583c-26.702 0-29.867-.104-40.408-.583c-9.75-.45-15.042-2.079-18.57-3.448c-4.666-1.813-8-3.979-11.5-7.479s-5.666-6.825-7.483-11.494c-1.369-3.521-3-8.813-3.444-18.563c-.479-10.542-.575-13.708-.575-40.413s.096-29.854.575-40.396c.446-9.75 2.075-15.042 3.444-18.567c1.813-4.667 3.983-8 7.484-11.5s6.833-5.667 11.5-7.483c3.525-1.375 8.819-3 18.569-3.448c9.225-.417 12.8-.542 31.437-.563zm62.351 16.604c-6.625 0-12 5.37-12 11.996c0 6.625 5.375 12 12 12s12-5.375 12-12s-5.375-12-12-12zm-53.38 14.021c-28.36 0-51.354 22.994-51.354 51.355s22.994 51.344 51.354 51.344c28.361 0 51.347-22.983 51.347-51.344c0-28.36-22.988-51.355-51.349-51.355zm0 18.021c18.409 0 33.334 14.923 33.334 33.334c0 18.409-14.925 33.334-33.334 33.334s-33.333-14.925-33.333-33.334c0-18.411 14.923-33.334 33.333-33.334"/>
    </svg>
  ),
  twitter_x: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 128 128">
      <path d="M75.916 54.2L122.542 0h-11.05L71.008 47.06L38.672 0H1.376l48.898 71.164L1.376 128h11.05L55.18 78.303L89.328 128h37.296L75.913 54.2ZM60.782 71.79l-4.955-7.086l-39.42-56.386h16.972L65.19 53.824l4.954 7.086l41.353 59.15h-16.97L60.782 71.793Z"/>
    </svg>
  ),
  snapchat: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
      <g fill="none">
        <path fill="#ffef5e" d="M22.064 17.711a.827.827 0 0 0 .11-1.552a15 15 0 0 1-2.756-1.654a1.334 1.334 0 0 1 .09-2.189l1.207-.765a1.333 1.333 0 1 0-1.43-2.251L18 10.116V7A6 6 0 1 0 6 7v3.116L4.712 9.3a1.333 1.333 0 1 0-1.43 2.251l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4a.82.82 0 0 1 .57.988a1.282 1.282 0 0 0 1.455 1.575l.626-.1a2.85 2.85 0 0 1 2.48.8A4.7 4.7 0 0 0 12 23a4.7 4.7 0 0 0 2.964-1.63a2.85 2.85 0 0 1 2.48-.8l.627.1a1.282 1.282 0 0 0 1.455-1.57a.82.82 0 0 1 .57-.988z"/>
        <path fill="#fff9bf" d="M11.999 1a6.02 6.02 0 0 0-6 6v3.116L4.712 9.3a1.334 1.334 0 0 0-1.43 2.252l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4q.06.026.115.059L17.525 4.668A6.02 6.02 0 0 0 11.999 1"/>
        <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M22.064 17.711a.827.827 0 0 0 .11-1.552a15 15 0 0 1-2.756-1.654a1.334 1.334 0 0 1 .09-2.189l1.207-.765a1.333 1.333 0 1 0-1.43-2.251L18 10.116V7A6 6 0 1 0 6 7v3.116L4.712 9.3a1.333 1.333 0 1 0-1.43 2.251l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4a.82.82 0 0 1 .57.988a1.282 1.282 0 0 0 1.455 1.575l.626-.1a2.85 2.85 0 0 1 2.48.8A4.7 4.7 0 0 0 12 23a4.7 4.7 0 0 0 2.964-1.63a2.85 2.85 0 0 1 2.48-.8l.627.1a1.282 1.282 0 0 0 1.455-1.57a.82.82 0 0 1 .57-.988z"/>
      </g>
    </svg>
  ),
  bitcoin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="btc1" x1="49.973%" x2="49.973%" y1="-.024%" y2="99.99%">
          <stop offset="0%" stopColor="#f9aa4b"/>
          <stop offset="100%" stopColor="#f7931a"/>
        </linearGradient>
      </defs>
      <path fill="url(#btc1)" d="M252.171 158.954c-17.102 68.608-86.613 110.314-155.123 93.211c-68.61-17.102-110.316-86.61-93.213-155.119C20.937 28.438 90.347-13.268 158.957 3.835c68.51 17.002 110.317 86.51 93.214 155.119"/>
      <path fill="#fff" d="M188.945 112.05c2.5-17-10.4-26.2-28.2-32.3l5.8-23.1l-14-3.5l-5.6 22.5c-3.7-.9-7.5-1.8-11.3-2.6l5.6-22.6l-14-3.5l-5.7 23q-4.65-1.05-9-2.1v-.1l-19.4-4.8l-3.7 15s10.4 2.4 10.2 2.5c5.7 1.4 6.7 5.2 6.5 8.2l-6.6 26.3c.4.1.9.2 1.5.5c-.5-.1-1-.2-1.5-.4l-9.2 36.8c-.7 1.7-2.5 4.3-6.4 3.3c.1.2-10.2-2.5-10.2-2.5l-7 16.1l18.3 4.6c3.4.9 6.7 1.7 10 2.6l-5.8 23.3l14 3.5l5.8-23.1c3.8 1 7.6 2 11.2 2.9l-5.7 23l14 3.5l5.8-23.3c24 4.5 42 2.7 49.5-19c6.1-17.4-.3-27.5-12.9-34.1c9.3-2.1 16.2-8.2 18-20.6m-32.1 45c-4.3 17.4-33.7 8-43.2 5.6l7.7-30.9c9.5 2.4 40.1 7.1 35.5 25.3m4.4-45.3c-4 15.9-28.4 7.8-36.3 5.8l7-28c7.9 2 33.4 5.7 29.3 22.2"/>
    </svg>
  ),
  signal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256">
      <path fill="#3a76f0" d="m97.28 3.74l2.88 11.639A115.7 115.7 0 0 0 68 28.678l-6.16-10.28A127.5 127.5 0 0 1 97.28 3.74m61.44 0l-2.88 11.639A115.7 115.7 0 0 1 188 28.678l6.2-10.28A127.5 127.5 0 0 0 158.72 3.74M18.4 61.835A127.5 127.5 0 0 0 3.74 97.272l11.64 2.88a115.7 115.7 0 0 1 13.3-32.157zM12 127.99a116 116 0 0 1 1.3-17.379l-11.86-1.8a128.4 128.4 0 0 0 0 38.358l11.86-1.8A116 116 0 0 1 12 127.99m182.16 109.592l-6.16-10.28a115.7 115.7 0 0 1-32.12 13.3l2.88 11.638a127.5 127.5 0 0 0 35.4-14.658M244 127.99a116 116 0 0 1-1.3 17.379l11.86 1.8a128.4 128.4 0 0 0 0-38.357l-11.86 1.8a116 116 0 0 1 1.3 17.378m8.26 30.718l-11.64-2.88a115.7 115.7 0 0 1-13.3 32.157l10.28 6.2a127.5 127.5 0 0 0 14.66-35.477M145.38 242.7a116.8 116.8 0 0 1-34.76 0l-1.8 11.86a128.5 128.5 0 0 0 38.36 0zm76-45.896a116.4 116.4 0 0 1-24.58 24.558l7.12 9.659a128.2 128.2 0 0 0 27.12-27.038zM196.8 34.617a116.4 116.4 0 0 1 24.58 24.578l9.66-7.2A128.2 128.2 0 0 0 204 24.959zM34.62 59.195A116.4 116.4 0 0 1 59.2 34.617L52 24.958a128.2 128.2 0 0 0-27.04 27.038zm202.98 2.64l-10.28 6.16a115.7 115.7 0 0 1 13.3 32.117l11.64-2.88a127.5 127.5 0 0 0-14.66-35.397M110.62 13.3a116.8 116.8 0 0 1 34.76 0l1.8-11.86a128.5 128.5 0 0 0-38.36 0zM40.78 234.202L16 239.982l5.78-24.779l-11.68-2.74l-5.78 24.779a11.998 11.998 0 0 0 14.42 14.418l24.76-5.68zM12.6 201.764l11.68 2.72l4-17.179a115.5 115.5 0 0 1-12.9-31.477l-11.64 2.88a127 127 0 0 0 11.8 30.417zm56 25.998l-17.18 4l2.72 11.68l12.64-2.94A127 127 0 0 0 97.2 252.3l2.88-11.639a115.5 115.5 0 0 1-31.4-12.979zM128 23.998c-37.843.02-72.69 20.593-90.985 53.717C18.72 110.84 19.863 151.287 40 183.325l-10 42.657l42.66-9.999c37.418 23.566 85.647 20.894 120.233-6.66s47.963-73.965 33.35-115.698C211.63 51.89 172.22 23.962 128 23.998"/>
    </svg>
  ),
  whatsapp: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 258">
      <defs>
        <linearGradient id="wa1" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#1faf38"/>
          <stop offset="100%" stopColor="#60d669"/>
        </linearGradient>
        <linearGradient id="wa2" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#f9f9f9"/>
          <stop offset="100%" stopColor="#fff"/>
        </linearGradient>
      </defs>
      <path fill="url(#wa1)" d="M5.463 127.456c-.006 21.677 5.658 42.843 16.428 61.499L4.433 252.697l65.232-17.104a123 123 0 0 0 58.8 14.97h.054c67.815 0 123.018-55.183 123.047-123.01c.013-32.867-12.775-63.773-36.009-87.025c-23.23-23.25-54.125-36.061-87.043-36.076c-67.823 0-123.022 55.18-123.05 123.004"/>
      <path fill="url(#wa2)" d="M1.07 127.416c-.007 22.457 5.86 44.38 17.014 63.704L0 257.147l67.571-17.717c18.618 10.151 39.58 15.503 60.91 15.511h.055c70.248 0 127.434-57.168 127.464-127.423c.012-34.048-13.236-66.065-37.3-90.15C194.633 13.286 162.633.014 128.536 0C58.276 0 1.099 57.16 1.071 127.416m40.24 60.376l-2.523-4.005c-10.606-16.864-16.204-36.352-16.196-56.363C22.614 69.029 70.138 21.52 128.576 21.52c28.3.012 54.896 11.044 74.9 31.06c20.003 20.018 31.01 46.628 31.003 74.93c-.026 58.395-47.551 105.91-105.943 105.91h-.042c-19.013-.01-37.66-5.116-53.922-14.765l-3.87-2.295l-40.098 10.513z"/>
      <path fill="#fff" d="M96.678 74.148c-2.386-5.303-4.897-5.41-7.166-5.503c-1.858-.08-3.982-.074-6.104-.074c-2.124 0-5.575.799-8.492 3.984c-2.92 3.188-11.148 10.892-11.148 26.561s11.413 30.813 13.004 32.94c1.593 2.123 22.033 35.307 54.405 48.073c26.904 10.609 32.379 8.499 38.218 7.967c5.84-.53 18.844-7.702 21.497-15.139c2.655-7.436 2.655-13.81 1.859-15.142c-.796-1.327-2.92-2.124-6.105-3.716s-18.844-9.298-21.763-10.361c-2.92-1.062-5.043-1.592-7.167 1.597c-2.124 3.184-8.223 10.356-10.082 12.48c-1.857 2.129-3.716 2.394-6.9.801c-3.187-1.598-13.444-4.957-25.613-15.806c-9.468-8.442-15.86-18.867-17.718-22.056c-1.858-3.184-.199-4.91 1.398-6.497c1.431-1.427 3.186-3.719 4.78-5.578c1.588-1.86 2.118-3.187 3.18-5.311c1.063-2.126.531-3.986-.264-5.579c-.798-1.593-6.987-17.343-9.819-23.64"/>
    </svg>
  ),
};

const PLATFORM_META: Record<SocialPlatform, { label: string }> = {
  onlyfans:  { label: "OnlyFans" },
  snapchat:  { label: "Snapchat" },
  instagram: { label: "Instagram" },
  telegram:  { label: "Telegram" },
  whatsapp:  { label: "WhatsApp" },
  twitter_x: { label: "X" },
  signal:    { label: "Signal" },
  bitcoin:   { label: "Bitcoin" },
};

interface Props {
  listingId: string;
  socialLinks: SocialLinks;
  isPremium: boolean;
  isOwnListing: boolean;
}

export default function SocialLinksSection({ listingId, socialLinks, isPremium, isOwnListing }: Props) {
  const platforms = Object.entries(socialLinks ?? {}).filter(
    ([, cfg]) => cfg?.url
  ) as [SocialPlatform, SocialLinkConfig][];

  const [unlocked, setUnlocked] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [busy, setBusy] = useState<SocialPlatform | null>(null);
  const [result, setResult] = useState<{ platform: SocialPlatform; ok: boolean; msg: string } | null>(null);

  if (platforms.length === 0) return null;

  const handleUnlock = async (platform: SocialPlatform, price: number) => {
    setBusy(platform);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("unlock_social_link", {
      p_listing_id: listingId,
      p_platform: platform,
    });
    if (error || !data?.success) {
      setResult({ platform, ok: false, msg: data?.error ?? error?.message ?? "Error" });
    } else {
      setUnlocked(prev => ({ ...prev, [platform]: data.url }));
      setResult({ platform, ok: true, msg: `${PLATFORM_META[platform].label} unlocked!` });
    }
    setBusy(null);
  };

  const openUrl = (url: string) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #E5E7EB" }}>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Social Media</h3>

      <div className="flex flex-wrap gap-3">
        {platforms.map(([platform, cfg]) => {
          const meta = PLATFORM_META[platform];
          const isUnlocked = !!unlocked[platform];
          const isBusy = busy === platform;
          const isLocked = cfg.locked && !isUnlocked && !isOwnListing;

          if (isLocked && !isPremium) return null;

          const url = isOwnListing ? cfg.url : (isUnlocked ? unlocked[platform]! : cfg.url);
          const canClick = isOwnListing || !cfg.locked || isUnlocked;

          return (
            <button
              key={platform}
              onClick={() => canClick ? openUrl(url!) : handleUnlock(platform, cfg.price_coins || 0)}
              disabled={isBusy}
              className="group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-60"
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {Icons[platform]}
              </div>

              {/* Label */}
              <span className="text-[14px] font-medium text-gray-800">
                {meta.label}
              </span>

              {/* Lock or arrow indicator */}
              {isLocked && !isUnlocked ? (
                <div className="flex items-center gap-1 ml-1">
                  <Lock size={12} className="text-gray-400" />
                  <span className="text-[11px] text-gray-400">{cfg.price_coins}</span>
                </div>
              ) : (
                <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors ml-1" />
              )}

              {/* Loading spinner */}
              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {result && (
        <div 
          className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px]"
          style={{
            background: result.ok ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${result.ok ? "#BBF7D0" : "#FECACA"}`,
            color: result.ok ? "#14532D" : "#DC2626",
          }}
        >
          {result.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
