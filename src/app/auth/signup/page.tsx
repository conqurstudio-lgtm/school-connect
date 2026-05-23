'use client'
// school-signup-parent-invite-only-v1
// Generic signup is for schools only.
// Parents can only create an account from a school/class invitation redirect.

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, School, Users } from 'lucide-react'

type AccountType = 'school' | 'parent'

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#8E8E93',
  border: 'rgba(0,0,0,0.08)',
  bg:     '#FFFFFF',
  soft:   '#F7F7F9',
  white:  '#FFFFFF',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  background: T.soft,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: T.ink2,
  marginBottom: 6,
}

function SignupForm() {
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || null
  const fromInvite = !!redirectTo && redirectTo.includes('parent-join')

  const accountType: AccountType = fromInvite ? 'parent' : 'school'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: accountType,
            full_name: fullName,
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        border: `1px dashed ${T.border}`,
        borderRadius: 16,
        background: 'transparent',
        padding: '18px 16px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: T.soft,
          color: T.ink2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}>
          {fromInvite ? <Users size={18} strokeWidth={1.8} /> : <School size={18} strokeWidth={1.8} />}
        </div>

        <p style={{
          fontSize: 15,
          fontWeight: 600,
          color: T.ink,
          margin: '0 0 4px',
        }}>
          {fromInvite ? 'Parent invitation' : 'School account'}
        </p>

        <p style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: T.ink3,
          margin: 0,
        }}>
          {fromInvite
            ? 'Create your parent account from this school invitation.'
            : 'Schools create accounts here. Parents must join using the private link shared by the school or teacher.'}
        </p>
      </div>

      <div>
        <label style={labelStyle}>Full name</label>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            style={{ ...inputStyle, paddingRight: 44 }}
          />

          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.ink3,
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={isPending} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '13px 0',
        marginTop: 4,
        background: isPending ? '#CCCCCC' : T.ink,
        color: T.white,
        border: 'none',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}>
        {isPending ? (
          <>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#FFFFFF',
              animation: 'spin 0.7s linear infinite',
            }} />
            Creating account…
          </>
        ) : (
          <>
            {fromInvite ? 'Create parent account' : 'Create school account'}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </>
        )}
      </button>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      minHeight: '100dvh',
      background: '#FFFFFF',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.ink3,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: '0 0 8px',
        }}>
          School Connect
        </p>

        <h1 style={{
          fontSize: 26,
          fontWeight: 600,
          color: T.ink,
          letterSpacing: '-0.03em',
          margin: 0,
        }}>
          Create your account
        </h1>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 400,
        background: T.white,
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        padding: '28px 24px',
        boxSizing: 'border-box',
      }}>
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: T.ink, fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p style={{ marginTop: 40, fontSize: 11, color: '#CCCCCC', letterSpacing: '0.04em', fontWeight: 500 }}>
        Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
      </p>
    </div>
  )
}
