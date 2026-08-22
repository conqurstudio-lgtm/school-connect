// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function serviceClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

function cleanText(value: unknown) {
  return String(
    value || ''
  ).trim()
}

function makeSlug(value: string) {
  const base = String(
    value || 'school'
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    )
    .slice(
      0,
      42
    )

  return `${
    base || 'school'
  }-${randomBytes(3).toString(
    'hex'
  )}`
}

async function safeUpsertProfile(
  sb: any,
  values: {
    id: string
    full_name: string
    email: string
    school_id: string
  }
) {
  const attempts = [
    {
      id:
        values.id,

      role:
        'school',

      full_name:
        values.full_name,

      email:
        values.email,

      school_id:
        values.school_id,

      managed_school_id:
        values.school_id,

      onboarding_done:
        true,

      onboarding_complete:
        true,

      updated_at:
        new Date().toISOString(),
    },

    {
      id:
        values.id,

      role:
        'school',

      full_name:
        values.full_name,

      email:
        values.email,

      school_id:
        values.school_id,

      managed_school_id:
        values.school_id,

      updated_at:
        new Date().toISOString(),
    },

    {
      id:
        values.id,

      role:
        'school',

      full_name:
        values.full_name,

      email:
        values.email,

      school_id:
        values.school_id,

      updated_at:
        new Date().toISOString(),
    },

    {
      id:
        values.id,

      role:
        'school',

      full_name:
        values.full_name,

      school_id:
        values.school_id,
    },
  ]

  let lastError: any =
    null

  for (
    const payload of attempts
  ) {
    const {
      error,
    } = await sb
      .from(
        'profiles'
      )
      .upsert(
        payload,
        {
          onConflict:
            'id',
        }
      )

    if (!error) {
      return null
    }

    lastError =
      error
  }

  return lastError
}

