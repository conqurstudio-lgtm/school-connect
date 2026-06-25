import Link from 'next/link'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'
import { AuthFormField } from '@/components/auth/AuthFormField'

import { AuthPrivacyLine } from '@/components/auth/AuthDetailText'
const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#21222D',
  border: '#DBDBE5',
  primary: '#21222D',
  accent: '#958CE8',
  soft: '#F7F8FC',
  redBg: '#FFF1F1',
  redBorder: 'rgba(220,38,38,0.16)',
  red: '#B42318',
}

const primaryButton: React.CSSProperties = {
  minHeight: 52,
  width: '100%',
  borderRadius: 16,
  border: 'none',
  background: T.primary,
  color: T.white,
  fontSize: 13.2,
  fontWeight: 610,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '-0.012em',
  marginTop: 8,
  boxShadow: '0 14px 28px rgba(33,34,45,0.18)',
  transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
}

const secondaryButton: React.CSSProperties = {
  minHeight: 50,
  width: '100%',
  borderRadius: 16,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 590,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
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
        padding: 'max(22px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
        color: T.ink,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: 'calc(100dvh - 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <AuthWelcomeHero
            compact
            imageSize={128}
            title="Owner account"
            text="Create the login for your school."
          />
        </div>

        <form method="POST" action="/api/auth/create-school-owner-form" style={{ display: 'grid', gap: 20 }}>
          {error ? (
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${T.redBorder}`,
                background: T.redBg,
                color: T.red,
                padding: '10px 12px',
                fontSize: 12.6,
                lineHeight: 1.4,
                fontWeight: 520,
              }}
            >
              {error}
            </div>
          ) : null}

          {!schoolName ? (
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${T.redBorder}`,
                background: T.redBg,
                color: T.red,
                padding: '10px 12px',
                fontSize: 12.6,
                lineHeight: 1.4,
                fontWeight: 520,
              }}
            >
              School name is missing. Go back to add it.
            </div>
          ) : null}

          <input type="hidden" name="school_name" value={schoolName} />
          <input type="hidden" name="school_phone" value={schoolPhone} />
          <input type="hidden" name="school_email" value={schoolEmail} />

          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: 14,
              background: T.soft,
            }}
          >
            <p style={{ margin: 0, color: T.ink, fontSize: 12.8, fontWeight: 610 }}>{schoolName || 'School not set'}</p>
            <p style={{ margin: '3px 0 0', color: T.ink3, fontSize: 11.8 }}>{schoolPhone || schoolEmail || 'School details'}</p>
          </div>

          <AuthFormField
            label="Full name"
            name="owner_name"
            placeholder="School Owner"
            autoComplete="name"
            required
            autoFocus
          />

          <AuthFormField
            label="Email"
            name="owner_email"
            type="email"
            placeholder="owner@school.co.za"
            autoComplete="email"
            inputMode="email"
            required
          />

          <AuthFormField
            label="Password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" className="sc-pressable" style={{ ...primaryButton, opacity: schoolName ? 1 : 0.55 }} disabled={!schoolName}>
            Create account
          </button>

          <Link href="/auth/signup" className="sc-pressable" style={secondaryButton}>
            Back
          </Link>

          <AuthPrivacyLine />
        </form>
      </section>
    </main>
  )
}
