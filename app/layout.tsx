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
import { SSRHeadScripts } from "@/components/ads/SSRHeadScripts";
import { InspectProtection } from "@/components/layout/InspectProtection";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamespn.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Live Sports Scores, Fixtures & Schedules | StreamESPN",
    template: "%s | StreamESPN",
  },
  description:
    "Follow live sports scores, upcoming fixtures, match schedules, team news, and the latest updates for soccer, basketball, tennis, and more on StreamESPN.",
  keywords: [
    "live sports scores",
    "sports fixtures",
    "match schedules",
    "soccer scores",
    "basketball fixtures",
    "tennis schedules",
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
    title: "Live Sports Scores, Fixtures & Schedules | StreamESPN",
    description:
      "Follow live sports scores, upcoming fixtures, match schedules, team news, and the latest updates for soccer, basketball, tennis, and more on StreamESPN.",
    siteName: "StreamESPN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Sports Scores, Fixtures & Schedules | StreamESPN",
    description:
      "Follow live sports scores, upcoming fixtures, match schedules, team news, and the latest updates for soccer, basketball, tennis, and more on StreamESPN.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

let memoryAdsCache: { timestamp: number; settings: any } | null = null;
const ADS_CACHE_TTL = 60 * 1000; // 60 seconds

async function getInitialAds() {
  const now = Date.now();
  if (memoryAdsCache && (now - memoryAdsCache.timestamp < ADS_CACHE_TTL)) {
    return memoryAdsCache.settings;
  }

  try {
    const defaultInternal = process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:5001/api' : 'http://localhost:5001/api';
    const urls = Array.from(new Set([
      process.env.BACKEND_API_URL,
      defaultInternal,
      process.env.NEXT_PUBLIC_API_URL,
      'https://backendapi.streamespn.org/api',
    ].filter(Boolean).map(u => String(u).replace(/\/$/, '')))) as string[];

    for (const cleanUrl of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 750);
        const res = await fetch(`${cleanUrl}/ads/fast`, {
          next: { revalidate: 60 },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.settings) {
            memoryAdsCache = { timestamp: Date.now(), settings: data.data.settings };
            return data.data.settings;
          }
        }
      } catch {
        // Try next fallback URL quickly
      }
    }
    return memoryAdsCache?.settings || {};
  } catch (e) {
    return memoryAdsCache?.settings || {};
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialAdsSettings = await getInitialAds();
  const isHeadAdsEnabled = initialAdsSettings?.isHeadAdsEnabled !== false;
  let headAdsHtml = '';
  if (isHeadAdsEnabled) {
    if (Array.isArray(initialAdsSettings?.headerScripts) && initialAdsSettings.headerScripts.length > 0) {
      headAdsHtml = initialAdsSettings.headerScripts
        .filter((s: any) => s && s.isEnabled && s.code && s.code.trim())
        .map((s: any) => s.code.trim())
        .join('\n\n');
    }
    if (!headAdsHtml && initialAdsSettings?.headAds) {
      headAdsHtml = initialAdsSettings.headAds;
    }
  }

  // Remove headAds & headerScripts from body props so they never appear inside body flight data
  const { headAds: _h1, headerScripts: _h2, ...bodyAdsSettings } = (initialAdsSettings || {}) as any;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://r2.thesportsdb.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://r2.thesportsdb.com" />
        <link rel="preconnect" href="https://musikazblai.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://musikazblai.org" />
        <SSRHeadScripts rawHtml={headAdsHtml} isEnabled={isHeadAdsEnabled} />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[var(--bg-main)] text-[var(--text-white)] flex flex-col font-sans">
        <ThemeProvider>
          <InspectProtection />
          <Suspense fallback={null}>
            <TopLoadingBar />
          </Suspense>
          <Navbar initialAdsSettings={bodyAdsSettings} />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer initialAdsSettings={bodyAdsSettings} />
        </ThemeProvider>
      </body>
    </html>
  );
}
