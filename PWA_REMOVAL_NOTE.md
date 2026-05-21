# PWA Runtime Removed

The app no longer uses `next-pwa` at runtime.

Removed:
- `next-pwa` wrapper from `next.config.js`
- generated `public/sw.js`
- generated `public/workbox-*.js`
- generated `public/manifest.json`
- Apple standalone install metadata

Kept intentionally:
- `PwaPauseCleanup` in `layout.tsx`

Why keep `PwaPauseCleanup`?
Old phones/browsers may already have a service worker installed. Keeping this cleanup component for a few deploys helps unregister old service workers and clear old caches.

Do not remove:
- `viewportFit: 'cover'`
- `mobile-safe-area.css`
- body background `#FCFCFF`

Those are layout/safe-area behaviours, not PWA caching.
