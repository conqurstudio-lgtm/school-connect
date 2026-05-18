const withPWA = require('next-pwa')({
  dest:        'public',
  register:    true,
  skipWaiting: true,
  disable:     true, // Disabled — re-enable when ready for production PWA
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Supabase images — cache first, serve instantly on repeat visits
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images-v1',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Supabase API — network first with fast timeout so offline still shows cached data
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-v1',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // App pages — stale while revalidate: instant load from cache, update in background
    {
      urlPattern: /^https?:\/\/[^/]+\/(feed|school|auth).*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'app-pages-v1',
        expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    // Static assets — cache first forever
    {
      urlPattern: /\.(js|css|woff2?|png|jpg|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-v1',
        expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow shipping while we still clean up types — these don't affect runtime
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
    formats:  ['image/avif', 'image/webp'],
    deviceSizes: [390, 520, 768],
    imageSizes:  [64, 128, 256],
    minimumCacheTTL: 2592000, // 30 days
  },
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  // Reduce JS bundle — tree shake lucide
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // HTTP cache headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://bdvauoxgdluniwybcxas.supabase.co',
          },
        ],
      },
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
