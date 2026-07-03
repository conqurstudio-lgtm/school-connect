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
          padding: '46px 34px 36px',
          boxSizing: 'border-box',
        }}
      >
        <AuthWelcomeHero
          title="School Connect"
          text="Keep school and home connected in one simple space."
        />

        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 20,
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
                width: 'fit-content',
                minHeight: 52,
                padding: '0 30px',
                borderRadius: 14,
                border: 'none',
                background: '#21222D',
                color: '#FFFFFF',
                fontSize: 13.2,
                fontWeight: 650,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '-0.012em',
                boxShadow: '0 14px 28px rgba(33,34,45,0.18)',
                transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              Get started
            </span>
          </Link>

          <AuthPrivacyLine />
        </div>
      </section>
    </main>
  )
}
