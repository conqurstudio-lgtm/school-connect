// @ts-nocheck
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

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null

  const sb = adminClient()
  const { data } = await sb.from('teachers').select('*').eq('access_token', token).maybeSingle()
  if (!data) return null

  const blocked = ['rejected', 'revoked', 'inactive', 'disabled']
  if (blocked.includes(String(data.status || '').toLowerCase())) return null

  return data
}

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const childId = String(url.searchParams.get('child_id') || '').trim()
  if (!childId) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

  const sb = adminClient()

  const { data: child } = await sb.from('children').select('*').eq('id', childId).maybeSingle()
  if (!child) return NextResponse.json({ error: 'child not found' }, { status: 404 })

  const sameSchool = child.school_id === teacher.school_id
  const sameTeacher = !child.created_by_teacher_id || child.created_by_teacher_id === teacher.id
  if (!sameSchool || !sameTeacher) return NextResponse.json({ error: 'child is not in your roster' }, { status: 403 })

  const { data: reports, error } = await sb
    .from('child_reports')
    .select('*')
    .eq('child_id', child.id)
    .eq('teacher_id', teacher.id)
    .eq('status', 'published')
    .order('week_starting', { ascending: false })
    .order('published_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: link } = await sb
    .from('child_parent_links')
    .select('token')
    .eq('child_id', child.id)
    .eq('is_active', true)
    .maybeSingle()

  const origin = (
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).replace(/\/$/, '')

  const magic_link = link?.token
    ? (origin ? `${origin}/report/${encodeURIComponent(link.token)}` : `/report/${encodeURIComponent(link.token)}`)
    : ''

  return NextResponse.json({ child, reports: reports || [], magic_link })
}
