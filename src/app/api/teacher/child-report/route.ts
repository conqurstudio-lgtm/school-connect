// /api/teacher/child-report
// messages-reports-feature-flow-v1
// Teacher creates or updates a published weekly report for a child in their class.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateComment } from '@/lib/reports'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    .from('teachers')
    .select('id, school_id, grade, class_name, status')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  return data
}

function cleanScores(input: any): Record<string, number> {
  const out: Record<string, number> = {}

  if (!input || typeof input !== 'object') return out

  for (const [name, raw] of Object.entries(input)) {
    const key = String(name || '').trim()
    const score = Number(raw)

    if (!key) continue
    if (!Number.isFinite(score)) continue

    out[key] = Math.max(0, Math.min(5, score))
  }

  return out
}

async function markReportUnreadForGuardians(sb: any, payload: {
  school_id: string
  teacher_id: string
  child_id: string
}) {
  const { data: links } = await sb
    .from('child_guardians')
    .select('guardian_id')
    .eq('child_id', payload.child_id)

  const guardianIds = Array.from(new Set((links ?? []).map((link: any) => link.guardian_id).filter(Boolean)))
  if (guardianIds.length === 0) return 0

  const now = new Date().toISOString()

  await Promise.all(guardianIds.map((parentId: string) =>
    sb.from('teacher_parent_threads')
      .upsert({
        school_id: payload.school_id,
        teacher_id: payload.teacher_id,
        parent_id: parentId,
        child_id: payload.child_id,
        unread_for_parent: 1,
        updated_at: now,
      }, { onConflict: 'teacher_id,parent_id' })
  ))

  return guardianIds.length
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const childId = String(body.child_id || '').trim()
  const weekStarting = String(body.week_starting || '').trim()
  const scores = cleanScores(body.scores)
  const manualComment = String(body.comment || '').trim()

  if (!childId) return NextResponse.json({ error: 'child_id required' }, { status: 400 })
  if (!weekStarting) return NextResponse.json({ error: 'week_starting required' }, { status: 400 })
  if (Object.keys(scores).length === 0) {
    return NextResponse.json({ error: 'at least one score required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: child, error: childErr } = await sb
    .from('children')
    .select('id, school_id, grade, class_name, status, name')
    .eq('id', childId)
    .single()

  if (childErr || !child) return NextResponse.json({ error: 'child not found' }, { status: 404 })

  const sameClass =
    child.school_id === teacher.school_id &&
    child.status === 'active' &&
    child.grade === teacher.grade &&
    (child.class_name || null) === (teacher.class_name || null)

  if (!sameClass) return NextResponse.json({ error: 'child is not in your class' }, { status: 403 })

  const comment = manualComment || generateComment(scores)

  const { data: existing } = await sb
    .from('child_reports')
    .select('id')
    .eq('child_id', child.id)
    .eq('teacher_id', teacher.id)
    .eq('week_starting', weekStarting)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await sb
      .from('child_reports')
      .update({
        scores,
        comment,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let guardian_count = 0
    try {
      guardian_count = await markReportUnreadForGuardians(sb, {
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        child_id: child.id,
      })
    } catch {}

    return NextResponse.json({ report: data, updated: true, guardian_count })
  }

  const { data, error } = await sb
    .from('child_reports')
    .insert({
      school_id: teacher.school_id,
      child_id: child.id,
      teacher_id: teacher.id,
      week_starting: weekStarting,
      scores,
      comment,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let guardian_count = 0
  try {
    guardian_count = await markReportUnreadForGuardians(sb, {
      school_id: teacher.school_id,
      teacher_id: teacher.id,
      child_id: child.id,
    })
  } catch {}

  return NextResponse.json({ report: data, created: true, guardian_count })
}
