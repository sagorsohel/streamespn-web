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
import { InspectProtection } from "@/components/layout/InspectProtection";
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
    const urls = [
      process.env.BACKEND_API_URL,
      process.env.NEXT_PUBLIC_API_URL,
      'http://localhost:5001/api',
      'http://127.0.0.1:5001/api',
      'https://backendapi.streamespn.org/api',
      'http://localhost:5000/api',
    ].filter(Boolean) as string[];

    for (const rawUrl of urls) {
      try {
        const cleanUrl = rawUrl.replace(/\/$/, '');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${cleanUrl}/ads/fast`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.settings) {
            return data.data.settings;
          }
        }
      } catch {
        // Try next fallback URL
      }
    }
    return {};
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; }, true);
                window.addEventListener('keydown', function(e) {
                  var k = e.key ? e.key.toUpperCase() : '';
                  var c = e.keyCode || e.which;
                  if (
                    k === 'F12' || c === 123 ||
                    ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'I' || k === 'J' || k === 'C' || k === 'K' || k === 'E' || c === 73 || c === 74 || c === 67 || c === 75 || c === 69)) ||
                    (e.metaKey && e.altKey && (k === 'I' || k === 'J' || k === 'C' || k === 'U' || c === 73 || c === 74 || c === 67 || c === 85)) ||
                    ((e.ctrlKey || e.metaKey) && (k === 'U' || k === 'S' || c === 85 || c === 83))
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[var(--bg-main)] text-[var(--text-white)] flex flex-col font-sans">
        <ThemeProvider>
          <InspectProtection />
          <HeadScriptInjector initialHeadAds={headAdsHtml} isEnabled={isHeadAdsEnabled} />
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
