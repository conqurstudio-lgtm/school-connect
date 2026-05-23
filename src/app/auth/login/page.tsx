'use client'
// school-connect-route-lock-v1
// school-admin-landing-route-repair-v1

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.08)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  border: `1px solid ${T.border}`, borderRadius: 12,
  background: T.bg, color: T.ink, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.14s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: T.ink2, marginBottom: 6,
}

// useSearchParams must be inside Suspense — isolated here
function LoginForm() {
  const router     = useRouter()
  const params     = useSearchParams()
  const explicitRedirectTo = params.get('explicitRedirectTo')

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending,    startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          toast.error(error.message)
        } else {
          if (explicitRedirectTo) {
            window.location.href = explicitRedirectTo
            return
          }

          const { data: userResult } = await supabase.auth.getUser()
          const userId = userResult?.user?.id

          let nextPath = '/feed'

          if (userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .maybeSingle()

            if (profile?.role === 'school') {
              nextPath = '/school'
            } else if (profile?.role === 'teacher') {
              nextPath = '/teacher'
            } else {
              nextPath = '/feed'
            }
          }

          window.location.href = nextPath
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('network') || e?.message?.includes('Load')) {
          toast.error('Network error — check your connection and try again')
        } else {
          toast.error('Something went wrong. Please try again.')
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          style={inputStyle} autoFocus />
      </div>

      <div>
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>Password</label>
          <input type={showPassword ? 'text' : 'password'} required
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            style={{ ...inputStyle, paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPassword(v => !v)} style={{
            position: 'absolute', right: 12, bottom: 12,
            background: 'none', border: 'none', cursor: 'pointer', color: T.ink3,
            display: 'flex', alignItems: 'center',
          }}>
            {showPassword
              ? <EyeOff style={{ width: 16, height: 16 }} />
              : <Eye    style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={isPending} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '13px 0', marginTop: 4,
        background: isPending ? '#CCCCCC' : T.ink,
        color: T.white, border: 'none', borderRadius: 12,
        fontSize: 15, fontWeight: 600,
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', letterSpacing: '-0.01em',
        transition: 'background 0.15s',
      }}>
        {isPending ? (
          <>
            <div style={{ width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: T.white,
                          animation: 'spin 0.7s linear infinite' }} />
            Signing in…
          </>
        ) : (
          <>Sign in <ArrowRight style={{ width: 16, height: 16 }} /></>
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', minHeight: '100dvh',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: T.ink3,
                    letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
          School Connect
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: T.ink,
                     letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          Welcome back
        </h1>
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        background: T.white, borderRadius: 20,
        border: `1px solid ${T.border}`, padding: '32px 28px',
      }}>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
            No account?{' '}
            <Link href="/auth/signup" style={{ color: T.ink, fontWeight: 500, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: T.ink3, textAlign: 'center', maxWidth: 280 }}>
        Parent? Use the invite link your school sent you.
      </p>

      <p style={{ marginTop: 40, fontSize: 11, color: '#CCCCCC', letterSpacing: '0.04em', fontWeight: 500 }}>
        Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
      </p>
    </div>
  )
}
