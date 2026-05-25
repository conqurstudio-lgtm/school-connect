// Public parent report view by private token.
// No parent login required.

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = String(params.token || '').trim()

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: link, error: linkError } = await sb
    .from('child_report_links')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (linkError || !link) {
    return NextResponse.json({ error: 'Report link not found' }, { status: 404 })
  }

  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This report link has expired' }, { status: 410 })
  }

  const { data: report, error: reportError } = await sb
    .from('child_reports')
    .select('*')
    .eq('id', link.report_id)
    .single()

  if (reportError || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const [{ data: child }, { data: teacher }, { data: school }] = await Promise.all([
    sb.from('children').select('id, name').eq('id', report.child_id).single(),
    sb.from('teachers').select('id, name, grade, class_name').eq('id', report.teacher_id).single(),
    sb.from('schools').select('id, name, logo_url, tagline').eq('id', report.school_id).single(),
  ])

  if (!link.viewed_at) {
    await sb
      .from('child_report_links')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', link.id)
  }

  return NextResponse.json({
    report,
    child,
    teacher,
    school,
  })
}
