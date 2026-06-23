import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

type LoginPageProps = {
  searchParams?: {
    error?: string
    created?: string
    redirectTo?: string
  }
}

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#21222D',
  border: '#DBDBE5',
  red: '#B42318',
  green: '#1F9D55',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '12px 14px',
  fontSize: 14.5,
  border: `1px solid ${T.border}`,
  borderRadius: 15,
  background: T.white,
  color: T.ink,
  outline: 'none',
  boxShadow: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  fontWeight: 430,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.8,
  fontWeight: 540,
  color: T.ink2,
  marginBottom: 7,
  letterSpacing: '-0.01em',
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error ? decodeURIComponent(String(searchParams.error)) : ''
  const created = searchParams?.created === '1'
  const redirectTo = searchParams?.redirectTo || '/school'

  return (
    <main className="sc-page-enter" style={{
      minHeight: '100dvh',
      background: T.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '22px 18px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: T.ink,
      boxSizing: 'border-box',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 390,
      }}>
        <AuthWelcomeHero
          compact
          imageSize={132}
          title="Sign in"
          text="Open your School Connect space."
        />

        <form
          method="post"
          action="/api/auth/login-redirect"
          style={{
            display: 'grid',
            gap: 17,
          }}
        >
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {created && !error && (
            <div style={{
              borderRadius: 14,
              border: '1px solid rgba(31,157,85,0.18)',
              background: '#F2FBF6',
              color: T.green,
              padding: '10px 12px',
              fontSize: 12.2,
              lineHeight: 1.4,
              fontWeight: 520,
            }}>
              School created. Sign in with the owner email and password.
            </div>
          )}

          {error && (
            <div style={{
              borderRadius: 14,
              border: '1px solid rgba(180,35,24,0.18)',
              background: '#FFF5F5',
              color: T.red,
              padding: '10px 12px',
              fontSize: 12.2,
              lineHeight: 1.4,
              fontWeight: 520,
            }}>
              {error}
            </div>
          )}

          <label>
            <span style={labelStyle}>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              style={inputStyle}
              autoFocus
            />
          </label>

          <label>
            <span style={labelStyle}>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter password"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              minHeight: 52,
              width: '100%',
              borderRadius: 18,
              border: 'none',
              background: '#21222D',
              color: T.white,
              fontSize: 13.8,
              fontWeight: 590,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
              letterSpacing: '-0.012em',
            }}
          >
            Sign in <ArrowRight size={16} />
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 12.2,
          color: T.ink3,
          margin: '22px 0 0',
          lineHeight: 1.45,
        }}>
          No school account yet?{' '}
          <Link href="/auth/signup" style={{ color: T.ink, fontWeight: 590, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>

        <p style={{
          textAlign: 'center',
          fontSize: 11.8,
          color: T.ink3,
          margin: '12px 0 0',
          lineHeight: 1.45,
        }}>
          Read our{' '}
          <Link href="/privacy" style={{ color: T.ink, fontWeight: 590, textDecoration: 'none' }}>
            Privacy & Safety Policy
          </Link>
        </p>
      </section>
    </main>
  )
}
