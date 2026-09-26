'use client';

import React, { useEffect, useRef } from 'react';
import { subscribeAdsSettings, fetchAdsSettingsAsync, AdsSettings } from '@/lib/adsCache';

interface HeadScriptInjectorProps {
  initialHeadAds?: string;
  isEnabled?: boolean;
}

export const HeadScriptInjector: React.FC<HeadScriptInjectorProps> = ({ initialHeadAds, isEnabled = true }) => {
  const currentInjectedHtmlRef = useRef<string>('');

  useEffect(() => {
    let isMounted = true;

    const removeExistingInjected = () => {
      document.querySelectorAll('[data-streamespn-head-script]').forEach((el) => el.remove());
      const oldContainer = document.getElementById('streamespn-head-scripts');
      if (oldContainer) oldContainer.remove();
      currentInjectedHtmlRef.current = '';
    };

    const injectScripts = (codeToInject?: string) => {
      if (!codeToInject || !codeToInject.trim()) {
        removeExistingInjected();
        return;
      }

      // Avoid redundant re-injections if the HTML is identical
      if (currentInjectedHtmlRef.current === codeToInject) {
        return;
      }

      removeExistingInjected();
      currentInjectedHtmlRef.current = codeToInject;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = codeToInject;

      // Execute each <script> tag individually inside <head>, one after another
      const scripts = wrapper.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-streamespn-head-script', 'true');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        }
        document.head.appendChild(newScript);
      });

      // Append any non-script tags (like <link>, <meta>, <style>) to <head>
      Array.from(wrapper.children).forEach((child) => {
        if (child.tagName !== 'SCRIPT') {
          const clone = child.cloneNode(true) as HTMLElement;
          clone.setAttribute('data-streamespn-head-script', 'true');
          document.head.appendChild(clone);
        }
      });

      if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
        console.log(`[HeadScriptInjector] Successfully injected ${scripts.length} script(s) into <head>.`);
      }
    };

    const applySettings = (settings?: AdsSettings) => {
      if (!isMounted) return;
      if (settings?.isHeadAdsEnabled === false || isEnabled === false) {
        removeExistingInjected();
        return;
      }

      let codeToInject = '';
      if (Array.isArray(settings?.headerScripts) && settings.headerScripts.length > 0) {
        const activeCodes = settings.headerScripts
          .filter((s) => s && s.isEnabled && s.code && s.code.trim())
          .map((s) => s.code.trim());
        codeToInject = activeCodes.join('\n\n');
      }

      if (!codeToInject && settings?.headAds) {
        codeToInject = settings.headAds;
      }

      injectScripts(codeToInject);
    };

    // If initialHeadAds provided from SSR and enabled, inject it immediately
    if (isEnabled && initialHeadAds && initialHeadAds.trim()) {
      injectScripts(initialHeadAds);
    }

    // Subscribe to live cache updates
    const unsubscribe = subscribeAdsSettings((updated) => {
      applySettings(updated);
    });

    // Always fetch fresh ads settings from /ads/fast on mount
    fetchAdsSettingsAsync().then((settings) => {
      applySettings(settings);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initialHeadAds, isEnabled]);

  return null;
};

