import { TeacherTokenLanding } from '@/components/teacher/TeacherTokenLanding'

export default function TeacherPage({ params }: { params: { token: string } }) {
  return <TeacherTokenLanding token={params.token} />
}
