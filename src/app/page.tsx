import Link from 'next/link'
import { AuthArrow } from '@/components/auth/AuthArrow'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

export default function HomePage() {
  return (
    <main className="sc-page-enter" style={{
      minHeight: '100dvh',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 18px calc(24px + env(safe-area-inset-bottom, 0px))',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: '#21222D',
      boxSizing: 'border-box',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 390,
        minHeight: 'calc(100dvh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AuthWelcomeHero />
        </div>

        <p style={{
          textAlign: 'center',
          color: '#21222D',
          fontSize: 11.4,
          lineHeight: 1.42,
          margin: '0 0 18px',
          fontWeight: 390,
        }}>
          Please read our{' '}
          <Link href="/privacy" style={{ color: '#958CE8', fontWeight: 600, textDecoration: 'none' }}>
            School Connect Privacy Policy
          </Link>.
          {' '}By continuing, you agree to the{' '}
          <Link href="/terms" style={{ color: '#958CE8', fontWeight: 600, textDecoration: 'none' }}>
            School Connect Terms of Service
          </Link>.
        </p>

        <Link
          href="/auth/login"
          style={{
            minHeight: 52,
            width: '100%',
            borderRadius: 18,
            border: 'none',
            background: '#21222D',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textDecoration: 'none',
            letterSpacing: '-0.012em',
          }}
        >
          Get started <AuthArrow direction="right" size={13} />
        </Link>
      </section>
    </main>
  )
}
