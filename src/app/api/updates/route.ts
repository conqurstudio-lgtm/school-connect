// /api/updates  — parent-facing thread with a teacher
// GET  ?teacher_id=...  → returns the thread with reactions + replies
// POST { teacher_id, body, image_url? } → parent sends an update

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

// Helper: is this parent linked to a child in this teacher's class?
async function isMyTeacher(sb: any, parentId: string, teacherId: string): Promise<boolean> {
  const { data: teacher } = await sb.from('teachers')
    .select('school_id, grade, class_name, status')
    .eq('id', teacherId).single()
  if (!teacher || teacher.status !== 'active') return false

  // Check via child_guardians
  const { data: links } = await sb.from('child_guardians')
    .select('child_id').eq('guardian_id', parentId)
  const childIds = (links ?? []).map((l: any) => l.child_id)
  if (childIds.length === 0) {
    // Fall back to legacy profiles.child_name
    const { data: prof } = await sb.from('profiles')
      .select('school_id, child_name').eq('id', parentId).single()
    if (!prof || prof.school_id !== teacher.school_id || !prof.child_name) return false
    const { data: legacyKids } = await sb.from('children')
      .select('grade, class_name')
      .eq('school_id', teacher.school_id)
      .ilike('name', prof.child_name)
    return (legacyKids ?? []).some((k: any) =>
      k.grade === teacher.grade
      && (k.class_name || null) === (teacher.class_name || null))
  }

  const { data: kids } = await sb.from('children')
    .select('grade, class_name, school_id').in('id', childIds)
  return (kids ?? []).some((k: any) =>
    k.school_id === teacher.school_id
    && k.grade === teacher.grade
    && (k.class_name || null) === (teacher.class_name || null))
}

export async function GET(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })

  const sb = adminClient()
  if (!(await isMyTeacher(sb, user.id, teacherId))) {
    return NextResponse.json({ can_message: false, updates: [] })
  }

  // Fetch updates between this parent and this teacher
  const { data: updates } = await sb.from('updates')
    .select('*, update_reactions(*), update_replies(*)')
    .eq('parent_id', user.id)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(80)

  return NextResponse.json({
    can_message: true,
    updates: updates ?? [],
  })
}

export async function POST(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { teacher_id, body, image_url, child_id } = await req.json()
  if (!teacher_id) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  if (!body?.trim() && !image_url) {
    return NextResponse.json({ error: 'empty update' }, { status: 400 })
  }

  const sb = adminClient()
  if (!(await isMyTeacher(sb, user.id, teacher_id))) {
    return NextResponse.json({ error: 'not your child\'s teacher' }, { status: 403 })
  }

  const { data: teacher } = await sb.from('teachers').select('school_id').eq('id', teacher_id).single()
  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })

  const { data, error } = await sb.from('updates').insert({
    school_id:    teacher.school_id,
    teacher_id,
    parent_id:    user.id,
    child_id:     child_id || null,
    author_kind:  'parent',
    body:         body?.trim() || null,
    image_url:    image_url || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ update: data })
}

// DELETE — parent removes their own update
export async function DELETE(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()
  const { data: u } = await sb.from('updates').select('parent_id, author_kind')
    .eq('id', id).single()
  if (!u || u.parent_id !== user.id || u.author_kind !== 'parent') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  await sb.from('updates').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
