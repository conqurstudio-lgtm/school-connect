// /api/updates
// Parent-facing thread with a teacher.
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

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role, child_name')
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
        .select('id, school_id, role, child_name')
        .eq('id', session.parent_id)
        .single()

      if (profile?.school_id) return { profile }
    }
  }

  return null
}


async function touchParentTeacherThread(sb: any, payload: {
  school_id: string
  teacher_id: string
  parent_id: string
  child_id?: string | null
  from: 'parent' | 'teacher'
}) {
  const now = new Date().toISOString()

  await sb
    .from('teacher_parent_threads')
    .upsert({
      school_id: payload.school_id,
      teacher_id: payload.teacher_id,
      parent_id: payload.parent_id,
      child_id: payload.child_id || null,
      last_message_at: now,
      last_message_from: payload.from,
      unread_for_teacher: payload.from === 'parent' ? 1 : 0,
      unread_for_parent: payload.from === 'teacher' ? 1 : 0,
      updated_at: now,
    }, { onConflict: 'teacher_id,parent_id' })
}

async function isMyTeacher(sb: any, parentId: string, teacherId: string): Promise<boolean> {
  const { data: teacher } = await sb.from('teachers')
    .select('school_id, grade, class_name, status')
    .eq('id', teacherId)
    .single()

  if (!teacher || teacher.status !== 'active') return false

  const { data: links } = await sb.from('child_guardians')
    .select('child_id')
    .eq('guardian_id', parentId)

  const childIds = (links ?? []).map((link: any) => link.child_id)

  if (childIds.length === 0) {
    const { data: prof } = await sb.from('profiles')
      .select('school_id, child_name')
      .eq('id', parentId)
      .single()

    if (!prof || prof.school_id !== teacher.school_id || !prof.child_name) return false

    const { data: legacyKids } = await sb.from('children')
      .select('grade, class_name')
      .eq('school_id', teacher.school_id)
      .ilike('name', prof.child_name)

    return (legacyKids ?? []).some((kid: any) =>
      kid.grade === teacher.grade &&
      (kid.class_name || null) === (teacher.class_name || null)
    )
  }

  const { data: kids } = await sb.from('children')
    .select('grade, class_name, school_id, status')
    .in('id', childIds)

  return (kids ?? []).some((kid: any) =>
    kid.school_id === teacher.school_id &&
    kid.status === 'active' &&
    kid.grade === teacher.grade &&
    (kid.class_name || null) === (teacher.class_name || null)
  )
}

export async function GET(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })

  const sb = adminClient()

  if (!(await isMyTeacher(sb, caller.profile.id, teacherId))) {
    return NextResponse.json({ can_message: false, updates: [] })
  }

  const { data: updates } = await sb.from('updates')
    .select('*, update_reactions(*), update_replies(*)')
    .eq('parent_id', caller.profile.id)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(80)

  return NextResponse.json({
    can_message: true,
    updates: updates ?? [],
  })
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { teacher_id, image_url, child_id, attachment_url, attachment_name, attachment_type } = body
  const text = typeof body.body === 'string' ? body.body.trim() : ''

  if (!teacher_id) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  if (!text && !image_url && !attachment_url) return NextResponse.json({ error: 'empty update' }, { status: 400 })

  const sb = adminClient()

  if (!(await isMyTeacher(sb, caller.profile.id, teacher_id))) {
    return NextResponse.json({ error: "not your child's teacher" }, { status: 403 })
  }

  const { data: teacher } = await sb.from('teachers')
    .select('school_id')
    .eq('id', teacher_id)
    .single()

  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })

  const { data, error } = await sb.from('updates')
    .insert({
      school_id: teacher.school_id,
      teacher_id,
      parent_id: caller.profile.id,
      child_id: child_id || null,
      author_kind: 'parent',
      body: text || null,
      image_url: image_url || null,
      attachment_url: attachment_url || null,
      attachment_name: attachment_name || null,
      attachment_type: attachment_type || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try {
    await touchParentTeacherThread(sb, {
      school_id: teacher.school_id,
      teacher_id,
      parent_id: typeof caller !== 'undefined' ? caller.profile.id : user.id,
      child_id: child_id || null,
      from: 'parent',
    })
  } catch {}

  return NextResponse.json({ update: data })
}

export async function DELETE(req: NextRequest) {
  const caller = await getCaller(req)
  if (!caller?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()

  const { data: update } = await sb.from('updates')
    .select('parent_id, author_kind')
    .eq('id', id)
    .single()

  if (!update || update.parent_id !== caller.profile.id || update.author_kind !== 'parent') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  await sb.from('updates').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
