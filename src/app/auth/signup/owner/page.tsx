import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, School } from 'lucide-react'

const T = {
  white: '#FFFFFF',
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  primary: '#2B2B2F',
  soft: '#F8F8F9',
  redBg: '#FFF1F1',
  redBorder: 'rgba(220,38,38,0.16)',
  red: '#B42318',
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

const secondaryButton = {
  minHeight: 44,
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  fontSize: 14,
  fontWeight: 580,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  textDecoration: 'none',
}

function StepDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: T.primary }} />
      <span style={{ width: 20, height: 6, borderRadius: 999, background: T.primary }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E6E6EA' }} />
    </div>
  )
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || ''
}

export default function OwnerSignupPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const schoolName = first(searchParams.school_name).trim()
  const schoolPhone = first(searchParams.school_phone).trim()
  const schoolEmail = first(searchParams.school_email).trim()
  const error = first(searchParams.error).trim()

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
          <p style={{ margin: 0, color: T.ink, fontSize: 23, fontWeight: 640, letterSpacing: '-0.035em' }}>
            School Connect
          </p>
          <p style={{ margin: '6px 0 0', color: T.ink3, fontSize: 13, lineHeight: 1.38 }}>
            Owner account for {schoolName || 'your school'}.
          </p>
        </div>

        <section style={{
          width: '100%',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 28,
          boxShadow: '0 18px 58px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 18px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <p style={{ margin: 0, color: T.ink, fontSize: 18, fontWeight: 640, letterSpacing: '-0.025em' }}>
              Owner account
            </p>
            <StepDots />
          </div>

          <form method="POST" action="/api/auth/create-school-owner-form" style={{ padding: '0 18px 18px', display: 'grid', gap: 14 }}>
            {error && (
              <div style={{
                borderRadius: 14,
                border: `1px solid ${T.redBorder}`,
                background: T.redBg,
                color: T.red,
                padding: '10px 12px',
                fontSize: 13,
                lineHeight: 1.45,
                fontWeight: 560,
              }}>
                {error}
              </div>
            )}

            {!schoolName && (
              <div style={{
                borderRadius: 14,
                border: `1px solid ${T.redBorder}`,
                background: T.redBg,
                color: T.red,
                padding: '10px 12px',
                fontSize: 13,
                lineHeight: 1.45,
                fontWeight: 560,
              }}>
                School name is missing. Go back and enter school details again.
              </div>
            )}

            <input type="hidden" name="school_name" value={schoolName} />
            <input type="hidden" name="school_phone" value={schoolPhone} />
            <input type="hidden" name="school_email" value={schoolEmail} />

            <div style={{
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: 12,
              background: T.soft,
            }}>
              <p style={{ margin: 0, color: T.ink, fontSize: 13.5, fontWeight: 620 }}>{schoolName || 'School not set'}</p>
              <p style={{ margin: '3px 0 0', color: T.ink3, fontSize: 12.5 }}>{schoolPhone || schoolEmail || 'School details captured'}</p>
            </div>

            <div>
              <label style={labelStyle}>Owner full name</label>
              <input name="owner_name" required autoComplete="name" placeholder="School Owner" style={inputStyle} autoFocus />
            </div>

            <div>
              <label style={labelStyle}>Owner email</label>
              <input name="owner_email" required type="email" autoComplete="email" placeholder="owner@school.co.za" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input name="password" required minLength={8} type="password" autoComplete="new-password" placeholder="At least 8 characters" style={inputStyle} />
            </div>

            <button type="submit" className="sc-pressable" style={{ ...primaryButton, opacity: schoolName ? 1 : 0.55 }} disabled={!schoolName}>
              <Check size={16} /> Create school account
            </button>

            <Link href="/auth/signup" className="sc-pressable" style={secondaryButton}>
              <ArrowLeft size={15} /> Back
            </Link>
          </form>
        </section>
      </div>
    </main>
  )
}
