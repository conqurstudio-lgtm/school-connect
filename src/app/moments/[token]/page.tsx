// @ts-nocheck
'use client'

import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'
import { ParentSharedAppShell } from '@/components/parents/ParentSharedAppShell'

export default function MomentsPage({ params }: { params: { token: string } }) {
  const token = params.token || ''

  return (
    <ParentSharedAppShell token={token} active="moments">
      <ParentMomentsPage token={token} shellless />
    </ParentSharedAppShell>
  )
}
