'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SchoolProfilePage } from '@/components/school/SchoolProfilePage'

const supabase = createClient()

export function SchoolPageClient() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!profile) { router.replace('/auth/login'); return }
      let school = null
      if (profile.role === 'school') {
        const { data: s } = await supabase.from('schools').select('*').eq('owner_id', session.user.id).single()
        school = s
      } else if (profile.school_id) {
        const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single()
        school = s
      }
      if (!school) { router.replace('/feed'); return }
      setData({ school, profile, isAdmin: profile.role === 'school', userId: session.user.id })
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#1A1A1A', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return <SchoolProfilePage {...data} />
}
