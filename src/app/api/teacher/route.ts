// /api/teacher
// Teacher roster actions for the report-focused MVP.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function isBlockedTeacher(status: unknown) {
  const value = String(status || '').toLowerCase()
  return value === 'rejected' || value === 'inactive' || value === 'disabled' || value === 'revoked'
}

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null

  const sb = adminClient()
  const { data } = await sb
    .from('teachers')
    .select('*')
    .eq('access_token', token)
    .maybeSingle()

  if (!data || isBlockedTeacher(data.status)) return null
  return data
}

function cleanPhone(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, '')
}

export async function PATCH(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const updates: any = {}

  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.photo_url === 'string') updates.photo_url = body.photo_url

  updates.updated_at = new Date().toISOString()

  const sb = adminClient()
  const { data, error } = await sb
    .from('teachers')
    .update(updates)
    .eq('id', teacher.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teacher: data })
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name || '').trim()
  const parent_whatsapp = cleanPhone(body.parent_whatsapp)
  const parent_email = String(body.parent_email || '').trim() || null

  if (!name) {
    return NextResponse.json({ error: 'Child name is required' }, { status: 400 })
  }

  if (!parent_whatsapp) {
    return NextResponse.json({ error: 'Parent WhatsApp number is required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data, error } = await sb
    .from('children')
    .insert({
      school_id: teacher.school_id,
      name,
      grade: teacher.grade,
      class_name: teacher.class_name,
      parent_whatsapp,
      parent_email,
      created_by_teacher_id: teacher.id,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

export async function PUT(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '').trim()
  const name = String(body.name || '').trim()
  const parent_whatsapp = cleanPhone(body.parent_whatsapp)
  const parent_email = String(body.parent_email || '').trim() || null

  if (!id || !name) {
    return NextResponse.json({ error: 'Child id and name are required' }, { status: 400 })
  }

  if (!parent_whatsapp) {
    return NextResponse.json({ error: 'Parent WhatsApp number is required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: child } = await sb
    .from('children')
    .select('*')
    .eq('id', id)
    .eq('school_id', teacher.school_id)
    .eq('created_by_teacher_id', teacher.id)
    .maybeSingle()

  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const { data, error } = await sb
    .from('children')
    .update({
      name,
      parent_whatsapp,
      parent_email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()

  const { data: child } = await sb
    .from('children')
    .select('*')
    .eq('id', id)
    .eq('school_id', teacher.school_id)
    .eq('created_by_teacher_id', teacher.id)
    .maybeSingle()

  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const { error } = await sb
    .from('children')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
