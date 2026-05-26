// /api/teacher/profile-photo
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
  const { data } = await sb.from('teachers').select('*').eq('access_token', token).maybeSingle()
  if (!data) return null

  const blocked = ['rejected', 'revoked', 'inactive', 'disabled']
  if (blocked.includes(String(data.status || '').toLowerCase())) return null

  return data
}

function extensionFromMime(mime: string) {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  return 'jpg'
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const dataUrl = String(body.data_url || '')
  const contentType = String(body.content_type || 'image/jpeg')

  if (!dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
  }

  const base64 = dataUrl.split(',')[1]
  if (!base64) return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 4 MB' }, { status: 400 })
  }

  const sb = adminClient()
  const ext = extensionFromMime(contentType)
  const path = `teachers/${teacher.school_id}/${teacher.id}/profile.${ext}`

  const { error: uploadError } = await sb.storage
    .from('school-assets')
    .upload(path, buffer, { upsert: true, contentType })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicData } = sb.storage.from('school-assets').getPublicUrl(path)
  const photoUrl = `${publicData.publicUrl}?t=${Date.now()}`

  const { data: updatedTeacher, error: updateError } = await sb
    .from('teachers')
    .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
    .eq('id', teacher.id)
    .select('*')
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ photo_url: photoUrl, teacher: updatedTeacher })
}
