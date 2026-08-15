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
        marginBottom: compact ? 26 : 22,
      }}
    >
      {isWideWelcomeImage ? (
        <div
          style={{
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            marginTop: 'calc(-42px - env(safe-area-inset-top, 0px))',
            marginBottom: 26,
            borderRadius: 0,
            overflow: 'visible',
          }}
        >
          <Image
            src="/images/school-connect-welcome-bubbles-hero.png"
            alt="SchoolConnect welcome bubbles"
            width={1600}
            height={1033}
            priority
            unoptimized
            sizes="100vw"
            style={{
              width: '100vw',
              maxWidth: 'none',
              height: 'auto',
              objectFit: 'contain',
              objectPosition: 'center top',
              display: 'block',
              margin: 0,
              padding: 0,
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          width: compact ? 58 : 66,
          height: compact ? 58 : 66,
          margin: compact ? '0 auto 16px' : '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          boxShadow: 'none',
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
          fontSize: compact ? 21 : 21,
          lineHeight: 1.08,
          fontWeight: 560,
          letterSpacing: '-0.018em',
        }}
      >
        {title}
      </h1>

      {text ? (
        <p
          style={{
            margin: compact ? '9px auto 0' : '12px auto 0',
            color: '#2A2A2C',
            fontSize: compact ? 14.5 : 15.5,
            lineHeight: 1.42,
            fontWeight: 400,
            maxWidth: compact ? 300 : 335,
            letterSpacing: '-0.018em',
          }}
        >
          {text}
        </p>
      ) : null}
    </div>
  )
}
