import { TopGoogleAd } from "@/components/ads/TopGoogleAd"

// A template re-mounts on every navigation, so the Google ad is added at the
// start of every page and refreshed when the page changes.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <br />
      <TopGoogleAd />
      <br />
      {children}
      <br />
      <TopGoogleAd />
      <br />
    </>
  )
}
