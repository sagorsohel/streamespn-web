"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AdRenderer } from "./AdRenderer"
import { HARDCODED_ADSENSE } from "./hardcodedAdsense"
import {
  AdsSettings,
  fetchAdsSettingsAsync,
  getAdsSettingsSync,
  subscribeAdsSettings,
} from "@/lib/adsCache"

/**
 * Hardcoded Google AdSense unit shown at the start (and end) of every page (not sticky).
 * The ad code is hardcoded; the admin panel ("Page Google Ad") only switches it ON/OFF.
 * Mounted from app/template.tsx, so it is re-created on every page navigation.
 */
export const TopGoogleAd: React.FC = () => {
  const pathname = usePathname()
  const [settings, setSettings] = useState<AdsSettings>(() => getAdsSettingsSync())

  useEffect(() => {
    const unsubscribe = subscribeAdsSettings((s) => setSettings(s))
    fetchAdsSettingsAsync().then((s) => s && setSettings(s))
    return () => unsubscribe()
  }, [])

  if (!settings?.isTopGoogleAdEnabled) return null

  return (
    <div suppressHydrationWarning className="relative z-10 w-full px-4">
      <div className="mx-auto w-full max-w-7xl">
        <AdRenderer
          uniqueKey="top-google-ad"
          refreshKey={pathname}
          code={HARDCODED_ADSENSE}
        />
      </div>
    </div>
  )
}
