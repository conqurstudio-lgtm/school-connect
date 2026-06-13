// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const MAX_FILE_BYTES = 8 * 1024 * 1024

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

function extFromMime(mime: string, fileName = '') {
  const lowerName = fileName.toLowerCase()
  if (lowerName.includes('.') && lowerName.split('.').pop()) return lowerName.split('.').pop()
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('pdf')) return 'pdf'
  if (mime.includes('word')) return 'docx'
  return 'bin'
}

function fileTypeFromMime(mime: string) {
  return mime.startsWith('image/') ? 'image' : 'document'
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const dataUrl = String(body.data_url || '')
  const fileName = String(body.file_name || 'moment-file')
  const mimeType = String(body.mime_type || body.content_type || 'application/octet-stream')
  const note = String(body.note || '').trim()
  const shareMode = body.share_mode === 'all' ? 'all' : 'child'
  const confirmAll = Boolean(body.confirm_all)
  const childIds = Array.from(new Set(Array.isArray(body.child_ids) ? body.child_ids.map(String) : []))

  if (!dataUrl.startsWith('data:') || !dataUrl.includes(',')) {
    return NextResponse.json({ error: 'Invalid file data' }, { status: 400 })
  }

  if (!childIds.length) {
    return NextResponse.json({ error: 'Choose at least one learner' }, { status: 400 })
  }

  if (shareMode === 'all' && !confirmAll) {
    return NextResponse.json({ error: 'Share-to-all confirmation required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: children, error: childrenError } = await sb
    .from('children')
    .select('id,name,parent_whatsapp,parent_email,school_id,created_by_teacher_id,status')
    .eq('school_id', teacher.school_id)
    .in('id', childIds)

  if (childrenError) return NextResponse.json({ error: childrenError.message }, { status: 500 })

  if ((children || []).length !== childIds.length) {
    return NextResponse.json({ error: 'One or more selected learners are not in your roster' }, { status: 403 })
  }

  const invalidChild = (children || []).find((child: any) => {
    const sameSchool = child.school_id === teacher.school_id
    const sameTeacher = !child.created_by_teacher_id || child.created_by_teacher_id === teacher.id
    const activeChild = !child.status || String(child.status).toLowerCase() === 'active'

    return !sameSchool || !sameTeacher || !activeChild
  })

  if (invalidChild) {
    return NextResponse.json({ error: 'One or more selected learners are not in your roster' }, { status: 403 })
  }

  const base64 = dataUrl.split(',')[1]
  const buffer = Buffer.from(base64, 'base64')

  if (!buffer.length) return NextResponse.json({ error: 'Invalid file content' }, { status: 400 })
  if (buffer.length > MAX_FILE_BYTES) return NextResponse.json({ error: 'Moment file must be under 8 MB' }, { status: 400 })

  const ext = extFromMime(mimeType, fileName)
  const storagePath = `moments/${teacher.school_id}/${teacher.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await sb.storage
    .from('school-assets')
    .upload(storagePath, buffer, { upsert: true, contentType: mimeType })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicData } = sb.storage.from('school-assets').getPublicUrl(storagePath)
  const fileUrl = publicData.publicUrl

  const { data: moment, error: momentError } = await sb
    .from('moments')
    .insert({
      school_id: teacher.school_id,
      teacher_id: teacher.id,
      share_mode: shareMode,
      note: note || null,
      file_url: fileUrl,
      file_path: storagePath,
      file_name: fileName,
      file_type: fileTypeFromMime(mimeType),
      mime_type: mimeType,
    })
    .select('*')
    .single()

  if (momentError) return NextResponse.json({ error: momentError.message }, { status: 500 })

  const recipientRows = (children || []).map((child: any) => ({
    moment_id: moment.id,
    child_id: child.id,
    parent_whatsapp: child.parent_whatsapp || null,
    parent_email: child.parent_email || null,
  }))

  const { error: recError } = await sb.from('moment_recipients').insert(recipientRows)
  if (recError) return NextResponse.json({ error: recError.message }, { status: 500 })

  return NextResponse.json({ moment, recipients: recipientRows.length })
}


export async function PATCH(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const momentId = String(body.moment_id || body.id || '').trim()
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  if (!momentId) {
    return NextResponse.json({ error: 'Missing moment id' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: existing, error: existingError } = await sb
    .from('moments')
    .select('id,teacher_id,school_id')
    .eq('id', momentId)
    .eq('teacher_id', teacher.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'Moment not found or not allowed' }, { status: 404 })
  }

  const { data: moment, error: updateError } = await sb
    .from('moments')
    .update({ note: note || null })
    .eq('id', momentId)
    .eq('teacher_id', teacher.id)
    .select('*')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ moment })
}


export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const momentId = String(body.moment_id || body.id || '').trim()

  if (!momentId) {
    return NextResponse.json({ error: 'Missing moment id' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: moment, error: momentError } = await sb
    .from('moments')
    .select('*')
    .eq('id', momentId)
    .eq('teacher_id', teacher.id)
    .maybeSingle()

  if (momentError) {
    return NextResponse.json({ error: momentError.message }, { status: 500 })
  }

  if (!moment) {
    return NextResponse.json({ error: 'Moment not found or not allowed' }, { status: 404 })
  }

  await sb.from('moment_reactions').delete().eq('moment_id', momentId)
  await sb.from('moment_recipients').delete().eq('moment_id', momentId)

  const { error: deleteError } = await sb
    .from('moments')
    .delete()
    .eq('id', momentId)
    .eq('teacher_id', teacher.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (moment.file_path) {
    await sb.storage.from('school-assets').remove([moment.file_path])
  }

  return NextResponse.json({ ok: true, deleted: momentId })
}
