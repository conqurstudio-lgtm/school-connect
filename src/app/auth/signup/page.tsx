'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { AuthDetailText, AuthPrivacyLine, AuthTextLink } from '@/components/auth/AuthDetailText'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

type SchoolForm = {
  schoolName: string
  schoolPhone: string
  schoolEmail: string
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 56,
  borderRadius: 999,
  border: 'none',
  background: '#f87645',
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 620,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '-0.014em',
  boxShadow: '0 14px 28px rgba(248,118,69,0.22)',
  transition: 'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
  boxSizing: 'border-box',
  cursor: 'pointer',
}

export default function SchoolSignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<SchoolForm>({
    schoolName: '',
    schoolPhone: '',
    schoolEmail: '',
  })

  const ownerHref = useMemo(() => {
    const params = new URLSearchParams()

    if (form.schoolName.trim()) params.set('schoolName', form.schoolName.trim())
    if (form.schoolPhone.trim()) params.set('schoolPhone', form.schoolPhone.trim())
    if (form.schoolEmail.trim()) params.set('schoolEmail', form.schoolEmail.trim())

    const query = params.toString()
    return query ? `/auth/signup/owner?${query}` : '/auth/signup/owner'
  }, [form.schoolEmail, form.schoolName, form.schoolPhone])

  function updateField(name: keyof SchoolForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function goNext() {
    if (!form.schoolName.trim()) {
      alert('Enter your school name.')
      return
    }

    setStep(2)
  }

  return (
    <main
      className="sc-page-enter school-connect-auth-page"
      style={{
        minHeight: '100dvh',
        background: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        padding: 'max(22px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
        color: '#21222D',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 390,
          minHeight: 'calc(100dvh - 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '42px 16px 26px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <AuthWelcomeHero
            title="Create school account"
            text="Start with your school details."
            compact
            imageSize={132}
          />

          <div
            aria-label="Signup progress"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 7,
              margin: '-6px 0 18px',
            }}
          >
            <span
              style={{
                width: step === 1 ? 18 : 7,
                height: 7,
                borderRadius: 999,
                background: '#f87645',
                transition: 'width 180ms ease',
              }}
            />
            <span
              style={{
                width: step === 2 ? 18 : 7,
                height: 7,
                borderRadius: 999,
                background: step === 2 ? '#f87645' : '#DBDBE5',
                transition: 'width 180ms ease, background 180ms ease',
              }}
            />
          </div>

          {step === 1 ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <AuthFormField
                label="School name"
                name="schoolName"
                type="text"
                placeholder="School name"
                required
                autoFocus
                value={form.schoolName}
                onChange={(event) => updateField('schoolName', event.target.value)}
              />

              <AuthFormField
                label="Phone"
                name="schoolPhone"
                type="tel"
                inputMode="tel"
                placeholder="Phone number"
                value={form.schoolPhone}
                onChange={(event) => updateField('schoolPhone', event.target.value)}
              />

              <AuthFormField
                label="Email"
                name="schoolEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="school@email.co.za"
                value={form.schoolEmail}
                onChange={(event) => updateField('schoolEmail', event.target.value)}
              />

              <AuthSubmitButton type="button" onClick={goNext}>
                Next
              </AuthSubmitButton>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  borderRadius: 18,
                  background: '#F4F4F6',
                  padding: 18,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(33,34,45,0.48)',
                      fontSize: 12.5,
                      lineHeight: 1.3,
                      fontWeight: 520,
                    }}
                  >
                    School
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: '#21222D',
                      fontSize: 15,
                      lineHeight: 1.35,
                      fontWeight: 620,
                    }}
                  >
                    {form.schoolName.trim()}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <p style={{ margin: 0, color: 'rgba(33,34,45,0.62)', fontSize: 13, lineHeight: 1.35 }}>
                    Phone: {form.schoolPhone.trim() || 'Not added'}
                  </p>
                  <p style={{ margin: 0, color: 'rgba(33,34,45,0.62)', fontSize: 13, lineHeight: 1.35 }}>
                    Email: {form.schoolEmail.trim() || 'Not added'}
                  </p>
                </div>
              </div>

              <Link href={ownerHref} style={{ textDecoration: 'none', display: 'block' }}>
                <span className="sc-pressable" style={primaryButtonStyle}>
                  Create owner account
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  minHeight: 48,
                  borderRadius: 999,
                  border: '1px solid rgba(248,118,69,0.12)',
                  background: '#FFF3EE',
                  color: '#f87645',
                  fontSize: 14,
                  fontWeight: 650,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12, textAlign: 'center', marginTop: 'auto', paddingTop: 34 }}>
          <AuthDetailText>
            Already have an account?{' '}
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
