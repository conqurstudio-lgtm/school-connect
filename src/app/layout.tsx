import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import '@/styles/globals.css'

// Self-hosted via next/font — zero network request, no FOUT, subset to latin only
const inter = Inter({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  display:  'swap',
  variable: '--font-inter',
  preload:  true,
})

export const metadata: Metadata = {
  title:       { default: 'School Connect', template: '%s - School Connect' },
  description: 'Your school feed - moments, updates and events.',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'School Connect',
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
    icon:  [{ url: '/favicon.ico', sizes: 'any' }],
  },
}

export const viewport: Viewport = {
  themeColor:   '#FCFCFF',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit:  'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable"            content="yes" />
        <meta name="apple-mobile-web-app-capable"      content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"        content="School Connect" />
        <link rel="apple-touch-icon"                   href="/icons/icon-192.png" />
        <link rel="icon"                               href="/favicon.ico" sizes="any" />
        <link rel="icon"                               href="/icons/icon-192.png" type="image/png" />
        {/* DNS prefetch for Supabase */}
        <link rel="dns-prefetch" href="//supabase.co" />
        <link rel="preconnect"   href="https://igynbwratioqnijqpsxm.supabase.co" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), -apple-system, system-ui, sans-serif', background: '#FCFCFF' }}>
        {children}
        <InstallPrompt />
        <Toaster
          position="top-center"
          containerStyle={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          toastOptions={{
            duration: 2500,
            style: {
              background:           'rgba(26,26,26,0.92)',
              backdropFilter:       'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color:                '#F5F5F5',
              borderRadius:         '12px',
              fontSize:             '14px',
              fontWeight:           '500',
              padding:              '10px 14px',
              border:               '1px solid rgba(255,255,255,0.08)',
              fontFamily:           'var(--font-inter), system-ui, sans-serif',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#FF3B30', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
