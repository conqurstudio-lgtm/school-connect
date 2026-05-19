import { redirect } from 'next/navigation'

export default function OldTeacherTokenRedirectPage({
  params,
}: {
  params: { token: string }
}) {
  redirect(`/teacher-link/${encodeURIComponent(params.token)}`)
}
