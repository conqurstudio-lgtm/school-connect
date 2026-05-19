// /api/teacher/updates  — teacher reads + sends updates with parents
// GET ?parent_id=...  → thread with that parent
// POST { parent_ids: string[], body, image_url? } → send to one or many parents
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null
  const sb = adminClient()
  const { data } = await sb.from('teachers').select('*')
    .eq('access_token', token).eq('status', 'active').single()
  return data
}


async function touchParentTeacherThread(sb: any, payload: {
  school_id: string
  teacher_id: string
  parent_id: string
  from: 'parent' | 'teacher'
}) {
  const now = new Date().toISOString()

  await sb
    .from('teacher_parent_threads')
    .upsert({
      school_id: payload.school_id,
      teacher_id: payload.teacher_id,
      parent_id: payload.parent_id,
      last_message_at: now,
      last_message_from: payload.from,
      unread_for_parent: payload.from === 'teacher' ? 1 : 0,
      unread_for_teacher: payload.from === 'parent' ? 1 : 0,
      updated_at: now,
    }, { onConflict: 'teacher_id,parent_id' })
}

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parentId = req.nextUrl.searchParams.get('parent_id')
  if (!parentId) return NextResponse.json({ error: 'parent_id required' }, { status: 400 })

  const sb = adminClient()
  const { data: updates } = await sb.from('updates')
    .select('*, update_reactions(*), update_replies(*)')
    .eq('teacher_id', teacher.id)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(80)

  return NextResponse.json({ updates: updates ?? [] })
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { parent_ids, body, image_url } = await req.json()
  if (!Array.isArray(parent_ids) || parent_ids.length === 0) {
    return NextResponse.json({ error: 'parent_ids required' }, { status: 400 })
  }
  if (!body?.trim() && !image_url) {
    return NextResponse.json({ error: 'empty update' }, { status: 400 })
  }

  const sb = adminClient()
  // For broadcasts, share a broadcast_id so we can group them later
  const broadcast_id = parent_ids.length > 1
    ? crypto.randomUUID()
    : null

  const rows = parent_ids.map((pid: string) => ({
    school_id:    teacher.school_id,
    teacher_id:   teacher.id,
    parent_id:    pid,
    author_kind:  'teacher',
    body:         body?.trim() || null,
    image_url:    image_url || null,
    broadcast_id,
  }))

  const { data, error } = await sb.from('updates').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  try {
    await Promise.all(
      parent_ids.map((pid: string) => touchParentTeacherThread(sb, {
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        parent_id: pid,
        from: 'teacher',
      }))
    )
  } catch {}

  return NextResponse.json({ updates: data, count: data?.length || 0 })
}

export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()
  const { data: u } = await sb.from('updates').select('teacher_id, author_kind')
    .eq('id', id).single()
  if (!u || u.teacher_id !== teacher.id || u.author_kind !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  await sb.from('updates').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
