'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TeacherProfileClient } from '@/components/feed/TeacherProfileClient'
import { TeacherSelfProfile } from '@/components/teacher/TeacherSelfProfile'

function Inner({ teacherId }: { teacherId: string }) {
  const params = useSearchParams()
  const isSelfEdit = params.get('edit') === '1'

  if (isSelfEdit) {
    return <TeacherSelfProfile teacherId={teacherId} />
  }
  return <TeacherProfileClient teacherId={teacherId} />
}

export default function TeacherProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <Inner teacherId={params.id} />
    </Suspense>
  )
}
