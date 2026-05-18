# School Connect — Mobile Feed Polish Package

This package focuses on the feed shell only. It is meant to make the mobile app feel more native, reduce top/bottom strip issues, smooth feed scrolling, fix pull-to-refresh targeting, clean notifications read-state mismatches, and make Vercel preview builds behave more like a real PWA.

## Files included

```txt
src/styles/globals.css
src/components/feed/FeedClient.tsx
src/components/feed/FeedHeader.tsx
src/components/feed/PullToRefresh.tsx
src/components/layout/NotificationPanel.tsx
src/components/pwa/InstallPrompt.tsx
src/lib/hooks/useNotifications.ts
next.config.js
```

## Install from your project root

Make sure you are inside your real project folder:

```bash
cd ~/Desktop/school-connect
```

Unzip the package:

```bash
unzip -o ~/Downloads/school-connect-mobile-polish.zip
```

Or, if the ZIP is not in Downloads, move it there first or update the path.

## Test locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/feed
```

## Push to Vercel

```bash
git status
git add src/styles/globals.css \
  src/components/feed/FeedClient.tsx \
  src/components/feed/FeedHeader.tsx \
  src/components/feed/PullToRefresh.tsx \
  src/components/layout/NotificationPanel.tsx \
  src/components/pwa/InstallPrompt.tsx \
  src/lib/hooks/useNotifications.ts \
  next.config.js

git commit -m "Polish mobile feed shell and PWA behavior"
git push
```

## What to test on mobile

1. Feed fills the phone screen without obvious white strips.
2. Header no longer creates a large top safe-area gap.
3. FAB sits closer to the bottom like a native app.
4. Pull-to-refresh works from the real feed scroll container.
5. Feed does not dim/blink when refreshing existing posts.
6. Notifications open as a full mobile sheet instead of a small centered modal.
7. Vercel preview/production enables the PWA service worker, while local dev keeps it disabled.

## Note

After deploying to Vercel, if your browser had an older service worker, refresh twice or clear site data before judging the final mobile behavior.
