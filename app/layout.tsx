import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

import AgeVerificationModal from "@/components/AgeVerificationModal";
import CookieBanner from "@/components/CookieBanner";
import PWARegister from "@/components/PWARegister";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ThemeProvider } from "@/lib/theme-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {/* Preconnect to image CDN for faster loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* PWA theme color */}
        <meta name="theme-color" content="#DC2626" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} antialiased theme-bg theme-text flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <LanguageProvider>
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
