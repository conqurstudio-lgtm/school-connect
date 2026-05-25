import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 46)

  return `${base || 'school'}-${randomUUID().slice(0, 6)}`
}

function cleanText(value: unknown) {
  return String(value || '').trim()
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function upsertProfile(sb: any, userId: string, payload: any) {
  const fullPayload = {
    id: userId,
    email: payload.ownerEmail,
    full_name: payload.ownerName,
    role: 'school',
    school_id: payload.schoolId,
    onboarding_done: true,
  }

  const { error } = await sb
    .from('profiles')
    .upsert(fullPayload, { onConflict: 'id' })

  if (!error) return

  const missingEmail = String(error.message || '').includes('email')
  const missingOnboarding = String(error.message || '').includes('onboarding_done')

  if (!missingEmail && !missingOnboarding) throw error

  const fallbackPayload: any = {
    id: userId,
    full_name: payload.ownerName,
    role: 'school',
    school_id: payload.schoolId,
  }

  const retry = await sb
    .from('profiles')
    .upsert(fallbackPayload, { onConflict: 'id' })

  if (retry.error) throw retry.error
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/auth/school-signup',
    supabase_url_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    service_role_configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  })
}

export async function POST(req: NextRequest) {
  let body: any = {}

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const ownerName = cleanText(body.owner_name)
  const ownerEmail = cleanText(body.owner_email).toLowerCase()
  const password = String(body.password || '')
  const schoolName = cleanText(body.school_name)
  const schoolPhone = cleanText(body.school_phone)
  const schoolEmail = cleanText(body.school_email).toLowerCase()

  if (!ownerName) return NextResponse.json({ error: 'Owner name is required' }, { status: 400 })
  if (!ownerEmail || !isEmail(ownerEmail)) return NextResponse.json({ error: 'A valid owner email is required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (!schoolName) return NextResponse.json({ error: 'School name is required' }, { status: 400 })
  if (schoolEmail && !isEmail(schoolEmail)) return NextResponse.json({ error: 'School email must be valid or left empty' }, { status: 400 })

  let sb: ReturnType<typeof createClient>

  try {
    sb = adminClient()
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server is not configured' }, { status: 500 })
  }

  const { data: createdUser, error: userError } = await sb.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'school',
      full_name: ownerName,
      school_name: schoolName,
    },
  })

  if (userError || !createdUser?.user?.id) {
    const message = userError?.message || 'Could not create owner account'
    const duplicate = message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')

    return NextResponse.json(
      { error: duplicate ? 'This email is already registered. Click “Use fresh demo details” or sign in.' : message },
      { status: 400 }
    )
  }

  const userId = createdUser.user.id

  const schoolPayload = {
    name: schoolName,
    slug: slugify(schoolName),
    tagline: 'Simple weekly child updates for parents.',
    phone: schoolPhone || null,
    email: schoolEmail || ownerEmail,
    country: 'South Africa',
    owner_id: userId,
    is_verified: false,
    is_active: true,
    settings: {},
  }

  const { data: school, error: schoolError } = await sb
    .from('schools')
    .insert(schoolPayload)
    .select('*')
    .single()

  if (schoolError || !school?.id) {
    await sb.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Could not create school profile: ${schoolError?.message || 'unknown error'}` },
      { status: 500 }
    )
  }

  try {
    await upsertProfile(sb, userId, {
      ownerEmail,
      ownerName,
      schoolId: school.id,
    })
  } catch (profileError: any) {
    await sb.from('schools').delete().eq('id', school.id)
    await sb.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Could not create owner profile: ${profileError?.message || 'unknown error'}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    school_id: school.id,
    school_slug: school.slug,
  })
}
