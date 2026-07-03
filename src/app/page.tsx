import Link from 'next/link'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

import { AuthPrivacyLine } from '@/components/auth/AuthDetailText'
export default function WelcomePage() {
  return (
    <main
      className="sc-page-enter"
      style={{
        minHeight: '100dvh',
        background: '#F5F6F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
              boxShadow: '0 14px 28px rgba(0,115,63,0.22)',
              transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
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
            title="School Connect"
            text="A calmer way to keep school and home connected."
          />
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Link
            href="/auth/signup"
            className="sc-pressable"
            style={{
              minHeight: 52,
              width: '100%',
              borderRadius: 16,
              border: 'none',
              background: '#00733f',
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
            Create your school account
          </Link>

          <AuthPrivacyLine />
        </div>
      </section>
    </main>
  )
}
