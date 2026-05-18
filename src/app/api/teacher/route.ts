// /api/teacher
// Teacher-authenticated actions (uses teacher_token cookie).
// PATCH → update teacher (photo, name)
// POST  → add a child to their class
// PUT   → update child
// DELETE → remove child

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
  const { data } = await sb
    .from('teachers').select('*')
    .eq('access_token', token).eq('status', 'active')
    .single()
  return data
}

// PATCH — update teacher (photo, name)
export async function PATCH(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: any = {}
  if (typeof body.name      === 'string') updates.name      = body.name.trim()
  if (typeof body.photo_url === 'string') updates.photo_url = body.photo_url
  updates.updated_at = new Date().toISOString()

  const sb = adminClient()
  const { data, error } = await sb.from('teachers')
    .update(updates).eq('id', teacher.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teacher: data })
}

// POST — add a child to the teacher's class
export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const sb = adminClient()
  const { data, error } = await sb.from('children')
    .insert({
      school_id:               teacher.school_id,
      name:                    name.trim(),
      grade:                   teacher.grade,
      class_name:              teacher.class_name,
      created_by_teacher_id:   teacher.id,
      status:                  'active',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

// PUT — update child (rename only — teachers can rename children in their class)
export async function PUT(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, name } = await req.json()
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: 'id and name required' }, { status: 400 })
  }

  const sb = adminClient()
  // Only allow update if child is in this teacher's class
  const { data: child } = await sb.from('children').select('*')
    .eq('id', id).eq('school_id', teacher.school_id).single()
  if (!child) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (child.grade !== teacher.grade || child.class_name !== teacher.class_name) {
    return NextResponse.json({ error: 'not in your class' }, { status: 403 })
  }

  const { data, error } = await sb.from('children')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

// DELETE — remove child from class (soft delete via status='inactive')
export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()
  const { data: child } = await sb.from('children').select('*')
    .eq('id', id).eq('school_id', teacher.school_id).single()
  if (!child) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (child.grade !== teacher.grade || child.class_name !== teacher.class_name) {
    return NextResponse.json({ error: 'not in your class' }, { status: 403 })
  }

  const { error } = await sb.from('children')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
