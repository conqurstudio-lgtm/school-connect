import Link from 'next/link'
import { ArrowRight, LockKeyhole } from 'lucide-react'

type LoginPageProps = {
  searchParams?: {
    error?: string
    created?: string
    redirectTo?: string
  }
}

const T = {
  white: '#FFFFFF',
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  soft: '#F8F8F9',
  red: '#B42318',
  green: '#1F9D55',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '12px 14px',
  fontSize: 16,
  border: `1px solid ${T.border}`,
  borderRadius: 15,
  background: T.white,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 650,
  color: T.ink2,
  marginBottom: 7,
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error ? decodeURIComponent(String(searchParams.error)) : ''
  const created = searchParams?.created === '1'
  const redirectTo = searchParams?.redirectTo || '/school'

  return (
    <main style={{
      minHeight: '100dvh',
      background: T.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 14px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      color: T.ink,
    }}>
      <section style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 18,
            background: T.soft,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: T.ink,
          }}>
            <LockKeyhole size={24} strokeWidth={1.8} />
          </div>

          <h1 style={{
            fontSize: 24,
            lineHeight: 1.1,
            fontWeight: 650,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            Sign in to School Connect
          </h1>

          <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.45, margin: '7px 0 0' }}>
            Open your school dashboard.
          </p>
        </div>

        <form
          method="post"
          action="/api/auth/login-redirect"
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            padding: 16,
            boxShadow: '0 18px 55px rgba(0,0,0,0.045)',
            display: 'grid',
            gap: 14,
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
              fontSize: 12.8,
              lineHeight: 1.4,
              fontWeight: 560,
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
              fontSize: 12.8,
              lineHeight: 1.4,
              fontWeight: 560,
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
              minHeight: 48,
              width: '100%',
              borderRadius: 15,
              border: 'none',
              background: T.ink,
              color: T.white,
              fontSize: 14.5,
              fontWeight: 650,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 2,
            }}
          >
            Sign in <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: T.ink3, margin: '14px 0 0' }}>
          No school account yet?{' '}
          <Link href="/auth/signup" style={{ color: T.ink, fontWeight: 650, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}
