// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  context: {
    params: {
      token: string
    }
  }
) {
  try {
    const token =
      String(
        context?.params?.token || ''
      ).trim()

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

    const sb = serviceClient()

    /*
    |--------------------------------------------------------------------------
    | 1. LOAD INVITATION
    |--------------------------------------------------------------------------
    */

    const {
      data: invite,
      error: inviteError,
    } = await sb
      .from('school_group_invites')
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
        'token',
        token
      )
      .maybeSingle()

    if (inviteError) {
      console.error(
        '[school-group-invite-token] invite lookup failed:',
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
    | 2. CHECK EXPIRY
    |--------------------------------------------------------------------------
    */

    const isExpired =
      invite.expires_at &&
      new Date(
        invite.expires_at
      ).getTime() <
        Date.now()

    if (
      isExpired &&
      invite.status === 'pending'
    ) {
      await sb
        .from('school_group_invites')
        .update({
          status: 'expired',
        })
        .eq(
          'id',
          invite.id
        )

      invite.status = 'expired'
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOAD GROUP
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
          primary_school_id
        `
      )
      .eq(
        'id',
        invite.group_id
      )
      .maybeSingle()

    if (groupError) {
      console.error(
        '[school-group-invite-token] group lookup failed:',
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
            'The school group for this invitation no longer exists.',
        },
        {
          status: 404,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 4. RETURN SAFE INVITATION DETAILS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      ok: true,

      invite: {
        id:
          invite.id,

        status:
          invite.status,

        expires_at:
          invite.expires_at,

        accepted_at:
          invite.accepted_at,

        principal_name:
          invite.principal_name,

        principal_email:
          invite.email,

        school: {
          id:
            invite.school_id,

          name:
            invite.school_name,

          phone:
            invite.school_phone,

          email:
            invite.school_email,

          province:
            invite.school_province,

          address:
            invite.school_address,
        },
      },

      group: {
        id:
          group.id,

        name:
          group.name,

        primary_school_id:
          group.primary_school_id,
      },
    })
  } catch (error: any) {
    console.error(
      '[school-group-invite-token] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not load this invitation.',
      },
      {
        status: 500,
      }
    )
  }
}