// /api/onboarding/children?school_id=...&q=...&grade=...
// Returns matching children for the parent join flow.
// Privacy note: the endpoint no longer returns the full school roster by default.

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

function clean(value: string | null) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export async function GET(req: NextRequest) {
  const schoolId = req.nextUrl.searchParams.get('school_id')
  if (!schoolId) return NextResponse.json({ error: 'school_id required' }, { status: 400 })

  const q = clean(req.nextUrl.searchParams.get('q'))
  const grade = clean(req.nextUrl.searchParams.get('grade'))

  const sb = adminClient()
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()

  let myChildIds: string[] = []

  if (user) {
    const { data: links } = await sb.from('child_guardians')
      .select('child_id')
      .eq('guardian_id', user.id)

    myChildIds = (links ?? []).map((link: any) => link.child_id)
  }

  // Do not expose the whole school roster on a public/shared invite link.
  // Parents must search by child name or narrow by grade/class.
  if (q.length < 2 && grade.length < 2) {
    return NextResponse.json({
      children: [],
      my_child_ids: myChildIds,
      needs_search: true,
    })
  }

  let query = sb.from('children')
    .select('id, name, grade, class_name')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('grade')
    .order('class_name')
    .order('name')
    .limit(30)

  if (q.length >= 2) {
    query = query.ilike('name', `%${q}%`)
  }

  if (grade.length >= 2) {
    query = query.or(`grade.ilike.%${grade}%,class_name.ilike.%${grade}%`)
  }

  const { data: kids, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    children: kids ?? [],
    my_child_ids: myChildIds,
    needs_search: false,
  })
}
