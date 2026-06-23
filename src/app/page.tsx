import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

export default function HomePage() {
  return (
    <main style={{
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
          fontSize: 12.6,
          lineHeight: 1.45,
          margin: '0 0 14px',
        }}>
          By continuing, you agree to our{' '}
          <Link href="/privacy" style={{ color: '#21222D', fontWeight: 620, textDecoration: 'none' }}>
            Privacy & Safety Policy
          </Link>.
        </p>

        <Link
          href="/auth/login"
          style={{
            minHeight: 54,
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
            gap: 8,
            textDecoration: 'none',
            letterSpacing: '-0.012em',
          }}
        >
          Get started <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  )
}
