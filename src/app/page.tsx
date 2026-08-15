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
        justifyContent: 'center',
        padding: 'max(22px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
        color: '#21222D',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: 'calc(100dvh - 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10px 16px 26px',
          boxSizing: 'border-box',
        }}
      >
        <AuthWelcomeHero
          title="School Connect"
          text="Keep school and home connected in one simple space."
          imageSize={168}
        />

        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <Link
            href="/auth/signup"
            style={{
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <span
              className="sc-pressable"
              style={{
                width: '100%',
                minHeight: 56,
                borderRadius: 16,
                border: 'none',
                background: '#21222D',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 680,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.014em',
                boxShadow: '0 14px 28px rgba(33,34,45,0.16)',
                transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              Get started
            </span>
          </Link>

          <Link
            href="/auth/login"
            style={{
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <span
              className="sc-pressable"
              style={{
                width: '100%',
                minHeight: 56,
                borderRadius: 16,
                border: '1px solid rgba(33,34,45,0.04)',
                background: '#F4F4F6',
                color: '#21222D',
                fontSize: 15,
                fontWeight: 680,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.014em',
                boxShadow: 'none',
                transition: 'transform 170ms ease, background 170ms ease, border-color 170ms ease',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              Sign in
            </span>
          </Link>

          <div style={{ marginTop: 10 }}>
            <AuthPrivacyLine />
          </div>
        </div>
      </section>
    </main>
  )
}
