import Link from 'next/link'
import { ArrowRight, School } from 'lucide-react'

const T = {
  white: '#FFFFFF',
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  primary: '#2B2B2F',
  soft: '#F8F8F9',
}

const inputStyle = {
  width: '100%',
  minHeight: 48,
  padding: '12px 14px',
  fontSize: 16,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  background: T.white,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 560,
  color: T.ink2,
  marginBottom: 7,
}

const primaryButton = {
  minHeight: 46,
  width: '100%',
  borderRadius: 14,
  border: 'none',
  background: T.primary,
  color: T.white,
  fontSize: 14.5,
  fontWeight: 620,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}

function StepDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <span style={{ width: 20, height: 6, borderRadius: 999, background: T.primary }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E6E6EA' }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E6E6EA' }} />
    </div>
  )
}

export default function SignupPage() {
  return (
    <main
      className="sc-page-enter"
      style={{
        minHeight: '100dvh',
        background: T.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 430 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: T.soft,
            border: `1px solid ${T.border}`,
            color: T.ink,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <School size={24} strokeWidth={1.7} />
          </div>
          <p style={{
            margin: 0,
            color: T.ink,
            fontSize: 23,
            fontWeight: 640,
            letterSpacing: '-0.035em',
          }}>
            School Connect
          </p>
          <p style={{ margin: '6px 0 0', color: T.ink3, fontSize: 13, lineHeight: 1.38 }}>
            Create the school space for weekly reports.
          </p>
        </div>

        <section
          style={{
            width: '100%',
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 28,
            boxShadow: '0 18px 58px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '18px 18px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <p style={{ margin: 0, color: T.ink, fontSize: 18, fontWeight: 640, letterSpacing: '-0.025em' }}>
              School details
            </p>
            <StepDots />
          </div>

          <form method="GET" action="/auth/signup/owner" style={{ padding: '0 18px 18px', display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle}>School name</label>
              <input
                name="school_name"
                required
                autoComplete="organization"
                placeholder="Demo Primary School"
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Phone optional</label>
                <input name="school_phone" placeholder="011 000 0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email optional</label>
                <input name="school_email" type="email" placeholder="info@school.co.za" style={inputStyle} />
              </div>
            </div>

            <button type="submit" className="sc-pressable" style={primaryButton}>
              Continue <ArrowRight size={16} />
            </button>
          </form>
        </section>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: T.ink, textDecoration: 'none', fontWeight: 620 }}>
              Sign in
            </Link>&nbsp;</p>
        </div>
      </div>
    </main>
  )
}
