'use client'

import { AuthDetailText, AuthPrivacyLine, AuthTextLink } from '@/components/auth/AuthDetailText'

import { useState } from 'react'
import Link from 'next/link'

import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'

const T = {
  white: '#FFFFFF',
  ink: '#21222D',
  ink3: '#21222D',
  accent: '#958CE8',
  greenBg: '#F2FBF6',
  greenBorder: 'rgba(20,120,70,0.14)',
  green: '#20764B',
  redBg: '#FFF5F5',
  redBorder: 'rgba(180,35,24,0.18)',
  red: '#B42318',
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || ''
}

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [loading, setLoading] = useState(false)
  const created = first(searchParams.created).trim()
  const error = first(searchParams.error).trim()

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
            title="Sign in"
            text="Open your School Connect space."
          />
        </div>

        {created ? (
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${T.greenBorder}`,
              background: T.greenBg,
              color: T.green,
              padding: '10px 12px',
              fontSize: 12.6,
              lineHeight: 1.4,
              fontWeight: 520,
              marginBottom: 18,
            }}
          >
            School created. Sign in with the owner email and password.
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${T.redBorder}`,
              background: T.redBg,
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

        <form
          method="POST"
          action="/api/auth/login-redirect"
          onSubmit={() => setLoading(true)}
          style={{
            display: 'grid',
            gap: 20,
          }}
        >
          <AuthFormField
            label="Email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
          />

          <AuthFormField
            label="Password"
            name="password"
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />

          <AuthSubmitButton loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </AuthSubmitButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, display: 'grid', gap: 12 }}>
          <AuthDetailText>
            No school account yet?{' '}
            <AuthTextLink href="/auth/signup">
              Create one
            </AuthTextLink>
          </AuthDetailText>

          <AuthPrivacyLine />
        </div>
      </section>
    </main>
  )
}
