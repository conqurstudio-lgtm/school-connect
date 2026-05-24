// /api/thread-status
// messages-reports-feature-flow-v1
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

function userClient() {
  const store = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return store.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

async function isMyTeacher(sb: any, parentId: string, teacherId: string): Promise<boolean> {
  const { data: teacher } = await sb
    .from('teachers')
    .select('school_id, grade, class_name, status')
    .eq('id', teacherId)
    .single()

  if (!teacher || teacher.status !== 'active') return false

  const { data: links } = await sb
    .from('child_guardians')
    .select('child_id')
    .eq('guardian_id', parentId)

  const childIds = (links ?? []).map((l: any) => l.child_id).filter(Boolean)

  if (childIds.length === 0) {
    const { data: prof } = await sb
      .from('profiles')
      .select('school_id, child_name')
      .eq('id', parentId)
      .single()

    if (!prof || prof.school_id !== teacher.school_id || !prof.child_name) return false

    const { data: legacyKids } = await sb
      .from('children')
      .select('grade, class_name')
      .eq('school_id', teacher.school_id)
      .ilike('name', prof.child_name)

    return (legacyKids ?? []).some((k: any) =>
      k.grade === teacher.grade &&
      (k.class_name || null) === (teacher.class_name || null)
    )
  }

  const { data: kids } = await sb
    .from('children')
    .select('school_id, grade, class_name')
    .in('id', childIds)

  return (kids ?? []).some((k: any) =>
    k.school_id === teacher.school_id &&
    k.grade === teacher.grade &&
    (k.class_name || null) === (teacher.class_name || null)
  )
}

export async function GET(req: NextRequest) {
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  const sb = adminClient()

  let updatesQuery = sb
    .from('updates')
    .select('teacher_id, created_at')
    .eq('parent_id', user.id)
    .eq('author_kind', 'teacher')
    .order('created_at', { ascending: false })
    .limit(500)

  let threadQuery = sb
    .from('teacher_parent_threads')
    .select('teacher_id, last_parent_seen_at')
    .eq('parent_id', user.id)

  if (teacherId) {
    if (!(await isMyTeacher(sb, user.id, teacherId))) {
      return NextResponse.json({ threads: [], by_teacher: {} })
    }

    updatesQuery = updatesQuery.eq('teacher_id', teacherId)
    threadQuery = threadQuery.eq('teacher_id', teacherId)
  }

  const [{ data: updates }, { data: threads }] = await Promise.all([updatesQuery, threadQuery])

  const { data: guardianLinks } = await sb
    .from('child_guardians')
    .select('child_id')
    .eq('guardian_id', user.id)

  const childIds = (guardianLinks ?? []).map((link: any) => link.child_id).filter(Boolean)

  let reports: any[] = []
  if (childIds.length > 0) {
    let reportsQuery = sb
      .from('child_reports')
      .select('teacher_id, child_id, created_at, published_at, week_starting, status')
      .in('child_id', childIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)

    if (teacherId) reportsQuery = reportsQuery.eq('teacher_id', teacherId)

    const { data } = await reportsQuery
    reports = data ?? []
  }

  const seenByTeacher = new Map<string, number>()
  for (const thread of (threads ?? [])) {
    seenByTeacher.set(thread.teacher_id, thread.last_parent_seen_at ? new Date(thread.last_parent_seen_at).getTime() : 0)
  }

  const byTeacher: Record<string, { teacher_id: string; unread_count: number; last_message_at: string | null; last_report_at?: string | null }> = {}

  for (const update of (updates ?? [])) {
    const teacherKey = update.teacher_id
    const createdAt = update.created_at || null
    const created = createdAt ? new Date(createdAt).getTime() : 0
    const lastSeen = seenByTeacher.get(teacherKey) || 0

    if (!byTeacher[teacherKey]) {
      byTeacher[teacherKey] = {
        teacher_id: teacherKey,
        unread_count: 0,
        last_message_at: createdAt,
      }
    }

    if (created > lastSeen) {
      byTeacher[teacherKey].unread_count += 1
    }
  }

  for (const report of reports) {
    const teacherKey = report.teacher_id
    const reportAt = report.published_at || report.created_at || report.week_starting || null
    const created = reportAt ? new Date(reportAt).getTime() : 0
    const lastSeen = seenByTeacher.get(teacherKey) || 0

    if (!byTeacher[teacherKey]) {
      byTeacher[teacherKey] = {
        teacher_id: teacherKey,
        unread_count: 0,
        last_message_at: reportAt,
        last_report_at: reportAt,
      }
    }

    if (created > lastSeen) {
      byTeacher[teacherKey].unread_count += 1
    }

    if (reportAt && (!byTeacher[teacherKey].last_message_at || reportAt > String(byTeacher[teacherKey].last_message_at))) {
      byTeacher[teacherKey].last_message_at = reportAt
    }

    if (reportAt && (!byTeacher[teacherKey].last_report_at || reportAt > String(byTeacher[teacherKey].last_report_at))) {
      byTeacher[teacherKey].last_report_at = reportAt
    }
  }

  return NextResponse.json({
    threads: Object.values(byTeacher),
    by_teacher: byTeacher,
  })
}

export async function POST(req: NextRequest) {
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const teacherId = String(body.teacher_id || '').trim()

  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })

  const sb = adminClient()

  if (!(await isMyTeacher(sb, user.id, teacherId))) {
    return NextResponse.json({ error: 'not your child teacher' }, { status: 403 })
  }

  const { data: teacher } = await sb
    .from('teachers')
    .select('school_id')
    .eq('id', teacherId)
    .single()

  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })

  const now = new Date().toISOString()

  const { error } = await sb
    .from('teacher_parent_threads')
    .upsert({
      school_id: teacher.school_id,
      teacher_id: teacherId,
      parent_id: user.id,
      last_parent_seen_at: now,
      unread_for_parent: 0,
      updated_at: now,
    }, { onConflict: 'teacher_id,parent_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, seen_at: now })
}
