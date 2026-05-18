// @ts-nocheck
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

// Module-level client — never recreated
const supabase = createClient()

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  const markRead = useCallback(async (notifId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications])

  return { notifications, unreadCount, markAllRead, markRead }
}
