import { TeacherProfileClient } from '@/components/feed/TeacherProfileClient'

type Props = {
  params: {
    id: string
  }
}

export default function PublicClassInvitePage({ params }: Props) {
  return <TeacherProfileClient teacherId={params.id} publicMode />
}
