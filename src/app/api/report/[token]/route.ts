// Public parent report view by private token.
// New behavior: token belongs to the child, so the same link shows latest + previous reports.
// Fallback: old one-report links still work.

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

async function loadChildPermanentLink(sb: any, token: string) {
  const { data: link } = await sb
    .from('child_parent_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()

  return link || null
}

async function loadOldReportLink(sb: any, token: string) {
  const { data: link } = await sb
    .from('child_report_links')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  return link || null
}

async function loadFamilyShare(sb: any, token: string) {
  const { data: share } = await sb
    .from('family_report_shares')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()

  return share || null
}

async function loadSchoolProfile(sb: any, schoolId: string) {
  if (!schoolId) return null

  const detailedFields = [
    'id',
    'name',
    'logo_url',
    'tagline',
    'address',
    'province',
    'country',
    'website',
    'phone',
    'email',
  ].join(', ')

  const { data, error } = await sb
    .from('schools')
    .select(detailedFields)
    .eq('id', schoolId)
    .maybeSingle()

  if (!error) return data || null

  const { data: fallback } = await sb
    .from('schools')
    .select('id, name, logo_url, tagline')
    .eq('id', schoolId)
    .maybeSingle()

  return fallback || null
}

function attachPreviousScores(reports: any[]) {
  return reports.map((report, index) => ({
    ...report,
    previous_scores: reports[index + 1]?.scores || null,
  }))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = String(params.token || '').trim()

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const sb = adminClient()

  const familyShare = await loadFamilyShare(sb, token)

  if (familyShare) {
    if (familyShare.expires_at && new Date(familyShare.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This family share link has expired' }, { status: 410 })
    }

    const reportQuery = sb
      .from('child_reports')
      .select('*')
      .eq('child_id', familyShare.child_id)
      .eq('status', 'published')

    const { data: report, error: reportError } = familyShare.report_id
      ? await reportQuery.eq('id', familyShare.report_id).maybeSingle()
      : await reportQuery
          .order('week_starting', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 })
    }

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    const [{ data: child }, { data: teacher }, school] = await Promise.all([
      sb.from('children').select('*').eq('id', familyShare.child_id).maybeSingle(),
      familyShare.teacher_id
        ? sb.from('teachers').select('*').eq('id', familyShare.teacher_id).maybeSingle()
        : { data: null },
      loadSchoolProfile(sb, familyShare.school_id || report.school_id),
    ])

    await sb
      .from('family_report_shares')
      .update({
        last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: Number(familyShare.view_count || 0) + 1,
      })
      .eq('id', familyShare.id)

    const safeChild = child ? {
      id: child.id,
      name: child.name,
      first_name: child.first_name,
      last_name: child.last_name,
      grade: child.grade,
      class_name: child.class_name,
    } : null

    const safeTeacher = teacher ? {
      id: teacher.id,
      name: teacher.name,
      photo_url: teacher.photo_url,
      avatar_url: teacher.avatar_url,
      image_url: teacher.image_url,
    } : null

    return NextResponse.json({
      link_type: 'family_share',
      report,
      reports: [report],
      child: safeChild,
      teacher: safeTeacher,
      school,
      family_share: {
        expires_at: familyShare.expires_at,
        include_moments: false,
      },
    })
  }

  const childLink = await loadChildPermanentLink(sb, token)

  if (childLink) {
    const [{ data: child }, school] = await Promise.all([
      sb.from('children').select('*').eq('id', childLink.child_id).maybeSingle(),
      loadSchoolProfile(sb, childLink.school_id),
    ])

    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

    const { data: reports, error: reportsError } = await sb
      .from('child_reports')
      .select('*')
      .eq('child_id', child.id)
      .eq('status', 'published')
      .order('week_starting', { ascending: false })
      .order('published_at', { ascending: false })

    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 })
    }

    const latest = reports?.[0] || null
    if (!latest) return NextResponse.json({ error: 'No report has been published yet' }, { status: 404 })

    const teacherId = latest.teacher_id || childLink.teacher_id
    const { data: teacher } = teacherId
      ? await sb.from('teachers').select('*').eq('id', teacherId).maybeSingle()
      : { data: null }

    await sb
      .from('child_parent_links')
      .update({
        last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', childLink.id)

    const reportsWithHistory = attachPreviousScores(reports || [])

    return NextResponse.json({
      link_type: 'child_permanent',
      report: reportsWithHistory[0],
      reports: reportsWithHistory,
      child,
      teacher,
      school,
    })
  }

  const oldLink = await loadOldReportLink(sb, token)

  if (!oldLink) {
    return NextResponse.json({ error: 'Report link not found' }, { status: 404 })
  }

  if (oldLink.expires_at && new Date(oldLink.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This report link has expired' }, { status: 410 })
  }

  const { data: report } = await sb
    .from('child_reports')
    .select('*')
    .eq('id', oldLink.report_id)
    .maybeSingle()

  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const [{ data: child }, { data: teacher }, { data: school }, { data: reports }] = await Promise.all([
    sb.from('children').select('*').eq('id', report.child_id).maybeSingle(),
    sb.from('teachers').select('*').eq('id', report.teacher_id).maybeSingle(),
    loadSchoolProfile(sb, report.school_id),
    sb
      .from('child_reports')
      .select('*')
      .eq('child_id', report.child_id)
      .eq('status', 'published')
      .order('week_starting', { ascending: false })
      .order('published_at', { ascending: false }),
  ])

  if (!oldLink.viewed_at) {
    await sb
      .from('child_report_links')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', oldLink.id)
  }

  const reportsWithHistory = attachPreviousScores(reports || [report])

  return NextResponse.json({
    link_type: 'legacy_report',
    report,
    reports: reportsWithHistory,
    child,
    teacher,
    school,
  })
}
