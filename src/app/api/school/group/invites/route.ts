// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured'
    )
  }

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getLoggedInUser(
  request: NextRequest
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll() {
          // Read-only auth check.
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

function cleanText(value: unknown) {
  return String(value || '').trim()
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase()
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  )
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. CONFIRM LOGGED-IN USER
    |--------------------------------------------------------------------------
    */

    const user =
      await getLoggedInUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 2. READ FORM
    |--------------------------------------------------------------------------
    */

    let body: any = {}

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body.',
        },
        {
          status: 400,
        }
      )
    }

    const schoolName =
      cleanText(
        body.school_name
      )

    const schoolPhone =
      cleanText(
        body.school_phone
      )

    const schoolEmail =
      cleanEmail(
        body.school_email
      )

    const schoolProvince =
      cleanText(
        body.school_province
      )

    const schoolAddress =
      cleanText(
        body.school_address
      )

    const principalName =
      cleanText(
        body.principal_name
      )

    const principalEmail =
      cleanEmail(
        body.principal_email
      )

    /*
    |--------------------------------------------------------------------------
    | 3. VALIDATE
    |--------------------------------------------------------------------------
    */

    if (!schoolName) {
      return NextResponse.json(
        {
          error:
            'School name is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (!principalName) {
      return NextResponse.json(
        {
          error:
            'Principal name is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !principalEmail ||
      !isEmail(principalEmail)
    ) {
      return NextResponse.json(
        {
          error:
            'A valid principal email is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      schoolEmail &&
      !isEmail(schoolEmail)
    ) {
      return NextResponse.json(
        {
          error:
            'School email must be valid or left empty.',
        },
        {
          status: 400,
        }
      )
    }

    const sb = serviceClient()

    /*
    |--------------------------------------------------------------------------
    | 4. CONFIRM USER IS ACTUALLY A GROUP OWNER
    |--------------------------------------------------------------------------
    */

    const {
      data: group,
      error: groupError,
    } = await sb
      .from('school_groups')
      .select(
        `
          id,
          name,
          primary_school_id,
          owner_user_id
        `
      )
      .eq(
        'owner_user_id',
        user.id
      )
      .maybeSingle()

    if (groupError) {
      console.error(
        '[school-group-invite] group lookup failed:',
        groupError
      )

      return NextResponse.json(
        {
          error:
            'Could not confirm school group.',
        },
        {
          status: 500,
        }
      )
    }

    if (!group) {
      return NextResponse.json(
        {
          error:
            'Only a School Group owner can add another school.',
        },
        {
          status: 403,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 5. PREVENT DUPLICATE PENDING INVITES
    |--------------------------------------------------------------------------
    */

    const {
      data: existingInvite,
      error: existingError,
    } = await sb
      .from('school_group_invites')
      .select(
        `
          id,
          email,
          school_name,
          status,
          token
        `
      )
      .eq(
        'group_id',
        group.id
      )
      .eq(
        'email',
        principalEmail
      )
      .eq(
        'status',
        'pending'
      )
      .maybeSingle()

    if (existingError) {
      console.error(
        '[school-group-invite] duplicate lookup failed:',
        existingError
      )

      return NextResponse.json(
        {
          error:
            'Could not check existing invitations.',
        },
        {
          status: 500,
        }
      )
    }

    if (existingInvite) {
      return NextResponse.json(
        {
          error:
            'This principal already has a pending invitation for this school group.',
          invite: existingInvite,
        },
        {
          status: 409,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 6. CREATE PENDING INVITE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | school_id stays NULL here.
    |
    | The real school record will only be created after the principal
    | accepts the invitation and becomes that school's normal owner/admin.
    |
    */

    const expiresAt =
      new Date(
        Date.now() +
          7 *
            24 *
            60 *
            60 *
            1000
      ).toISOString()

    const {
      data: invite,
      error: inviteError,
    } = await sb
      .from(
        'school_group_invites'
      )
      .insert({
        group_id:
          group.id,

        school_id:
          null,

        email:
          principalEmail,

        status:
          'pending',

        expires_at:
          expiresAt,

        school_name:
          schoolName,

        school_phone:
          schoolPhone ||
          null,

        school_email:
          schoolEmail ||
          null,

        school_province:
          schoolProvince ||
          null,

        school_address:
          schoolAddress ||
          null,

        principal_name:
          principalName,
      })
      .select(
        `
          id,
          group_id,
          school_id,
          email,
          token,
          status,
          expires_at,
          created_at,
          school_name,
          school_phone,
          school_email,
          school_province,
          school_address,
          principal_name
        `
      )
      .single()

    if (
      inviteError ||
      !invite
    ) {
      console.error(
        '[school-group-invite] invite creation failed:',
        inviteError
      )

      return NextResponse.json(
        {
          error:
            inviteError?.message ||
            'Could not create principal invitation.',
        },
        {
          status: 500,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 7. BUILD PRINCIPAL SETUP LINK
    |--------------------------------------------------------------------------
    */

    const origin =
      new URL(
        request.url
      ).origin

    const inviteUrl =
      `${origin}/school/group/invite/${invite.token}`

    /*
    |--------------------------------------------------------------------------
    | 8. SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        ok: true,

        message:
          'Branch invitation created.',

        group: {
          id:
            group.id,

          name:
            group.name,
        },

        invite,

        invite_url:
          inviteUrl,
      },
      {
        status: 201,
      }
    )
  } catch (error: any) {
    console.error(
      '[school-group-invite] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not create branch invitation.',
      },
      {
        status: 500,
      }
    )
  }
}