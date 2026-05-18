'use client'

import { useEffect } from 'react'

export default function TeacherIndex() {
  useEffect(() => {
    // Try to use the cookie via the session route
    fetch('/api/teacher-session').then(async r => {
      if (r.ok) {
        // Cookie works, but we need a token in the URL to land properly
        // Just show a friendly message
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A',
                     letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          Need your teacher link
        </h1>
        <p style={{ fontSize: 14, color: '#9A9A9A', lineHeight: 1.5, margin: 0 }}>
          Open the link your school admin shared with you to access your dashboard.
        </p>
      </div>
    </div>
  )
}
