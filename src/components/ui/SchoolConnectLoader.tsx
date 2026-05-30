'use client'

type SchoolConnectLoaderProps = {
  size?: 'sm' | 'md'
  center?: boolean
}

const T = {
  accent: '#8FA6A1',
  soft: '#DDE7E4',
}

export function SchoolConnectLoader({ size = 'md', center = true }: SchoolConnectLoaderProps) {
  const dot = size === 'sm' ? 6 : 8
  const gap = size === 'sm' ? 5 : 7
  const height = size === 'sm' ? 18 : 24

  return (
    <div
      aria-label="Loading"
      role="status"
      style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
      }}
    >
      <style>{`
        @keyframes schoolConnectGentleBump {
          0%, 100% {
            transform: translateY(0) scale(0.82);
            opacity: 0.42;
          }
          42% {
            transform: translateY(-4px) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
        }}
      >
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            style={{
              width: dot,
              height: dot,
              borderRadius: 999,
              background: item === 1 ? T.accent : T.soft,
              animation: 'schoolConnectGentleBump 1.25s cubic-bezier(0.33, 1, 0.68, 1) infinite',
              animationDelay: `${item * 0.16}s`,
              display: 'block',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default SchoolConnectLoader
