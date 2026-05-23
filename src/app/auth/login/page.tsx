'use client'
// white-premium-app-theme-v1
// auth-clear-entry-placeholders-v2

import { useState, useTransition, Suspense, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

const supabase = createClient()

const T = {
  ink: '#262626',
  ink2: '#5F6268',
  ink3: '#8D8D94',
  border: 'rgba(0,0,0,0.08)',
  softBorder: 'rgba(0,0,0,0.06)',
  white: '#FFFFFF',
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

function LoginForm() {
  const params = useSearchParams()
  const explicitRedirectTo = params.get('explicitRedirectTo') || params.get('redirectTo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          toast.error(error.message)
          return
        }

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
          }
        }

        window.location.href = nextPath
      } catch {
        toast.error('Could not sign in.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="name@example.com"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter password"
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
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        style={{
          minHeight: 46,
          width: '100%',
          borderRadius: 14,
          border: 'none',
          background: isPending ? '#BDBDC2' : T.ink,
          color: T.white,
          fontSize: 14.5,
          fontWeight: 620,
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 2,
        }}
      >
        {isPending ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
          <p style={{
            margin: '6px 0 0',
            color: T.ink3,
            fontSize: 13,
            lineHeight: 1.38,
          }}>
            Sign in to your space.
          </p>
        </div>

        <div style={{
          background: T.white,
          border: `1px solid ${T.softBorder}`,
          borderRadius: 28,
          boxShadow: '0 20px 70px rgba(0,0,0,0.06)',
          padding: 18,
        }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13 }}>
            <Link href="/auth/signup" style={{ color: T.ink, textDecoration: 'none', fontWeight: 600 }}>
              Create school account
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
