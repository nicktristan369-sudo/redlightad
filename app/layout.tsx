import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider } from "@/lib/theme-context";

// Dynamic imports for non-critical components (server-side rendering)
const AgeVerificationModal = dynamic(() => import("@/components/AgeVerificationModal"));
const SentryInit = dynamic(() => import("@/components/SentryInit"));
const CookieBanner = dynamic(() => import("@/components/CookieBanner"));
const PWARegister = dynamic(() => import("@/components/PWARegister"));
const MobileBottomNav = dynamic(() => import("@/components/MobileBottomNav"));

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: "RedLightAD — The Premier Adult Advertising Platform",
  description:
    "Connect with 5000+ active users worldwide. Targeted adult advertising that delivers real results.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RedLightAD",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party domains */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://kkkqvhfgjofppimwxtub.supabase.co" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://kkkqvhfgjofppimwxtub.supabase.co" />
        {/* Preload critical LCP image */}
        <link rel="preload" href="/age-verify-bg.jpg" as="image" fetchPriority="high" />
        {/* PWA theme color */}
        <meta name="theme-color" content="#DC2626" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} antialiased theme-bg theme-text flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <SentryInit />
            <AgeVerificationModal />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileBottomNav />
            <CookieBanner />
            <PWARegister />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
