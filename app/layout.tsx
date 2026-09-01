import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import { Suspense } from "react";
import { TopLoadingBar } from "@/components/layout/TopLoadingBar";
import { HeadScriptInjector } from "@/components/ads/HeadScriptInjector";
import { JsonLdSchema } from "@/components/seo/JsonLdSchema";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamespn.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StreamESPN | Watch Live Sports & All Events Online FREE",
    template: "%s | StreamESPN",
  },
  description:
    "Watch Your Favorite Sports Live Streams Online for FREE, TV Coverage, Replays, and Highlights from Anywhere at Anytime. Fast HLS streaming CDN optimized for PC, Mac, iPad, iPhone, and Android.",
  keywords: [
    "live sports streaming",
    "soccer live stream",
    "free sports stream",
    "hd sports stream",
    "nba live stream",
    "nfl live stream",
    "f1 live stream",
    "streamespn",
  ],
  authors: [{ name: "StreamESPN" }],
  creator: "StreamESPN",
  publisher: "StreamESPN",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "StreamESPN | Watch Live Sports & All Events Online FREE",
    description:
      "Watch Your Favorite Sports Live Streams Online for FREE, TV Coverage, Replays, and Highlights from Anywhere at Anytime.",
    siteName: "StreamESPN",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamESPN | Watch Live Sports & All Events Online FREE",
    description:
      "Watch Your Favorite Sports Live Streams Online for FREE, TV Coverage, Replays, and Highlights from Anywhere at Anytime.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

async function getInitialAds() {
  try {
    const rawUrl =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api';
    const res = await fetch(`${rawUrl.replace(/\/$/, '')}/ads/fast`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data?.data?.settings || {};
  } catch (e) {
    return {};
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialAdsSettings = await getInitialAds();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <link rel="preconnect" href="https://www.highperformanceformat.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.highperformanceformat.com" />
        <JsonLdSchema type="website" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[var(--bg-main)] text-[var(--text-white)] flex flex-col font-sans">
        <ThemeProvider>
          <HeadScriptInjector />
          <Suspense fallback={null}>
            <TopLoadingBar />
          </Suspense>
          <Navbar initialAdsSettings={initialAdsSettings} />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer initialAdsSettings={initialAdsSettings} />
        </ThemeProvider>
      </body>
    </html>
  );
}
