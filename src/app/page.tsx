import Link from 'next/link'

import { AuthPrivacyLine } from '@/components/auth/AuthDetailText'
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
        padding: 'max(22px, env(safe-area-inset-top)) 22px max(22px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
        color: '#21222D',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 360,
          minHeight: 'calc(100dvh - 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '26px 10px 30px',
          boxSizing: 'border-box',
        }}
      >
        <AuthWelcomeHero
          title="School Connect"
          text="Keep school and home connected in one simple space."
          imageSize={148}
        />

        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 16,
            marginTop: -4,
          }}
        >
          <Link
            href="/auth/signup"
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            <span
              className="sc-pressable"
              style={{
                minHeight: 48,
                padding: '0 28px',
                borderRadius: 14,
                border: 'none',
                background: '#21222D',
                color: '#FFFFFF',
                fontSize: 13.4,
                fontWeight: 650,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.012em',
                boxShadow: '0 12px 24px rgba(33,34,45,0.14)',
                transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              Get started
            </span>
          </Link>

          <p
            style={{
              margin: '2px 0 0',
              color: 'rgba(33, 34, 45, 0.48)',
              fontSize: 12.5,
              lineHeight: 1.5,
              fontWeight: 420,
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/auth/login"
              style={{
                color: '#21222D',
                textDecoration: 'none',
                fontWeight: 650,
              }}
            >
              Sign in
            </Link>
          </p>

          <div style={{ marginTop: 10 }}>
            <AuthPrivacyLine />
          </div>
        </div>
      </section>
    </main>
  )
}
