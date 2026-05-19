// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/lib/types'

const supabase = createClient()

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading,  setLoading]  = useState(true)
  const userIdRef  = useRef<string | undefined>(undefined)
  const emailRef   = useRef<string | undefined>(undefined)

  async function load(userId: string, email?: string) {
    userIdRef.current = userId
    emailRef.current  = email

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) {
        setAuthUser(null)
        setLoading(false)
        return
      }

      let school = undefined
      let parentSchool = undefined

      if (profile.role === 'school') {
        const { data: s } = await supabase
          .from('schools')
          .select('*')
          .eq('owner_id', userId)
          .single()

        school = s ?? undefined
      } else if (profile.school_id) {
        const { data: s } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single()

        parentSchool = s ?? undefined
      }

      setAuthUser({ id: userId, email, profile, school, parentSchool })
    } catch {
      setAuthUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadParentSession() {
    try {
      const res = await fetch('/api/parent-session', {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (!res.ok) {
        setAuthUser(null)
        setLoading(false)
        return
      }

      const json = await res.json()

      if (!json?.profile?.id || !json?.school?.id) {
        setAuthUser(null)
        setLoading(false)
        return
      }

      const profile = {
        ...json.profile,
        role: 'parent',
        onboarding_done: true,
      }

      setAuthUser({
        id: json.profile.id,
        email: undefined,
        profile,
        school: undefined,
        parentSchool: json.school,
      })
    } catch {
      setAuthUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        load(session.user.id, session.user.email)
      } else {
        loadParentSession()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        load(session.user.id, session.user.email)
      } else {
        loadParentSession()
      }
    })

    const onSchoolUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail

      if (detail && Object.keys(detail).length > 0) {
        setAuthUser(prev => {
          if (!prev) return prev
          const updatedSchool = prev.school ? { ...prev.school, ...detail } : prev.school
          const updatedParentSchool = prev.parentSchool ? { ...prev.parentSchool, ...detail } : prev.parentSchool
          return { ...prev, school: updatedSchool, parentSchool: updatedParentSchool }
        })
      } else if (userIdRef.current) {
        load(userIdRef.current, emailRef.current)
      }
    }

    window.addEventListener('school-updated', onSchoolUpdated as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('school-updated', onSchoolUpdated as EventListener)
    }
  }, [])

  const signOut = async () => {
    await fetch('/api/parent-session', { method: 'DELETE' }).catch(() => {})
    await supabase.auth.signOut()
    setAuthUser(null)
    window.location.href = '/auth/login'
  }

  return {
    authUser,
    loading,
    signOut,
    isSchool:    authUser?.profile?.role === 'school',
    isParent:    authUser?.profile?.role === 'parent',
    isTeacher:   authUser?.profile?.role === 'teacher',
    isOnboarded: authUser?.profile?.onboarding_done ?? false,
    school:      authUser?.school ?? authUser?.parentSchool ?? null,
  }
}
