import api from './api';

export interface AdsSettings {
  id?: number;
  headAds?: string;
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

export const fetchAdsSettingsAsync = async (): Promise<AdsSettings> => {
  try {
    const res = await api.get('/ads');
    if (res.data?.success && res.data?.data?.settings) {
      const settings = res.data.data.settings;
      setAdsSettingsCache(settings);
      return settings;
    }
  } catch (e) {
    // ignore
  }
  return getAdsSettingsSync();
};
