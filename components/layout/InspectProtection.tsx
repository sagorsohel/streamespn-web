'use client';

import { useEffect } from 'react';

export function InspectProtection() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable Key Combinations for DevTools and View Source
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const code = e.keyCode || e.which;

      // F12 (DevTools)
      if (key === 'F12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + Shift + I / J / C / K / E (DevTools, Console, Inspector)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (key === 'I' || key === 'J' || key === 'C' || key === 'K' || key === 'E' || code === 73 || code === 74 || code === 67 || code === 75 || code === 69)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Mac: Cmd + Option + I / J / C / U
      if (
        e.metaKey &&
        e.altKey &&
        (key === 'I' || key === 'J' || key === 'C' || key === 'U' || code === 73 || code === 74 || code === 67 || code === 85)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U or Cmd + U (View Source)
      if ((e.ctrlKey || e.metaKey) && (key === 'U' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S or Cmd + S (Save Page / View Source offline)
      if ((e.ctrlKey || e.metaKey) && (key === 'S' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Attach listeners with capture = true so they intercept before any other handlers
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return null;
}