async function cleanupFailedSetup(
  sb: any,
  values: {
    userId?: string | null
    schoolId?: string | null
    membershipId?: string | null
  }
) {
  if (
    values.membershipId
  ) {
    try {
      await sb
        .from(
          'school_group_members'
        )
        .delete()
        .eq(
          'id',
          values.membershipId
        )
    } catch {}
  }

  if (
    values.schoolId
  ) {
    try {
      await sb
        .from(
          'profiles'
        )
        .delete()
        .eq(
          'school_id',
          values.schoolId
        )
    } catch {}

    try {
      await sb
        .from(
          'schools'
        )
        .delete()
        .eq(
          'id',
          values.schoolId
        )
    } catch {}
  }

  if (
    values.userId
  ) {
    try {
      await sb
        .auth
        .admin
        .deleteUser(
          values.userId
        )
    } catch {}
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: {
      token: string
    }
  }
) {
  const sb =
    serviceClient()

  let createdUserId:
    | string
    | null = null

  let createdSchoolId:
    | string
    | null = null

  let createdMembershipId:
    | string
    | null = null

  try {
    /*
    |--------------------------------------------------------------------------
    | 1. READ TOKEN
    |--------------------------------------------------------------------------
    */

    const token =
      cleanText(
        context
          ?.params
          ?.token
      )

    if (!token) {
      return NextResponse.json(
        {
          error:
            'Invitation token is missing.',
        },
        {
          status: 400,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 2. READ ACCOUNT DETAILS
    |--------------------------------------------------------------------------
    */

    let body: any =
      {}

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request.',
        },
        {
          status: 400,
        }
      )
    }

    const fullName =
      cleanText(
        body.full_name
      )

    const password =
      String(
        body.password ||
          ''
      )

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            'Your full name is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      password.length <
      8
    ) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters.',
        },
        {
          status: 400,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOAD INVITATION
    |--------------------------------------------------------------------------
    */

    const {
      data: invite,
      error:
        inviteError,
    } = await sb
      .from(
        'school_group_invites'
      )
      .select(
        `
          id,
          group_id,
          school_id,
          email,
          token,
          status,
          expires_at,
          accepted_at,
          school_name,
          school_phone,
          school_email,
          school_province,
          school_address,
          principal_name
        `
      )
      .eq(
        'token',
        token
      )
      .maybeSingle()

    if (
      inviteError
    ) {
      console.error(
        '[branch-accept] invitation lookup failed:',
        inviteError
      )

      return NextResponse.json(
        {
          error:
            'Could not load this invitation.',
        },
        {
          status: 500,
        }
      )
    }

    if (!invite) {
      return NextResponse.json(
        {
          error:
            'This invitation could not be found.',
        },
        {
          status: 404,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 4. VALIDATE INVITATION STATUS
    |--------------------------------------------------------------------------
    */

    if (
      invite.status ===
      'accepted'
    ) {
      return NextResponse.json(
        {
          error:
            'This invitation has already been accepted.',
        },
        {
          status: 409,
        }
      )
    }

    if (
      invite.status ===
      'revoked'
    ) {
      return NextResponse.json(
        {
          error:
            'This invitation has been cancelled.',
        },
        {
          status: 410,
        }
      )
    }

    if (
      invite.status ===
      'expired'
    ) {
      return NextResponse.json(
        {
          error:
            'This invitation has expired.',
        },
        {
          status: 410,
        }
      )
    }

    const isExpired =
      invite.expires_at &&
      new Date(
        invite.expires_at
      ).getTime() <
        Date.now()

    if (isExpired) {
      await sb
        .from(
          'school_group_invites'
        )
        .update({
          status:
            'expired',
        })
        .eq(
          'id',
          invite.id
        )
        .eq(
          'status',
          'pending'
        )

      return NextResponse.json(
        {
          error:
            'This invitation has expired.',
        },
        {
          status: 410,
        }
      )
    }

    if (
      invite.status !==
      'pending'
    ) {
      return NextResponse.json(
        {
          error:
            'This invitation is no longer available.',
        },
        {
          status: 409,
        }
      )
    }

    if (
      invite.school_id
    ) {
      return NextResponse.json(
        {
          error:
            'This invitation is already linked to a school.',
        },
        {
          status: 409,
        }
      )
    }

    if (
      !invite.email
    ) {
      return NextResponse.json(
        {
          error:
            'The principal email is missing from this invitation.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !invite.school_name
    ) {
      return NextResponse.json(
        {
          error:
            'The school name is missing from this invitation.',
        },
        {
          status: 400,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 5. CONFIRM GROUP STILL EXISTS
    |--------------------------------------------------------------------------
    */

    const {
      data: group,
      error:
        groupError,
    } = await sb
      .from(
        'school_groups'
      )
      .select(
        `
          id,
          name,
          primary_school_id,
          owner_user_id
        `
      )
      .eq(
        'id',
        invite.group_id
      )
      .maybeSingle()

    if (
      groupError
    ) {
      console.error(
        '[branch-accept] group lookup failed:',
        groupError
      )

      return NextResponse.json(
        {
          error:
            'Could not load the school group.',
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
            'This school group no longer exists.',
        },
        {
          status: 404,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 6. CREATE NORMAL PRINCIPAL AUTH ACCOUNT
    |--------------------------------------------------------------------------
    |
    | We always use the email stored on the invitation.
    | The browser cannot replace the invited principal email.
    |
    */

    const {
      data:
        createdAuth,
      error:
        authError,
    } = await sb
      .auth
      .admin
      .createUser({
        email:
          String(
            invite.email
          )
            .trim()
            .toLowerCase(),

        password,

        email_confirm:
          true,

        user_metadata:
          {
            role:
              'school',

            full_name:
              fullName,

            school_name:
              invite.school_name,

            source:
              'school_group_invite',
          },
      })

    if (
      authError ||
      !createdAuth
        ?.user
        ?.id
    ) {
      const message =
        authError
          ?.message ||
        'Could not create the principal account.'

      const duplicate =
        /already|registered|exists/i.test(
          message
        )

      return NextResponse.json(
        {
          error:
            duplicate
              ? 'An account already exists with this principal email. Please use a different principal email for this test.'
              : message,
        },
        {
          status:
            duplicate
              ? 409
              : 500,
        }
      )
    }

    createdUserId =
      createdAuth.user.id

    /*
    |--------------------------------------------------------------------------
    | 7. CREATE THE BRANCH AS A NORMAL SCHOOL
    |--------------------------------------------------------------------------
    */

    const slug =
      makeSlug(
        invite.school_name
      )

    const schoolAttempts =
      [
        {
          name:
            invite.school_name,

          slug,

          phone:
            invite.school_phone ||
            null,

          email:
            invite.school_email ||
            null,

          province:
            invite.school_province ||
            null,

          address:
            invite.school_address ||
            null,

          owner_id:
            createdUserId,

          is_active:
            true,

          is_verified:
            false,

          settings: {
            mvp:
              'weekly_reports',
          },
        },

        {
          name:
            invite.school_name,

          slug,

          phone:
            invite.school_phone ||
            null,

          email:
            invite.school_email ||
            null,

          province:
            invite.school_province ||
            null,

          address:
            invite.school_address ||
            null,

          owner_id:
            createdUserId,

          is_active:
            true,

          is_verified:
            false,
        },

        {
          name:
            invite.school_name,

          slug,

          phone:
            invite.school_phone ||
            null,

          email:
            invite.school_email ||
            null,

          owner_id:
            createdUserId,

          is_active:
            true,

          is_verified:
            false,
        },

        {
          name:
            invite.school_name,

          slug,

          owner_id:
            createdUserId,
        },
      ]

    let school:
      any = null

    let schoolError:
      any = null

    for (
      const payload of
        schoolAttempts
    ) {
      const result =
        await sb
          .from(
            'schools'
          )
          .insert(
            payload
          )
          .select(
            '*'
          )
          .single()

      if (
        !result.error &&
        result.data
          ?.id
      ) {
        school =
          result.data

        schoolError =
          null

        break
      }

      schoolError =
        result.error
    }

    if (
      !school?.id
    ) {
      await cleanupFailedSetup(
        sb,
        {
          userId:
            createdUserId,
        }
      )

      createdUserId =
        null

      return NextResponse.json(
        {
          error:
            schoolError
              ?.message ||
            'The principal account was created, but the school could not be created.',
        },
        {
          status: 500,
        }
      )
    }

    createdSchoolId =
      school.id

    /*
    |--------------------------------------------------------------------------
    | 8. LINK PRINCIPAL PROFILE TO THEIR SCHOOL
    |--------------------------------------------------------------------------
    */

    const profileError =
      await safeUpsertProfile(
        sb,
        {
          id:
            createdUserId,

          full_name:
            fullName,

          email:
            String(
              invite.email
            )
              .trim()
              .toLowerCase(),

          school_id:
            createdSchoolId,
        }
      )

    if (
      profileError
    ) {
      await cleanupFailedSetup(
        sb,
        {
          userId:
            createdUserId,

          schoolId:
            createdSchoolId,
        }
      )

      createdUserId =
        null

      createdSchoolId =
        null

      return NextResponse.json(
        {
          error:
            profileError
              ?.message ||
            'The school was created, but the principal profile could not be linked.',
        },
        {
          status: 500,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 9. ADD NORMAL SCHOOL TO THE GROUP
    |--------------------------------------------------------------------------
    */

    const {
      data:
        membership,
      error:
        membershipError,
    } = await sb
      .from(
        'school_group_members'
      )
      .insert({
        group_id:
          invite.group_id,

        school_id:
          createdSchoolId,

        member_type:
          'branch',
      })
      .select(
        `
          id,
          group_id,
          school_id,
          member_type,
          created_at
        `
      )
      .single()

    if (
      membershipError ||
      !membership?.id
    ) {
      await cleanupFailedSetup(
        sb,
        {
          userId:
            createdUserId,

          schoolId:
            createdSchoolId,
        }
      )

      createdUserId =
        null

      createdSchoolId =
        null

      return NextResponse.json(
        {
          error:
            membershipError
              ?.message ||
            'The school was created, but it could not be added to the School Group.',
        },
        {
          status: 500,
        }
      )
    }

    createdMembershipId =
      membership.id

    /*
    |--------------------------------------------------------------------------
    | 10. MARK INVITATION ACCEPTED
    |--------------------------------------------------------------------------
    |
    | The .eq('status', 'pending') prevents a completed/revoked invite from
    | being finalized again.
    |
    */

    const acceptedAt =
      new Date()
        .toISOString()

    const {
      data:
        acceptedInvite,
      error:
        acceptError,
    } = await sb
      .from(
        'school_group_invites'
      )
      .update({
        school_id:
          createdSchoolId,

        status:
          'accepted',

        accepted_at:
          acceptedAt,
      })
      .eq(
        'id',
        invite.id
      )
      .eq(
        'status',
        'pending'
      )
      .select(
        `
          id,
          school_id,
          status,
          accepted_at
        `
      )
      .maybeSingle()

    if (
      acceptError ||
      !acceptedInvite
        ?.id
    ) {
      await cleanupFailedSetup(
        sb,
        {
          userId:
            createdUserId,

          schoolId:
            createdSchoolId,

          membershipId:
            createdMembershipId,
        }
      )

      createdUserId =
        null

      createdSchoolId =
        null

      createdMembershipId =
        null

      return NextResponse.json(
        {
          error:
            acceptError
              ?.message ||
            'The invitation changed while the account was being created. Please try again.',
        },
        {
          status: 409,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 11. SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        ok: true,

        message:
          'Principal account and school created successfully.',

        principal: {
          id:
            createdUserId,

          name:
            fullName,

          email:
            String(
              invite.email
            )
              .trim()
              .toLowerCase(),
        },

        school: {
          id:
            school.id,

          name:
            school.name,

          slug:
            school.slug,
        },

        group: {
          id:
            group.id,

          name:
            group.name,
        },

        membership: {
          id:
            membership.id,

          member_type:
            membership.member_type,
        },

        login_url:
          `/auth/login?created=1&email=${encodeURIComponent(
            String(
              invite.email
            )
              .trim()
              .toLowerCase()
          )}&school=${encodeURIComponent(
            school.name ||
              invite.school_name
          )}`,
      },
      {
        status: 201,
      }
    )
  } catch (
    error: any
  ) {
    console.error(
      '[branch-accept] unexpected error:',
      error
    )

    if (
      createdUserId ||
      createdSchoolId ||
      createdMembershipId
    ) {
      try {
        await cleanupFailedSetup(
          sb,
          {
            userId:
              createdUserId,

            schoolId:
              createdSchoolId,

            membershipId:
              createdMembershipId,
          }
        )
      } catch {}
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not complete principal account setup.',
      },
      {
        status: 500,
      }
    )
  }
}