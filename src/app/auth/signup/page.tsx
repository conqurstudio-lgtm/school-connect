'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

const T = {
  white: '#FFFFFF',
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#70757C',
  border: 'rgba(0,0,0,0.12)',
  borderSoft: 'rgba(0,0,0,0.075)',
  primary: '#2B2B2F',
  soft: '#F8F9F8',
  red: '#B42318',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 56,
  padding: '14px 15px',
  fontSize: 16,
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
  fontSize: 12.5,
  fontWeight: 580,
  color: T.ink2,
  marginBottom: 8,
  letterSpacing: '-0.01em',
}

const primaryButton: React.CSSProperties = {
  minHeight: 54,
  width: '100%',
  borderRadius: 18,
  border: 'none',
  background: T.primary,
  color: T.white,
  fontSize: 15,
  fontWeight: 620,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  letterSpacing: '-0.012em',
}

const secondaryButton: React.CSSProperties = {
  minHeight: 52,
  width: '100%',
  borderRadius: 18,
  border: `1px solid ${T.borderSoft}`,
  background: T.white,
  color: T.ink2,
  fontSize: 14.5,
  fontWeight: 580,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  letterSpacing: '-0.01em',
}

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          style={{
            width: item === step ? 28 : 7,
            height: 7,
            borderRadius: 999,
            background: item <= step ? T.primary : '#E2E4E7',
            transition: 'width 180ms ease, background 180ms ease',
          }}
        />
      ))}
    </div>
  )
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
      <section style={{ width: '100%', maxWidth: 430 }}>
        <AuthWelcomeHero
          compact
          imageSize={132}
          title="Create your school space"
          text="Set up a clean space for reports, teachers and parent communication."
        />

        <section
          style={{
            width: '100%',
            background: T.white,
            border: `1px solid ${T.borderSoft}`,
            borderRadius: 30,
            boxShadow: '0 18px 58px rgba(20, 30, 28, 0.045)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '22px 22px 15px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 14,
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: 0,
                color: T.ink,
                fontSize: 23,
                fontWeight: 680,
                lineHeight: 1.08,
                letterSpacing: '-0.042em',
              }}>
                {step === 0 ? 'School details' : step === 1 ? 'Contact details' : 'Review details'}
              </p>

              <p style={{
                margin: '7px 0 0',
                color: T.ink3,
                fontSize: 13.3,
                lineHeight: 1.42,
                fontWeight: 410,
              }}>
                {step === 0
                  ? 'Start with the school name parents and teachers will recognise.'
                  : step === 1
                    ? 'Add optional contact details. You can update these later.'
                    : 'Confirm the school details before creating the owner account.'}
              </p>
            </div>

            <div style={{ paddingTop: 8 }}>
              <StepDots step={step} />
            </div>
          </div>

          {error ? (
            <div style={{
              margin: '0 22px 14px',
              borderRadius: 16,
              border: '1px solid rgba(180,35,24,0.18)',
              background: '#FFF5F5',
              color: T.red,
              padding: '10px 12px',
              fontSize: 12.8,
              lineHeight: 1.4,
              fontWeight: 520,
            }}>
              {error}
            </div>
          ) : null}

          <form method="GET" action="/auth/signup/owner" style={{ padding: '0 22px 22px', display: 'grid', gap: 15 }}>
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
                gap: 10,
                border: `1px solid ${T.borderSoft}`,
                borderRadius: 22,
                background: '#FAFAFA',
                padding: 14,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12.2, color: T.ink3, fontWeight: 500 }}>School name</p>
                  <p style={{ margin: '3px 0 0', fontSize: 14.5, color: T.ink, fontWeight: 570 }}>
                    {schoolName.trim() || 'Not set'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.2, color: T.ink3, fontWeight: 500 }}>Phone</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13.5, color: T.ink2, fontWeight: 440 }}>
                      {schoolPhone.trim() || 'Optional'}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: 12.2, color: T.ink3, fontWeight: 500 }}>Email</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13.5, color: T.ink2, fontWeight: 440, overflowWrap: 'anywhere' }}>
                      {schoolEmail.trim() || 'Optional'}
                    </p>
                  </div>
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
        </section>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13.2, lineHeight: 1.45 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: T.ink, textDecoration: 'none', fontWeight: 620 }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
