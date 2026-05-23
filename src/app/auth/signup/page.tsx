'use client'
// school-signup-mobile-steps-v2
// School signup is public. Parent signup is invitation-only.

import { Suspense, useMemo, useState, useTransition, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, School, Users } from 'lucide-react'

type AccountType = 'school' | 'parent'
type StepKey = 'start' | 'identity' | 'security' | 'review'

const supabase = createClient()

const T = {
  ink: '#171717',
  ink2: '#4B4B4F',
  ink3: '#8D8D94',
  border: 'rgba(0,0,0,0.08)',
  softBorder: 'rgba(0,0,0,0.06)',
  bg: '#FFFFFF',
  soft: '#F7F7F9',
  muted: '#FAFAFB',
  white: '#FFFFFF',
  blue: '#2563EB',
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
  background: T.ink,
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
  fontWeight: 560,
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
            background: index <= currentIndex ? T.ink : '#E6E6EA',
            transition: 'width 180ms ease',
          }}
        />
      ))}
    </div>
  )
}

function InfoCard({
  active,
  icon,
  title,
  text,
}: {
  active?: boolean
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div style={{
      border: active ? `1px solid ${T.ink}` : `1px solid ${T.border}`,
      background: active ? '#FFFFFF' : T.muted,
      borderRadius: 18,
      padding: 14,
      display: 'grid',
      gridTemplateColumns: '42px 1fr',
      gap: 12,
      alignItems: 'center',
    }}>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: active ? T.ink : T.soft,
        color: active ? T.white : T.ink2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', color: T.ink, fontSize: 14.5, fontWeight: 620 }}>
          {title}
        </p>
        <p style={{ margin: 0, color: T.ink3, fontSize: 12.7, lineHeight: 1.42 }}>
          {text}
        </p>
      </div>
    </div>
  )
}

function SignupFlow() {
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || ''
  const fromInvite = redirectTo.includes('parent-join') || redirectTo.includes('/join/') || redirectTo.includes('class')

  const accountType: AccountType = fromInvite ? 'parent' : 'school'
  const steps: StepKey[] = ['start', 'identity', 'security', 'review']

  const [step, setStep] = useState<StepKey>('start')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentIndex = Math.max(0, steps.indexOf(step))

  const title = useMemo(() => {
    if (step === 'start') return fromInvite ? 'Join School Connect' : 'Create your school account'
    if (step === 'identity') return fromInvite ? 'Parent details' : 'Your details'
    if (step === 'security') return 'Secure your account'
    return 'Review and create'
  }, [fromInvite, step])

  const subtitle = useMemo(() => {
    if (step === 'start') return fromInvite
      ? 'This invite will connect you to your child’s school once approved.'
      : 'A simple setup for schools to start building their official school life.'
    if (step === 'identity') return 'Add the name people will see in the system.'
    if (step === 'security') return 'Use an email and password you can access again.'
    return 'Confirm everything looks right before creating the account.'
  }, [fromInvite, step])

  const next = () => {
    if (step === 'start') {
      setStep('identity')
      return
    }

    if (step === 'identity') {
      if (!fullName.trim()) {
        toast.error('Please enter your full name.')
        return
      }
      setStep('security')
      return
    }

    if (step === 'security') {
      if (!email.trim()) {
        toast.error('Please enter your email.')
        return
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters.')
        return
      }
      setStep('review')
    }
  }

  const back = () => {
    if (step === 'identity') setStep('start')
    if (step === 'security') setStep('identity')
    if (step === 'review') setStep('security')
  }

  const handleSubmit = () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
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
        toast.success('Check your email to confirm your account.')
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
    <div style={{
      width: '100%',
      maxWidth: 430,
      margin: '0 auto',
      background: T.white,
      border: `1px solid ${T.softBorder}`,
      borderRadius: 28,
      boxShadow: '0 20px 70px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: `1px solid ${T.softBorder}`,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFBFC 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 15,
            background: T.ink,
            color: T.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {fromInvite ? <Users size={18} strokeWidth={1.8} /> : <School size={18} strokeWidth={1.8} />}
          </div>

          <StepDots currentIndex={currentIndex} total={steps.length} />
        </div>

        <div style={{ marginTop: 18 }}>
          <h1 style={{
            margin: 0,
            color: T.ink,
            fontSize: 22,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            fontWeight: 640,
          }}>
            {title}
          </h1>
          <p style={{
            margin: '7px 0 0',
            color: T.ink3,
            fontSize: 13.2,
            lineHeight: 1.45,
          }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {step === 'start' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {fromInvite ? (
              <InfoCard
                active
                icon={<Users size={18} strokeWidth={1.8} />}
                title="Parent invitation"
                text="Your account will continue through the private school or class link."
              />
            ) : (
              <>
                <InfoCard
                  active
                  icon={<School size={18} strokeWidth={1.8} />}
                  title="School account"
                  text="Create the school workspace, then add teachers and classes."
                />

                <InfoCard
                  icon={<Lock size={18} strokeWidth={1.8} />}
                  title="Parents use invite links"
                  text="Parents should join through a private school or teacher link, not public signup."
                />
              </>
            )}

            <button type="button" onClick={next} style={{ ...primaryButton, marginTop: 6 }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'identity' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                placeholder={fromInvite ? 'Parent full name' : 'School owner full name'}
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div style={{
              border: `1px dashed ${T.border}`,
              borderRadius: 16,
              padding: 13,
              color: T.ink3,
              fontSize: 12.8,
              lineHeight: 1.45,
              background: 'transparent',
            }}>
              {fromInvite
                ? 'The school will use this to identify you during approval.'
                : 'You will create the school profile after this account is ready.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 9 }}>
              <button type="button" onClick={back} style={secondaryButton}>
                <ArrowLeft size={15} /> Back
              </button>
              <button type="button" onClick={next} style={primaryButton}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'security' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 30,
                    height: 30,
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
              <button type="button" onClick={back} style={secondaryButton}>
                <ArrowLeft size={15} /> Back
              </button>
              <button type="button" onClick={next} style={primaryButton}>
                Review <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              overflow: 'hidden',
              background: T.white,
            }}>
              {[
                ['Account', fromInvite ? 'Parent invitation' : 'School account'],
                ['Name', fullName || '—'],
                ['Email', email || '—'],
              ].map(([label, value], index) => (
                <div key={label} style={{
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr',
                  gap: 12,
                  padding: '12px 14px',
                  borderTop: index === 0 ? 'none' : `1px solid ${T.softBorder}`,
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
              style={{
                ...primaryButton,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.72 : 1,
              }}
            >
              {isPending ? 'Creating account…' : (
                <>
                  <Check size={16} /> Create account
                </>
              )}
            </button>

            <button type="button" onClick={back} style={secondaryButton}>
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
    <main style={{
      minHeight: '100dvh',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom))',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <p style={{
            margin: '0 0 6px',
            color: T.ink3,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            School Connect
          </p>
          <p style={{
            margin: 0,
            color: T.ink2,
            fontSize: 13,
            lineHeight: 1.4,
          }}>
            Simple school communication, organized.
          </p>
        </div>

        <Suspense fallback={null}>
          <SignupFlow />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: T.ink, textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
