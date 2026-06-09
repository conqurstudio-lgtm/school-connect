'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageGhostLoader } from '@/components/ui/PageGhostLoader'

export function TeacherTokenLanding({ token }: { token: string }) {
  const router = useRouter()

  useEffect(() => {
    if (token) {
      router.replace(`/teacher-link/${encodeURIComponent(token)}`)
    }
  }, [token, router])

  return <PageGhostLoader />
}
