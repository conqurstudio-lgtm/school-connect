// /api/teacher/thread-status
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null

  const sb = adminClient()
  const { data } = await sb
    .from('teachers')
    .select('*')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  return data
}

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parentId = req.nextUrl.searchParams.get('parent_id')
  const sb = adminClient()

  let updatesQuery = sb
    .from('updates')
    .select('parent_id, created_at')
    .eq('teacher_id', teacher.id)
    .eq('author_kind', 'parent')
    .order('created_at', { ascending: false })
    .limit(500)

  let threadQuery = sb
    .from('teacher_parent_threads')
    .select('parent_id, last_teacher_seen_at')
    .eq('teacher_id', teacher.id)

  if (parentId) {
    updatesQuery = updatesQuery.eq('parent_id', parentId)
    threadQuery = threadQuery.eq('parent_id', parentId)
  }

  const [{ data: updates }, { data: threads }] = await Promise.all([updatesQuery, threadQuery])

  const seenByParent = new Map<string, number>()
  for (const thread of (threads ?? [])) {
    seenByParent.set(thread.parent_id, thread.last_teacher_seen_at ? new Date(thread.last_teacher_seen_at).getTime() : 0)
  }

  const byParent: Record<string, { parent_id: string; unread_count: number; last_message_at: string | null }> = {}

  for (const update of (updates ?? [])) {
    const parentKey = update.parent_id
    const createdAt = update.created_at || null
    const created = createdAt ? new Date(createdAt).getTime() : 0
    const lastSeen = seenByParent.get(parentKey) || 0

    if (!byParent[parentKey]) {
      byParent[parentKey] = {
        parent_id: parentKey,
        unread_count: 0,
        last_message_at: createdAt,
      }
    }

    if (created > lastSeen) {
      byParent[parentKey].unread_count += 1
    }
  }

  return NextResponse.json({
    threads: Object.values(byParent),
    by_parent: byParent,
  })
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parentId = String(body.parent_id || '').trim()

  if (!parentId) return NextResponse.json({ error: 'parent_id required' }, { status: 400 })

  const sb = adminClient()
  const now = new Date().toISOString()

  const { error } = await sb
    .from('teacher_parent_threads')
    .upsert({
      school_id: teacher.school_id,
      teacher_id: teacher.id,
      parent_id: parentId,
      last_teacher_seen_at: now,
      unread_for_teacher: 0,
      updated_at: now,
    }, { onConflict: 'teacher_id,parent_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, seen_at: now })
}
