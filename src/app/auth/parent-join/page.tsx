'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { JoinFlow } from '@/components/onboarding/JoinFlow'
import { AuthWelcomeHero } from '@/components/auth/AuthWelcomeHero'

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
          <AuthWelcomeHero
            compact
            imageSize={142}
            title="Need a school invite link"
            text="Open the link your school admin shared with you to join."
          />
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
