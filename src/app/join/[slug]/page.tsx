import { redirect } from 'next/navigation'

interface Props {
  params: { slug: string }
}

// Simply pass the slug through to the parent join page
export default function JoinPage({ params }: Props) {
  redirect(`/auth/parent-join?slug=${params.slug}`)
}
