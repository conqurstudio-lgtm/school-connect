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

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const childId = String(url.searchParams.get('child_id') || '').trim()

  if (!childId) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

  const sb = adminClient()

  const { data: child, error: childError } = await sb
    .from('children')
    .select('id,name,school_id')
    .eq('id', childId)
    .maybeSingle()

  if (childError || !child) return NextResponse.json({ error: 'child not found' }, { status: 404 })

  const { data: recipients, error: recError } = await sb
    .from('moment_recipients')
    .select('id,moment_id,child_id,viewed_at,created_at')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })

  if (recError) return NextResponse.json({ error: recError.message }, { status: 500 })

  const momentIds = (recipients || []).map((row: any) => row.moment_id)
  if (!momentIds.length) return NextResponse.json({ child, moments: [] })

  const { data: moments, error: momentsError } = await sb
    .from('moments')
    .select('*')
    .in('id', momentIds)
    .order('created_at', { ascending: false })

  if (momentsError) return NextResponse.json({ error: momentsError.message }, { status: 500 })

  const teacherIds = Array.from(new Set((moments || []).map((moment: any) => moment.teacher_id).filter(Boolean)))
  let teacherMap: any = {}

  if (teacherIds.length) {
    const { data: teachers } = await sb
      .from('teachers')
      .select('id,name,photo_url,grade,class_name')
      .in('id', teacherIds)

    teacherMap = Object.fromEntries((teachers || []).map((teacher: any) => [teacher.id, teacher]))
  }

  const { data: reactions } = await sb
    .from('moment_reactions')
    .select('moment_id,reaction')
    .eq('child_id', child.id)
    .in('moment_id', momentIds)

  const reactionMap = Object.fromEntries((reactions || []).map((row: any) => [row.moment_id, row.reaction]))
  const recipientMap = Object.fromEntries((recipients || []).map((row: any) => [row.moment_id, row]))

  return NextResponse.json({
    child,
    moments: (moments || []).map((moment: any) => ({
      ...moment,
      teacher: moment.teacher_id ? teacherMap[moment.teacher_id] || null : null,
      recipient: recipientMap[moment.id] || null,
      reaction: reactionMap[moment.id] || null,
    })),
  })
}
