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

    const normalizeCode = (s?: string) => (s || '').replace(/\r\n/g, '\n').trim();

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

      // If code is identical to what is already in head (e.g. from SSR), DO NOT re-inject or remove
      if (normalizeCode(currentInjectedHtmlRef.current) === normalizeCode(codeToInject)) {
        return;
      }

      injectScripts(codeToInject);
    };

    // Since SSR (SSRHeadScripts) already rendered initialHeadAds directly into <head>,
    // record it in ref so we don't duplicate injection on initial load
    if (isEnabled && initialHeadAds && initialHeadAds.trim()) {
      currentInjectedHtmlRef.current = initialHeadAds;
    } else if (typeof document !== 'undefined') {
      const existingSSR = document.querySelectorAll('[data-streamespn-head-script="true"]');
      if (existingSSR.length > 0) {
        // SSR scripts are present in DOM, seed ref with initialHeadAds or mark present
        currentInjectedHtmlRef.current = initialHeadAds || '';
      }
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


