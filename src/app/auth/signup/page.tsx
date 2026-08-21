'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import {
  AuthDetailText,
  AuthPrivacyLine,
  AuthTextLink,
} from '@/components/auth/AuthDetailText'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

type SchoolForm = {
  schoolName: string
  schoolPhone: string
  schoolEmail: string
  hasBranches: '' | 'yes' | 'no'
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 56,
  borderRadius: 999,
  border: 'none',
  background: '#f87645',
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '-0.014em',
  boxShadow: '0 14px 28px rgba(248,118,69,0.22)',
  transition:
    'transform 170ms ease, background 170ms ease, box-shadow 170ms ease',
  boxSizing: 'border-box',
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  width: '100%',
  borderRadius: 999,
  border: '1px solid rgba(248,118,69,0.14)',
  background: 'rgba(255,243,238,0.62)',
  color: '#f87645',
  fontSize: 13.5,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

function branchOptionStyle(
  selected: boolean
): React.CSSProperties {
  return {
    width: '100%',
    minHeight: 76,
    borderRadius: 20,
    border: selected
      ? '1.5px solid rgba(248,118,69,0.65)'
      : '1px solid rgba(33,34,45,0.09)',
    background: selected
      ? 'rgba(255,243,238,0.78)'
      : '#FFFFFF',
    padding: '15px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }
}

export default function SchoolSignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [form, setForm] = useState<SchoolForm>({
    schoolName: '',
    schoolPhone: '',
    schoolEmail: '',
    hasBranches: '',
  })

  const ownerHref = useMemo(() => {
    const params = new URLSearchParams()

    if (form.schoolName.trim()) {
      params.set('school_name', form.schoolName.trim())
      params.set('schoolName', form.schoolName.trim())
    }

    if (form.schoolPhone.trim()) {
      params.set('school_phone', form.schoolPhone.trim())
      params.set('schoolPhone', form.schoolPhone.trim())
    }

    if (form.schoolEmail.trim()) {
      params.set('school_email', form.schoolEmail.trim())
      params.set('schoolEmail', form.schoolEmail.trim())
    }

    if (form.hasBranches) {
      params.set('has_branches', form.hasBranches)
    }

    const query = params.toString()

    return query
      ? `/auth/signup/owner?${query}`
      : '/auth/signup/owner'
  }, [
    form.schoolEmail,
    form.schoolName,
    form.schoolPhone,
    form.hasBranches,
  ])

  function updateField(
    name: keyof SchoolForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function goSchoolDetailsNext() {
    if (!form.schoolName.trim()) {
      alert('Enter your school name.')
      return
    }

    setStep(2)
  }

  function goBranchQuestionNext() {
    if (!form.hasBranches) {
      alert('Please choose Yes or No.')
      return
    }

    setStep(3)
  }

  return (
    <main
      className="sc-page-enter school-connect-auth-page"
      style={{
        minHeight: '100dvh',
        background: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        padding:
          'max(22px, env(safe-area-inset-top)) 18px max(22px, env(safe-area-inset-bottom))',
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
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
          padding: '36px 16px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <AuthWelcomeHero
            title="Create school account"
            text={
              step === 2
                ? 'Tell us how your school is structured.'
                : 'Start with your school details.'
            }
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
            {[1, 2, 3].map((number) => (
              <span
                key={number}
                style={{
                  width: step === number ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  background:
                    step >= number
                      ? '#f87645'
                      : '#DBDBE5',
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <AuthFormField
                label="School name"
                name="schoolName"
                type="text"
                placeholder="School name"
                required
                autoFocus
                value={form.schoolName}
                onChange={(event) =>
                  updateField(
                    'schoolName',
                    event.target.value
                  )
                }
              />

              <AuthFormField
                label="Phone"
                name="schoolPhone"
                type="tel"
                inputMode="tel"
                placeholder="Phone number"
                value={form.schoolPhone}
                onChange={(event) =>
                  updateField(
                    'schoolPhone',
                    event.target.value
                  )
                }
              />

              <AuthFormField
                label="Email"
                name="schoolEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="school@email.co.za"
                value={form.schoolEmail}
                onChange={(event) =>
                  updateField(
                    'schoolEmail',
                    event.target.value
                  )
                }
              />

              <AuthSubmitButton
                type="button"
                onClick={goSchoolDetailsNext}
              >
                Next
              </AuthSubmitButton>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#21222D',
                    fontSize: 18,
                    lineHeight: 1.3,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Does your school have other branches?
                </p>

                <p
                  style={{
                    margin: '7px 0 0',
                    color: 'rgba(33,34,45,0.58)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  You can manage additional schools under
                  one School Connect group.
                </p>
              </div>

              <button
                type="button"
                className="sc-pressable"
                onClick={() =>
                  updateField('hasBranches', 'yes')
                }
                style={branchOptionStyle(
                  form.hasBranches === 'yes'
                )}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#21222D',
                    fontSize: 14.5,
                    fontWeight: 600,
                  }}
                >
                  Yes, we have other branches
                </span>

                <span
                  style={{
                    display: 'block',
                    marginTop: 5,
                    color: 'rgba(33,34,45,0.52)',
                    fontSize: 12.5,
                    lineHeight: 1.4,
                  }}
                >
                  Set up this school as the main school
                  for your group.
                </span>
              </button>

              <button
                type="button"
                className="sc-pressable"
                onClick={() =>
                  updateField('hasBranches', 'no')
                }
                style={branchOptionStyle(
                  form.hasBranches === 'no'
                )}
              >
                <span
                  style={{
                    display: 'block',
                    color: '#21222D',
                    fontSize: 14.5,
                    fontWeight: 600,
                  }}
                >
                  No, this is our only school
                </span>

                <span
                  style={{
                    display: 'block',
                    marginTop: 5,
                    color: 'rgba(33,34,45,0.52)',
                    fontSize: 12.5,
                    lineHeight: 1.4,
                  }}
                >
                  Continue with the normal School Connect
                  setup.
                </span>
              </button>

              <AuthSubmitButton
                type="button"
                onClick={goBranchQuestionNext}
              >
                Continue
              </AuthSubmitButton>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={secondaryButtonStyle}
              >
                Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  borderRadius: 20,
                  background: '#F7F7F8',
                  padding: 16,
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
                      fontWeight: 600,
                    }}
                  >
                    {form.schoolName.trim()}
                  </p>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: 'rgba(33,34,45,0.62)',
                    fontSize: 13,
                  }}
                >
                  Phone:{' '}
                  {form.schoolPhone.trim() || 'Not added'}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: 'rgba(33,34,45,0.62)',
                    fontSize: 13,
                  }}
                >
                  Email:{' '}
                  {form.schoolEmail.trim() || 'Not added'}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: 'rgba(33,34,45,0.62)',
                    fontSize: 13,
                  }}
                >
                  Other branches:{' '}
                  {form.hasBranches === 'yes'
                    ? 'Yes'
                    : 'No'}
                </p>
              </div>

              <Link
                href={ownerHref}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <span
                  className="sc-pressable"
                  style={primaryButtonStyle}
                >
                  Create owner account
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setStep(2)}
                style={secondaryButtonStyle}
              >
                Back
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            textAlign: 'center',
            marginTop: 'auto',
            paddingTop: 34,
          }}
        >
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
