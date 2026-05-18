// @ts-nocheck
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

const supabase = createClient()

function normalizeNotification(row: any): Notification {
  return {
    ...row,
    recipient_id: row.recipient_id ?? row.user_id,
    is_read: Boolean(row.is_read ?? row.read ?? false),
    read_at: row.read_at,
  }
}

async function fetchRows(userId: string) {
  // New schema first: recipient_id + is_read.
  let res = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  // Legacy/current schema fallback: user_id + read.
  if (res.error) {
    res = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
  }

  return res
}

async function markOneReadInDb(notifId: string) {
  const now = new Date().toISOString()

  let res = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('id', notifId)

  if (res.error) {
    res = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId)
  }

  return res
}

async function markAllReadInDb(userId: string) {
  const now = new Date().toISOString()

  let res = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('recipient_id', userId)
    .eq('is_read', false)

  if (res.error) {
    res = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  }

  return res
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback((items: Notification[]) => {
    setUnreadCount(items.filter((n: any) => !Boolean(n.is_read ?? n.read)).length)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    const { data } = await fetchRows(userId)
    if (!data) return

    const normalised = data.map(normalizeNotification)
    setNotifications(normalised)
    refreshUnread(normalised)
  }, [userId, refreshUnread])

  const markAllRead = useCallback(async () => {
    if (!userId) return

    await markAllReadInDb(userId)
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, is_read: true, read: true }))
      refreshUnread(next)
      return next
    })
  }, [userId, refreshUnread])

  const markRead = useCallback(async (notifId: string) => {
    await markOneReadInDb(notifId)
    setNotifications(prev => {
      const next = prev.map(n => n.id === notifId ? { ...n, is_read: true, read: true } : n)
      refreshUnread(next)
      return next
    })
  }, [refreshUnread])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, payload => {
        const next = normalizeNotification(payload.new)
        const recipient = (next as any).recipient_id ?? (next as any).user_id
        if (recipient !== userId) return

        setNotifications(prev => {
          if (prev.some(n => n.id === next.id)) return prev
          const items = [next, ...prev].slice(0, 30)
          refreshUnread(items)
          return items
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications, refreshUnread])

  return { notifications, unreadCount, markAllRead, markRead, refetch: fetchNotifications }
}
