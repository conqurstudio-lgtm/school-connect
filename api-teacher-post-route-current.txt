// /api/teacher/post
// Teacher posts to their class. Uses service role since teachers do not have Supabase auth.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const { data, error } = await sb
    .from('teachers')
    .select('*')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  if (error) return null
  return data
}

function cleanString(value: unknown) {
  if (typeof value !== 'string') return null
  const clean = value.trim()
  return clean.length ? clean : null
}

function normaliseImages(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function detectPostType({
  explicitType,
  imageUrls,
  eventDate,
  eventTime,
  eventLocation,
}: {
  explicitType?: unknown
  imageUrls: string[]
  eventDate: string | null
  eventTime: string | null
  eventLocation: string | null
}) {
  const allowed = new Set(['update', 'moment', 'event'])

  if (typeof explicitType === 'string' && allowed.has(explicitType)) {
    return explicitType
  }

  if (eventDate || eventTime || eventLocation) return 'event'
  if (imageUrls.length > 0) return 'moment'
  return 'update'
}

// POST — create a class post
export async function POST(req: NextRequest) {
  try {
    const teacher = await getTeacher(req)
    if (!teacher) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    let payload: any = {}
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid request body' }, { status: 400 })
    }

    const postBody = cleanString(payload.body)
    const imageUrls = normaliseImages(payload.image_urls)
    const eventDate = cleanString(payload.event_date)
    const eventTime = cleanString(payload.event_time)
    const eventLocation = cleanString(payload.event_location)

    // Need at least body OR images OR event details
    if (!postBody && imageUrls.length === 0 && !eventDate && !eventTime && !eventLocation) {
      return NextResponse.json({ error: 'empty post' }, { status: 400 })
    }

    const detectedType = detectPostType({
      explicitType: payload.type,
      imageUrls,
      eventDate,
      eventTime,
      eventLocation,
    })

    const sb = adminClient()

    const { data: post, error } = await sb
      .from('posts')
      .insert({
        school_id: teacher.school_id,
        author_id: null,
        type: detectedType,
        status: 'published',
        body: postBody,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        event_date: eventDate,
        event_time: eventTime,
        event_location: eventLocation,
        posted_by_kind: 'teacher',
        teacher_id: teacher.id,
        audience_grade: teacher.grade,
        audience_class: teacher.class_name,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'server error' },
      { status: 500 }
    )
  }
}

// DELETE — teacher removes their own post
export async function DELETE(req: NextRequest) {
  try {
    const teacher = await getTeacher(req)
    if (!teacher) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const sb = adminClient()

    // Only allow if teacher owns the post
    const { data: post, error: findError } = await sb
      .from('posts')
      .select('teacher_id')
      .eq('id', id)
      .single()

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (!post || post.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    }

    const { error } = await sb
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'server error' },
      { status: 500 }
    )
  }
}
