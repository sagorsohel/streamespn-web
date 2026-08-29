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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StreamESPN | Enjoy Live Sports & ALL Events",
  description:
    "Watch Your Favorite Sports Live Stream Online for FREE, TV Coverage, Replays, Highlights from Anywhere at Anytime. Optimized for PC, Mac, iPad, iPhone, Android ...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <HeadScriptInjector />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[var(--bg-main)] text-[var(--text-white)] flex flex-col font-sans">
        <ThemeProvider>
          <Suspense fallback={null}>
            <TopLoadingBar />
          </Suspense>
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
