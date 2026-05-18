const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,

  // Local dev stays clean. Vercel production/preview builds get the PWA service worker.
  disable: true, // PWA paused while we stabilise mobile browser scrolling // PWA paused while we stabilise mobile browser scrolling

  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images-v1',
        expiration: { maxEntries: 220, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-v1',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 80, maxAgeSeconds: 5 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https?:\/\/[^/]+\/(feed|school|reports|auth).*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'app-pages-v1',
        expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-v1',
        expiration: { maxEntries: 140, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep shipping while the old ts-nocheck files are gradually cleaned up.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 430, 520, 768],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2592000,
  },

  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
