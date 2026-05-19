// /api/class-join
// Parent requests to join a teacher's class.
// Supports normal Supabase parents and lightweight parent_token sessions.

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
    {
      cookies: {
        get(name: string) { return store.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

function clean(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.school_id) return { profile }
  }

  const parentToken = req.cookies.get('parent_token')?.value

  if (parentToken) {
    const { data: session } = await sb.from('parent_sessions')
      .select('*')
      .eq('access_token', parentToken)
      .maybeSingle()

    if (session && (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())) {
      const { data: profile } = await sb.from('profiles')
        .select('id, school_id, role')
        .eq('id', session.parent_id)
        .single()

      if (profile?.school_id) return { profile }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const teacherId = clean(body.teacher_id)
  const childFirstName = clean(body.child_first_name)
  const childLastName = clean(body.child_last_name)
  const relationship = clean(body.relationship) || 'Parent/Guardian'

  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  if (!childFirstName || !childLastName) {
    return NextResponse.json({ error: 'child first name and surname required' }, { status: 400 })
  }

  const sb = adminClient()
  const profile = caller.profile

  const { data: teacher } = await sb.from('teachers')
    .select('id, school_id, grade, class_name, status')
    .eq('id', teacherId)
    .eq('status', 'active')
    .single()

  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })
  if (profile.school_id !== teacher.school_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { data: links } = await sb.from('child_guardians')
    .select('child_id')
    .eq('guardian_id', profile.id)

  const childIds = (links ?? []).map((link: any) => link.child_id)

  if (childIds.length > 0) {
    const { data: kids } = await sb.from('children')
      .select('id, school_id, grade, class_name, status')
      .in('id', childIds)

    const alreadyLinked = (kids ?? []).some((kid: any) =>
      kid.school_id === teacher.school_id &&
      kid.status === 'active' &&
      kid.grade === teacher.grade &&
      (kid.class_name || null) === (teacher.class_name || null)
    )

    if (alreadyLinked) return NextResponse.json({ already_joined: true })
  }

  const { data: existingPending } = await sb.from('class_join_requests')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('parent_id', profile.id)
    .eq('status', 'pending')
    .ilike('child_first_name', childFirstName)
    .ilike('child_last_name', childLastName)
    .maybeSingle()

  if (existingPending) {
    return NextResponse.json({ request: existingPending, already_pending: true })
  }

  const { data, error } = await sb.from('class_join_requests')
    .insert({
      school_id: teacher.school_id,
      teacher_id: teacher.id,
      parent_id: profile.id,
      child_first_name: childFirstName,
      child_last_name: childLastName,
      relationship,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}
