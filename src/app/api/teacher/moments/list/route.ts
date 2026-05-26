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

  const { data } = await sb
    .from('teachers')
    .select('*')
    .eq('access_token', token)
    .maybeSingle()

  if (!data) return null

  const blocked = ['rejected', 'revoked', 'inactive', 'disabled']
  if (blocked.includes(String(data.status || '').toLowerCase())) return null

  return data
}

async function buildMomentRows(sb: any, moments: any[]) {
  const momentIds = (moments || []).map((moment: any) => moment.id)

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
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const summaryOnly = url.searchParams.get('summary') === '1'
  const sb = adminClient()

  const { data: moments, error: momentsError } = await sb
    .from('moments')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })
    .limit(summaryOnly ? 200 : 80)

  if (momentsError) {
    return NextResponse.json({ error: momentsError.message }, { status: 500 })
  }

  const rows = await buildMomentRows(sb, moments || [])

  return NextResponse.json({
    summary: {
      moments: rows.length,
      reactions: rows.reduce((sum: number, row: any) => sum + Number(row.reaction_count || 0), 0),
    },
    moments: summaryOnly ? [] : rows,
  })
}
