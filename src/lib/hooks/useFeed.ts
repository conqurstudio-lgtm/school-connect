// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, FeedFilter } from '@/lib/types'

const supabase = createClient()

export function useFeed(schoolId: string | undefined, userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('feed-cache')
      if (cached) {
        const { posts: p } = JSON.parse(cached)
        if (Array.isArray(p) && p.length > 0) setPosts(p)
      }
    } catch {}
    setHydrated(true)
  }, [])

  const [optimisticIds, setOptimisticIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FeedFilter>('all')
  const activeFilter = useRef<FeedFilter>('all')
  const fetching = useRef(false)
  const lastFetchAt = useRef(0)

  async function fetchFeed(f: FeedFilter) {
    if (!schoolId || !userId) return
    if (fetching.current) return

    fetching.current = true
    lastFetchAt.current = Date.now()

    if (posts.length === 0) setLoading(true)

    try {
      const res = await fetch(`/api/feed?school_id=${encodeURIComponent(schoolId)}&filter=${encodeURIComponent(f)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (!res.ok) return

      const json = await res.json()
      const fresh = json.posts ?? []

      setPosts(prev => {
        if (prev.length === 0) return fresh

        const prevById = new Map(prev.map(p => [p.id, p]))

        const merged = fresh.map((np: any) => {
          const op = prevById.get(np.id)
          if (!op) return np

          const same =
            op.reaction_count === np.reaction_count &&
            op.my_reaction === np.my_reaction &&
            op.is_pinned === np.is_pinned &&
            op.body === np.body &&
            op.title === np.title &&
            op.image_url === np.image_url &&
            JSON.stringify(op.reaction_counts || {}) === JSON.stringify(np.reaction_counts || {})

          return same ? op : { ...op, ...np }
        })

        const orderUnchanged = merged.length === prev.length &&
          merged.every((p: any, i: number) => p === prev[i])

        return orderUnchanged ? prev : merged
      })
    } catch (e) {
      console.error('useFeed error:', e)
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }

  useEffect(() => {
    if (!schoolId || !userId || !hydrated) return

    activeFilter.current = filter

    try {
      const cached = sessionStorage.getItem('feed-cache')
      if (cached) {
        const { ts, schoolId: cachedSchool, filter: cachedFilter } = JSON.parse(cached)
        const fresh = Date.now() - ts < 2 * 60_000
        if (fresh && cachedSchool === schoolId && cachedFilter === filter && posts.length > 0) return
      }
    } catch {}

    fetchFeed(filter)
  }, [schoolId, userId, filter, hydrated])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && schoolId && userId) {
        const now = Date.now()
        if (now - lastFetchAt.current > 30_000) {
          lastFetchAt.current = now
          fetchFeed(activeFilter.current)
        }
      }
    }

    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [schoolId, userId])

  useEffect(() => {
    if (!schoolId || posts.length === 0) return

    try {
      sessionStorage.setItem('feed-cache', JSON.stringify({
        posts,
        schoolId,
        filter,
        ts: Date.now(),
      }))
    } catch {}
  }, [posts, schoolId, filter])

  useEffect(() => {
    if (!schoolId) return

    const ch = supabase
      .channel(`feed:${schoolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `school_id=eq.${schoolId}`,
      }, () => fetchFeed(activeFilter.current))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `school_id=eq.${schoolId}`,
      }, () => fetchFeed(activeFilter.current))
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [schoolId, userId])

  const addOptimisticPost = (draft: Partial<Post>) => {
    const tempId = `optimistic-${Date.now()}`
    const optimistic: Post = {
      id: tempId,
      school_id: schoolId ?? '',
      author_id: '',
      type: draft.type ?? 'update',
      status: 'published',
      body: draft.body ?? null,
      image_urls: draft.image_urls ?? [],
      is_pinned: draft.is_pinned ?? false,
      reaction_count: 0,
      my_reaction: null,
      comment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: true,
    } as any

    setOptimisticIds(s => [...s, tempId])
    setPosts(prev => [optimistic, ...prev])
    return tempId
  }

  const removeOptimisticPost = (tempId: string) => {
    setPosts(prev => prev.filter(p => p.id !== tempId))
    setOptimisticIds(s => s.filter(id => id !== tempId))
  }

  return {
    posts,
    loading,
    filter,
    optimisticIds,
    addOptimisticPost,
    removeOptimisticPost,
    changeFilter: (f: FeedFilter) => setFilter(f),
    refetch: () => fetchFeed(activeFilter.current),
    updatePostReaction: (postId: string, type: string | null, prevType: string | null) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p

        const counts = { ...(p.reaction_counts || {}) }

        if (prevType && counts[prevType] > 0) counts[prevType] -= 1
        if (prevType && counts[prevType] === 0) delete counts[prevType]
        if (type) counts[type] = (counts[type] || 0) + 1

        const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)

        return {
          ...p,
          my_reaction: type,
          reaction_counts: counts,
          reaction_count: total,
        }
      }))
    },
  }
}
