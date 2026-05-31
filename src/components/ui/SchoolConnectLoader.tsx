'use client'

type SchoolConnectLoaderProps = {
  size?: 'sm' | 'md' | 'lg'
  center?: boolean
}

const LOTTIE_URL = 'https://lottie.host/embed/7f7ce2c0-0c82-4d79-95d2-f45ca8bb900e/FqsPBhMDJt.lottie'

export function SchoolConnectLoader({ size = 'md', center = true }: SchoolConnectLoaderProps) {
  const dimensions = {
    sm: 48,
    md: 68,
    lg: 82,
  }

  const box = dimensions[size] || dimensions.md

  return (
    <div
      aria-label="Loading"
      role="status"
      style={{
        width: '100%',
        minHeight: box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
      }}
    >
      <iframe
        title="School Connect loading"
        src={LOTTIE_URL}
        style={{
          width: box,
          height: box,
          border: 'none',
          display: 'block',
          background: 'transparent',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export function SchoolConnectPageLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        width: '100%',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <SchoolConnectLoader size={size} />
    </main>
  )
}

export default SchoolConnectLoader
