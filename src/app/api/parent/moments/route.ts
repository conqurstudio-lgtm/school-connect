// @ts-nocheck
// school-connect-private-moments-storage-v1
// school-connect-private-moments-signed-url-fix-v2
// parent-moments-scope-fix-v421
// school-connect-parent-private-moment-media-proxy-v1
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

const MOMENTS_BUCKET = 'school-moments'
const MOMENT_URL_TTL_SECONDS = 60 * 60 * 6

async function signMomentRows(sb: any, moments: any[]) {
  const rows = Array.isArray(moments) ? moments : []

  return await Promise.all(rows.map(async (moment: any) => {
    const path = String(moment?.file_path || '').trim()

    if (!path) return moment

    // New V1 private Moments: sign the object path every time it is returned.
    // Use createSignedUrl per object so we never depend on batch response indexing.
    try {
      const { data, error } = await sb.storage
        .from(MOMENTS_BUCKET)
        .createSignedUrl(path, MOMENT_URL_TTL_SECONDS)

      const signedUrl = String(data?.signedUrl || data?.signedURL || '').trim()

      if (!error && signedUrl) {
        return {
          ...moment,
          file_url: signedUrl,
        }
      }
    } catch {}

    // Legacy Moments may still live in public school-assets.
    // Only use an existing full URL as a fallback; never send a bare private path
    // to the browser because <img src="moments/..."> will fail.
    const legacyUrl = String(moment?.file_url || '').trim()
    const isFullUrl = /^https?:\/\//i.test(legacyUrl)

    return {
      ...moment,
      file_url: isFullUrl ? legacyUrl : null,
    }
  }))
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

  // V1 privacy lock:
  // Moments may only be accessed through the child's current active
  // permanent parent link. Legacy report/magic tokens must not unlock photos.
  const { data: link, error: linkError } = await sb
    .from('child_parent_links')
    .select('id,child_id,school_id,teacher_id,is_active')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (linkError || !link?.child_id) return null

  const { data: child, error: childError } = await sb
    .from('children')
    .select('id,name,school_id,grade,class_name,parent_whatsapp,parent_email')
    .eq('id', link.child_id)
    .maybeSingle()

  if (childError || !child) return null

  // Prevent a stale/mismatched link from crossing schools.
  if (link.school_id && child.school_id !== link.school_id) return null

  return child
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = String(url.searchParams.get('token') || '').trim()
  const peek = url.searchParams.get('peek') === '1'
  const cursor = String(url.searchParams.get('cursor') || '').trim()
  const PAGE_SIZE = 10

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

  let recipientQuery = sb
    .from('moment_recipients')
    .select('id,moment_id,child_id,viewed_at,created_at')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) {
    recipientQuery = recipientQuery.lt('created_at', cursor)
  }

  const { data: recipientPage, error: recError } = await recipientQuery

  if (recError) {
    return NextResponse.json({ error: recError.message }, { status: 500 })
  }

  const hasMore = (recipientPage || []).length > PAGE_SIZE
  const recipients = (recipientPage || []).slice(0, PAGE_SIZE)

  const nextCursor =
    hasMore && recipients.length
      ? String(recipients[recipients.length - 1]?.created_at || '')
      : null

  // parent-moments-privacy-lock-v430
  // Parents should only see Moments where their child is an explicit recipient.
  // Teacher class/all sharing already creates moment_recipients rows for the selected learners.
  // Do not auto-add every school-wide share_mode='all' Moment here, because that can expose
  // another teacher/class Moment to the wrong parent.
  const directMomentIds = (recipients || []).map((row: any) => row.moment_id).filter(Boolean)
  const classMomentIds: any[] = []
  const momentIds = Array.from(new Set(directMomentIds))

  if (!momentIds.length) {
    return NextResponse.json({
      child,
      moments: [],
      next_cursor: null,
      has_more: false,
    })
  }

  const { data: moments, error: momentsError } = await sb
    .from('moments')
    .select('*')
    .in('id', momentIds)
    .order('created_at', { ascending: false })

  if (momentsError) {
    return NextResponse.json({ error: momentsError.message }, { status: 500 })
  }

  // Parent images are served securely through /api/parent/moments/media.
  // Do not generate signed URLs for every Moment during feed loading.
  const safeMoments = moments || []

  const teacherIds = Array.from(new Set((safeMoments || []).map((moment: any) => moment.teacher_id).filter(Boolean)))

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

  const { data: allRecipientsForMomentScope } = await sb
    .from('moment_recipients')
    .select('moment_id,child_id')
    .in('moment_id', momentIds)

  const classMomentIdSet = new Set(classMomentIds)
  const recipientCountMap: any = {}

  for (const row of allRecipientsForMomentScope || []) {
    if (!row?.moment_id) continue
    recipientCountMap[row.moment_id] = Number(recipientCountMap[row.moment_id] || 0) + 1
  }

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

  const rows = (safeMoments || []).map((moment: any) => {
    const reactionCounts = reactionCountMap[moment.id] || { heart: 0, like: 0, smile: 0 }
    const reactionTotal = Number(reactionCounts.heart || 0) +
      Number(reactionCounts.like || 0) +
      Number(reactionCounts.smile || 0)

    const rawShareMode = String(moment.share_mode || '').trim().toLowerCase()
    const recipientCount = Number(recipientCountMap[moment.id] || 0)
    const teacher = moment.teacher_id ? teacherMap[moment.teacher_id] || null : null

    const momentScope = (
      classMomentIdSet.has(moment.id) ||
      ['all', 'class', 'classroom', 'whole_class', 'whole-class', 'everyone', 'all_parents', 'all-parents'].includes(rawShareMode) ||
      (!rawShareMode && recipientCount > 1)
    ) ? 'class' : 'child'

    // parent-class-moment-teacher-scope-v431
    // Protect parents from seeing another teacher/class Moment through old or incorrect
    // moment_recipients rows. Class Moments must belong to the child's grade/class teacher.
    const childGrade = String(child.grade || '').trim()
    const childClass = String(child.class_name || '').trim()
    const teacherGrade = String(teacher?.grade || '').trim()
    const teacherClass = String(teacher?.class_name || '').trim()

    const classMomentMatchesChildClass = momentScope !== 'class' || (
      Boolean(teacher) &&
      childGrade === teacherGrade &&
      childClass === teacherClass
    )

    if (!classMomentMatchesChildClass) return null

    return {
      ...moment,
      moment_scope: momentScope,
      recipient_count: recipientCount,
      teacher,
      recipient: recipientMap[moment.id] || null,
      reaction: reactionMap[moment.id] || null,
      reaction_counts: reactionCounts,
      reaction_count: reactionTotal,
    }
  }).filter(Boolean)

  // Important: do this after building rows so the first page load can still show the new-dot state correctly.
  if (!peek) {
    const unseenRecipientIds = (recipients || [])
      .filter((row: any) => !row.viewed_at)
      .map((row: any) => row.id)
      .filter(Boolean)

    if (unseenRecipientIds.length) {
      await sb
        .from('moment_recipients')
        .update({ viewed_at: new Date().toISOString() })
        .in('id', unseenRecipientIds)
    }
  }

  const securedRows = (rows || []).map((moment: any) => {
    const filePath = String(moment?.file_path || '').trim()

    if (!filePath) return moment

    return {
      ...moment,
      file_url: `/api/parent/moments/media?token=${encodeURIComponent(token)}&moment_id=${encodeURIComponent(moment.id)}`,
    }
  })

  return NextResponse.json({
    child,
    moments: securedRows,
    next_cursor: nextCursor,
    has_more: hasMore,
  })
}
