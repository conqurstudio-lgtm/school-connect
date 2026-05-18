import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'School Connect' }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}
