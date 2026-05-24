'use client'
// auth-copy-motion-polish-v1
// Public signup creates a school account. Parent signup appears only from an invite redirect.

import { Suspense, useMemo, useState, useTransition, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type AccountType = 'school' | 'parent'
type StepKey = 'name' | 'security' | 'review'

const supabase = createClient()

const T = {
  white: '#FFFFFF',
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.06)',
  primary: '#2B2B2F',
}

const inputStyle: CSSProperties = {
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
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 560,
  color: T.ink2,
  marginBottom: 7,
}

const primaryButton: CSSProperties = {
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

const secondaryButton: CSSProperties = {
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
}

function StepDots({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          style={{
            width: index === currentIndex ? 20 : 6,
            height: 6,
            borderRadius: 999,
            background: index <= currentIndex ? T.primary : '#E6E6EA',
            transition: 'width 160ms cubic-bezier(.2,.8,.2,1)',
          }}
        />
      ))}
    </div>
  )
}

function SignupFlow() {
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || ''
  const fromInvite = redirectTo.includes('parent-join') || redirectTo.includes('/join/') || redirectTo.includes('class')
  const accountType: AccountType = fromInvite ? 'parent' : 'school'

  const steps: StepKey[] = ['name', 'security', 'review']
  const [step, setStep] = useState<StepKey>('name')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentIndex = Math.max(0, steps.indexOf(step))

  const title = useMemo(() => {
    return accountType === 'parent' ? 'Create parent account' : 'Create school account'
  }, [accountType])

  const next = () => {
    if (step === 'name') {
      if (!fullName.trim()) {
        toast.error('Enter your full name')
        return
      }
      setStep('security')
      return
    }

    if (step === 'security') {
      if (!email.trim()) {
        toast.error('Enter your email')
        return
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters')
        return
      }

      setStep('review')
    }
  }

  const back = () => {
    if (step === 'security') setStep('name')
    if (step === 'review') setStep('security')
  }

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      toast.error('Check your details')
      return
    }

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: accountType,
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (!data.session) {
        toast.success('Check your email')
        window.location.href = '/auth/login'
        return
      }

      if (accountType === 'school') {
        window.location.href = '/auth/school-setup'
        return
      }

      if (redirectTo) {
        window.location.href = redirectTo
        return
      }

      window.location.href = '/feed'
    })
  }

  return (
    <div
      className="sc-slide-up"
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
        <p style={{
          margin: 0,
          color: T.ink,
          fontSize: 18,
          fontWeight: 640,
          letterSpacing: '-0.025em',
        }}>
          {title}
        </p>

        <StepDots currentIndex={currentIndex} total={steps.length} />
      </div>

      <div style={{ padding: '0 18px 18px' }}>
        {step === 'name' && (
          <div className="sc-fade-in" style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                autoComplete="name"
                placeholder={accountType === 'parent' ? 'Parent name' : 'School owner name'}
                style={inputStyle}
                autoFocus
              />
            </div>

            <button type="button" onClick={next} className="sc-pressable" style={primaryButton}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'security' && (
          <div className="sc-fade-in" style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder={accountType === 'parent' ? 'parent@example.com' : 'school@example.com'}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  style={{ ...inputStyle, paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="sc-pressable"
                  style={{
                    position: 'absolute',
                    right: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: 'none',
                    background: 'transparent',
                    color: T.ink3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 9 }}>
              <button type="button" onClick={back} className="sc-pressable" style={secondaryButton}>
                <ArrowLeft size={15} /> Back
              </button>
              <button type="button" onClick={next} className="sc-pressable" style={primaryButton}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="sc-fade-in" style={{ display: 'grid', gap: 14 }}>
            <div style={{
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              overflow: 'hidden',
              background: T.white,
            }}>
              {[
                ['Name', fullName || '—'],
                ['Email', email || '—'],
              ].map(([label, value], index) => (
                <div key={label} style={{
                  display: 'grid',
                  gridTemplateColumns: '76px 1fr',
                  gap: 12,
                  padding: '12px 14px',
                  borderTop: index === 0 ? 'none' : `1px solid ${T.border}`,
                  alignItems: 'center',
                }}>
                  <span style={{ color: T.ink3, fontSize: 12.5, fontWeight: 560 }}>{label}</span>
                  <span style={{ color: T.ink, fontSize: 13.5, fontWeight: 580, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="sc-pressable"
              style={{
                ...primaryButton,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.72 : 1,
              }}
            >
              {isPending ? 'Creating…' : <><Check size={16} /> Create account</>}
            </button>

            <button type="button" onClick={back} className="sc-pressable" style={secondaryButton}>
              <ArrowLeft size={15} /> Back
            </button>
          </div>
        )}
      </div>
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
          <p style={{
            margin: 0,
            color: T.ink,
            fontSize: 23,
            fontWeight: 640,
            letterSpacing: '-0.035em',
          }}>
            School Connect
          </p>
        </div>

        <Suspense fallback={null}>
          <SignupFlow />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13 }}>
            <Link href="/auth/login" style={{ color: T.ink, textDecoration: 'none', fontWeight: 620 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
