import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
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
