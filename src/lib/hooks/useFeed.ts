// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, FeedFilter } from '@/lib/types'

const supabase = createClient()

export function useFeed(schoolId: string | undefined, userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate cached posts AFTER mount so server and client both render empty initially
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('feed-cache')
      if (cached) {
        const { posts: p } = JSON.parse(cached)
        if (Array.isArray(p) && p.length > 0) {
          setPosts(p)
        }
      }
    } catch {}
    setHydrated(true)
  }, [])
  const [optimisticIds, setOptimisticIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [filter,  setFilter]  = useState<FeedFilter>('all')
  const activeFilter          = useRef<FeedFilter>('all')
  const fetching              = useRef(false)
  const lastFetchAt           = useRef(0)

  async function fetch(f: FeedFilter) {
    if (!schoolId || !userId) return
    if (fetching.current) return
    fetching.current = true
    lastFetchAt.current = Date.now()
    // Only show skeleton on first load — if we have posts, refresh silently
    if (posts.length === 0) setLoading(true)

    try {
      let q = supabase
        .from('posts').select('*')
        .eq('school_id', schoolId)
        .eq('status', 'published')

      if (f === 'pinned') {
        q = q.eq('is_pinned', true)
      } else if (f !== 'all') {
        const map: Record<string, string> = {
          updates: 'update', moments: 'moment',
          events: 'event', documents: 'document',
        }
        if (map[f]) q = q.eq('type', map[f])
      }

      const { data } = await q
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (!data) return  // network error — keep existing posts
      if (data.length === 0) {
        setPosts([])
        return
      }

      const ids = data.map(p => p.id)

      const [rxAll, rxMine] = await Promise.all([
        supabase.from('reactions').select('post_id, type').in('post_id', ids),
        supabase.from('reactions').select('post_id, type').in('post_id', ids).eq('user_id', userId),
      ])

      // Per-type counts: { post_id: { love: 3, like: 1, celebrate: 2 } }
      const typeMap: Record<string, Record<string, number>> = {}
      const mineMap: Record<string, string> = {}

      rxAll.data?.forEach(r => {
        if (!typeMap[r.post_id]) typeMap[r.post_id] = {}
        typeMap[r.post_id][r.type] = (typeMap[r.post_id][r.type] || 0) + 1
      })
      rxMine.data?.forEach(r => {
        mineMap[r.post_id] = r.type
      })

      const fresh = data.map(p => {
        const counts = typeMap[p.id] || {}
        const total = Object.values(counts).reduce((a, b) => a + b, 0)
        return {
          ...p,
          reaction_count:  total,
          reaction_counts: counts,
          my_reaction:     mineMap[p.id] || null,
          comment_count:   0,
        }
      })

      // Smart merge: keep stable references for unchanged posts so React doesn't
      // re-render them, preserves scroll position and image cache.
      setPosts(prev => {
        if (prev.length === 0) return fresh

        const prevById = new Map(prev.map(p => [p.id, p]))
        const merged = fresh.map(np => {
          const op = prevById.get(np.id)
          if (!op) return np  // new post

          // Check if anything we care about changed
          const same =
            op.reaction_count  === np.reaction_count &&
            op.my_reaction     === np.my_reaction &&
            op.is_pinned       === np.is_pinned &&
            op.body            === np.body &&
            op.title           === np.title &&
            op.image_url       === np.image_url &&
            JSON.stringify(op.reaction_counts || {}) === JSON.stringify(np.reaction_counts || {})

          // Reuse the old object reference if nothing meaningful changed
          return same ? op : { ...op, ...np }
        })

        // If post count and order are identical AND all references are the same, skip update
        const orderUnchanged = merged.length === prev.length &&
          merged.every((p, i) => p === prev[i])
        return orderUnchanged ? prev : merged
      })
    } catch (e) {
      console.error('useFeed error:', e)
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }

  // Fetch when schoolId/userId become available or filter changes.
  // Wait for hydration so we know whether cache is in posts state.
  useEffect(() => {
    if (!schoolId || !userId || !hydrated) return
    activeFilter.current = filter

    try {
      const cached = sessionStorage.getItem('feed-cache')
      if (cached) {
        const { ts, schoolId: cachedSchool, filter: cachedFilter } = JSON.parse(cached)
        const fresh = Date.now() - ts < 2 * 60_000
        if (fresh && cachedSchool === schoolId && cachedFilter === filter && posts.length > 0) {
          // Cache hit — same school AND same filter, instant feed
          return
        }
      }
    } catch {}

    fetch(filter)
  }, [schoolId, userId, filter, hydrated])

  // Silent background refresh on tab return — but only if it's been >30s since last fetch
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && schoolId && userId) {
        const now = Date.now()
        if (now - lastFetchAt.current > 30_000) {
          lastFetchAt.current = now
          fetch(activeFilter.current)
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [schoolId, userId])

  // Persist posts to sessionStorage whenever they change
  useEffect(() => {
    if (!schoolId || posts.length === 0) return
    try {
      sessionStorage.setItem('feed-cache', JSON.stringify({
        posts, schoolId, filter, ts: Date.now(),
      }))
    } catch {}
  }, [posts, schoolId, filter])

  // Real-time — posts AND reactions (in-place update, no refetch)
  useEffect(() => {
    if (!schoolId) return
    const ch = supabase
      .channel(`feed:${schoolId}`)
      // Posts: full refetch when a post is created/edited/deleted
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'posts',
        filter: `school_id=eq.${schoolId}`,
      }, () => fetch(activeFilter.current))
      // Reactions INSERT — bump the count for the post
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'reactions',
        filter: `school_id=eq.${schoolId}`,
      }, (payload) => {
        const r = payload.new as any
        // Skip own actions — we already updated optimistically
        if (r.user_id === userId) return
        setPosts(prev => prev.map(p => {
          if (p.id !== r.post_id) return p
          const counts = { ...(p.reaction_counts || {}) }
          counts[r.type] = (counts[r.type] || 0) + 1
          const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)
          return { ...p, reaction_counts: counts, reaction_count: total }
        }))
      })
      // Reactions DELETE — decrement the count
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'reactions',
        filter: `school_id=eq.${schoolId}`,
      }, (payload) => {
        const r = payload.old as any
        if (r.user_id === userId) return
        setPosts(prev => prev.map(p => {
          if (p.id !== r.post_id) return p
          const counts = { ...(p.reaction_counts || {}) }
          if (counts[r.type] > 0) counts[r.type] -= 1
          if (counts[r.type] === 0) delete counts[r.type]
          const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)
          return { ...p, reaction_counts: counts, reaction_count: total }
        }))
      })
      // Reactions UPDATE — someone switched their reaction type
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'reactions',
        filter: `school_id=eq.${schoolId}`,
      }, (payload) => {
        const newR = payload.new as any
        const oldR = payload.old as any
        if (newR.user_id === userId) return
        setPosts(prev => prev.map(p => {
          if (p.id !== newR.post_id) return p
          const counts = { ...(p.reaction_counts || {}) }
          if (oldR.type && counts[oldR.type] > 0) counts[oldR.type] -= 1
          if (oldR.type && counts[oldR.type] === 0) delete counts[oldR.type]
          counts[newR.type] = (counts[newR.type] || 0) + 1
          const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)
          return { ...p, reaction_counts: counts, reaction_count: total }
        }))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [schoolId, userId])

  const addOptimisticPost = (draft: Partial<Post>) => {
    const tempId = `optimistic-${Date.now()}`
    const optimistic: Post = {
      id:           tempId,
      school_id:    schoolId ?? '',
      author_id:    '',
      type:         draft.type ?? 'update',
      status:       'published',
      body:         draft.body ?? null,
      image_urls:   draft.image_urls ?? [],
      is_pinned:    draft.is_pinned ?? false,
      reaction_count: 0,
      my_reaction:  null,
      comment_count: 0,
      created_at:   new Date().toISOString(),
      updated_at:   new Date().toISOString(),
      _optimistic:  true,
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
    refetch:      () => fetch(activeFilter.current),
    updatePostReaction: (postId: string, type: string | null, prevType: string | null) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        const counts = { ...(p.reaction_counts || {}) }

        // Remove old reaction count
        if (prevType && counts[prevType] > 0) counts[prevType] -= 1
        if (prevType && counts[prevType] === 0) delete counts[prevType]

        // Add new reaction count
        if (type) counts[type] = (counts[type] || 0) + 1

        const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)
        return {
          ...p,
          my_reaction:     type,
          reaction_counts: counts,
          reaction_count:  total,
        }
      }))
    },
  }
}
