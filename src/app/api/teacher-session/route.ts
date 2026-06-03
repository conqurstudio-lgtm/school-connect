// /api/teacher-session
// Robust teacher-link session for the report MVP.
// Opens the teacher dashboard even if old child columns/report tables are not migrated yet.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

function isBlockedTeacher(status: unknown) {
  const value = String(status || '').toLowerCase()
  return value === 'rejected' || value === 'inactive' || value === 'disabled' || value === 'revoked'
}

async function getChildrenSafely(sb: any, teacher: any) {
  // New MVP roster: learners created by the teacher.
  const newer = await sb
    .from('children')
    .select('id, name, grade, class_name, parent_whatsapp, parent_email, status, report_subjects, created_at, created_by_teacher_id')
    .eq('school_id', teacher.school_id)
    .eq('created_by_teacher_id', teacher.id)
    .or('status.is.null,status.eq.active')
    .order('name')

  if (!newer.error) return newer.data || []

  // Old schema fallback: open the link even before the new migration is applied.
  const older = await sb
    .from('children')
    .select('id, name, grade, class_name, status, report_subjects, created_at')
    .eq('school_id', teacher.school_id)
    .eq('grade', teacher.grade)
    .or('status.is.null,status.eq.active')
    .order('name')

  if (older.error) {
    return []
  }

  const rows = older.data || []
  return teacher.class_name
    ? rows.filter((child: any) => child.class_name === teacher.class_name)
    : rows
}

async function getReportSummarySafely(sb: any, childIds: string[], teacherId: string) {
  if (!childIds.length) return {}

  const { data, error } = await sb
    .from('child_reports')
    .select('id, child_id, published_at, week_starting, report_subjects')
    .in('child_id', childIds)
    .eq('teacher_id', teacherId)

  if (error) return {}

  const map: Record<string, { count: number; latest?: string | null }> = {}

  for (const report of data || []) {
    const key = report.child_id
    if (!map[key]) map[key] = { count: 0, latest: null }
    map[key].count += 1

    const stamp = report.published_at || report.week_starting
    if (!map[key].latest || String(stamp) > String(map[key].latest)) {
      map[key].latest = stamp
    }
  }

  return map
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const tokenFromUrl = url.searchParams.get('token')
    const token = tokenFromUrl ?? req.cookies.get('teacher_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No teacher token was provided.' }, { status: 401 })
    }

    const sb = adminClient()

    const { data: teacher, error: teacherError } = await sb
      .from('teachers')
      .select('*')
      .eq('access_token', token)
      .maybeSingle()

    if (teacherError) {
      return NextResponse.json({ error: teacherError.message }, { status: 500 })
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher link was not found in the teachers table.' }, { status: 404 })
    }

    if (isBlockedTeacher(teacher.status)) {
      return NextResponse.json({ error: 'This teacher link has been revoked.' }, { status: 401 })
    }

    await sb
      .from('teachers')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', teacher.id)

    const { data: school } = await sb
      .from('schools')
      .select('id, name, logo_url, tagline, report_subjects')
      .eq('id', teacher.school_id)
      .maybeSingle()

    const childrenRows = await getChildrenSafely(sb, teacher)
    const childIds = (childrenRows || []).map((child: any) => child.id).filter(Boolean)
    const reportMap: any = await getReportSummarySafely(sb, childIds, teacher.id)

    const children = (childrenRows || []).map((child: any) => ({
      ...child,
      parent_whatsapp: child.parent_whatsapp || '',
      parent_email: child.parent_email || '',
      report_count: reportMap[child.id]?.count || 0,
      latest_report_at: reportMap[child.id]?.latest || null,
    }))

    const res = NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        photo_url: teacher.photo_url,
        grade: teacher.grade,
        class_name: teacher.class_name,
        status: teacher.status,
      },
      school,
      children,
    })

    if (tokenFromUrl || !req.cookies.get('teacher_token')) {
      res.cookies.set('teacher_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }

    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Teacher session failed.' }, { status: 500 })
  }
}

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('teacher_token', '', { maxAge: 0, path: '/' })
  return res
}
