// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const allowed = ['heart', 'like', 'smile']

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
  if (!token) return null

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


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const token = String(body.token || '').trim()
    const momentId = String(body.moment_id || '').trim()
    const requestedChildId = String(body.child_id || '').trim()
    const reaction = String(body.reaction || '').trim()

    if (!token) return NextResponse.json({ error: 'missing token' }, { status: 400 })
    if (!momentId) return NextResponse.json({ error: 'missing moment' }, { status: 400 })
    if (!allowed.includes(reaction)) return NextResponse.json({ error: 'invalid reaction' }, { status: 400 })

    const sb = adminClient()

    const resolvedChild = await resolveChildFromToken(sb, token)
    const candidateChildIds = Array.from(new Set([
      requestedChildId,
      resolvedChild?.id || '',
    ].filter(Boolean)))

    if (!candidateChildIds.length) {
      return NextResponse.json({ error: 'missing child' }, { status: 400 })
    }

    let recipient: any = null
    let childId = ''

    for (const id of candidateChildIds) {
      const { data, error } = await sb
        .from('moment_recipients')
        .select('id, child_id, moment_id')
        .eq('moment_id', momentId)
        .eq('child_id', id)
        .maybeSingle()

      if (!error && data?.child_id) {
        recipient = data
        childId = String(data.child_id)
        break
      }
    }

    if (!recipient || !childId) {
      return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    }

    await sb
      .from('moment_reactions')
      .delete()
      .eq('moment_id', momentId)
      .eq('child_id', childId)

    const { data: savedReaction, error: saveError } = await sb
      .from('moment_reactions')
      .insert({
        moment_id: momentId,
        child_id: childId,
        reaction,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message || 'could not save reaction' }, { status: 500 })
    }

    const { data: latestReactions, error: countsError } = await sb
      .from('moment_reactions')
      .select('reaction')
      .eq('moment_id', momentId)

    const reactionCounts: Record<string, number> = { heart: 0, like: 0, smile: 0 }

    if (!countsError) {
      for (const row of latestReactions || []) {
        const key = String(row?.reaction || '')
        if (Object.prototype.hasOwnProperty.call(reactionCounts, key)) {
          reactionCounts[key] += 1
        }
      }
    }

    return NextResponse.json({
      ok: true,
      reaction: savedReaction,
      child_id: childId,
      reaction_counts: reactionCounts,
      reaction_count: reactionCounts.heart + reactionCounts.like + reactionCounts.smile,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not react' },
      { status: 500 }
    )
  }
}

