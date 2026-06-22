import Image from 'next/image'

type AuthWelcomeHeroProps = {
  title?: string
  text?: string
  compact?: boolean
  imageSize?: number
}

export function AuthWelcomeHero({
  title = 'Welcome to School Connect',
  text = 'A simple space for schools, teachers and parents to stay connected through reports, updates and shared moments.',
  compact = false,
  imageSize,
}: AuthWelcomeHeroProps) {
  const size = imageSize || (compact ? 136 : 250)

  return (
    <div style={{
      textAlign: 'center',
      marginBottom: compact ? 18 : 26,
    }}>
      <div style={{
        width: size,
        maxWidth: '82%',
        margin: compact ? '0 auto 12px' : '0 auto 24px',
      }}>
        <Image
          src="/images/school-connect-welcome-transparent.png"
          alt="School Connect welcome illustration"
          width={620}
          height={520}
          priority={!compact}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>

      {title ? (
        <h1 style={{
          fontSize: compact ? 23 : 32,
          lineHeight: compact ? 1.08 : 1.04,
          fontWeight: compact ? 650 : 690,
          letterSpacing: compact ? '-0.038em' : '-0.05em',
          margin: 0,
          color: '#262626',
        }}>
          {title}
        </h1>
      ) : null}

      {text ? (
        <p style={{
          fontSize: compact ? 13.4 : 15,
          color: '#70757C',
          lineHeight: 1.5,
          margin: compact ? '7px auto 0' : '13px auto 0',
          maxWidth: compact ? 330 : 350,
          fontWeight: 410,
          letterSpacing: '-0.006em',
        }}>
          {text}
        </p>
      ) : null}
    </div>
  )
}
