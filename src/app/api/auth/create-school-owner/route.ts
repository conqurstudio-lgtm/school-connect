import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function json(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

function makeSlug(value: string) {
  const base = String(value || 'school')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42)

  const suffix = randomBytes(3).toString('hex')
  return `${base || 'school'}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const schoolName = String(body.school_name || '').trim()
    const schoolPhone = String(body.school_phone || '').trim() || null
    const schoolEmail = String(body.school_email || '').trim() || null
    const ownerName = String(body.owner_name || '').trim()
    const ownerEmail = String(body.owner_email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!schoolName) return json({ error: 'School name is required.' }, 400)
    if (!ownerName) return json({ error: 'Owner full name is required.' }, 400)
    if (!ownerEmail || !ownerEmail.includes('@')) return json({ error: 'A valid owner email is required.' }, 400)
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return json({
        error: 'Signup server is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart npm run dev.',
      }, 500)
    }

    const sb = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: created, error: createError } = await sb.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'school',
        full_name: ownerName,
        school_name: schoolName,
      },
    })

    if (createError || !created.user?.id) {
      const message = createError?.message || 'Could not create owner account.'
      const isDuplicate = /already|registered|exists/i.test(message)
      return json({ error: isDuplicate ? 'This owner email already exists. Please sign in instead.' : message }, isDuplicate ? 409 : 400)
    }

    const ownerId = created.user.id
    const slug = makeSlug(schoolName)

    const { data: school, error: schoolError } = await sb
      .from('schools')
      .insert({
        name: schoolName,
        slug,
        phone: schoolPhone,
        email: schoolEmail,
        owner_id: ownerId,
        is_active: true,
        is_verified: false,
        settings: { mvp: 'weekly_reports' },
      })
      .select('*')
      .single()

    if (schoolError || !school?.id) {
      return json({ error: schoolError?.message || 'Owner was created, but the school profile could not be created.' }, 500)
    }

    const { error: profileError } = await sb
      .from('profiles')
      .upsert({
        id: ownerId,
        role: 'school',
        full_name: ownerName,
        school_id: school.id,
        onboarding_done: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      return json({ error: profileError.message || 'School was created, but the owner profile could not be linked.' }, 500)
    }

    return json({
      ok: true,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
      },
      owner: {
        id: ownerId,
        email: ownerEmail,
      },
    })
  } catch (error: any) {
    return json({ error: error?.message || 'Unexpected signup error.' }, 500)
  }
}
