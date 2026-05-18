'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'

/**
 * Visible on /feed only when there's a valid teacher cookie.
 * Same .fab class as the parent's reports FAB so it sits in the same place
 * with the same animated ring. Replaces the parent FAB (which is hidden for teachers).
 */
export function TeacherFeedFab() {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher-session').then(async r => {
      if (r.ok) {
        const json = await r.json()
        if (json.teacher?.id) setTeacherId(json.teacher.id)
      }
    }).catch(() => {})
  }, [])

  if (!teacherId) return null

  return (
    <button
      onClick={() => router.push(`/teachers/${teacherId}?edit=1`)}
      aria-label="Go to my dashboard"
      className="fab"
    >
      <GraduationCap size={22} strokeWidth={1.8} />
    </button>
  )
}
