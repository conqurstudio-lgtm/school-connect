'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { JoinFlow } from '@/components/onboarding/JoinFlow'

function Inner() {
  const params = useSearchParams()
  const slug = params.get('slug') || params.get('token')

  if (!slug) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A',
                       letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Need a school invite link
          </h1>
          <p style={{ fontSize: 14, color: '#9A9A9A', lineHeight: 1.5, margin: 0 }}>
            Open the link your school admin shared with you to join.
          </p>
        </div>
      </div>
    )
  }
  return <JoinFlow slug={slug} />
}

export default function ParentJoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%',
                      border: '2px solid rgba(0,0,0,0.07)', borderTopColor: '#1A1A1A',
                      animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <Inner />
    </Suspense>
  )
}
