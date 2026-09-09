'use client';

import React, { useEffect } from 'react';
import api from '@/lib/api';

interface HeadScriptInjectorProps {
  initialHeadAds?: string;
  isEnabled?: boolean;
}

export const HeadScriptInjector: React.FC<HeadScriptInjectorProps> = ({ initialHeadAds, isEnabled = true }) => {
  useEffect(() => {
    let isMounted = true;

    // If disabled, remove any existing scripts from head and exit immediately
    if (isEnabled === false) {
      const existingContainer = document.getElementById('streamespn-head-scripts');
      if (existingContainer) {
        existingContainer.remove();
      }
      return;
    }

    const injectScripts = (headAds?: string) => {
      if (!headAds || !headAds.trim()) return;

      let headContainer = document.getElementById('streamespn-head-scripts');
      if (!headContainer) {
        headContainer = document.createElement('div');
        headContainer.id = 'streamespn-head-scripts';
        document.head.appendChild(headContainer);
      }

      headContainer.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.innerHTML = headAds;

      // Execute all <script> tags dynamically inside <head>
      const scripts = wrapper.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        }
        headContainer!.appendChild(newScript);
      });

      // Append non-script tags (like <link>, <meta>, <style>) to <head>
      Array.from(wrapper.children).forEach((child) => {
        if (child.tagName !== 'SCRIPT') {
          headContainer!.appendChild(child.cloneNode(true));
        }
      });
    };

    if (initialHeadAds && initialHeadAds.trim()) {
      injectScripts(initialHeadAds);
      return;
    }

    const fetchAndInjectHeadAds = async () => {
      try {
        const res = await api.get('/ads/fast');
        if (!isMounted) return;

        const settings = res.data?.data?.settings;
        if (settings?.isHeadAdsEnabled === false) return;

        const headAds = settings?.headAds;
        injectScripts(headAds);
      } catch (err) {
        // silent catch
      }
    };

    fetchAndInjectHeadAds();

    return () => {
      isMounted = false;
    };
  }, [initialHeadAds, isEnabled]);

  return null;
};

