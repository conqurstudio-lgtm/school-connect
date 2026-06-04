import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  colorScheme: 'light',
  viewportFit: 'cover',
}

export default function ReportTokenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="sc-report-token-layout">
      {children}
    </div>
  )
}
