'use client';

import React, { useEffect } from 'react';
import api from '@/lib/api';

interface HeadScriptInjectorProps {
  hasSsrHeadAds?: boolean;
}

export const HeadScriptInjector: React.FC<HeadScriptInjectorProps> = ({ hasSsrHeadAds = false }) => {
  useEffect(() => {
    // If SSR already rendered head ads directly into <head>, skip client fetch to save bandwidth and prevent duplicate scripts
    if (hasSsrHeadAds) return;

    let isMounted = true;

    const fetchAndInjectHeadAds = async () => {
      try {
        const res = await api.get('/ads/fast');
        if (!isMounted) return;

        const headAds = res.data?.data?.settings?.headAds;
        if (!headAds || !headAds.trim()) return;

        // Container in document.head to manage injected scripts
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
          document.head.appendChild(newScript);
        });

        // Append non-script tags (like <link>, <meta>, <style>) to <head>
        Array.from(wrapper.children).forEach((child) => {
          if (child.tagName !== 'SCRIPT') {
            document.head.appendChild(child.cloneNode(true));
          }
        });
      } catch (err) {
        // silent catch
      }
    };

    fetchAndInjectHeadAds();

    return () => {
      isMounted = false;
    };
  }, [hasSsrHeadAds]);

  return null;
};

