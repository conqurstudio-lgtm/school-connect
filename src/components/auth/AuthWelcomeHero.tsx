import Image from 'next/image'

import { authTheme as T } from './authTheme'

type AuthWelcomeHeroProps = {
  title?: string
  text?: string
  compact?: boolean
  imageSize?: number
}

export function AuthWelcomeHero({
  title = 'School Connect',
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
          maxWidth: isWideWelcomeImage ? 760 : resolvedImageSize,
          height: isWideWelcomeImage ? 300 : resolvedImageSize,
          margin: compact ? '0 auto 18px' : '-18px 0 34px 50%',
          transform: isWideWelcomeImage ? 'translateX(-50%)' : 'none',
          borderRadius: isWideWelcomeImage ? 0 : T.radius.image,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <Image
          src="/images/school-connect-welcome-bubbles-v2.png"
          alt=""
          width={1200}
          height={520}
          priority
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center bottom',
            display: 'block',
          }}
        />
      </div>

      <h1
        style={{
          margin: 0,
          color: T.colors.ink,
          fontSize: compact ? 22 : 30,
          lineHeight: 1.08,
          fontWeight: 760,
          letterSpacing: '-0.055em',
        }}
      >
        {title}
      </h1>

      {text ? (
        <p
          style={{
            margin: compact ? '12px auto 0' : '16px auto 0',
            color: T.colors.inkSoft,
            fontSize: compact ? 14 : 16,
            lineHeight: 1.42,
            fontWeight: 430,
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
