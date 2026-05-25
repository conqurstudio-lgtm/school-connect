// /api/teacher/child-report
// Saves a weekly report and returns the child's permanent private parent link.

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
    .select('*')
    .eq('access_token', token)
    .maybeSingle()

  if (!data) return null

  const blocked = ['rejected', 'revoked', 'inactive', 'disabled']
  if (blocked.includes(String(data.status || '').toLowerCase())) return null

  return data
}

function cleanScores(input: any): Record<string, number> {
  const out: Record<string, number> = {}

  if (!input || typeof input !== 'object') return out

  for (const [name, raw] of Object.entries(input)) {
    const key = String(name || '').trim()
    const score = Number(raw)

    if (!key || !Number.isFinite(score)) continue

    out[key] = Math.max(0, Math.min(5, score))
  }

  return out
}

function tokenValue() {
  return `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`
}

function publicOrigin(req: NextRequest) {
  return (
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '')
}

async function getOrCreateChildLink(sb: any, child: any, teacher: any) {
  const { data: existing } = await sb
    .from('child_parent_links')
    .select('*')
    .eq('child_id', child.id)
    .maybeSingle()

  if (existing?.token) {
    await sb
      .from('child_parent_links')
      .update({
        school_id: child.school_id,
        teacher_id: teacher.id,
        is_active: true,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    return existing
  }

  const { data, error } = await sb
    .from('child_parent_links')
    .insert({
      school_id: child.school_id,
      child_id: child.id,
      teacher_id: teacher.id,
      token: tokenValue(),
      is_active: true,
      last_sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
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
    .select('*')
    .eq('id', childId)
    .maybeSingle()

  if (childErr || !child) {
    return NextResponse.json({ error: 'child not found' }, { status: 404 })
  }

  const sameSchool = child.school_id === teacher.school_id
  const sameTeacher = !child.created_by_teacher_id || child.created_by_teacher_id === teacher.id
  const activeChild = !child.status || String(child.status).toLowerCase() === 'active'

  if (!sameSchool || !sameTeacher || !activeChild) {
    return NextResponse.json({ error: 'child is not in your roster' }, { status: 403 })
  }

  if (!child.parent_whatsapp) {
    return NextResponse.json({ error: 'This learner does not have a parent WhatsApp number' }, { status: 400 })
  }

  const comment = manualComment || generateComment(scores)

  const { data: existing } = await sb
    .from('child_reports')
    .select('id')
    .eq('child_id', child.id)
    .eq('teacher_id', teacher.id)
    .eq('week_starting', weekStarting)
    .maybeSingle()

  let savedReport: any = null

  if (existing?.id) {
    const { data, error } = await sb
      .from('child_reports')
      .update({
        school_id: teacher.school_id,
        child_id: child.id,
        teacher_id: teacher.id,
        week_starting: weekStarting,
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
    savedReport = data
  } else {
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
    savedReport = data
  }

  try {
    const linkRow = await getOrCreateChildLink(sb, child, teacher)
    const origin = publicOrigin(req)
    const magicLink = origin
      ? `${origin}/report/${encodeURIComponent(linkRow.token)}`
      : `/report/${encodeURIComponent(linkRow.token)}`

    const message = `${child.name}'s weekly update is ready.\n\nView it here:\n${magicLink}`

    await sb.from('whatsapp_notifications').insert({
      report_id: savedReport.id,
      school_id: teacher.school_id,
      child_id: child.id,
      parent_whatsapp: child.parent_whatsapp,
      message,
      magic_link: magicLink,
      status: 'pending',
    })

    return NextResponse.json({
      report: savedReport,
      magic_link: magicLink,
      parent_link_type: 'child_permanent',
      whatsapp_status: 'queued',
      updated: Boolean(existing?.id),
      created: !existing?.id,
    })
  } catch (e: any) {
    return NextResponse.json({
      report: savedReport,
      warning: e?.message || 'Report saved, but child parent link could not be created',
    })
  }
}
