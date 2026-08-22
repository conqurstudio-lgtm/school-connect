// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

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

async function getLoggedInUser(
  request: NextRequest
) {
  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },

          setAll() {
            // Read-only API.
          },
        },
      }
    )

  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser()

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      await getLoggedInUser(
        request
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const sb =
      serviceClient()

    /*
    |--------------------------------------------------------------------------
    | 1. CHECK WHETHER THIS USER OWNS A GROUP
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
          owner_user_id,
          created_at,
          updated_at
        `
      )
      .eq(
        'owner_user_id',
        user.id
      )
      .maybeSingle()

    if (groupError) {
      console.error(
        '[school-group] group lookup failed:',
        groupError
      )

      return NextResponse.json(
        {
          error:
            'Could not load school group.',
        },
        {
          status: 500,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 2. STANDALONE / BRANCH SCHOOL
    |--------------------------------------------------------------------------
    */

    if (!group) {
      return NextResponse.json({
        ok: true,
        is_group_owner: false,
        group: null,
        schools: [],
        pending_invites: [],
      })
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOAD ACCEPTED GROUP MEMBERS
    |--------------------------------------------------------------------------
    */

    const {
      data: members,
      error:
        membersError,
    } = await sb
      .from(
        'school_group_members'
      )
      .select(
        `
          id,
          group_id,
          school_id,
          member_type,
          created_at
        `
      )
      .eq(
        'group_id',
        group.id
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

    if (membersError) {
      console.error(
        '[school-group] member lookup failed:',
        membersError
      )

      return NextResponse.json(
        {
          error:
            'Could not load schools in this group.',
        },
        {
          status: 500,
        }
      )
    }

    const schoolIds =
      (
        members ||
        []
      )
        .map(
          (
            member: any
          ) =>
            member.school_id
        )
        .filter(Boolean)

    /*
    |--------------------------------------------------------------------------
    | 4. LOAD NORMAL SCHOOL RECORDS
    |--------------------------------------------------------------------------
    */

    let schools: any[] =
      []

    if (
      schoolIds.length >
      0
    ) {
      const {
        data:
          schoolRows,
        error:
          schoolsError,
      } = await sb
        .from(
          'schools'
        )
        .select(
          `
            id,
            name,
            slug,
            logo_url,
            phone,
            email,
            province,
            address,
            owner_id,
            is_active,
            is_verified,
            created_at
          `
        )
        .in(
          'id',
          schoolIds
        )

      if (
        schoolsError
      ) {
        console.error(
          '[school-group] school lookup failed:',
          schoolsError
        )

        return NextResponse.json(
          {
            error:
              'Could not load school details.',
          },
          {
            status: 500,
          }
        )
      }

      schools =
        (
          members ||
          []
        ).map(
          (
            member: any
          ) => {
            const school =
              (
                schoolRows ||
                []
              ).find(
                (
                  row: any
                ) =>
                  row.id ===
                  member.school_id
              )

            return {
              ...school,

              membership_id:
                member.id,

              member_type:
                member.member_type,
            }
          }
        )
    }

    /*
    |--------------------------------------------------------------------------
    | 5. LOAD PENDING BRANCH INVITATIONS
    |--------------------------------------------------------------------------
    |
    | These are schools that the group owner has added, but the principal
    | has not completed their School Connect account yet.
    |
    | school_id remains null until the principal accepts the invitation.
    |
    */

    const {
      data:
        pendingInviteRows,
      error:
        pendingInvitesError,
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
          status,
          expires_at,
          accepted_at,
          created_at,
          school_name,
          school_phone,
          school_email,
          school_province,
          school_address,
          principal_name
        `
      )
      .eq(
        'group_id',
        group.id
      )
      .eq(
        'status',
        'pending'
      )
      .is(
        'school_id',
        null
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (
      pendingInvitesError
    ) {
      console.error(
        '[school-group] pending invite lookup failed:',
        pendingInvitesError
      )

      return NextResponse.json(
        {
          error:
            'Could not load pending school invitations.',
        },
        {
          status: 500,
        }
      )
    }

    const now =
      Date.now()

    const pendingInvites =
      (
        pendingInviteRows ||
        []
      )
        .filter(
          (
            invite: any
          ) => {
            if (
              !invite.expires_at
            ) {
              return true
            }

            return (
              new Date(
                invite.expires_at
              ).getTime() >
              now
            )
          }
        )
        .map(
          (
            invite: any
          ) => ({
            id:
              invite.id,

            group_id:
              invite.group_id,

            school_id:
              invite.school_id,

            status:
              invite.status,

            expires_at:
              invite.expires_at,

            created_at:
              invite.created_at,

            school_name:
              invite.school_name,

            school_phone:
              invite.school_phone,

            school_email:
              invite.school_email,

            school_province:
              invite.school_province,

            school_address:
              invite.school_address,

            principal_name:
              invite.principal_name,

            principal_email:
              invite.email,
          })
        )

    /*
    |--------------------------------------------------------------------------
    | 6. RETURN GROUP OVERVIEW
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      ok: true,

      is_group_owner:
        true,

      group,

      schools,

      pending_invites:
        pendingInvites,
    })
  } catch (
    error: any
  ) {
    console.error(
      '[school-group] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not load school group.',
      },
      {
        status: 500,
      }
    )
  }
}