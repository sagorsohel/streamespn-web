import api from './api';

export interface HeaderScriptItem {
  id: string;
  name: string;
  code: string;
  isEnabled: boolean;
}

export interface AdsSettings {
  id?: number;
  headAds?: string;
  isHeadAdsEnabled?: boolean;
  headerScripts?: HeaderScriptItem[];
  navAds?: string;
  modalSignupAds?: string;
  footerAds?: string;
  floatMobileAds?: string;
  floatDesktopAds?: string;
  histatsScript?: string;
  membershipReferralLink?: string;
  globalSignInReferralLink?: string;
}

let memoryAdsSettings: AdsSettings | null = null;
const LISTENERS = new Set<(settings: AdsSettings) => void>();

export const getAdsSettingsSync = (): AdsSettings => {
  if (memoryAdsSettings) {
    return memoryAdsSettings;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('streamespn_ads_settings');
      if (stored) {
        memoryAdsSettings = JSON.parse(stored);
        return memoryAdsSettings!;
      }
    } catch (e) {
      // ignore
    }
  }
  return {};
};

// Prime the cache with SSR-provided data (no listener notification needed — called before mount)
export const primeAdsCache = (settings: AdsSettings) => {
  if (!settings || (!settings.navAds && !settings.headAds && !settings.footerAds && !settings.floatMobileAds && !settings.floatDesktopAds && !settings.modalSignupAds && !settings.membershipReferralLink)) return;
  if (memoryAdsSettings) return; // already populated
  memoryAdsSettings = settings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('streamespn_ads_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }
};


export const setAdsSettingsCache = (settings: AdsSettings) => {
  memoryAdsSettings = settings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('streamespn_ads_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }
  LISTENERS.forEach((listener) => listener(settings));
};

export const subscribeAdsSettings = (callback: (settings: AdsSettings) => void) => {
  LISTENERS.add(callback);
  return () => {
    LISTENERS.delete(callback);
  };
};

let inFlightAdsPromise: Promise<AdsSettings> | null = null;
let lastAdsFetchTime = 0;
const ADS_FETCH_INTERVAL_MS = 30000; // 30 seconds

export const fetchAdsSettingsAsync = async (): Promise<AdsSettings> => {
  const now = Date.now();
  if (memoryAdsSettings && now - lastAdsFetchTime < ADS_FETCH_INTERVAL_MS) {
    return memoryAdsSettings;
  }
  if (inFlightAdsPromise) {
    return inFlightAdsPromise;
  }

  inFlightAdsPromise = (async () => {
    try {
      const res = await api.get('/ads/fast');
      if (res.data?.success && res.data?.data?.settings) {
        const settings = res.data.data.settings;
        setAdsSettingsCache(settings);
        lastAdsFetchTime = Date.now();
        return settings;
      }
    } catch (e) {
      // ignore
    } finally {
      inFlightAdsPromise = null;
    }
    return getAdsSettingsSync();
  })();

  return inFlightAdsPromise;
};
