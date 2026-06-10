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

function publicOrigin(req: NextRequest) {
  return (
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin ||
    ''
  ).replace(/\/$/, '')
}

async function loadPermanentParentLink(sb: any, token: string) {
  const { data, error } = await sb
    .from('child_parent_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function loadLegacyReportLink(sb: any, token: string) {
  const { data, error } = await sb
    .from('child_report_links')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function loadLatestPublishedReport(sb: any, childId: string) {
  const { data, error } = await sb
    .from('child_reports')
    .select('*')
    .eq('child_id', childId)
    .eq('status', 'published')
    .order('week_starting', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function loadReportById(sb: any, reportId: string) {
  const { data, error } = await sb
    .from('child_reports')
    .select('*')
    .eq('id', reportId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function resolveReportToShare(sb: any, token: string) {
  const parentLink = await loadPermanentParentLink(sb, token)

  if (parentLink) {
    const report = await loadLatestPublishedReport(sb, parentLink.child_id)

    if (!report) {
      return {
        error: 'No published report found to share',
        status: 404,
      }
    }

    return {
      parentLink,
      report,
      childId: parentLink.child_id,
      schoolId: parentLink.school_id || report.school_id || null,
      teacherId: report.teacher_id || parentLink.teacher_id || null,
    }
  }

  const legacyLink = await loadLegacyReportLink(sb, token)

  if (legacyLink) {
    if (legacyLink.expires_at && new Date(legacyLink.expires_at).getTime() < Date.now()) {
      return {
        error: 'This report link has expired',
        status: 410,
      }
    }

    const report = await loadReportById(sb, legacyLink.report_id)

    if (!report) {
      return {
        error: 'Report not found',
        status: 404,
      }
    }

    return {
      parentLink: null,
      report,
      childId: legacyLink.child_id || report.child_id,
      schoolId: legacyLink.school_id || report.school_id || null,
      teacherId: report.teacher_id || null,
    }
  }

  return {
    error: 'Parent report link not found',
    status: 404,
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const sourceToken = String(params.token || '').trim()

  if (!sourceToken) {
    return NextResponse.json({ error: 'Missing report token' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const expiresInDays = Math.max(1, Math.min(30, Number(body.expires_in_days || 14)))

  const sb = adminClient()

  try {
    const resolved: any = await resolveReportToShare(sb, sourceToken)

    if (resolved?.error) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status || 400 }
      )
    }

    const shareToken = makeToken()
    const expiresAt = addDays(expiresInDays)

    const { data: share, error: shareError } = await sb
      .from('family_report_shares')
      .insert({
        token: shareToken,
        parent_link_id: resolved.parentLink?.id || null,
        child_id: resolved.childId,
        school_id: resolved.schoolId,
        teacher_id: resolved.teacherId,
        report_id: resolved.report.id,
        include_moments: false,
        is_active: true,
        expires_at: expiresAt,
      })
      .select('*')
      .single()

    if (shareError) {
      const message = String(shareError.message || '')

      if (
        message.includes('family_report_shares') ||
        message.includes('schema cache') ||
        message.includes('Could not find')
      ) {
        return NextResponse.json(
          { error: 'Family sharing needs the Supabase SQL migration to be applied first.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ error: shareError.message }, { status: 500 })
    }

    const origin = publicOrigin(req)
    const shareUrl = origin
      ? `${origin}/report/${encodeURIComponent(share.token)}`
      : `/report/${encodeURIComponent(share.token)}`

    return NextResponse.json({
      ok: true,
      token: share.token,
      share_url: shareUrl,
      expires_at: share.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not create family share link' },
      { status: 500 }
    )
  }
}
