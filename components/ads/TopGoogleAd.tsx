"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { AdRenderer } from "./AdRenderer"
import { HARDCODED_ADSENSE } from "./hardcodedAdsense"

/**
 * Hardcoded Google AdSense unit shown at the start of every page (not sticky).
 * Independent of the admin panel. Mounted from app/template.tsx, so it is
 * re-created (and a fresh ad is requested) on every page navigation.
 */
export const TopGoogleAd: React.FC = () => {
  const pathname = usePathname()
  return (
    <div suppressHydrationWarning className="relative z-10 w-full px-4">
      <div className="mx-auto w-full max-w-7xl p-3">
        <AdRenderer
          uniqueKey="top-google-ad"
          refreshKey={pathname}
          code={HARDCODED_ADSENSE}
        />
      </div>
    </div>
  )
}
