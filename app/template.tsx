import { TopGoogleAd } from "@/components/ads/TopGoogleAd"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopGoogleAd />
      {children}
    </>
  )
}
