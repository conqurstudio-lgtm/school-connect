// @ts-nocheck
// /api/teacher/child-report/batch
// Creates the same weekly report for selected learners in one teacher action.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateComment } from '@/lib/reports'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_SUBJECTS = ['Mathematics', 'English', 'Life Skills', 'Behaviour']

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

function normalizeSubjects(value: any) {
  const raw = Array.isArray(value) ? value : DEFAULT_SUBJECTS
  const seen = new Set<string>()

  const subjects = raw
    .map((item: any) => String(item || '').trim())
    .filter(Boolean)
    .map((item: string) => item.slice(0, 40))
    .filter((item: string) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)

  return subjects.length ? subjects : DEFAULT_SUBJECTS
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

async function saveReport(
  sb: any,
  teacher: any,
  child: any,
  weekStarting: string,
  scores: Record<string, number>
) {
  const comment = generateComment(scores, child.name)

  const { data: existing, error: existingError } = await sb
    .from('child_reports')
    .select('id')
    .eq('child_id', child.id)
    .eq('teacher_id', teacher.id)
    .eq('week_starting', weekStarting)
    .maybeSingle()

  if (existingError) throw existingError

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

    if (error) throw error
    return data
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

  if (error) throw error
  return data
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await getTeacher(req)
    if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const weekStarting = String(body.week_starting || '').trim()
    const childIds = Array.from(
      new Set(
        (Array.isArray(body.child_ids) ? body.child_ids : [])
          .map((id: any) => String(id || '').trim())
          .filter(Boolean)
      )
    ).slice(0, 100)

    if (!weekStarting) {
      return NextResponse.json({ error: 'week_starting required' }, { status: 400 })
    }

    if (!childIds.length) {
      return NextResponse.json({ error: 'Choose at least one learner' }, { status: 400 })
    }

    const sb = adminClient()
    const subjects = normalizeSubjects(teacher.report_subjects)
    const scores = Object.fromEntries(subjects.map((subject: string) => [subject, 3]))

    const { data: children, error: childrenError } = await sb
      .from('children')
      .select('*')
      .in('id', childIds)
      .eq('school_id', teacher.school_id)
      .eq('created_by_teacher_id', teacher.id)
      .or('status.is.null,status.eq.active')

    if (childrenError) throw childrenError

    if (!children?.length) {
      return NextResponse.json({ error: 'No selected learners were found in your roster' }, { status: 404 })
    }

    if (children.length !== childIds.length) {
      return NextResponse.json({ error: 'One or more selected learners are not in your roster' }, { status: 403 })
    }

    const origin = publicOrigin(req)

    const reports = await Promise.all(
      children.map(async (child: any) => {
        const report = await saveReport(sb, teacher, child, weekStarting, scores)
        const linkRow = await getOrCreateChildLink(sb, child, teacher)
        const magicLink = origin
          ? `${origin}/report/${encodeURIComponent(linkRow.token)}`
          : `/report/${encodeURIComponent(linkRow.token)}`

        if (child.parent_whatsapp) {
          const message = `${child.name}'s weekly update is ready.\n\nView it here:\n${magicLink}`

          await sb.from('whatsapp_notifications').insert({
            report_id: report.id,
            school_id: teacher.school_id,
            child_id: child.id,
            parent_whatsapp: child.parent_whatsapp,
            message,
            magic_link: magicLink,
            status: 'pending',
          })
        }

        return {
          id: report.id,
          child_id: child.id,
          week_starting: weekStarting,
          magic_link: magicLink,
          whatsapp_status: child.parent_whatsapp ? 'queued' : 'not_configured',
        }
      })
    )

    return NextResponse.json({
      ok: true,
      count: reports.length,
      reports,
    })
  } catch (error: any) {
    console.error('[teacher-report-batch]', error)
    return NextResponse.json(
      { error: error?.message || 'Could not save batch reports' },
      { status: 500 }
    )
  }
}
