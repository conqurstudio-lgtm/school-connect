import { TeacherProfileClient } from '@/components/feed/TeacherProfileClient'
import { TeacherSelfProfile } from '@/components/teacher/TeacherSelfProfile'

type SearchParams = Record<string, string | string[] | undefined>

function hasValue(value: string | string[] | undefined, expected?: string) {
  if (Array.isArray(value)) return expected ? value.includes(expected) : value.length > 0
  return expected ? value === expected : !!value
}

export default function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: SearchParams
}) {
  const isTeacherDashboard =
    hasValue(searchParams?.edit, '1') ||
    hasValue(searchParams?.token)

  if (isTeacherDashboard) {
    return <TeacherSelfProfile teacherId={params.id} />
  }

  return <TeacherProfileClient teacherId={params.id} />
}
