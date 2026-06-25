import Link from 'next/link'

const T = {
  ink: '#21222D',
  muted: 'rgba(33, 34, 45, 0.48)',
  soft: 'rgba(33, 34, 45, 0.38)',
}

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
        color: size === 'xs' ? T.soft : T.muted,
        fontSize: size === 'xs' ? 12 : 13,
        lineHeight: 1.5,
        fontWeight: 420,
        textAlign: 'center',
        letterSpacing: '-0.004em',
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
        color: underline ? 'rgba(33, 34, 45, 0.56)' : T.ink,
        textDecoration: underline ? 'underline' : 'none',
        textUnderlineOffset: underline ? 2 : undefined,
        textDecorationColor: underline ? 'rgba(33, 34, 45, 0.24)' : undefined,
        fontWeight: underline ? 520 : 650,
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
