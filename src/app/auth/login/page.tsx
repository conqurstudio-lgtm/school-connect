'use client'

import { useState } from 'react'
import Link from 'next/link'

import { AuthDetailText, AuthPrivacyLine, AuthTextLink } from '@/components/auth/AuthDetailText'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    created?: string
    error?: string
  }
}) {
  const [loading, setLoading] = useState(false)

  const created = searchParams?.created === '1'
  const error = searchParams?.error

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
          padding: '36px 16px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <AuthWelcomeHero
            title="Welcome back"
            text="Sign in to continue where you left off."
            compact
            imageSize={132}
          />

          {created ? (
            <div
              style={{
                margin: '-6px 0 18px',
                padding: '12px 14px',
                borderRadius: 14,
                background: '#F7F7F8',
                color: 'rgba(33, 34, 45, 0.70)',
                fontSize: 13,
                lineHeight: 1.45,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              Account created. Sign in to continue.
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                margin: '-6px 0 18px',
                padding: '12px 14px',
                borderRadius: 14,
                background: '#FFF1F2',
                color: '#9F1239',
                fontSize: 13,
                lineHeight: 1.45,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              Sign in failed. Check your details and try again.
            </div>
          ) : null}

          <form
            method="POST"
            action="/api/auth/login-redirect"
            onSubmit={() => setLoading(true)}
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <AuthFormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@school.co.za"
              required
              autoFocus
            />

            <AuthFormField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />

            <AuthSubmitButton loading={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </AuthSubmitButton>
          </form>
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
            New to School Connect?{' '}
            <AuthTextLink href="/auth/signup">
              Get started
            </AuthTextLink>
          </AuthDetailText>

          <AuthPrivacyLine />
        </div>
      </section>
    </main>
)
}
