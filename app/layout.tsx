import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedLightAD — The Premier Adult Advertising Platform",
  description:
    "Connect with 5000+ active users worldwide. Targeted adult advertising that delivers real results.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-[#F5F5F7] text-[#1D1D1F] flex flex-col min-h-screen`}
      >
        <LanguageProvider>
          <AgeVerificationModal />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
