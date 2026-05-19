// /api/parent/reports
// Returns published reports for children linked to the logged-in parent.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    {
      cookies: {
        get(name: string) { return store.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

export async function GET() {
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()

  const { data: profile } = await sb
    .from('profiles')
    .select('id, role, school_id, child_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: links } = await sb
    .from('child_guardians')
    .select('child_id')
    .eq('guardian_id', user.id)

  let childIds = Array.from(new Set((links ?? []).map((l: any) => l.child_id).filter(Boolean)))

  // Legacy fallback for older parent profiles that only had child_name.
  if (childIds.length === 0 && profile.child_name && profile.school_id) {
    const { data: legacyKids } = await sb
      .from('children')
      .select('id')
      .eq('school_id', profile.school_id)
      .ilike('name', profile.child_name)

    childIds = Array.from(new Set((legacyKids ?? []).map((k: any) => k.id).filter(Boolean)))
  }

  if (childIds.length === 0) {
    return NextResponse.json({ reports: [], child_name: profile.child_name || 'Your child' })
  }

  const { data: children } = await sb
    .from('children')
    .select('id, name, grade, class_name')
    .in('id', childIds)

  const childMap = new Map((children ?? []).map((c: any) => [c.id, c]))

  const { data: rawReports, error } = await sb
    .from('child_reports')
    .select('*')
    .in('child_id', childIds)
    .eq('status', 'published')
    .order('week_starting', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const teacherIds = Array.from(new Set((rawReports ?? []).map((r: any) => r.teacher_id).filter(Boolean)))

  let teacherMap = new Map<string, any>()
  if (teacherIds.length > 0) {
    const { data: teachers } = await sb
      .from('teachers')
      .select('id, name')
      .in('id', teacherIds)

    teacherMap = new Map((teachers ?? []).map((t: any) => [t.id, t]))
  }

  const newestFirst = rawReports ?? []
  const oldestFirst = [...newestFirst].reverse()

  const previousByChild = new Map<string, any>()
  const enrichedOldestFirst = oldestFirst.map((report: any) => {
    const child = childMap.get(report.child_id)
    const teacher = teacherMap.get(report.teacher_id)
    const previous = previousByChild.get(report.child_id) || null

    previousByChild.set(report.child_id, report)

    return {
      ...report,
      child_name: child?.name || profile.child_name || 'Your child',
      child_grade: child?.grade || null,
      child_class_name: child?.class_name || null,
      teacher_name: teacher?.name || 'Teacher',
      previous_scores: previous?.scores || null,
    }
  })

  const firstChild = children?.[0]
  const childName = (children?.length || 0) === 1
    ? firstChild?.name || profile.child_name || 'Your child'
    : 'Your children'

  return NextResponse.json({
    reports: enrichedOldestFirst,
    child_name: childName,
  })
}
