'use client'

import { AuthDetailText, AuthPrivacyLine, AuthTextLink } from '@/components/auth/AuthDetailText'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#21222D',
  border: '#DBDBE5',
  accent: '#958CE8',
  primary: '#21222D',
  soft: '#F7F8FC',
  red: '#B42318',
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
      setError('Enter your school name.')
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
            imageSize={132}
            title="Create school account"
            text="Add your school details."
          />
        </div>

        {error ? (
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(180,35,24,0.18)',
              background: '#FFF5F5',
              color: T.red,
              padding: '10px 12px',
              fontSize: 12.6,
              lineHeight: 1.4,
              fontWeight: 520,
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        ) : null}

        <form method="GET" action="/auth/signup/owner" style={{ display: 'grid', gap: 20 }}>
          {step !== 0 ? <input type="hidden" name="school_name" value={schoolName.trim()} /> : null}
          {step !== 1 ? <input type="hidden" name="school_phone" value={schoolPhone.trim()} /> : null}
          {step !== 1 ? <input type="hidden" name="school_email" value={schoolEmail.trim()} /> : null}

          {step === 0 ? (
            <div key="school-step" className="sc-form-step-swipe">
              <AuthFormField
                label="School name"
                name="school_name"
                placeholder="Demo Primary School"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                autoComplete="organization"
                required
                autoFocus
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div key="contact-step" className="sc-form-step-swipe" style={{ display: 'grid', gap: 20 }}>
              <AuthFormField
                label="Phone"
                name="school_phone"
                type="tel"
                placeholder="011 000 0000"
                value={schoolPhone}
                onChange={(event) => setSchoolPhone(event.target.value)}
                inputMode="tel"
              />

              <AuthFormField
                label="Email"
                name="school_email"
                type="email"
                placeholder="info@school.co.za"
                value={schoolEmail}
                onChange={(event) => setSchoolEmail(event.target.value)}
                inputMode="email"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div
              key="review-step"
              className="sc-form-step-swipe"
              style={{
                display: 'grid',
                gap: 12,
                border: `1px solid ${T.border}`,
                borderRadius: 18,
                padding: 14,
                background: T.soft,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 560 }}>School name</p>
                <p style={{ margin: '3px 0 0', fontSize: 13.4, color: T.ink, fontWeight: 610 }}>
                  {schoolName.trim() || 'Not set'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 560 }}>Phone</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.8, color: T.ink2, fontWeight: 440 }}>
                  {schoolPhone.trim() || 'Not added'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: 11.7, color: T.ink3, fontWeight: 560 }}>Email</p>
                <p style={{ margin: '3px 0 0', fontSize: 12.8, color: T.ink2, fontWeight: 440, overflowWrap: 'anywhere' }}>
                  {schoolEmail.trim() || 'Not added'}
                </p>
              </div>
            </div>
          ) : null}

          {step < 2 ? (
            <AuthSubmitButton type="button" onClick={nextStep}>
              Continue
            </AuthSubmitButton>
          ) : (
            <AuthSubmitButton>
              Create owner account
            </AuthSubmitButton>
          )}

          {step > 0 ? (
            <button type="button" className="sc-pressable" style={secondaryButton} onClick={backStep}>
              Back
            </button>
          ) : null}
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, display: 'grid', gap: 12 }}>
          <AuthDetailText>
            Already registered?{' '}
            <AuthTextLink href="/auth/login">
              Sign in
            </AuthTextLink>
          </AuthDetailText>

          <AuthPrivacyLine />
        </div>
      </section>
    </main>
  )
}
