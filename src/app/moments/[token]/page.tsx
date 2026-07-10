import { redirect } from 'next/navigation'

export default function MomentsPage({ params }: { params: { token: string } }) {
  const token = encodeURIComponent(params.token || '')
  redirect(`/report/${token}?view=moments`)
}
