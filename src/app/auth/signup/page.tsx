'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#21222D',
  border: '#DBDBE5',
  primary: '#21222D',
  red: '#B42318',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 58,
  padding: '14px 15px',
  fontSize: 13.4,
  border: `1px solid ${T.border}`,
  borderRadius: 18,
  background: T.white,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  fontWeight: 430,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.8,
  fontWeight: 540,
  color: T.ink2,
  marginBottom: 10,
  letterSpacing: '-0.01em',
}

const primaryButton: React.CSSProperties = {
  minHeight: 54,
  width: '100%',
  borderRadius: 18,
  border: 'none',
  background: T.primary,
  color: T.white,
  fontSize: 13.8,
  fontWeight: 590,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  letterSpacing: '-0.012em',
  marginTop: 5,
}

const secondaryButton: React.CSSProperties = {
  minHeight: 52,
  width: '100%',
  borderRadius: 18,
  border: `1px solid rgba(0,0,0,0.09)`,
  background: T.white,
  color: T.ink2,
  fontSize: 13.4,
  fontWeight: 540,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  letterSpacing: '-0.01em',
}

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const [schoolName, setSchoolName] = useState('')
  const [schoolPhone, setSchoolPhone] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [error, setError] = useState('')

  const canContinue = useMemo(() => schoolName.trim().length >= 2, [schoolName])

  const nextStep = () => {
    setError('')

    if (step === 0 && !canContinue) {
      setError('Please enter your school name to continue.')
      return
    }

    setStep((value) => Math.min(value + 1, 2))
  }

  const backStep = () => {
    setError('')
    setStep((value) => Math.max(value - 1, 0))
  }

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
      <section style={{
        width: '100%',
        maxWidth: 390,
        minHeight: 'calc(100dvh - 44px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ marginBottom: 34 }}>
          <AuthWelcomeHero
            compact
            imageSize={132}
            title="Create your school space"
            text="Set up a clean space for reports, teachers and parent communication."
          />
        </div>

        {error ? (
          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(180,35,24,0.18)',
            background: '#FFF5F5',
            color: T.red,
            padding: '10px 12px',
            fontSize: 12.8,
            lineHeight: 1.4,
            fontWeight: 520,
            marginBottom: 18,
          }}>
            {error}
          </div>
        ) : null}

        <form method="GET" action="/auth/signup/owner" style={{ display: 'grid', gap: 20 }}>
          {step !== 0 ? <input type="hidden" name="school_name" value={schoolName.trim()} /> : null}
          {step !== 1 ? <input type="hidden" name="school_phone" value={schoolPhone.trim()} /> : null}
          {step !== 1 ? <input type="hidden" name="school_email" value={schoolEmail.trim()} /> : null}

          {step === 0 ? (
            <div>
              <label style={labelStyle}>School name</label>
              <input
                name="school_name"
                required
                autoComplete="organization"
                placeholder="Demo Primary School"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                style={inputStyle}
                autoFocus
              />
            </div>
          ) : null}

          {step === 1 ? (
            <>
              <div>
                <label style={labelStyle}>Phone optional</label>
                <input
                  name="school_phone"
                  placeholder="011 000 0000"
                  value={schoolPhone}
                  onChange={(event) => setSchoolPhone(event.target.value)}
                  style={inputStyle}
                  inputMode="tel"
                />
              </div>

              <div>
                <label style={labelStyle}>Email optional</label>
                <input
                  name="school_email"
                  type="email"
                  placeholder="info@school.co.za"
                  value={schoolEmail}
                  onChange={(event) => setSchoolEmail(event.target.value)}
                  style={inputStyle}
                  inputMode="email"
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div style={{
              display: 'grid',
              gap: 16,
              padding: '6px 0 8px',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 500 }}>School name</p>
                <p style={{ margin: '3px 0 0', fontSize: 13.8, color: T.ink, fontWeight: 570 }}>
                  {schoolName.trim() || 'Not set'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 500 }}>Phone</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.8, color: T.ink2, fontWeight: 440 }}>
                  {schoolPhone.trim() || 'Optional'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 500 }}>Email</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.8, color: T.ink2, fontWeight: 440, overflowWrap: 'anywhere' }}>
                  {schoolEmail.trim() || 'Optional'}
                </p>
              </div>
            </div>
          ) : null}

          {step < 2 ? (
            <button type="button" className="sc-pressable" style={primaryButton} onClick={nextStep}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" className="sc-pressable" style={primaryButton}>
              Continue to owner account <ArrowRight size={16} />
            </button>
          )}

          {step > 0 ? (
            <button type="button" className="sc-pressable" style={secondaryButton} onClick={backStep}>
              <ArrowLeft size={15} /> Back
            </button>
          ) : null}
        </form>

        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 11.7, lineHeight: 1.45 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: T.ink, textDecoration: 'none', fontWeight: 590 }}>
              Sign in
            </Link>
          </p>

          <p style={{ margin: '10px 0 0', color: T.ink3, fontSize: 11.7, lineHeight: 1.45 }}>
            By continuing, you agree to our{' '}
            <Link href="/privacy" style={{ color: T.ink, textDecoration: 'none', fontWeight: 590 }}>
              Privacy & Safety Policy
            </Link>.
          </p>
        </div>
      </section>
    </main>
  )
}
