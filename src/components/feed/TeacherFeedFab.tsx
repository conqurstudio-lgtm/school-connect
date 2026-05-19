'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'

/**
 * Teacher dashboard entry on the feed.
 * We no longer use the shared `.fab` class because the bottom floating button
 * was intentionally removed from the feed.
 */
export function TeacherFeedFab() {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher-session')
      .then(async r => {
        if (!r.ok) return
        const json = await r.json()
        if (json.teacher?.id) setTeacherId(json.teacher.id)
      })
      .catch(() => {})
  }, [])

  if (!teacherId) return null

  return (
    <button
      onClick={() => router.push(`/teachers/${teacherId}?edit=1`)}
      aria-label="Go to my class dashboard"
      className="teacher-feed-top-link"
    >
      <GraduationCap size={15} strokeWidth={1.9} />
      <span>Class</span>
    </button>
  )
}
