// /api/onboarding/children?school_id=...&already=... → children grouped by grade
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function userClient() {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(n: string) { return store.get(n)?.value }, set() {}, remove() {} } }
  )
}

export async function GET(req: NextRequest) {
  const schoolId = req.nextUrl.searchParams.get('school_id')
  if (!schoolId) return NextResponse.json({ error: 'school_id required' }, { status: 400 })

  const sb = adminClient()
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()

  // Get all active children at the school
  const { data: kids } = await sb.from('children')
    .select('id, name, grade, class_name')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('grade').order('class_name').order('name')

  // If user is signed in, find their existing links so we can mark already-linked kids
  let myChildIds: string[] = []
  if (user) {
    const { data: links } = await sb.from('child_guardians')
      .select('child_id').eq('guardian_id', user.id)
    myChildIds = (links ?? []).map(l => l.child_id)
  }

  return NextResponse.json({
    children:    kids ?? [],
    my_child_ids: myChildIds,
  })
}
