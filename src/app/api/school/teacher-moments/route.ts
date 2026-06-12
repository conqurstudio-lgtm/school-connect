// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

async function buildMomentRows(sb: any, moments: any[]) {
  const momentIds = (moments || []).map((moment: any) => moment.id).filter(Boolean)
  if (!momentIds.length) return []

  const { data: recipients } = await sb
    .from('moment_recipients')
    .select('moment_id,child_id,viewed_at,created_at,parent_whatsapp,parent_email')
    .in('moment_id', momentIds)

  const childIds = Array.from(new Set((recipients || []).map((row: any) => row.child_id).filter(Boolean)))

  let childMap: any = {}
  if (childIds.length) {
    const { data: children } = await sb
      .from('children')
      .select('id,name,parent_whatsapp,parent_email')
      .in('id', childIds)

    childMap = Object.fromEntries((children || []).map((child: any) => [child.id, child]))
  }

  const { data: reactions } = await sb
    .from('moment_reactions')
    .select('moment_id,child_id,reaction,created_at')
    .in('moment_id', momentIds)

  const recipientMap: any = {}
  for (const row of recipients || []) {
    if (!recipientMap[row.moment_id]) recipientMap[row.moment_id] = []

    const child = childMap[row.child_id] || null

    recipientMap[row.moment_id].push({
      ...row,
      child,
      parent_whatsapp: row.parent_whatsapp || child?.parent_whatsapp || null,
      parent_email: row.parent_email || child?.parent_email || null,
    })
  }

  const reactionMap: any = {}
  for (const row of reactions || []) {
    if (!reactionMap[row.moment_id]) reactionMap[row.moment_id] = []

    const child = childMap[row.child_id] || null
    const recipient = (recipientMap[row.moment_id] || []).find((item: any) => item.child_id === row.child_id)

    reactionMap[row.moment_id].push({
      ...row,
      child,
      parent_whatsapp: recipient?.parent_whatsapp || child?.parent_whatsapp || null,
      parent_email: recipient?.parent_email || child?.parent_email || null,
    })
  }

  return (moments || []).map((moment: any) => {
    const momentReactions = reactionMap[moment.id] || []
    const reactionCounts = {
      heart: momentReactions.filter((row: any) => row.reaction === 'heart').length,
      like: momentReactions.filter((row: any) => row.reaction === 'like').length,
      smile: momentReactions.filter((row: any) => row.reaction === 'smile').length,
    }

    return {
      ...moment,
      recipients: recipientMap[moment.id] || [],
      recipient_count: (recipientMap[moment.id] || []).length,
      reactions: momentReactions,
      reaction_count: momentReactions.length,
      reaction_counts: reactionCounts,
    }
  })
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!school) return NextResponse.json({ error: 'no school' }, { status: 404 })

  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (teacherError) return NextResponse.json({ error: teacherError.message }, { status: 500 })
  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })

  const { data: moments, error: momentsError } = await supabase
    .from('moments')
    .select('*')
    .eq('school_id', school.id)
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })
    .limit(80)

  if (momentsError) return NextResponse.json({ error: momentsError.message }, { status: 500 })

  const rows = await buildMomentRows(supabase, moments || [])

  return NextResponse.json({
    teacher,
    summary: {
      moments: rows.length,
      reactions: rows.reduce((sum: number, row: any) => sum + Number(row.reaction_count || 0), 0),
      recipients: rows.reduce((sum: number, row: any) => sum + Number(row.recipient_count || 0), 0),
      reacted_moments: rows.filter((row: any) => Number(row.reaction_count || 0) > 0).length,
    },
    moments: rows,
  })
}
