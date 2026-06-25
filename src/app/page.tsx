import Link from 'next/link'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

export default function WelcomePage() {
  return (
    <main
      className="sc-page-enter"
      style={{
        minHeight: '100dvh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
        color: '#21222D',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <AuthWelcomeHero
            imageSize={174}
            title="Welcome to School Connect"
            text="A simple way for schools, teachers and parents to stay connected."
          />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <Link
            href="/auth/signup"
            className="sc-pressable"
            style={{
              minHeight: 52,
              width: '100%',
              borderRadius: 16,
              border: 'none',
              background: '#21222D',
              color: '#FFFFFF',
              fontSize: 13.2,
              fontWeight: 610,
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              letterSpacing: '-0.012em',
              boxSizing: 'border-box',
            }}
          >
            Get started
          </Link>

          <p
            style={{
              textAlign: 'center',
              color: '#21222D',
              fontSize: 11.7,
              lineHeight: 1.45,
              margin: 0,
              fontWeight: 390,
            }}
          >
            Please read our{' '}
            <Link href="/privacy" style={{ color: '#958CE8', fontWeight: 600, textDecoration: 'none' }}>
              School Connect Privacy Policy
            </Link>.
          </p>
        </div>
      </section>
    </main>
  )
}
