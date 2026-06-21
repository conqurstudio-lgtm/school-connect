import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'
import { ParentBottomHoverMenu } from '@/components/parents/ParentBottomHoverMenu'

export default function MomentsPage({ params }: { params: { token: string } }) {
  return <ParentMomentsPage token={params.token} />
}
