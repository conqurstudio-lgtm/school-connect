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

async function firstWorking<T>(tasks: Array<() => Promise<T | null>>) {
  for (const task of tasks) {
    try {
      const result = await task()
      if (result) return result
    } catch {
      // Try next lookup path.
    }
  }

  return null
}

async function resolveChildFromToken(sb: any, token: string) {
  // Different earlier builds used slightly different token storage.
  // Keep all lookups safe so Moments works with the same link that reports use.

  return await firstWorking([
    async () => {
      const { data } = await sb
        .from('child_parent_links')
        .select('id, child_id, is_active')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle()

      if (!data?.child_id) return null

      const { data: child } = await sb
        .from('children')
        .select('id,name,school_id,parent_whatsapp,parent_email')
        .eq('id', data.child_id)
        .maybeSingle()

      return child || null
    },

    async () => {
      const { data } = await sb
        .from('children')
        .select('id,name,school_id,parent_whatsapp,parent_email')
        .eq('parent_token', token)
        .maybeSingle()

      return data || null
    },

    async () => {
      const { data } = await sb
        .from('children')
        .select('id,name,school_id,parent_whatsapp,parent_email')
        .eq('magic_token', token)
        .maybeSingle()

      return data || null
    },

    async () => {
      const { data: report } = await sb
        .from('child_reports')
        .select('child_id')
        .eq('magic_token', token)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!report?.child_id) return null

      const { data: child } = await sb
        .from('children')
        .select('id,name,school_id,parent_whatsapp,parent_email')
        .eq('id', report.child_id)
        .maybeSingle()

      return child || null
    },

    async () => {
      const { data: report } = await sb
        .from('reports')
        .select('child_id')
        .eq('magic_token', token)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!report?.child_id) return null

      const { data: child } = await sb
        .from('children')
        .select('id,name,school_id,parent_whatsapp,parent_email')
        .eq('id', report.child_id)
        .maybeSingle()

      return child || null
    },
  ])
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = String(url.searchParams.get('token') || '').trim()
  const peek = url.searchParams.get('peek') === '1'

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const sb = adminClient()
  const child = await resolveChildFromToken(sb, token)

  if (!child?.id) {
    return NextResponse.json({
      error: 'Could not open Moments for this report link.',
      moments: [],
    }, { status: 404 })
  }

  const { data: recipients, error: recError } = await sb
    .from('moment_recipients')
    .select('id,moment_id,child_id,viewed_at,created_at')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })

  if (recError) {
    return NextResponse.json({ error: recError.message }, { status: 500 })
  }

  // class-history-v270
  // Direct/private Moments still come from moment_recipients.
  // Class/shared Moments are available to all learners in the same school,
  // including learners added after the Moment was originally shared.
  const directMomentIds = (recipients || []).map((row: any) => row.moment_id)

  const { data: classMoments, error: classMomentsError } = await sb
    .from('moments')
    .select('*')
    .eq('school_id', child.school_id)
    .eq('share_mode', 'all')
    .order('created_at', { ascending: false })

  if (classMomentsError) {
    return NextResponse.json({ error: classMomentsError.message }, { status: 500 })
  }

  const classMomentIds = (classMoments || []).map((moment: any) => moment.id)
  const momentIds = Array.from(new Set([...directMomentIds, ...classMomentIds]))

  if (!momentIds.length) {
    return NextResponse.json({ child, moments: [] })
  }

  const existingRecipientIds = new Set((recipients || []).map((row: any) => row.moment_id))
  const missingClassRecipientRows = (classMoments || [])
    .filter((moment: any) => !existingRecipientIds.has(moment.id))
    .map((moment: any) => ({
      moment_id: moment.id,
      child_id: child.id,
      parent_whatsapp: child.parent_whatsapp || null,
      parent_email: child.parent_email || null,
      viewed_at: peek ? null : new Date().toISOString(),
    }))

  if (!peek && missingClassRecipientRows.length) {
    await sb.from('moment_recipients').insert(missingClassRecipientRows)
  }

  const { data: moments, error: momentsError } = await sb
    .from('moments')
    .select('*')
    .in('id', momentIds)
    .order('created_at', { ascending: false })

  if (momentsError) {
    return NextResponse.json({ error: momentsError.message }, { status: 500 })
  }

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

  // reaction-counts-v273
  // Parent UI needs total reaction counts so the number appears after tapping
  // and remains visible after page reload.
  const { data: allReactions } = await sb
    .from('moment_reactions')
    .select('moment_id,child_id,reaction,created_at')
    .in('moment_id', momentIds)

  const reactionMap = Object.fromEntries((reactions || []).map((row: any) => [row.moment_id, row.reaction]))
  const recipientMap = Object.fromEntries((recipients || []).map((row: any) => [row.moment_id, row]))

  // reaction-switch-fix-v274
  // Count only one reaction per child per Moment. This protects the UI from
  // older duplicate rows that may exist before the delete-then-insert fix.
  const latestReactionByChildMoment: any = {}

  for (const row of allReactions || []) {
    const key = `${row.moment_id}:${row.child_id || 'unknown'}`
    const existing = latestReactionByChildMoment[key]

    if (!existing) {
      latestReactionByChildMoment[key] = row
      continue
    }

    const existingTime = new Date(existing.created_at || 0).getTime()
    const rowTime = new Date(row.created_at || 0).getTime()

    if (rowTime >= existingTime) {
      latestReactionByChildMoment[key] = row
    }
  }

  const reactionCountMap: any = {}

  for (const row of Object.values(latestReactionByChildMoment) as any[]) {
    if (!reactionCountMap[row.moment_id]) {
      reactionCountMap[row.moment_id] = { heart: 0, like: 0, smile: 0 }
    }

    if (row.reaction && reactionCountMap[row.moment_id][row.reaction] !== undefined) {
      reactionCountMap[row.moment_id][row.reaction] += 1
    }
  }

  const rows = (moments || []).map((moment: any) => {
    const reactionCounts = reactionCountMap[moment.id] || { heart: 0, like: 0, smile: 0 }
    const reactionTotal = Number(reactionCounts.heart || 0) +
      Number(reactionCounts.like || 0) +
      Number(reactionCounts.smile || 0)

    return {
      ...moment,
      teacher: moment.teacher_id ? teacherMap[moment.teacher_id] || null : null,
      recipient: recipientMap[moment.id] || null,
      reaction: reactionMap[moment.id] || null,
      reaction_counts: reactionCounts,
      reaction_count: reactionTotal,
    }
  })

  // Important: do this after building rows so the first page load can still show the new-dot state correctly.
  if (!peek && (recipients || []).some((row: any) => !row.viewed_at)) {
    await sb
      .from('moment_recipients')
      .update({ viewed_at: new Date().toISOString() })
      .eq('child_id', child.id)
      .is('viewed_at', null)
  }

  return NextResponse.json({
    child,
    moments: rows,
  })
}
