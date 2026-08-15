import Image from 'next/image'

import { authTheme as T } from './authTheme'

type AuthWelcomeHeroProps = {
  title?: string
  text?: string
  compact?: boolean
  imageSize?: number
}

export function AuthWelcomeHero({
  title = 'SchoolConnect',
  text = 'Keep school and home connected in one simple space.',
  compact = false,
  imageSize,
}: AuthWelcomeHeroProps) {
  const resolvedImageSize = imageSize ?? (compact ? 132 : 168)
  const isWideWelcomeImage = !compact

  return (
    <div
      style={{
        textAlign: 'center',
        color: T.colors.ink,
        marginBottom: compact ? 22 : 28,
      }}
    >
      <div
        style={{
          width: isWideWelcomeImage ? '100vw' : resolvedImageSize,
          position: 'relative',
          left: isWideWelcomeImage ? '50%' : 'auto',
          right: isWideWelcomeImage ? '50%' : 'auto',
          marginLeft: isWideWelcomeImage ? '-50vw' : 'auto',
          marginRight: isWideWelcomeImage ? '-50vw' : 'auto',
          marginTop: compact ? 0 : -26,
          marginBottom: compact ? 22 : 46,
          borderRadius: isWideWelcomeImage ? 0 : T.radius.image,
          overflow: 'visible',
        }}
      >
        <Image
          src="/images/school-connect-welcome-bubbles-hero.png"
          alt="SchoolConnect welcome bubbles"
          width={1600}
          height={900}
          priority
          sizes="100vw"
          style={{
            width: '100vw',
            maxWidth: 'none',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      </div>

      <div
        style={{
          width: compact ? 58 : 76,
          height: compact ? 58 : 76,
          margin: compact ? '0 auto 12px' : '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src="/images/school-connect-logo.png"
          alt="SchoolConnect logo"
          width={120}
          height={120}
          priority
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      <h1
        style={{
          margin: 0,
          color: '#050506',
          fontSize: compact ? 19 : 22,
          lineHeight: 1.08,
          fontWeight: 540,
          letterSpacing: '-0.028em',
        }}
      >
        {title}
      </h1>

      {text ? (
        <p
          style={{
            margin: compact ? '12px auto 0' : '14px auto 0',
            color: '#111111',
            fontSize: compact ? 14 : 16,
            lineHeight: 1.42,
            fontWeight: 410,
            maxWidth: compact ? 300 : 330,
            letterSpacing: '-0.018em',
          }}
        >
          {text}
        </p>
      ) : null}
    </div>
  )
}
