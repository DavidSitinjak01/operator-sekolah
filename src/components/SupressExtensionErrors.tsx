'use client';

import { useEffect } from 'react';

/**
 * Suppresses console errors caused by browser extensions
 * (e.g., "A listener indicated an asynchronous response by returning true,
 * but the message channel closed before a response was received").
 * These are NOT application errors — they come from Chrome/Edge extensions.
 */
export default function SuppressExtensionErrors() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message;
      if (
        msg?.includes('A listener indicated an asynchronous response') ||
        msg?.includes('message channel closed before a response') ||
        msg?.includes('Extension context invalidated') ||
        msg?.includes('Disconnection') ||
        (msg?.includes('extension') && msg?.includes('message'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener('error', handler, true);
    return () => window.removeEventListener('error', handler, true);
  }, []);

  return null;
}
