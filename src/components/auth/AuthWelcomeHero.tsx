import Image from 'next/image'

const T = {
  ink: '#21222D',
  muted: 'rgba(33, 34, 45, 0.56)',
  green: '#00733f',
  softGrey: '#F5F6F5',
  greenSoft: '#F1F8F4',
  border: 'rgba(0, 115, 63, 0.12)',
}

type AuthWelcomeHeroProps = {
  title?: string
  text?: string
  compact?: boolean
  imageSize?: number
}

export function AuthWelcomeHero({
  title = 'School Connect',
  text = 'A calmer way to keep school and home connected.',
  compact = false,
  imageSize,
}: AuthWelcomeHeroProps) {
  const resolvedImageSize = imageSize ?? (compact ? 132 : 174)

  return (
    <div
      style={{
        textAlign: 'center',
        color: T.ink,
        marginBottom: compact ? 24 : 30,
      }}
    >
      <div
        style={{
          width: resolvedImageSize,
          height: resolvedImageSize,
          margin: compact ? '0 auto 18px' : '0 auto 28px',
          borderRadius: compact ? 28 : 34,
          background: `linear-gradient(180deg, ${T.greenSoft}, ${T.softGrey})`,
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 18px 42px rgba(0, 115, 63, 0.08)',
        }}
      >
        <Image
          src="/images/school-connect-welcome-palette.png"
          alt=""
          width={resolvedImageSize}
          height={resolvedImageSize}
          priority
          style={{
            width: '88%',
            height: '88%',
            objectFit: 'contain',
          }}
        />
      </div>

      <h1
        style={{
          margin: 0,
          color: T.ink,
          fontSize: compact ? 19 : 25,
          lineHeight: 1.08,
          fontWeight: 650,
          letterSpacing: '-0.04em',
        }}
      >
        {title}
      </h1>

      {text ? (
        <p
          style={{
            margin: compact ? '10px auto 0' : '15px auto 0',
            color: T.muted,
            fontSize: compact ? 12.6 : 13.4,
            lineHeight: 1.45,
            fontWeight: 420,
            maxWidth: compact ? 290 : 320,
          }}
        >
          {text}
        </p>
      ) : null}
    </div>
  )
}
