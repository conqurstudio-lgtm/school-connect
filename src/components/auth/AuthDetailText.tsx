import Link from 'next/link'

import { authTheme as T } from './authTheme'

export function AuthDetailText({
  children,
  size = 'sm',
  style,
}: {
  children: React.ReactNode
  size?: 'sm' | 'xs'
  style?: React.CSSProperties
}) {
  return (
    <p
      style={{
        margin: 0,
        color: size === 'xs' ? T.colors.faint : T.colors.muted,
        fontSize: size === 'xs' ? 12.5 : 13,
        lineHeight: 1.5,
        fontWeight: 430,
        textAlign: 'center',
        letterSpacing: '-0.006em',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

export function AuthTextLink({
  href,
  children,
  underline = false,
}: {
  href: string
  children: React.ReactNode
  underline?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        color: underline ? 'rgba(33, 34, 45, 0.58)' : T.colors.ink,
        textDecoration: underline ? 'underline' : 'none',
        textUnderlineOffset: underline ? 2 : undefined,
        textDecorationColor: underline ? 'rgba(33, 34, 45, 0.28)' : undefined,
        fontWeight: underline ? 560 : 680,
        transition: 'color 160ms ease, text-decoration-color 160ms ease',
      }}
    >
      {children}
    </Link>
  )
}

export function AuthPrivacyLine() {
  return (
    <AuthDetailText size="xs">
      Read our{' '}
      <AuthTextLink href="/privacy" underline>
        Privacy & Safety Policy
      </AuthTextLink>
    </AuthDetailText>
  )
}
