import Link from 'next/link'

const T = {
  ink: '#21222D',
  muted: 'rgba(33, 34, 45, 0.52)',
  accent: '#958CE8',
}

export function AuthDetailText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <p
      style={{
        margin: 0,
        color: T.muted,
        fontSize: 12.4,
        lineHeight: 1.55,
        fontWeight: 430,
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
  accent = false,
}: {
  href: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        color: accent ? T.accent : T.ink,
        textDecoration: 'none',
        fontWeight: 650,
        transition: 'color 160ms ease',
      }}
    >
      {children}
    </Link>
  )
}

export function AuthPrivacyLine() {
  return (
    <AuthDetailText style={{ fontSize: 11.8, color: 'rgba(33,34,45,0.46)' }}>
      Please read our{' '}
      <AuthTextLink href="/privacy" accent>
        School Connect Privacy Policy
      </AuthTextLink>.
    </AuthDetailText>
  )
}
