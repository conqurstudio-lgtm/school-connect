// @ts-nocheck
// school-connect-parent-private-moment-media-proxy-v1
// school-connect-parent-moment-media-redirect-v2

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const PRIVATE_BUCKET = 'school-moments'
const LEGACY_BUCKET = 'school-assets'

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
    } catch {}
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

async function resolveMomentMediaUrl(sb: any, path: string) {
  // New private Moments: authorize in this route, then redirect the browser
  // to a short-lived Supabase signed URL.
  try {
    const { data, error } = await sb.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(path, 60 * 5)

    const signedUrl = String(data?.signedUrl || data?.signedURL || '').trim()

    if (!error && signedUrl) {
      return signedUrl
    }
  } catch {}

  // Legacy public Moments stay available until migration is complete.
  try {
    const { data } = sb.storage.from(LEGACY_BUCKET).getPublicUrl(path)
    const publicUrl = String(data?.publicUrl || '').trim()
    if (publicUrl) return publicUrl
  } catch {}

  return ''
}

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('token') || '').trim()
  const momentId = String(req.nextUrl.searchParams.get('moment_id') || '').trim()

  if (!token || !momentId) {
    return NextResponse.json({ error: 'missing media access details' }, { status: 400 })
  }

  const sb = adminClient()
  const child = await resolveChildFromToken(sb, token)

  if (!child?.id) {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  }

  const { data: recipient } = await sb
    .from('moment_recipients')
    .select('moment_id,child_id')
    .eq('moment_id', momentId)
    .eq('child_id', child.id)
    .maybeSingle()

  if (!recipient) {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  }

  const { data: moment } = await sb
    .from('moments')
    .select('id,school_id,teacher_id,share_mode,file_path,mime_type')
    .eq('id', momentId)
    .maybeSingle()

  if (!moment?.file_path || moment.school_id !== child.school_id) {
    return NextResponse.json({ error: 'media not found' }, { status: 404 })
  }

  const rawShareMode = String(moment.share_mode || '').trim().toLowerCase()
  const isClassMoment = [
    'all',
    'class',
    'classroom',
    'whole_class',
    'whole-class',
    'everyone',
    'all_parents',
    'all-parents',
  ].includes(rawShareMode)

  if (isClassMoment && moment.teacher_id) {
    const { data: teacher } = await sb
      .from('teachers')
      .select('id,grade,class_name')
      .eq('id', moment.teacher_id)
      .maybeSingle()

    const childGrade = String(child.grade || '').trim()
    const childClass = String(child.class_name || '').trim()
    const teacherGrade = String(teacher?.grade || '').trim()
    const teacherClass = String(teacher?.class_name || '').trim()

    if (!teacher || childGrade !== teacherGrade || childClass !== teacherClass) {
      return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    }
  }

  const mediaUrl = await resolveMomentMediaUrl(sb, String(moment.file_path))

  if (!mediaUrl) {
    return NextResponse.json({ error: 'media not found' }, { status: 404 })
  }

  const response = NextResponse.redirect(mediaUrl, 307)
  response.headers.set('Cache-Control', 'private, max-age=240')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}
