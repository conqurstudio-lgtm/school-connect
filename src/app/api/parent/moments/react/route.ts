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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const childId = String(body.child_id || '').trim()
  const momentId = String(body.moment_id || '').trim()
  const reaction = String(body.reaction || '').trim()

  if (!childId || !momentId) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  if (!allowed.includes(reaction)) return NextResponse.json({ error: 'invalid reaction' }, { status: 400 })

  const sb = adminClient()

  const { data: recipient } = await sb
    .from('moment_recipients')
    .select('id')
    .eq('moment_id', momentId)
    .eq('child_id', childId)
    .maybeSingle()

  if (!recipient) return NextResponse.json({ error: 'not allowed' }, { status: 403 })

  const { data, error } = await sb
    .from('moment_reactions')
    .upsert({
      moment_id: momentId,
      child_id: childId,
      reaction,
      created_at: new Date().toISOString(),
    }, { onConflict: 'moment_id,child_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reaction: data })
}
