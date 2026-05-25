// /api/teacher/class-requests
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null

  const sb = adminClient()
  const { data } = await sb.from('teachers')
    .select('*')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  return data
}

function childName(joinReq: any) {
  return String(joinReq.child_full_name || `${joinReq.child_first_name || ''} ${joinReq.child_last_name || ''}`)
    .trim()
    .replace(/\s+/g, ' ')
}

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || 'pending'
  const sb = adminClient()

  const { data: requests, error } = await sb.from('class_join_requests')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const parentIds = Array.from(new Set((requests ?? []).map((r: any) => r.parent_id).filter(Boolean)))
  const { data: parents } = parentIds.length > 0
    ? await sb.from('profiles').select('id, full_name, phone').in('id', parentIds)
    : { data: [] as any[] }

  const parentById: Record<string, any> = {}
  for (const parent of (parents ?? [])) parentById[parent.id] = parent

  return NextResponse.json({
    requests: (requests ?? []).map((r: any) => ({ ...r, parent: parentById[r.parent_id] || null })),
  })
}

export async function PATCH(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const requestId = body.request_id
  const action = body.action
  const teacherNote = typeof body.teacher_note === 'string' ? body.teacher_note.trim() : null

  if (!requestId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'request_id and valid action required' }, { status: 400 })
  }

  const sb = adminClient()
  const { data: joinReq } = await sb.from('class_join_requests')
    .select('*')
    .eq('id', requestId)
    .eq('teacher_id', teacher.id)
    .single()

  if (!joinReq) return NextResponse.json({ error: 'request not found' }, { status: 404 })
  if (joinReq.status !== 'pending') {
    return NextResponse.json({ error: 'request already reviewed' }, { status: 400 })
  }

  if (action === 'reject') {
    const { data, error } = await sb.from('class_join_requests')
      .update({
        status: 'rejected',
        teacher_note: teacherNote,
        reviewed_at: new Date().toISOString(),
        reviewed_by_teacher_id: teacher.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', joinReq.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ request: data })
  }

  const name = childName(joinReq)
  const { data: existingKids } = await sb.from('children')
    .select('*')
    .eq('school_id', teacher.school_id)
    .eq('grade', teacher.grade)
    .eq('status', 'active')
    .ilike('name', name)

  let child = (existingKids ?? []).find((kid: any) =>
    (kid.class_name || null) === (teacher.class_name || null)
  ) || null

  if (!child) {
    const { data: newChild, error: childError } = await sb.from('children')
      .insert({
        school_id: teacher.school_id,
        name,
        grade: teacher.grade,
        class_name: teacher.class_name,
        created_by_teacher_id: teacher.id,
        status: 'active',
      })
      .select()
      .single()

    if (childError) return NextResponse.json({ error: childError.message }, { status: 500 })
    child = newChild
  }

  const { data: existingLink } = await sb.from('child_guardians')
    .select('id')
    .eq('child_id', child.id)
    .eq('guardian_id', joinReq.parent_id)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkError } = await sb.from('child_guardians')
      .insert({
        child_id: child.id,
        guardian_id: joinReq.parent_id,
        relationship: joinReq.relationship || 'Parent/Guardian',
        is_primary: false,
      })

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const { data: updatedRequest, error: updateError } = await sb.from('class_join_requests')
    .update({
      status: 'approved',
      teacher_note: teacherNote,
      created_child_id: child.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by_teacher_id: teacher.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', joinReq.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ request: updatedRequest, child })
}
