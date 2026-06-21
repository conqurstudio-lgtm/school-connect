import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'

export default function MomentsPage({ params }: { params: { token: string } }) {
  return <ParentMomentsPage token={params.token} />
}
