import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function makeToken() {
  return randomBytes(24).toString('base64url')
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const parentToken = String(params.token || '').trim()
  if (!parentToken) {
    return NextResponse.json({ error: 'missing token' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const expiresInDays = Math.max(1, Math.min(30, Number(body.expires_in_days || 14)))

  const sb = adminClient()

  const { data: parentLink, error: linkError } = await sb
    .from('child_parent_links')
    .select('*')
    .eq('token', parentToken)
    .eq('is_active', true)
    .maybeSingle()

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  if (!parentLink) {
    return NextResponse.json({ error: 'Parent report link not found' }, { status: 404 })
  }

  const { data: latestReport, error: reportError } = await sb
    .from('child_reports')
    .select('*')
    .eq('child_id', parentLink.child_id)
    .eq('status', 'published')
    .order('week_starting', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 })
  }

  if (!latestReport) {
    return NextResponse.json({ error: 'No published report found to share' }, { status: 404 })
  }

  const shareToken = makeToken()
  const expiresAt = addDays(expiresInDays)

  const { data: share, error: shareError } = await sb
    .from('family_report_shares')
    .insert({
      token: shareToken,
      parent_link_id: parentLink.id,
      child_id: parentLink.child_id,
      school_id: parentLink.school_id || latestReport.school_id || null,
      teacher_id: latestReport.teacher_id || parentLink.teacher_id || null,
      report_id: latestReport.id,
      include_moments: false,
      is_active: true,
      expires_at: expiresAt,
    })
    .select('*')
    .single()

  if (shareError) {
    return NextResponse.json({ error: shareError.message }, { status: 500 })
  }

  const shareUrl = `${req.nextUrl.origin}/report/${encodeURIComponent(share.token)}`

  return NextResponse.json({
    ok: true,
    token: share.token,
    share_url: shareUrl,
    expires_at: share.expires_at,
  })
}
