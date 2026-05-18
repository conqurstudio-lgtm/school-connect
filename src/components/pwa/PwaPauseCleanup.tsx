'use client'

import { useEffect } from 'react'

export function PwaPauseCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Remove old service workers from previous PWA builds so Safari/Chrome
    // stop serving cached shell/CSS while we test browser-scroll mode.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => registration.unregister().catch(() => {}))
        })
        .catch(() => {})
    }

    // Clear common runtime caches created by next-pwa/workbox.
    if ('caches' in window) {
      caches.keys()
        .then(keys => {
          keys
            .filter(key =>
              key.includes('workbox') ||
              key.includes('supabase') ||
              key.includes('app-pages') ||
              key.includes('static-assets') ||
              key.includes('precache')
            )
            .forEach(key => caches.delete(key).catch(() => {}))
        })
        .catch(() => {})
    }
  }, [])

  return null
}
